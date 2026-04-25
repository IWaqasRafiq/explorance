"use client";

import { ChevronRight, File, Folder, FolderOpen, FolderTree } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

function Node({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = node.kind === "dir";
  const Icon = isDir ? open ? FolderOpen : Folder : File;

  return (
    <li>
      <button
        type="button"
        onClick={() => isDir && setOpen((o) => !o)}
        className={cn(
          "group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary/60",
          !isDir && "cursor-default hover:bg-transparent"
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}>
        
        {isDir ?
        <ChevronRight
          className={cn(
            "mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90"
          )} /> :


        <span className="w-3.5 shrink-0" />
        }
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", isDir ? "text-primary" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <span className="font-mono text-sm">{node.name}</span>
          {node.description &&
          <span className="ml-2 text-xs text-muted-foreground">— {node.description}</span>
          }
        </div>
      </button>
      {isDir && open && node.children && node.children.length > 0 &&
      <ul>
          {node.children.map((c) =>
        <Node key={c.name} node={c} depth={depth + 1} />
        )}
        </ul>
      }
    </li>);

}

export function FolderStructure({ root }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <FolderTree className="h-4 w-4" />
          Folder structure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="rounded-md border bg-muted/20 p-2">
          <Node node={root} />
        </ul>
      </CardContent>
    </Card>);

}