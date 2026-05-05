"use client";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Explorance</p>
        <p className="font-mono text-xs">Built with gemini 3 pro API by WAQAS RAFIQ</p>
      </div>
    </footer>);

}