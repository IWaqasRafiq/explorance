import { create } from "zustand";
import { apiClient } from "./api";














let pollTimer = null;

export const useAnalysisStore = create((set, get) => ({
  jobId: null,
  status: null,
  report: null,
  error: null,
  isPolling: false,

  reset: () => {
    if (pollTimer) clearTimeout(pollTimer);
    pollTimer = null;
    set({ jobId: null, status: null, report: null, error: null, isPolling: false });
  },

  startAnalysis: async (req) => {
    if (pollTimer) clearTimeout(pollTimer);
    set({ jobId: null, status: null, report: null, error: null, isPolling: true });
    try {
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

  pollStatus: async (jobId) => {
    try {
      const status = await apiClient.status(jobId);
      set({ status });
      if (status.status === "completed" && status.reportId) {
        const report = await apiClient.report(status.reportId);
        set({ report, isPolling: false });
        return;
      }
      if (status.status === "failed") {
        set({ error: status.error ?? "Analysis failed", isPolling: false });
        return;
      }
      pollTimer = setTimeout(() => get().pollStatus(jobId), 700);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Polling failed";
      set({ error: msg, isPolling: false });
    }
  },

  loadReport: async (id) => {
    const report = await apiClient.report(id);
    set({ report });
    return report;
  }
}));