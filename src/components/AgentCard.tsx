"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  agentKey: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  trigger: "real-time" | "scheduled" | "on-demand";
  tools: string[];
  runs: number | null;
  runnable: boolean;
};

type JobResult = { summary: string; actions: string[]; count: number; usedAI: boolean };

const TRIGGER_STYLES: Record<string, string> = {
  "real-time": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  scheduled: "bg-sky-50 text-sky-700 ring-sky-600/20",
  "on-demand": "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export default function AgentCard(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<JobResult | null>(null);

  async function run() {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/agents/${props.agentKey}/run`, { method: "POST" });
      const data: JobResult = await res.json();
      setResult(data);
      router.refresh(); // reflect the agent's real actions on other pages
    } catch {
      setResult({ summary: "Something went wrong — please try again.", actions: [], count: 0, usedAI: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-lift">
      <div className="flex items-start gap-3.5">
        <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-emerald-50 text-2xl ring-1 ring-slate-200/60">
          {props.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">{props.name}</h3>
            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> active
            </span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-brand-600">{props.tagline}</p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-500">{props.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${TRIGGER_STYLES[props.trigger]}`}>
          {props.trigger}
        </span>
        {props.tools.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-500">
            {t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <div>
          <div className="text-lg font-semibold leading-none text-slate-900">
            {props.runs === null ? "—" : props.runs.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">{props.runs === null ? "on-demand" : "actions run"}</div>
        </div>

        {props.runnable ? (
          <button
            onClick={run}
            disabled={busy}
            className="flex items-center gap-2 rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-800 disabled:opacity-60"
          >
            {busy ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Working…
              </>
            ) : (
              <>
                <span>▶</span> Run now
              </>
            )}
          </button>
        ) : (
          <span className="rounded-lg bg-slate-100 px-3.5 py-2 text-xs font-medium text-slate-500">Use ✨ Copilot</span>
        )}
      </div>

      {result && (
        <div className="mt-3 animate-slideup rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-500/25 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-[11px] text-white">✓</span>
            {result.summary}
          </div>
          {result.actions.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-emerald-200/70 pt-2">
              {result.actions.map((a, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <span className="text-emerald-400">•</span> {a}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 text-[10px] text-emerald-600/70">{result.usedAI ? "Powered by live AI" : "Demo engine"}</div>
        </div>
      )}
    </div>
  );
}
