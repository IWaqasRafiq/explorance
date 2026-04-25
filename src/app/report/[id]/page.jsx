"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from 'next/link';
import { ArrowLeft, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
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
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Report · AI GitHub Explorer";
  }, []);

  useEffect(() => {
    if (!id || report && report.id === id) return;
    let active = true;
    apiClient.
    report(id).
    then((r) => active && setReport(r)).
    catch((e) => active && setError(e instanceof Error ? e.message : "Not found"));
    return () => {active = false;};
  }, [id, report]);

  if (error) {
    return (
      <AppLayout>
        <section className="container max-w-xl py-20">
          <Card>
            <CardContent className="space-y-3 p-8 text-center">
              <h1 className="text-xl font-semibold">Report unavailable</h1>
              <p className="text-sm text-muted-foreground">{error}. Reports live in-session — start a new analysis to generate one.</p>
              <Button asChild><Link href="/analyze">Start analysis</Link></Button>
            </CardContent>
          </Card>
        </section>
      </AppLayout>);

  }

  if (!report) {
    return (
      <AppLayout>
        <div className="container flex items-center justify-center py-32">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>);

  }

  return (
    <AppLayout>
      <section className="container space-y-6 py-10">
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

        <StatGrid
          stats={[
          { label: "Files", value: report.metrics.files },
          { label: "Lines of code", value: report.metrics.lines.toLocaleString() },
          { label: "Avg complexity", value: report.metrics.complexity, hint: "cyclomatic" },
          { label: "Test coverage", value: `${report.metrics.coverage}%` }]
          } />
        

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