"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";







export function JobStatusCard({ status, error }) {
  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-3 p-4">
          <XCircle className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium">Analysis failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>);

  }

  if (!status) return null;

  const done = status.status === "completed";
  const partialPreview = status.status === "partial_preview";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={partialPreview ? "border-amber-500/40" : ""}>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {done || partialPreview ? <CheckCircle2 className={`h-4 w-4 ${partialPreview ? "text-amber-500" : "text-success"}`} /> : <Loader2 className="h-4 w-4 animate-spin" />}
              <p className="text-sm font-medium">{done ? "Completed" : status.stage}</p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{status.progress}%</span>
          </div>
          <Progress value={status.progress} className="h-1.5" />
          <p className="font-mono text-[11px] text-muted-foreground">job_id: {status.jobId}</p>
        </CardContent>
      </Card>
    </motion.div>);

}