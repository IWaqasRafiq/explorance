"use client";

import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Sparkles, Zap, Search, Gem, TrendingUp, Info, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

export function RepoScoutModal({ isOpen, onClose, repoUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState({ progress: 0, stage: "Starting...", status: "pending" });
  const [polling, setPolling] = useState(false);
  const pollIntervalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && repoUrl) {
      setLoading(true);
      fetchScoutData(repoUrl);
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [isOpen, repoUrl]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setPolling(false);
  };

  const fetchScoutData = async (url) => {
    try {
      const headers = { "Content-Type": "application/json" };
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
      if (apiKey) headers["x-api-key"] = apiKey;

      const res = await fetch("/api/scout", {
        method: "POST",
        headers,
        body: JSON.stringify({ repoUrl: url }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        
        if (json.jobId) {
          startPolling(json.jobId);
        }
      }
    } catch (err) {
      console.error("Scout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (jobId) => {
    setPolling(true);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        if (res.ok) {
          const status = await res.json();
          setStatusData({
            progress: status.progress || 0,
            stage: status.stage || "Analyzing...",
            status: status.status
          });

          if (status.status === 'completed' || status.status === 'failed') {
            stopPolling();
          }
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 2000);
  };

  const handleViewFullReport = () => {
    if (data?.projectId) {
      router.push(`/report/${data.projectId}`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-primary/20 bg-background/95 backdrop-blur-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <DialogTitle className="text-xl">Repo Scout: Quick Look</DialogTitle>
            </div>
            {statusData.status === 'completed' && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase bg-green-500/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </motion.div>
            )}
          </div>
          <DialogDescription>
            Instant preview active. Our deep audit engine is running in the background.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                <Sparkles className="absolute inset-0 h-12 w-12 text-primary animate-pulse p-2" />
              </div>
              <div className="text-center">
                <p className="font-mono text-sm font-bold text-primary">Infiltrating Repository...</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Bypassing firewalls & indexing patterns</p>
              </div>
            </div>
          ) : data ? (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Pitch and Health Score */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-5 border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Zap className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                      <Zap className="h-3.5 w-3.5" /> The Pitch
                    </h3>
                    <p className="text-sm leading-relaxed font-medium">{data.pitch}</p>
                  </div>
                  
                  <div className="w-full sm:w-32 flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/10 p-4">
                    <div className="relative h-20 w-20">
                      <svg className="h-full w-full" viewBox="0 0 36 36">
                        <path className="stroke-muted/20 fill-none stroke-[3]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <motion.path 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: (data.healthScore || 75) / 100 }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="stroke-primary fill-none stroke-[3] stroke-round" 
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold">{data.healthScore || 75}</span>
                        <span className="text-[8px] font-bold uppercase text-muted-foreground">QA Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QA Red Flags */}
                {data.qaRedFlags && data.qaRedFlags.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-400">
                        <AlertTriangle className="h-4 w-4" /> QA Initial Red Flags
                      </h3>
                      <span className="text-[10px] font-bold text-red-400/60 uppercase">High Priority</span>
                    </div>
                    <div className="grid gap-2">
                      {data.qaRedFlags.map((flag, i) => (
                        <motion.div 
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs group hover:bg-red-500/10 transition-colors"
                        >
                          <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                          <span className="text-red-200/80 group-hover:text-red-100 transition-colors">{flag}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* First Impressions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 rounded-xl border border-border/40 bg-muted/20 p-4 hover:border-primary/30 transition-all group">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">
                      <Search className="h-4 w-4" /> Personality
                    </h3>
                    <p className="text-sm font-semibold italic text-foreground/90">"{data.personality}"</p>
                  </div>
                  <div className="space-y-2 rounded-xl border border-border/40 bg-muted/20 p-4 hover:border-primary/30 transition-all group">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground group-hover:text-primary transition-colors">
                      <div className="h-3.5 w-3.5 rounded-full bg-primary/40 group-hover:animate-ping" /> Tech Stack
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {data.stack.map(s => (
                        <span key={s} className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[9px] font-black text-primary uppercase tracking-tighter hover:bg-primary hover:text-primary-foreground transition-all cursor-default">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Structural Gems */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500">
                      <Gem className="h-4 w-4" /> Structural Gems
                    </h3>
                  </div>
                  <div className="grid gap-3">
                    {data.gems.map((gem, i) => (
                      <motion.div 
                        whileHover={{ x: 5 }}
                        key={i} 
                        className="rounded-xl border border-border/50 bg-background/50 p-4 text-sm flex gap-4 items-center group hover:bg-muted/10 transition-all"
                      >
                        <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                           <Gem className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-xs uppercase tracking-tight">{gem.title}</p>
                          <p className="text-xs text-muted-foreground leading-snug">{gem.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Pulse & Fact */}
                <div className="grid gap-4 sm:grid-cols-2 border-t border-border/40 pt-4">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> Momentum
                    </h3>
                    <p className="text-xs font-medium">{data.momentum}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <Info className="h-3 w-3" /> Did You Know?
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{data.funFact}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-destructive">Scout failed to report back. Deep audit continues...</p>
            </div>
          )}
        </div>

        {/* Footer with Progress and Action */}
        <div className="mt-4 pt-4 border-t border-border/40 shrink-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-tighter">
              <span className={statusData.status === 'completed' ? "text-green-500" : "text-primary animate-pulse"}>
                {statusData.status === 'completed' ? 'Deep Audit Complete' : `Current Stage: ${statusData.stage}`}
              </span>
              <span className="text-muted-foreground">{statusData.progress}%</span>
            </div>
            <Progress value={statusData.progress} className="h-1.5" />
            
            <button
              onClick={handleViewFullReport}
              disabled={statusData.status !== 'completed' && !data?.projectId}
              className="w-full group relative flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {statusData.status === 'completed' ? (
                <>Explore Full Report <ChevronRight className="h-4 w-4" /></>
              ) : (
                <>
                  {data?.projectId ? 'Enter Workspace While We Audit' : 'Initializing Deep Audit...'}
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-muted-foreground">
              Built for speed. Analyzed with precision. Developed for experts.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
