/**
 * In-browser mock API. Mirrors a real backend with these endpoints:
 *  POST /api/analyze         -> { jobId }
 *  GET  /api/status/:jobId   -> JobStatusResponse
 *  GET  /api/report/:id      -> Report
 *
 * Swap `apiClient` for fetch() against a real backend later — signatures match.
 */










const API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

export const apiClient = {
  async analyze(req) {
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['x-api-key'] = API_KEY;

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(req)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to analyze repository');
    }
    return res.json();
  },

  async status(jobId) {
    const headers = {};
    if (API_KEY) headers['x-api-key'] = API_KEY;

    const res = await fetch(`/api/status/${jobId}`, { headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch status');
    }
    const data = await res.json();
    
    let stage = data.stage;
    if (!stage) {
      if (data.progress < 20) stage = "Cloning repository";
      else if (data.progress < 40) stage = "Indexing files";
      else if (data.progress < 70) stage = "Static analysis";
      else if (data.progress < 90) stage = "AI review";
      else stage = "Generating report";
    }

    if (data.status === 'completed') {
      stage = 'Done';
    }

    return { 
      jobId: data.jobId, 
      status: data.status, 
      progress: data.progress, 
      stage, 
      reportId: data.projectId, 
      error: data.error,
      updatedAt: data.updatedAt,
      createdAt: data.createdAt
    };
  },

  async scout(repoUrl) {
    const headers = { 'Content-Type': 'application/json' };
    if (API_KEY) headers['x-api-key'] = API_KEY;
    const res = await fetch('/api/scout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ repoUrl })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch scout preview');
    }
    return res.json();
  },

  async report(id) {
    const headers = {};
    if (API_KEY) headers['x-api-key'] = API_KEY;

    const res = await fetch(`/api/report/${id}`, { headers });

    // 202 = analysis running but no report data written yet
    if (res.status === 202) {
      const err = await res.json();
      throw new Error(err.error || 'Analysis still in progress');
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch report');
    }
    const data = await res.json();
    
    return {
      id: data.project._id,
      repo: data.project.repoUrl,
      analyzedAt: data.report.createdAt,
      partial: data.partial ?? false,   // ← pass partial flag to the UI
      ...data.report.reportData
    };
  }
};