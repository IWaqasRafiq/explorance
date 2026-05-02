import { StaticAnalysisService } from './static-analysis.service.js';
import { AIService } from './ai.service.js';

export class ReportService {
  /**
   * Generates the final comprehensive report for a project
   * @param {string} projectId 
   * @param {Array} files 
   */
  static async generateFullReport(projectId, files) {
    console.log(`[REPORT_SERVICE] Creating master report for project ${projectId}...`);

    // 1. Run Static Analysis (Facts)
    const staticResults = StaticAnalysisService.analyze(files);
    
    // 2. Run AI Analysis (Interpretation)
    const aiInsights = await AIService.generateInsights(files, staticResults);

    // 3. Combine into the Final Report Structure
    const report = {
      projectId,
      timestamp: new Date().toISOString(),
      summary: aiInsights.summary || "Project summary not available.",
      purpose: staticResults.purpose, // Added missing purpose
      metrics: staticResults.metrics,
      languages: staticResults.metrics.languages || [],
      qualityScore: staticResults.metrics.qualityScore ?? 0,
      techStack: aiInsights.techStack || [],
      bugs: aiInsights.bugs || [],
      performance: aiInsights.performance || [],
      duplicates: staticResults.duplicates || [],
      unusedCode: staticResults.unusedCode || [],
      folderStructure: staticResults.folderStructure,
      libraries: staticResults.libraries || [],
      credentials: staticResults.credentials || [],
      architecture: {
        style: aiInsights.architectureStyle || "Modular",
        insights: aiInsights.recommendations || []
      }
    };

    console.log(`[REPORT_SERVICE] Master report complete.`);
    return report;
  }
}
