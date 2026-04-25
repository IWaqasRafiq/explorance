/**
 * In-browser mock API. Mirrors a real backend with these endpoints:
 *  POST /api/analyze         -> { jobId }
 *  GET  /api/status/:jobId   -> JobStatusResponse
 *  GET  /api/report/:id      -> Report
 *
 * Swap `apiClient` for fetch() against a real backend later — signatures match.
 */










const jobs = new Map();
const reports = new Map();

const STAGES = [
{ until: 15, stage: "Cloning repository" },
{ until: 35, stage: "Indexing files" },
{ until: 55, stage: "Static analysis" },
{ until: 75, stage: "AI review" },
{ until: 95, stage: "Generating report" },
{ until: 100, stage: "Finalizing" }];


const TOTAL_MS = 6500;

function pickStage(progress) {
  return STAGES.find((s) => progress <= s.until)?.stage ?? "Working";
}

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 10);
}

function buildReport(id, repo) {
  return {
    id,
    repo,
    analyzedAt: new Date().toISOString(),
    summary:
    "This repository is a mid-size TypeScript application with a React frontend and a thin Node service layer. Architecture is generally sound — components are well-decomposed and routing is consistent. Main risks are concentrated in the data layer: several async paths swallow errors, and a handful of hot loops perform redundant work. Test coverage is adequate for happy paths but thin around edge cases. Recommended next steps: tighten error boundaries, memoize heavy renders, and extract three duplicated helpers into a shared module.",
    purpose:
    "This project was created to help engineering teams ship a customer-facing analytics dashboard. It ingests events from a backend API, normalizes them, and renders interactive charts so non-technical stakeholders can explore product usage. Secondary goals are to provide an authenticated admin area for managing data sources and to expose a small REST surface for embedding widgets in other internal tools.",
    qualityScore: 78,
    metrics: { files: 312, lines: 24890, complexity: 14.2, coverage: 67 },
    languages: [
    { name: "TypeScript", percent: 58, bytes: 1_420_000 },
    { name: "JavaScript", percent: 18, bytes: 440_000 },
    { name: "CSS", percent: 9, bytes: 220_000 },
    { name: "HTML", percent: 6, bytes: 145_000 },
    { name: "JSON", percent: 5, bytes: 120_000 },
    { name: "Other", percent: 4, bytes: 95_000 }],

    bugs: [
    { id: uid("b_"), title: "Unhandled promise rejection in fetchUser", file: "src/api/user.ts", line: 42, severity: "high", description: "Network errors silently fail; downstream UI shows stale data." },
    { id: uid("b_"), title: "Off-by-one in pagination range", file: "src/components/Pagination.tsx", line: 88, severity: "medium", description: "Last page omits one item when total % size === 1." },
    { id: uid("b_"), title: "Race condition on auth refresh", file: "src/auth/refresh.ts", line: 17, severity: "critical", description: "Concurrent refreshes can clobber the new token." },
    { id: uid("b_"), title: "Missing key prop in list", file: "src/views/Feed.tsx", line: 121, severity: "low", description: "React reconciliation warning; minor perf impact." }],

    performance: [
    { id: uid("p_"), title: "Re-render storm in <Dashboard>", file: "src/views/Dashboard.tsx", line: 64, severity: "high", description: "Context value recreated each render; memoize with useMemo." },
    { id: uid("p_"), title: "N+1 query in /api/posts", file: "server/routes/posts.ts", line: 31, severity: "high", description: "Fetch authors in batch via IN(...) instead of per-row." },
    { id: uid("p_"), title: "Large bundle from moment.js", file: "package.json", line: 1, severity: "medium", description: "Replace with date-fns or dayjs to shave ~70KB gzipped." }],

    duplicates: [
    { id: uid("d_"), files: ["src/utils/format.ts", "src/views/Invoice.tsx"], lines: 28, similarity: 0.94, snippet: "function formatCurrency(n: number) {\n  return new Intl.NumberFormat('en-US', {\n    style: 'currency', currency: 'USD'\n  }).format(n);\n}" },
    { id: uid("d_"), files: ["src/api/user.ts", "src/api/admin.ts"], lines: 19, similarity: 0.88, snippet: "const res = await fetch(url, { headers });\nif (!res.ok) throw new Error(res.statusText);\nreturn res.json();" }],

    libraries: [
    { name: "react", version: "18.3.1", type: "runtime", purpose: "UI rendering library powering the component tree." },
    { name: "react-dom", version: "18.3.1", type: "runtime", purpose: "DOM bindings for React." },
    { name: "react-router-dom", version: "6.26.2", type: "runtime", purpose: "Client-side routing between pages." },
    { name: "@tanstack/react-query", version: "5.56.2", type: "runtime", purpose: "Server state caching and async data fetching." },
    { name: "zustand", version: "4.5.5", type: "runtime", purpose: "Lightweight global state store." },
    { name: "axios", version: "1.7.7", type: "runtime", purpose: "HTTP client for API requests." },
    { name: "tailwindcss", version: "3.4.13", type: "dev", purpose: "Utility-first CSS framework for styling." },
    { name: "vite", version: "5.4.8", type: "dev", purpose: "Dev server and build tool." },
    { name: "typescript", version: "5.6.2", type: "dev", purpose: "Static type checking." },
    { name: "vitest", version: "2.1.1", type: "dev", purpose: "Unit testing framework." },
    { name: "eslint", version: "9.11.1", type: "dev", purpose: "Code linting and style enforcement." },
    { name: "recharts", version: "2.12.7", type: "runtime", purpose: "Charting library used in the dashboard." }],

    folderStructure: {
      name: "repo-root", kind: "dir", description: "Project root.",
      children: [
      { name: "src", kind: "dir", description: "Application source code.", children: [
        { name: "components", kind: "dir", description: "Reusable UI components.", children: [
          { name: "ui", kind: "dir", description: "Primitive design-system components." },
          { name: "Dashboard.tsx", kind: "file", description: "Main dashboard view." }]
        },
        { name: "pages", kind: "dir", description: "Route-level pages." },
        { name: "lib", kind: "dir", description: "Shared utilities, API client, and types.", children: [
          { name: "api.ts", kind: "file", description: "Typed API client." },
          { name: "store.ts", kind: "file", description: "Zustand global store." }]
        },
        { name: "hooks", kind: "dir", description: "Custom React hooks." },
        { name: "main.tsx", kind: "file", description: "App entry point." }]
      },
      { name: "public", kind: "dir", description: "Static assets served as-is." },
      { name: "tests", kind: "dir", description: "Vitest unit and integration tests." },
      { name: "package.json", kind: "file", description: "Dependencies and npm scripts." },
      { name: "vite.config.ts", kind: "file", description: "Vite build configuration." },
      { name: "tailwind.config.ts", kind: "file", description: "Tailwind theme and tokens." },
      { name: ".env.example", kind: "file", description: "Sample env vars — copy to .env.local." },
      { name: "README.md", kind: "file", description: "Project overview and setup guide." }]

    },
    credentials: [
    { name: "VITE_API_BASE_URL", required: true, description: "Base URL for the backend API the frontend talks to.", example: "http://localhost:4000", where: "Run the backend locally or use a deployed staging URL." },
    { name: "DATABASE_URL", required: true, description: "PostgreSQL connection string used by the backend.", example: "postgres://user:pass@localhost:5432/app", where: "Provision a local Postgres (e.g. Docker) or use Neon/Supabase." },
    { name: "JWT_SECRET", required: true, description: "Secret used to sign and verify auth tokens.", example: "a-long-random-string", where: "Generate with `openssl rand -hex 32`." },
    { name: "GITHUB_CLIENT_ID", required: true, description: "OAuth client ID for GitHub sign-in.", where: "GitHub → Settings → Developer settings → OAuth Apps." },
    { name: "GITHUB_CLIENT_SECRET", required: true, description: "OAuth client secret paired with the client ID.", where: "Same OAuth App page on GitHub." },
    { name: "OPENAI_API_KEY", required: false, description: "Enables AI-powered code summaries. Optional — feature is hidden if missing.", where: "platform.openai.com → API keys." },
    { name: "SENTRY_DSN", required: false, description: "Error reporting endpoint. Optional in development.", where: "Sentry project settings → Client Keys." }]

  };
}

export const apiClient = {
  async analyze(req) {
    await delay(350);
    const jobId = uid("job_");
    jobs.set(jobId, { jobId, startedAt: Date.now(), status: "queued", request: req });
    return { jobId };
  },

  async status(jobId) {
    await delay(180);
    const job = jobs.get(jobId);
    if (!job) throw new Error("Job not found");

    const elapsed = Date.now() - job.startedAt;
    const progress = Math.min(100, Math.round(elapsed / TOTAL_MS * 100));

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

  async report(id) {
    await delay(220);
    const r = reports.get(id);
    if (!r) throw new Error("Report not found");
    return r;
  }
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}