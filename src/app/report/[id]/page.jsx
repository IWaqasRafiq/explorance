"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion, useScroll, useSpring } from "framer-motion";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";

const useScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  return useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
};
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalysisStore } from "@/lib/store";
import { apiClient } from "@/lib/api";

import { LanguageChart } from "@/components/dashboard/language-chart";
import { QualityScore } from "@/components/dashboard/quality-score";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { AISummary } from "@/components/dashboard/ai-summary";
import { IssueList } from "@/components/dashboard/issue-list";
import { DuplicateList } from "@/components/dashboard/duplicate-list";
import { PurposeCard } from "@/components/dashboard/purpose-card";
import { LibrariesList } from "@/components/dashboard/libraries-list";
import { FolderStructure } from "@/components/dashboard/folder-tree";
import { CredentialsList } from "@/components/dashboard/credentials-list";

const ReportPage = () => {
  const { id } = useParams();
  const cached = useAnalysisStore((s) => s.report);
  const [report, setReport] = useState(cached?.id === id ? cached : null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollProgress = useScrollProgress();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSyncing && (status?.progress === 0 || !status)) setShowWarning(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [status, isSyncing]);

  useEffect(() => {
    document.title = "Report · AI GitHub Explorer";
  }, []);

  // Main report fetcher
  useEffect(() => {
    if (!id) return;
    
    const fetchReport = async () => {
      try {
        const r = await apiClient.report(id);
        setReport(r);
        setIsSyncing(false);
        setError(null);
      } catch (e) {
        const msg = e.message.toLowerCase();
        if (msg.includes('in progress') || msg.includes('no report data yet')) {
          setIsSyncing(true);
        } else {
          setError(e.message);
        }
      }
    };

    if (!report || isSyncing) {
      fetchReport();
    }
  }, [id, report, isSyncing]);

  // Status poller for syncing state
  useEffect(() => {
    if (!id || !isSyncing) return;

    const poll = setInterval(async () => {
      try {
        const s = await apiClient.status(id);
        setStatus(s);
        if (s.status === 'completed') {
          setIsSyncing(false);
          const r = await apiClient.report(id);
          setReport(r);
        }
      } catch (err) {
        console.error("Poller error:", err);
      }
    }, 3000);

    return () => clearInterval(poll);
  }, [id, isSyncing]);

  if (error) {
    return (
      <AppLayout>
        <section className="container max-w-xl py-20">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <ArrowLeft className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Intelligence Feed Interrupted</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => window.location.reload()}>Retry Connection</Button>
                <Button asChild><Link href="/analyze">Start New Scan</Link></Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </AppLayout>);
  }

  if (isSyncing || (!report && !error)) {
    const logs = [
      "Establishing neural link to repository...",
      "Intercepting file system events...",
      "Mapping dependency graph...",
      "Scanning for architectural patterns...",
      "Evaluating technical debt...",
      "Running QA heuristics...",
      "Synthesizing final intelligence..."
    ];
    const activeLogIdx = Math.min(Math.floor((status?.progress || 0) / 15), logs.length - 1);

    return (
      <AppLayout>
        <div className="container max-w-2xl py-24 text-center">
          <div className="relative mx-auto mb-8 h-24 w-24">
            <Loader2 className="h-24 w-24 animate-spin text-primary/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">{status?.progress || 0}%</span>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">Deep Audit in Progress...</h1>
          <p className="mb-8 text-muted-foreground">
            Current Stage: <span className="font-mono text-primary uppercase tracking-tighter">{status?.stage || "Establishing Perimeter"}</span>
          </p>
          
          <div className="space-y-4 rounded-xl border border-border/40 bg-black/40 backdrop-blur-sm p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-2"><div className="h-2 w-2 animate-pulse rounded-full bg-green-500" /> Security Protocols</span>
              <span className="text-primary">Neural Link Active</span>
            </div>
            
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/30">
               <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${status?.progress || 10}%` }}
                className="h-full bg-gradient-to-r from-primary/50 to-primary"
               />
            </div>

            {/* Neural Feed */}
            <div className="mt-6 space-y-2 font-mono text-[10px] uppercase tracking-tighter">
              {logs.slice(0, activeLogIdx + 1).map((log, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: i === activeLogIdx ? 1 : 0.4, x: 0 }}
                  key={log}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <span className={i === activeLogIdx ? "text-primary" : ""}>{i === activeLogIdx ? ">" : "•"}</span>
                  <span className={i === activeLogIdx ? "text-foreground font-bold" : ""}>{log}</span>
                  {i === activeLogIdx && <span className="h-3 w-1 animate-pulse bg-primary" />}
                </motion.div>
              ))}
            </div>
          </div>

          {showWarning && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/80"
            >
              <p className="font-bold uppercase tracking-tight mb-1 text-amber-500">System Latency Detected</p>
              The deep audit is taking longer than expected to initialize. This usually happens if the backend analysis worker is offline or the repository is extremely large.
            </motion.div>
          )}
          
          <Button variant="ghost" className="mt-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors" asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </AppLayout>);
  }

  return (
    <AppLayout>
      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-[60] origin-left"
        style={{ scaleX: scrollProgress }}
      />

      <section className="container space-y-6 py-10 relative">
        {/* Completion Glow Effect */}
        {report && !isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 2, repeat: 1 }}
            className="absolute inset-0 bg-primary/20 pointer-events-none blur-3xl rounded-full"
          />
        )}

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Dashboard</Link>
          </Button>
          <span className="font-mono text-xs text-muted-foreground">id: {report.id}</span>
        </div>

        <header>
          <p className="font-mono text-xs text-muted-foreground">{new Date(report.analyzedAt).toLocaleString()}</p>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{report.repo}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Detailed insights from static analysis and AI review.</p>
        </header>

        {report.partial && (
          <Card className="border-amber-500/40">
            <CardContent className="space-y-1 p-4">
              <p className="text-sm font-medium">Partial report is ready</p>
              <p className="text-sm text-muted-foreground">
                This repository is large. Showing an initial report from {report?.analysisScope?.analyzedFiles ?? 0} of {report?.analysisScope?.totalFiles ?? 0} files while enrichment continues in the background.
              </p>
            </CardContent>
          </Card>
        )}

        <StatGrid
          stats={[
            { label: "Files", value: report?.metrics?.files ?? 0 },
            { label: "Lines of code", value: (report?.metrics?.lines ?? 0).toLocaleString() },
            { label: "Avg complexity", value: report?.metrics?.complexity ?? 0, hint: "cyclomatic" },
            { label: "Test coverage", value: `${report?.metrics?.coverage ?? 0}%` }
          ]} />
        

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="libraries">Libraries</TabsTrigger>
            <TabsTrigger value="structure">Folder structure</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <PurposeCard purpose={report.purpose} />
            <div className="grid gap-6 md:grid-cols-2">
              <QualityScore score={report.qualityScore} />
              <LanguageChart data={report.languages} />
            </div>
            <AISummary summary={report.summary} />
            <div className="grid gap-6 md:grid-cols-2">
              <IssueList title="Bug report" kind="bug" issues={report.bugs} />
              <IssueList title="Performance issues" kind="perf" issues={report.performance} />
            </div>
            <DuplicateList items={report.duplicates} />
          </TabsContent>

          <TabsContent value="libraries">
            <LibrariesList libraries={report.libraries} />
          </TabsContent>

          <TabsContent value="structure">
            <FolderStructure root={report.folderStructure} />
          </TabsContent>

          <TabsContent value="credentials">
            <CredentialsList credentials={report.credentials} />
          </TabsContent>
        </Tabs>
      </section>
    </AppLayout>);

};

export default ReportPage;