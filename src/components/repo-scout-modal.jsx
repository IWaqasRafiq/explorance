"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Sparkles, Zap, Search, Gem, TrendingUp, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RepoScoutModal({ isOpen, onClose, repoUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && repoUrl) {
      setLoading(true);
      fetchScoutData(repoUrl);
    }
  }, [isOpen, repoUrl]);

  const fetchScoutData = async (url) => {
    try {
      const res = await fetch("/api/scout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_ADMIN_API_KEY
        },
        body: JSON.stringify({ repoUrl: url }),
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Scout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-primary/20 bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <DialogTitle className="text-xl">Repo Scout: Quick Look</DialogTitle>
          </div>
          <DialogDescription>
            Hold tight! While we perform a deep audit, here&apos;s a first-glance summary.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 min-h-[300px]">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
              <p className="animate-pulse font-mono text-sm text-muted-foreground">Scouting the perimeter...</p>
            </div>
          ) : data ? (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar"
              >
                {/* Elevator Pitch */}
                <div className="rounded-lg bg-primary/5 p-4 border border-primary/10">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Zap className="h-4 w-4" /> The 10-Second Elevator Pitch
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">{data.pitch}</p>
                </div>

                {/* First Impressions */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Search className="h-4 w-4" /> The Personality
                    </h3>
                    <p className="text-sm text-muted-foreground italic">"{data.personality}"</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <div className="h-4 w-4 rounded-full bg-primary/20" /> The Stack
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {data.stack.map(s => (
                        <span key={s} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hidden Gems */}
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                    <Gem className="h-4 w-4" /> Hidden Gems
                  </h3>
                  <ul className="space-y-2">
                    {data.gems.map((gem, i) => (
                      <li key={i} className="rounded-md border border-border/50 bg-muted/30 p-3 text-sm">
                        <span className="font-medium text-foreground">{gem.title}:</span> {gem.description}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pulse & Fact */}
                <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <TrendingUp className="h-3 w-3" /> Momentum Check
                    </h3>
                    <p className="text-xs">{data.momentum}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Info className="h-3 w-3" /> Did You Know?
                    </h3>
                    <p className="text-xs text-muted-foreground">{data.funFact}</p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="animate-pulse text-[10px] font-medium text-primary/60 uppercase tracking-widest">
                    Full analysis {data.syncProgress || "85"}% synced...
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-destructive">Scout failed to report back. Deep audit continues...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
