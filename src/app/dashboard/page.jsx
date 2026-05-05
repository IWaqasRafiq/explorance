"use client";

import { useEffect } from "react";
import Link from 'next/link';
import { ArrowRight, Inbox } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalysisStore } from "@/lib/store";
import { JobStatusCard } from "@/components/job-status-card";
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

const Dashboard = () => {
  const { report, status, error } = useAnalysisStore();

  useEffect(() => {
    document.title = "Dashboard · Explorance";
  }, []);

  if (!report) {
    return (
      <AppLayout>
        <section className="container max-w-2xl py-20">
          {status || error ?
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold tracking-tight">Analysis in progress</h1>
              <JobStatusCard status={status} error={error} />
            </div> :

          <Card>
              <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">No analyses yet</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Run your first analysis to populate the dashboard.</p>
                </div>
                <Button asChild>
                  <Link href="/analyze">Start an analysis <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          }
        </section>
      </AppLayout>);

  }

  return (
    <AppLayout>
      <section className="container space-y-6 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-xs text-muted-foreground">{new Date(report.analyzedAt).toLocaleString()}</p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{report.repo}</h1>
          </div>
          <Button asChild variant="outline">
            <Link href={`/report/${report.id}`}>Open full report <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        <StatGrid
          stats={[
          { label: "Files", value: report.metrics.files },
          { label: "Lines of code", value: report.metrics.lines.toLocaleString() },
          { label: "Avg complexity", value: report.metrics.complexity },
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

export default Dashboard;