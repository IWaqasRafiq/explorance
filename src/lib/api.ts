/**
 * In-browser mock API. Mirrors a real backend with these endpoints:
 *  POST /api/analyze         -> { jobId }
 *  GET  /api/status/:jobId   -> JobStatusResponse
 *  GET  /api/report/:id      -> Report
 *
 * Swap `apiClient` for fetch() against a real backend later — signatures match.
 */
import type { AnalyzeRequest, JobStatusResponse, Report } from "./types";

interface JobRecord {
  jobId: string;
  startedAt: number;
  status: JobStatusResponse["status"];
  reportId?: string;
  request: AnalyzeRequest;
}

const jobs = new Map<string, JobRecord>();
const reports = new Map<string, Report>();

const STAGES = [
  { until: 15, stage: "Cloning repository" },
  { until: 35, stage: "Indexing files" },
  { until: 55, stage: "Static analysis" },
  { until: 75, stage: "AI review" },
  { until: 95, stage: "Generating report" },
  { until: 100, stage: "Finalizing" },
];

const TOTAL_MS = 6500;

function pickStage(progress: number) {
  return STAGES.find((s) => progress <= s.until)?.stage ?? "Working";
}

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function buildReport(id: string, repo: string): Report {
  return {
    id,
    repo,
    analyzedAt: new Date().toISOString(),
    summary:
      "This repository is a mid-size TypeScript application with a React frontend and a thin Node service layer. Architecture is generally sound — components are well-decomposed and routing is consistent. Main risks are concentrated in the data layer: several async paths swallow errors, and a handful of hot loops perform redundant work. Test coverage is adequate for happy paths but thin around edge cases. Recommended next steps: tighten error boundaries, memoize heavy renders, and extract three duplicated helpers into a shared module.",
    qualityScore: 78,
    metrics: { files: 312, lines: 24890, complexity: 14.2, coverage: 67 },
    languages: [
      { name: "TypeScript", percent: 58, bytes: 1_420_000 },
      { name: "JavaScript", percent: 18, bytes: 440_000 },
      { name: "CSS", percent: 9, bytes: 220_000 },
      { name: "HTML", percent: 6, bytes: 145_000 },
      { name: "JSON", percent: 5, bytes: 120_000 },
      { name: "Other", percent: 4, bytes: 95_000 },
    ],
    bugs: [
      { id: uid("b_"), title: "Unhandled promise rejection in fetchUser", file: "src/api/user.ts", line: 42, severity: "high", description: "Network errors silently fail; downstream UI shows stale data." },
      { id: uid("b_"), title: "Off-by-one in pagination range", file: "src/components/Pagination.tsx", line: 88, severity: "medium", description: "Last page omits one item when total % size === 1." },
      { id: uid("b_"), title: "Race condition on auth refresh", file: "src/auth/refresh.ts", line: 17, severity: "critical", description: "Concurrent refreshes can clobber the new token." },
      { id: uid("b_"), title: "Missing key prop in list", file: "src/views/Feed.tsx", line: 121, severity: "low", description: "React reconciliation warning; minor perf impact." },
    ],
    performance: [
      { id: uid("p_"), title: "Re-render storm in <Dashboard>", file: "src/views/Dashboard.tsx", line: 64, severity: "high", description: "Context value recreated each render; memoize with useMemo." },
      { id: uid("p_"), title: "N+1 query in /api/posts", file: "server/routes/posts.ts", line: 31, severity: "high", description: "Fetch authors in batch via IN(...) instead of per-row." },
      { id: uid("p_"), title: "Large bundle from moment.js", file: "package.json", line: 1, severity: "medium", description: "Replace with date-fns or dayjs to shave ~70KB gzipped." },
    ],
    duplicates: [
      { id: uid("d_"), files: ["src/utils/format.ts", "src/views/Invoice.tsx"], lines: 28, similarity: 0.94, snippet: "function formatCurrency(n: number) {\n  return new Intl.NumberFormat('en-US', {\n    style: 'currency', currency: 'USD'\n  }).format(n);\n}" },
      { id: uid("d_"), files: ["src/api/user.ts", "src/api/admin.ts"], lines: 19, similarity: 0.88, snippet: "const res = await fetch(url, { headers });\nif (!res.ok) throw new Error(res.statusText);\nreturn res.json();" },
    ],
  };
}

export const apiClient = {
  async analyze(req: AnalyzeRequest): Promise<{ jobId: string }> {
    await delay(350);
    const jobId = uid("job_");
    jobs.set(jobId, { jobId, startedAt: Date.now(), status: "queued", request: req });
    return { jobId };
  },

  async status(jobId: string): Promise<JobStatusResponse> {
    await delay(180);
    const job = jobs.get(jobId);
    if (!job) throw new Error("Job not found");

    const elapsed = Date.now() - job.startedAt;
    const progress = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));

    if (progress < 100) {
      job.status = elapsed < 400 ? "queued" : "running";
      return { jobId, status: job.status, progress, stage: pickStage(progress) };
    }

    if (!job.reportId) {
      const reportId = uid("rep_");
      const repo = job.request.repoUrl ?? job.request.fileName ?? "uploaded.zip";
      reports.set(reportId, buildReport(reportId, repo));
      job.reportId = reportId;
      job.status = "completed";
    }
    return { jobId, status: "completed", progress: 100, stage: "Done", reportId: job.reportId };
  },

  async report(id: string): Promise<Report> {
    await delay(220);
    const r = reports.get(id);
    if (!r) throw new Error("Report not found");
    return r;
  },
};

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
