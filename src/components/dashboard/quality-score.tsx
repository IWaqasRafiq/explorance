import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QualityScore({ score }: { score: number }) {
  const tier =
    score >= 85 ? { label: "Excellent", color: "text-success" } :
    score >= 70 ? { label: "Good", color: "text-chart-1" } :
    score >= 50 ? { label: "Fair", color: "text-warning" } :
    { label: "Needs work", color: "text-destructive" };

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Code quality score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative h-[120px] w-[120px]">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" stroke="hsl(var(--secondary))" strokeWidth="8" fill="none" />
              <circle
                cx="50" cy="50" r="42"
                stroke="hsl(var(--foreground))"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-semibold tabular-nums">{score}</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div>
            <p className={cn("text-lg font-semibold", tier.color)}>{tier.label}</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Based on static analysis, AI review, complexity, and duplication signals.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
