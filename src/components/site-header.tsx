import { Link, NavLink as RRNavLink } from "react-router-dom";
import { Github } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/analyze", label: "Analyze" },
  { to: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
            <Github className="h-4 w-4" />
          </div>
          <span>AI GitHub Explorer</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <RRNavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground bg-secondary",
                )
              }
            >
              {l.label}
            </RRNavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/analyze">Start analysis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
