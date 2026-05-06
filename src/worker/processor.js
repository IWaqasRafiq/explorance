import { GithubService } from '../services/github.service.js';
import { FileService } from '../services/file.service.js';
import { ChunkingService } from '../services/chunking.service.js';
import { VectorService } from '../services/vector.service.js';
import { ReportService } from '../services/report.service.js';
import { connectDB } from '../lib/db.js';
import Project from '../models/Project.js';
import AnalysisResult from '../models/AnalysisResult.js';

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const pickRepresentativeFiles = (files, limit) => {
  if (files.length <= limit) return files;

  const prioritized = [...files].sort((a, b) => {
    const aPath = (a.path || '').toLowerCase();
    const bPath = (b.path || '').toLowerCase();
    const score = (p) => {
      if (p.endsWith('package.json')) return 100;
      if (p.endsWith('readme.md')) return 90;
      if (p.includes('/src/')) return 80;
      if (p.includes('/app/')) return 70;
      if (p.includes('/lib/')) return 60;
      if (p.includes('/components/')) return 55;
      return 10;
    };
    return score(bPath) - score(aPath) || (b.lines || 0) - (a.lines || 0);
  });

  return prioritized.slice(0, limit);
};

export default async function processor(job) {
  const { projectId, repoUrl } = job.data;
  let tempDir = null;

  console.log(`[PROCESSOR] Starting production pipeline for project ${projectId}`);

  try {
    await connectDB();
    await Project.findByIdAndUpdate(projectId, {
      status: 'processing',
      progress: 5,
      stage: 'Preparing analysis...'
    });

    const updateStatus = async (progress, stage) => {
      await Project.findByIdAndUpdate(projectId, { status: 'processing', progress, stage });
      await job.updateProgress(progress);
    };

    // 1. Ingestion
    await updateStatus(10, 'Downloading repository...');
    tempDir = await GithubService.cloneRepo(repoUrl);

    await updateStatus(20, 'Extracting and preparing files...');
    await updateStatus(30, 'Scanning and filtering files...');
    const files = await FileService.scanDirectory(tempDir);

    // 2. Parallel Processing (Faster performance)
    await updateStatus(45, 'Generating intelligence and analysis...');
    const isProd = process.env.NODE_ENV === 'production';
    const defaultChunkLimit = isProd ? 200 : 120;
    const CHUNK_LIMIT = toPositiveInt(process.env.ANALYSIS_CHUNK_LIMIT, defaultChunkLimit);
    const BLOCK_ON_VECTORIZATION = process.env.BLOCK_ON_VECTORIZATION === 'true';
    const LARGE_REPO_FILE_THRESHOLD = toPositiveInt(process.env.LARGE_REPO_FILE_THRESHOLD, 180);
    const PARTIAL_REPORT_FILE_LIMIT = toPositiveInt(process.env.PARTIAL_REPORT_FILE_LIMIT, 120);
    const ENABLE_BACKGROUND_REPORT_ENRICHMENT = process.env.ENABLE_BACKGROUND_REPORT_ENRICHMENT !== 'false';

    const shouldUsePartialReport = files.length > LARGE_REPO_FILE_THRESHOLD;
    const reportFiles = shouldUsePartialReport ? pickRepresentativeFiles(files, PARTIAL_REPORT_FILE_LIMIT) : files;
    const reportMode = shouldUsePartialReport ? 'partial' : 'full';
    const includeAIInPartial = process.env.INCLUDE_AI_IN_PARTIAL_REPORT === 'true';
    const includeAI = reportMode === 'full' || includeAIInPartial;

    const chunks = ChunkingService.processFiles(files);


    console.log(`[PROCESSOR] Processing ${Math.min(chunks.length, CHUNK_LIMIT)} of ${chunks.length} chunks`);
    if (shouldUsePartialReport) {
      console.log(`[PROCESSOR] Large repo detected (${files.length} files). Generating partial report from ${reportFiles.length} representative files.`);
    }

    const chunksForEmbeddings = chunks.slice(0, CHUNK_LIMIT);
    const report = await ReportService.generateFullReport(projectId, reportFiles, {
      includeAI,
      mode: reportMode,
      totalFiles: files.length
    });

    const vectorizationTask = VectorService.storeChunks(projectId, chunksForEmbeddings, updateStatus)
      .then(() => {
        console.log(`[PROCESSOR] Vectorization complete for project ${projectId}`);
      })
      .catch((vectorError) => {
        console.error(`[PROCESSOR] Vectorization failed for project ${projectId}:`, vectorError.message);
      });

    if (BLOCK_ON_VECTORIZATION) {
      await vectorizationTask;
    } else {
      // Keep report latency low by not blocking on embeddings.
      void vectorizationTask;
    }

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
        stage: shouldUsePartialReport ? 'Done (Partial report ready)' : 'Done' 
      });
      console.log(`[PROCESSOR] Analysis saved for project ${projectId}`);

      if (shouldUsePartialReport && ENABLE_BACKGROUND_REPORT_ENRICHMENT) {
        void (async () => {
          try {
            console.log(`[PROCESSOR] Starting background enrichment for project ${projectId}...`);
            const fullReport = await ReportService.generateFullReport(projectId, files, {
              includeAI: true,
              mode: 'full',
              totalFiles: files.length
            });

            await AnalysisResult.findOneAndUpdate(
              { projectId },
              { reportData: fullReport },
              { new: true }
            );

            await Project.findByIdAndUpdate(projectId, {
              stage: 'Done (Fully enriched)'
            });
            console.log(`[PROCESSOR] Background enrichment complete for project ${projectId}.`);
          } catch (enrichmentError) {
            console.error(`[PROCESSOR] Background enrichment failed for project ${projectId}:`, enrichmentError.message);
          }
        })();
      }
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
