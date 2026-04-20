// Types shared across the analysis flow.

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface AnalyzeRequest {
  source: "url" | "zip";
  repoUrl?: string;
  fileName?: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  stage: string;
  reportId?: string;
  error?: string;
}

export interface LanguageBreakdown {
  name: string;
  percent: number;
  bytes: number;
}

export interface Issue {
  id: string;
  title: string;
  file: string;
  line: number;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface Duplicate {
  id: string;
  files: string[];
  lines: number;
  similarity: number; // 0-1
  snippet: string;
}

export interface Library {
  name: string;
  version: string;
  type: "runtime" | "dev" | "peer";
  purpose: string;
}

export interface FolderNode {
  name: string;
  kind: "dir" | "file";
  description?: string;
  children?: FolderNode[];
}

export interface Credential {
  name: string;
  required: boolean;
  description: string;
  example?: string;
  where: string; // where to obtain it
}

export interface Report {
  id: string;
  repo: string;
  analyzedAt: string;
  summary: string;
  purpose: string;
  qualityScore: number; // 0-100
  metrics: {
    files: number;
    lines: number;
    complexity: number;
    coverage: number;
  };
  languages: LanguageBreakdown[];
  libraries: Library[];
  folderStructure: FolderNode;
  credentials: Credential[];
  bugs: Issue[];
  performance: Issue[];
  duplicates: Duplicate[];
}
