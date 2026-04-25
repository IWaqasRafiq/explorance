"use client";

import { useCallback, useRef, useState } from "react";
import { Github, Upload, Loader2, FileArchive, X } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const urlSchema = z.
string().
trim().
min(1, "Repository URL is required").
max(300, "URL too long").
regex(/^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i, "Enter a valid GitHub repo URL");





export function AnalyzeForm({ onSubmitted }) {
  const { toast } = useToast();
  const startAnalysis = useAnalysisStore((s) => s.startAnalysis);
  const isPolling = useAnalysisStore((s) => s.isPolling);

  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const submitUrl = async () => {
    setError(null);
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    try {
      const jobId = await startAnalysis({ source: "url", repoUrl: parsed.data });
      onSubmitted?.(jobId);
    } catch {
      toast({ title: "Failed to start", description: "Please try again.", variant: "destructive" });
    }
  };

  const submitZip = async () => {
    setError(null);
    if (!file) {setError("Please choose a .zip file");return;}
    if (!file.name.toLowerCase().endsWith(".zip")) {setError("File must be a .zip");return;}
    if (file.size > 50 * 1024 * 1024) {setError("Max file size is 50MB");return;}
    try {
      const jobId = await startAnalysis({ source: "zip", fileName: file.name });
      onSubmitted?.(jobId);
    } catch {
      toast({ title: "Failed to start", description: "Please try again.", variant: "destructive" });
    }
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  }, []);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <Tabs defaultValue="url">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url"><Github className="mr-2 h-4 w-4" />GitHub URL</TabsTrigger>
            <TabsTrigger value="zip"><Upload className="mr-2 h-4 w-4" />Upload ZIP</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-6 space-y-3">
            <label htmlFor="repo-url" className="text-sm font-medium">Repository URL</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="repo-url"
                placeholder="https://github.com/vercel/next.js"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitUrl()}
                className="font-mono"
                maxLength={300} />
              
              <Button onClick={submitUrl} disabled={isPolling} className="sm:w-40">
                {isPolling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing</> : "Analyze"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="zip" className="mt-6 space-y-3">
            <div
              onDragOver={(e) => {e.preventDefault();setDragOver(true);}}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors",
                dragOver && "border-foreground bg-secondary/50"
              )}>
              
              <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              
              <AnimatePresence mode="wait">
                {file ?
                <motion.div key="file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                    <FileArchive className="h-6 w-6" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => {e.stopPropagation();setFile(null);}}>
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div> :

                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Drop a .zip here, or click to browse</p>
                    <p className="text-xs text-muted-foreground">Max 50MB</p>
                  </motion.div>
                }
              </AnimatePresence>
            </div>
            <Button onClick={submitZip} disabled={isPolling || !file} className="w-full">
              {isPolling ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing</> : "Analyze upload"}
            </Button>
          </TabsContent>
        </Tabs>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>);

}