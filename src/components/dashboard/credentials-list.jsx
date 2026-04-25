"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export function CredentialsList({ credentials }) {
  const [copied, setCopied] = useState(null);
  const required = credentials.filter((c) => c.required);
  const optional = credentials.filter((c) => !c.required);

  const envExample = credentials.
  map((c) => `${c.required ? "" : "# optional\n"}${c.name}=${c.example ?? ""}`).
  join("\n");

  const copy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((v) => v === key ? null : v), 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base font-semibold">
          <span className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Required credentials
            <span className="font-mono text-xs text-muted-foreground">
              ({required.length} required · {optional.length} optional)
            </span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => copy(envExample, "__all__")}
            className="h-7 gap-1.5 text-xs">
            
            {copied === "__all__" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied === "__all__" ? "Copied" : "Copy .env"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          To run this repository locally without errors, create a <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.env.local</code> file in the project root and add the variables below.
        </p>

        <ul className="divide-y divide-border rounded-md border">
          {credentials.map((c) =>
          <li key={c.name} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-medium">{c.name}</code>
                  <Badge
                  variant="outline"
                  className={cn(
                    "h-5 border text-[10px] uppercase tracking-wide",
                    c.required ?
                    "bg-destructive/15 text-destructive border-destructive/30" :
                    "bg-secondary text-secondary-foreground"
                  )}>
                  
                    {c.required ? "required" : "optional"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Where:</span> {c.where}
                </p>
                {c.example &&
              <div className="mt-2 flex items-center gap-2">
                    <code className="block flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs">
                      {c.name}={c.example}
                    </code>
                    <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => copy(`${c.name}=${c.example}`, c.name)}
                  aria-label={`Copy ${c.name}`}>
                  
                      {copied === c.name ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
              }
              </div>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>);

}