/**
 * In-browser mock API. Mirrors a real backend with these endpoints:
 *  POST /api/analyze         -> { jobId }
 *  GET  /api/status/:jobId   -> JobStatusResponse
 *  GET  /api/report/:id      -> Report
 *
 * Swap `apiClient` for fetch() against a real backend later — signatures match.
 */










export const apiClient = {
  async analyze(req) {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze repository');
    }
    return res.json(); // { jobId, projectId, message }
  },

  async status(jobId) {
    const res = await fetch(`/api/status/${jobId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch status');
    }
    const data = await res.json();
    
    // Map backend status to what frontend expects
    let stage = "Working";
    if (data.progress < 20) stage = "Cloning repository";
    else if (data.progress < 40) stage = "Indexing files";
    else if (data.progress < 70) stage = "Static analysis";
    else if (data.progress < 90) stage = "AI review";
    else stage = "Generating report";

    if (data.status === 'completed') {
      stage = 'Done';
    }

    return { 
      jobId: data.jobId, 
      status: data.status, // "pending", "processing", "completed", "failed"
      progress: data.progress, 
      stage, 
      reportId: data.projectId, // We use projectId to fetch the report
      error: data.error 
    };
  },

  async report(id) {
    const res = await fetch(`/api/report/${id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch report');
    }
    const data = await res.json(); // { project, report }
    
    // Inject ID and Repo into the AI generated reportData
    return {
      id: data.project._id,
      repo: data.project.repoUrl,
      analyzedAt: data.report.createdAt,
      ...data.report.reportData // The exact JSON structure from AI
    };
  }
};