"use client";

import Link from 'next/link';
import { motion } from "framer-motion";
import { ArrowRight, Bug, Code2, GitBranch, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
{ icon: Sparkles, title: "AI summary", desc: "Plain-English overview of architecture, risks, and next steps." },
{ icon: Bug, title: "Bug detection", desc: "Surfaces likely defects with file, line, and severity." },
{ icon: Zap, title: "Performance", desc: "Hot paths, re-renders, N+1 queries, and bundle bloat." },
{ icon: Code2, title: "Duplicate code", desc: "Find near-identical blocks ready to extract." },
{ icon: GitBranch, title: "Language breakdown", desc: "Understand the composition at a glance." },
{ icon: ShieldCheck, title: "Quality score", desc: "A single 0–100 number to track progress over time." }];


const Index = () => {
  return (
    <AppLayout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="grid-bg pointer-events-none absolute inset-0" />
        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-center">
            
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              AI code reviews · powered by static analysis + LLMs
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-gradient md:text-7xl">
              Understand any GitHub repo<br className="hidden md:block" /> in 60 seconds.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-muted-foreground">
              Paste a URL or drop a ZIP. Get bugs, performance issues, duplicate code,
              and a clear AI summary — without cloning anything.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/analyze">Analyze a repo <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">View dashboard</Link>
              </Button>
            </div>
            <p className="mt-4 font-mono text-xs text-muted-foreground">no signup · no install · privacy-first</p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything in one report</h2>
          <p className="mt-3 text-muted-foreground">Designed for engineers shipping at speed.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) =>
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}>
            
              <Card className="h-full transition-colors hover:bg-secondary/30">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-secondary/40">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60 bg-secondary/20">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Ready when you are.</h2>
          <p className="mt-2 text-muted-foreground">Run your first analysis — it takes about a minute.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/analyze">Start analyzing <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </AppLayout>);

};

export default Index;