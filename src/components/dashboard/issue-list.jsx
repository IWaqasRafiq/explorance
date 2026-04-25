"use client";

import { AlertTriangle, Bug, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-warning/15 text-warning border-warning/30",
  high: "bg-destructive/15 text-destructive border-destructive/30",
  critical: "bg-destructive text-destructive-foreground"
};







export function IssueList({ title, kind, issues }) {
  const Icon = kind === "bug" ? Bug : Zap;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-4 w-4" />
          {title}
          <span className="font-mono text-xs text-muted-foreground">({issues.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ?
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5" />
            No issues detected.
          </div> :

        <ul className="divide-y divide-border">
            {issues.map((i) =>
          <li key={i.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium leading-snug">{i.title}</p>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                    {i.file}:{i.line}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{i.description}</p>
                </div>
                <Badge variant="outline" className={cn("h-fit border", SEVERITY_STYLES[i.severity])}>
                  {i.severity}
                </Badge>
              </li>
          )}
          </ul>
        }
      </CardContent>
    </Card>);

}