"use client";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} AI GitHub Explorer</p>
        <p className="font-mono text-xs">v0.1.0 · mock API</p>
      </div>
    </footer>);

}