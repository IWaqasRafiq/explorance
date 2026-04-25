"use client";

import { Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";


export function DuplicateList({ items }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Copy className="h-4 w-4" />
          Duplicate code
          <span className="font-mono text-xs text-muted-foreground">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 && <p className="py-4 text-sm text-muted-foreground">No duplicates detected.</p>}
        {items.map((d) =>
        <div key={d.id} className="rounded-md border border-border bg-secondary/30 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {d.files.map((f) =>
              <Badge key={f} variant="outline" className="font-mono text-xs">{f}</Badge>
              )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">{d.lines} lines</span>
                <span className="font-mono">{Math.round(d.similarity * 100)}% match</span>
              </div>
            </div>
            <pre className="overflow-x-auto rounded bg-background p-3 font-mono text-xs leading-relaxed text-foreground/90">
{d.snippet}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>);

}