import { SOURCE_STYLES, TIER_STYLES, STAGE_STYLES } from "@/lib/constants";

export function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${SOURCE_STYLES[source] ?? "bg-slate-100 text-slate-600 ring-slate-400/20"}`}>
      {source}
    </span>
  );
}

export function TierBadge({ tier, score }: { tier: string; score?: number }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${TIER_STYLES[tier] ?? TIER_STYLES.Cold}`}>
      {tier === "Hot" ? "🔥" : tier === "Warm" ? "☀️" : "❄️"} {tier}
      {typeof score === "number" && <span className="opacity-70">· {score}</span>}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${STAGE_STYLES[stage] ?? "bg-slate-100 text-slate-700"}`}>
      {stage}
    </span>
  );
}
