"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { STAGES } from "@/lib/constants";
import { inr } from "@/lib/format";

type Lead = {
  id: string;
  name: string;
  project: string;
  city: string;
  budget: number;
  tier: string;
  score: number;
  status: string;
  agent: string;
};

const COL_ACCENT: Record<string, string> = {
  New: "border-t-slate-400",
  Qualified: "border-t-indigo-400",
  "Site Visit": "border-t-sky-400",
  Negotiation: "border-t-amber-400",
  Booked: "border-t-emerald-500",
  Lost: "border-t-rose-400",
};

export default function PipelineBoard({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [items, setItems] = useState(leads);
  const [busy, setBusy] = useState<string | null>(null);

  async function move(lead: Lead, dir: -1 | 1) {
    const idx = STAGES.indexOf(lead.status as any);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= STAGES.length) return;
    const next = STAGES[nextIdx];
    setBusy(lead.id);
    setItems((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
    await fetch(`/api/leads/${lead.id}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: next }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="scroll-thin flex gap-4 overflow-x-auto pb-4">
      {STAGES.map((stage) => {
        const colLeads = items.filter((l) => l.status === stage);
        const value = colLeads.reduce((a, l) => a + l.budget, 0);
        return (
          <div key={stage} className="flex w-72 flex-none flex-col">
            <div className={`rounded-t-xl border-t-4 bg-white px-3.5 py-3 shadow-card ${COL_ACCENT[stage]}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">{stage}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{colLeads.length}</span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">{inr(value)}</div>
            </div>

            <div className="scroll-thin flex-1 space-y-2.5 rounded-b-xl bg-slate-100/60 p-2.5" style={{ minHeight: 200 }}>
              {colLeads.map((l) => {
                const idx = STAGES.indexOf(l.status as any);
                return (
                  <div key={l.id} className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition ${busy === l.id ? "opacity-50" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/leads/${l.id}`} className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-800 hover:text-brand-700">{l.name}</div>
                        <div className="truncate text-xs text-slate-500">{l.project}</div>
                      </Link>
                      <span
                        className={`flex-none rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                          l.tier === "Hot" ? "bg-accent text-accent-fg" : l.tier === "Warm" ? "bg-transparent text-content ring-1 ring-inset ring-line" : "bg-elevated text-faint"
                        }`}
                      >
                        {l.score}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{inr(l.budget)}</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => move(l, -1)}
                          disabled={idx === 0 || busy === l.id}
                          className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          title="Move back"
                        >
                          ‹
                        </button>
                        <button
                          onClick={() => move(l, 1)}
                          disabled={idx === STAGES.length - 1 || busy === l.id}
                          className="grid h-6 w-6 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                          title="Move forward"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[11px] text-slate-400">{l.agent.split(" ")[0]}</div>
                  </div>
                );
              })}
              {colLeads.length === 0 && <div className="grid h-20 place-items-center text-xs text-slate-400">Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
