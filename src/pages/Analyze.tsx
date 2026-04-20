import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/app-layout";
import { AnalyzeForm } from "@/components/analyze-form";
import { JobStatusCard } from "@/components/job-status-card";
import { useAnalysisStore } from "@/lib/store";

const Analyze = () => {
  const navigate = useNavigate();
  const { status, error, report, reset } = useAnalysisStore();

  useEffect(() => {
    document.title = "Analyze · AI GitHub Explorer";
  }, []);

  useEffect(() => {
    if (report) {
      const id = report.id;
      const t = setTimeout(() => navigate(`/report/${id}`), 600);
      return () => clearTimeout(t);
    }
  }, [report, navigate]);

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
      </section>
    </AppLayout>
  );
};

export default Analyze;
