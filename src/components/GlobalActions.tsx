"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SimResult = {
  lead: { id: string; name: string; source: string; project: string; city: string; budget: number; score: number; tier: string };
  reply: string;
  usedAI: boolean;
};

const STEP_LABELS = [
  "Lead captured from portal",
  "AI qualifying & scoring",
  "Instant WhatsApp reply sent",
  "Added to sales pipeline",
];

export default function GlobalActions({ aiEnabled, label }: { aiEnabled: boolean; label: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<SimResult | null>(null);
  const [resetting, setResetting] = useState(false);

  async function runSimulate() {
    setOpen(true);
    setResult(null);
    setStep(0);
    const stepTimers = [350, 900, 1500];
    stepTimers.forEach((t, i) => setTimeout(() => setStep(i + 1), t));

    try {
      const res = await fetch("/api/leads/simulate", { method: "POST" });
      const data: SimResult = await res.json();
      setTimeout(() => {
        setResult(data);
        setStep(4);
        router.refresh();
      }, 1700);
    } catch {
      setOpen(false);
    }
  }

  async function runReset() {
    if (!confirm("Reset the demo? This restores the original 42 seeded leads.")) return;
    setResetting(true);
    await fetch("/api/reset", { method: "POST" });
    setResetting(false);
    router.refresh();
    router.push("/");
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 md:inline-flex ${
          aiEnabled ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-400/20"
        }`}
        title={aiEnabled ? "AI provider is live" : "Running on built-in AI mock (no API key set)"}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${aiEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
        {label}
      </span>

      <button
        onClick={runReset}
        disabled={resetting}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
      >
        {resetting ? "Resetting…" : "Reset demo"}
      </button>

      <button
        onClick={runSimulate}
        className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-brand-600 to-brand-500 px-3.5 py-2 text-sm font-semibold text-white shadow-lift transition hover:brightness-110"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
        </svg>
        Simulate inbound lead
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[440px] max-w-[92vw] animate-pop rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-600 text-white">⚡</span>
              Live automation firing
            </div>

            <div className="mt-5 space-y-3">
              {STEP_LABELS.map((label, i) => {
                const done = step > i;
                const active = step === i;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span
                      className={`grid h-6 w-6 flex-none place-items-center rounded-full text-xs transition ${
                        done ? "bg-emerald-500 text-white" : active ? "bg-brand-500 text-white" : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <span className={`text-sm ${done || active ? "text-slate-800" : "text-slate-400"}`}>{label}</span>
                    {active && !done && (
                      <span className="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    )}
                  </div>
                );
              })}
            </div>

            {result && (
              <div className="mt-5 animate-slideup rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-800">{result.lead.name}</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      result.lead.tier === "Hot" ? "bg-rose-100 text-rose-700" : result.lead.tier === "Warm" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {result.lead.tier} · {result.lead.score}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {result.lead.project} · {result.lead.city} · from {result.lead.source}
                </div>
                <div className="mt-2 rounded-lg bg-emerald-500/10 p-2.5 text-xs leading-relaxed text-emerald-900">
                  <span className="font-semibold">Auto-reply:</span> {result.reply}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => {
                      setOpen(false);
                      router.push(`/leads/${result.lead.id}`);
                    }}
                    className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Open lead
                  </button>
                  <button onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
