"use client";

import { Card, CardContent } from "@/components/ui/card";



export function StatGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((s) =>
      <Card key={s.label}>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{s.value}</p>
            {s.hint && <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>}
          </CardContent>
        </Card>
      )}
    </div>);

}