import { create } from "zustand";
import { apiClient } from "./api";














let pollTimer = null;
const POLL_INTERVAL_MS = Number.parseInt(process.env.NEXT_PUBLIC_STATUS_POLL_MS || "1200", 10);
const MAX_POLL_MS = Number.parseInt(process.env.NEXT_PUBLIC_MAX_POLL_MS || String(20 * 60 * 1000), 10);
const STALE_JOB_MS = Number.parseInt(process.env.NEXT_PUBLIC_STALE_JOB_MS || String(3 * 60 * 1000), 10);

export const useAnalysisStore = create((set, get) => ({
  jobId: null,
  status: null,
  report: null,
  quickScout: null,
  error: null,
  isPolling: false,
  pollingStartedAt: null,

  reset: () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
    set({ jobId: null, status: null, report: null, quickScout: null, error: null, isPolling: false, pollingStartedAt: null });
  },

  startAnalysis: async (req) => {
    if (pollTimer) clearTimeout(pollTimer);
    set({ jobId: null, status: null, report: null, quickScout: null, error: null, isPolling: true, pollingStartedAt: Date.now() });
    try {
      if (req?.source === "url" && req?.repoUrl) {
        void apiClient.scout(req.repoUrl)
          .then((scout) => set({ quickScout: scout }))
          .catch(() => {});
      }
      const { jobId } = await apiClient.analyze(req);
      set({ jobId });
      get().pollStatus(jobId);
      return jobId;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start analysis";
      set({ error: msg, isPolling: false });
      throw e;
    }
  },

  pollStatus: async (jobId, background = false) => {
    try {
      const status = await apiClient.status(jobId);
      set({ status });

      const state = get();
      const now = Date.now();
      const pollStartedAt = state.pollingStartedAt || now;
      const totalElapsed = now - pollStartedAt;
      const serverUpdatedAtMs = status.updatedAt ? new Date(status.updatedAt).getTime() : now;
      const staleFor = Number.isFinite(serverUpdatedAtMs) ? now - serverUpdatedAtMs : 0;

      if (status.status === "completed" && status.reportId) {
        const report = await apiClient.report(status.reportId);
        set({ report, isPolling: false, pollingStartedAt: null });
        return;
      }
      if (status.status === "failed") {
        set({ error: status.error ?? "Analysis failed", isPolling: false, pollingStartedAt: null });
        return;
      }

      if (totalElapsed > MAX_POLL_MS || staleFor > STALE_JOB_MS) {
        set((prev) => ({
          status: {
            ...(prev.status || status),
            status: "partial_preview",
            stage: "Partial preview ready. Full analysis continues in background.",
            progress: Math.max(65, prev?.status?.progress || status.progress || 0)
          },
          error: null,
          isPolling: false
        }));
        pollTimer = setTimeout(() => get().pollStatus(jobId, true), 10000);
        return;
      }

      pollTimer = setTimeout(() => get().pollStatus(jobId, background), background ? 10000 : POLL_INTERVAL_MS);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Polling failed";
      set({ error: msg, isPolling: false, pollingStartedAt: null });
    }
  },

  loadReport: async (id) => {
    const report = await apiClient.report(id);
    set({ report });
    return report;
  }
}));