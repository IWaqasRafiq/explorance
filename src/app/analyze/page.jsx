"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { motion } from "framer-motion";
import { AppLayout } from "@/components/app-layout";
import { AnalyzeForm } from "@/components/analyze-form";
import { JobStatusCard } from "@/components/job-status-card";
import { useAnalysisStore } from "@/lib/store";

const Analyze = () => {
  const router = useRouter();
  const { status, error, report, reset, isPolling } = useAnalysisStore();
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const headers = {};
        const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
        if (apiKey) headers["x-api-key"] = apiKey;

        const res = await fetch("/api/recent", { headers });
        if (res.ok) {
          const data = await res.json();
          setRecentProjects(data);
        }
      } catch (err) {
        console.error("Failed to fetch recent projects:", err);
      }
    };
    fetchRecent();
  }, [isPolling]); // Refresh when a new analysis completes (isPolling changes from true to false)

  useEffect(() => {
    document.title = "Analyze · Explorance";
  }, []);

  useEffect(() => {
    if (report) {
      const id = report.id;
      const t = setTimeout(() => router.push(`/report/${id}`), 600);
      return () => clearTimeout(t);
    }
  }, [report, router]);

  return (
    <AppLayout>
      <section className="container max-w-2xl py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Analyze a repository</h1>
          <p className="mt-2 text-muted-foreground">
            Provide a public GitHub URL or upload a ZIP. We&apos;ll run static analysis and an AI review.
          </p>
        </motion.div>

        <div className="mt-8">
          <AnalyzeForm />
        </div>

        <div className="mt-6 space-y-3">
          <JobStatusCard status={status} error={error} />
          {(status || error) && (
            <button
              onClick={reset}
              className="font-mono text-xs text-muted-foreground underline-offset-4 hover:underline"
            >
              reset
            </button>
          )}
        </div>

        {recentProjects.length > 0 && (
          <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-sm font-medium text-muted-foreground">Recent Scans</h2>
            <div className="mt-4 overflow-hidden rounded-lg border bg-card">
              <ul className="divide-y">
                {recentProjects.map((project) => (
                  <li key={project._id} className="group">
                    <Link 
                      href={`/report/${project._id}`}
                      className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="truncate font-mono text-sm">{project.repoUrl}</span>
                      <span className="ml-4 text-xs text-muted-foreground">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
};

export default Analyze;