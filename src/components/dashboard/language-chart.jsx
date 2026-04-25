"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";


const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

export function LanguageChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Language breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="percent" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="hsl(var(--background))">
                  {data.map((_, i) =>
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  )}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12
                  }}
                  formatter={(v, n) => [`${v}%`, n]} />
                
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-2">
            {data.map((l, i) =>
            <li key={l.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                  <span>{l.name}</span>
                </div>
                <span className="font-mono text-muted-foreground">{l.percent}%</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>);

}