"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STAGES } from "@/lib/constants";
import { clockTime } from "@/lib/format";

type Msg = { id: string; direction: string; body: string; isAuto: boolean; createdAt: string };

export default function LeadWorkspace({
  leadId,
  initialMessages,
  status,
  hasSiteVisit,
}: {
  leadId: string;
  initialMessages: Msg[];
  status: string;
  hasSiteVisit: boolean;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [usedAI, setUsedAI] = useState<boolean | null>(null);

  async function suggest() {
    setDrafting(true);
    setUsedAI(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft" }),
      });
      const data = await res.json();
      setDraft(data.text);
      setUsedAI(data.usedAI);
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      direction: "out",
      body: draft,
      isAuto: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    const body = draft;
    setDraft("");
    try {
      await fetch(`/api/leads/${leadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "send", text: body }),
      });
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function changeStage(stage: string) {
    await fetch(`/api/leads/${leadId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    router.refresh();
  }

  async function schedule() {
    const sysMsg: Msg = {
      id: `tmp-${Date.now()}`,
      direction: "out",
      body: "📅 Site visit confirmed for this Saturday, 11 AM. Our team will share the location pin & reminder on WhatsApp.",
      isAuto: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, sysMsg]);
    await fetch(`/api/leads/${leadId}/schedule`, { method: "POST" });
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      {/* WhatsApp thread */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 15l-1.2 4.4 4.5-1.2A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-2.7.7.7-2.6-.2-.3A8 8 0 0 1 12 4z" /></svg>
        </span>
        <div>
          <div className="text-sm font-semibold text-slate-800">WhatsApp conversation</div>
          <div className="text-[11px] text-emerald-600">● Business API connected (simulated)</div>
        </div>
      </div>

      <div className="scroll-thin flex-1 space-y-2.5 overflow-y-auto bg-[#e9f1ea] px-4 py-4" style={{ minHeight: 260, maxHeight: 360 }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                m.direction === "out" ? "rounded-br-sm bg-[#d9fdd3] text-slate-800" : "rounded-bl-sm bg-white text-slate-800"
              }`}
            >
              {m.isAuto && m.direction === "out" && (
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">⚡ Auto-reply</div>
              )}
              <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>
              <div className="mt-0.5 text-right text-[10px] text-slate-400">{clockTime(m.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={suggest}
            disabled={drafting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
          >
            {drafting ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            ) : (
              <span>✨</span>
            )}
            {drafting ? "Drafting…" : "AI suggest reply"}
          </button>
          {usedAI !== null && (
            <span className="text-[11px] text-slate-400">{usedAI ? "Drafted by Claude" : "Drafted by demo AI"}</span>
          )}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a reply, or use AI suggest…"
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            Send on WhatsApp
          </button>
          <button
            onClick={schedule}
            disabled={hasSiteVisit}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            📅 {hasSiteVisit ? "Visit scheduled" : "Book site visit"}
          </button>
        </div>
      </div>

      {/* Stage changer */}
      <div className="border-t border-slate-100 px-4 py-3">
        <div className="mb-1.5 text-xs font-medium text-slate-500">Move pipeline stage</div>
        <div className="flex flex-wrap gap-1.5">
          {STAGES.map((st) => (
            <button
              key={st}
              onClick={() => changeStage(st)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                st === status ? "bg-brand-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
