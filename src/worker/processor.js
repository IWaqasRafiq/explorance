import { GithubService } from '../services/github.service.js';
import { FileService } from '../services/file.service.js';
import { ChunkingService } from '../services/chunking.service.js';
import { VectorService } from '../services/vector.service.js';
import { ReportService } from '../services/report.service.js';
import { connectDB } from '../lib/db.js';
import Project from '../models/Project.js';
import AnalysisResult from '../models/AnalysisResult.js';

export default async function processor(job) {
  const { projectId, repoUrl } = job.data;
  let tempDir = null;

  console.log(`[PROCESSOR] Starting production pipeline for project ${projectId}`);

  try {
    await connectDB();

    const updateStatus = async (progress, stage) => {
      await Project.findByIdAndUpdate(projectId, { progress, stage });
      await job.updateProgress(progress);
    };

    // 1. Ingestion
    await updateStatus(10, 'Cloning repository...');
    tempDir = await GithubService.cloneRepo(repoUrl);

    await updateStatus(25, 'Scanning and filtering files...');
    const files = await FileService.scanDirectory(tempDir);

    // 2. Parallel Processing (Faster performance)
    await updateStatus(40, 'Generating Intelligence & Analysis...');
    const chunks = ChunkingService.processFiles(files);

    const isProd = process.env.NODE_ENV === 'production';
    // Increase limit in production - with batching and Atlas search, 250 is safe and provides much better RAG quality
    const CHUNK_LIMIT = isProd ? 250 : 500; 

    console.log(`[PROCESSOR] Processing ${Math.min(chunks.length, CHUNK_LIMIT)} of ${chunks.length} chunks`);

    // Run report generation and embedding storage in parallel
    const [report] = await Promise.all([
      ReportService.generateFullReport(projectId, files),
      VectorService.storeChunks(projectId, chunks.slice(0, CHUNK_LIMIT), updateStatus) 
    ]);

    // 3. Finalizing
    await updateStatus(95, 'Saving analysis results...');
    
    try {
      await AnalysisResult.create({
        projectId,
        reportData: report
      });

      await Project.findByIdAndUpdate(projectId, { 
        status: 'completed', 
        progress: 100, 
        stage: 'Done' 
      });
      console.log(`[PROCESSOR] Analysis saved for project ${projectId}`);
    } catch (saveError) {
      console.error(`[PROCESSOR] Failed to save final results:`, saveError);
      await Project.findByIdAndUpdate(projectId, { 
        status: 'completed', 
        progress: 100, 
        stage: 'Done (Partial)',
        error: "Report generated but storage failed."
      });
    }

    console.log(`[PROCESSOR] Project ${projectId} pipeline completed successfully.`);
    return { success: true };

  } catch (error) {
    console.error(`[PROCESSOR] Job failed:`, error);
    await Project.findByIdAndUpdate(projectId, { 
      status: 'failed', 
      error: error.message 
    });
    throw error;
  } finally {
    if (tempDir) {
      await GithubService.cleanupRepo(tempDir);
    }
  }
}
