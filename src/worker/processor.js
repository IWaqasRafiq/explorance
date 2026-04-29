import { GithubService } from '../services/github.service.js';
import { FileService } from '../services/file.service.js';
import { AIService } from '../services/ai.service.js';
import { connectDB } from '../lib/db.js';
import Project from '../models/Project.js';
import AnalysisResult from '../models/AnalysisResult.js';

export default async function processor(job) {
  const { projectId, repoUrl } = job.data;
  let tempDir = null;

  console.log(`[PROCESSOR] Starting job for project ${projectId}, url: ${repoUrl}`);

  try {
    await connectDB();
    console.log(`[PROCESSOR] DB connected`);
    
    await Project.findByIdAndUpdate(projectId, { status: 'processing', progress: 10 });
    await job.updateProgress(10);

    // 1. Clone Repo
    console.log(`[PROCESSOR] Cloning repo...`);
    tempDir = await GithubService.cloneRepo(repoUrl);
    console.log(`[PROCESSOR] Repo cloned to ${tempDir}`);
    
    await Project.findByIdAndUpdate(projectId, { progress: 30 });
    await job.updateProgress(30);

    // 2. Scan Files
    console.log(`[PROCESSOR] Scanning files...`);
    const files = await FileService.scanDirectory(tempDir);
    console.log(`[PROCESSOR] Scanned ${files.length} files`);
    
    await Project.findByIdAndUpdate(projectId, { progress: 50 });
    await job.updateProgress(50);

    // 3. AI Analysis
    console.log(`[PROCESSOR] Running AI analysis...`);
    const analysis = await AIService.analyzeFiles(files);
    console.log(`[PROCESSOR] AI analysis complete`);
    
    await Project.findByIdAndUpdate(projectId, { progress: 80 });
    await job.updateProgress(80);

    // 4. Save Results
    console.log(`[PROCESSOR] Saving results...`);
    await AnalysisResult.create({
      projectId,
      reportData: analysis
    });

    await Project.findByIdAndUpdate(projectId, { status: 'completed', progress: 100 });
    await job.updateProgress(100);
    console.log(`[PROCESSOR] Job complete!`);

    return { success: true };
  } catch (error) {
    console.error(`Job failed for project ${projectId}:`, error);
    await Project.findByIdAndUpdate(projectId, { status: 'failed', error: error.message });
    throw error;
  } finally {
    if (tempDir) {
      await GithubService.cleanupRepo(tempDir);
    }
  }
}
