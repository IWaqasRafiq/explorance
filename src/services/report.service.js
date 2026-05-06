import { StaticAnalysisService } from './static-analysis.service.js';
import { AIService } from './ai.service.js';

export class ReportService {
  /**
   * Generates the final comprehensive report for a project
   * @param {string} projectId 
   * @param {Array} files 
   */
  static async generateFullReport(projectId, files, options = {}) {
    const { includeAI = true, mode = 'full', totalFiles = files.length } = options;
    console.log(`[REPORT_SERVICE] Creating master report for project ${projectId}...`);

    // 1. Run Static Analysis (Facts)
    const staticResults = StaticAnalysisService.analyze(files);
    
    // 2. Run AI Analysis (Interpretation)
    let aiInsights = {
      summary: '',
      purpose: '',
      techStack: [],
      bugs: [],
      performance: [],
      architectureStyle: 'Modular',
      recommendations: []
    };

    if (includeAI) {
      aiInsights = await AIService.generateInsights(files, staticResults);
    }

    // 3. Combine into the Final Report Structure (Merging Static + AI)
    const report = {
      projectId,
      timestamp: new Date().toISOString(),
      summary: aiInsights.summary || "Static analysis summary generated. AI insights are unavailable for this run.",
      purpose: aiInsights.purpose || staticResults.purpose || "Project purpose not detected.",
      metrics: staticResults.metrics,
      languages: staticResults.metrics.languages || [],
      qualityScore: staticResults.metrics.qualityScore ?? 0,
      techStack: aiInsights.techStack || [],
      // Merge bugs from both sources, ensuring no duplicates by ID (if possible)
      bugs: [...(staticResults.bugs || []), ...(aiInsights.bugs || [])].slice(0, 15),
      // Merge performance issues from both sources
      performance: [...(staticResults.performance || []), ...(aiInsights.performance || [])].slice(0, 15),
      duplicates: staticResults.duplicates || [],
      unusedCode: staticResults.unusedCode || [],
      folderStructure: staticResults.folderStructure,
      libraries: staticResults.libraries || [],
      credentials: staticResults.credentials || [],
      architecture: {
        style: aiInsights.architectureStyle || "Modular",
        insights: aiInsights.recommendations || []
      },
      partial: mode !== 'full',
      analysisScope: {
        mode,
        analyzedFiles: files.length,
        totalFiles,
        hasBackgroundEnrichment: mode !== 'full'
      }
    };

    console.log(`[REPORT_SERVICE] Master report complete.`);
    return report;
  }
}
