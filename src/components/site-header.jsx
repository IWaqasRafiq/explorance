"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '../../public/Explorance-Logo.png';
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from 'next/image';

const links = [
  { href: "/", label: "Home" },
  { href: "/analyze", label: "Analyze" },
  { href: "/dashboard", label: "Dashboard" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 glass">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-background">
            <Image src={Logo} alt="Explorance Logo" width={24} height={24} />
          </div>
          <span>Explorance</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const isActive = l.href === "/" ? pathname === "/" : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground bg-secondary"
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/analyze">Start analysis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}