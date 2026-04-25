"use client";

import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";

export function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>);

}