"use client";

import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

const TYPE_STYLES = {
  runtime: "bg-primary/10 text-primary border-primary/20",
  dev: "bg-secondary text-secondary-foreground",
  peer: "bg-warning/15 text-warning border-warning/30"
};

export function LibrariesList({ libraries }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => libraries.filter((l) => l.name.toLowerCase().includes(q.toLowerCase())),
    [libraries, q]
  );
  const counts = useMemo(() => {
    return libraries.reduce(
      (acc, l) => ({ ...acc, [l.type]: (acc[l.type] ?? 0) + 1 }),
      {}
    );
  }, [libraries]);

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Package className="h-4 w-4" />
          Libraries breakdown
          <span className="font-mono text-xs text-muted-foreground">({libraries.length})</span>
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          {["runtime", "dev", "peer"].map((t) =>
          counts[t] ?
          <Badge key={t} variant="outline" className={cn("border", TYPE_STYLES[t])}>
                {t}: {counts[t]}
              </Badge> :
          null
          )}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter libraries…"
              className="h-8 pl-8 text-sm" />
            
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {filtered.map((l) =>
          <li key={l.name} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm font-medium">{l.name}</p>
                  <span className="font-mono text-xs text-muted-foreground">v{l.version}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{l.purpose}</p>
              </div>
              <Badge variant="outline" className={cn("h-fit border", TYPE_STYLES[l.type])}>
                {l.type}
              </Badge>
            </li>
          )}
          {filtered.length === 0 &&
          <li className="py-6 text-center text-sm text-muted-foreground">No libraries match "{q}".</li>
          }
        </ul>
      </CardContent>
    </Card>);

}