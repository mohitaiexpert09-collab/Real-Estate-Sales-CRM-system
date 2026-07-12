"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SOURCES, STAGES } from "@/lib/constants";

type SampleLead = { id: string; name: string; project: string; city: string; budget: number; tier: string };

const TIERS = ["All", "Hot", "Warm", "Cold"];
const CITIES = ["All", "Mumbai", "Pune", "Bangalore"];

const PRESETS = [
  { key: "launch", label: "🚀 New launch", text: "Hi {name}! 🎉 We're launching {project} in {city} — early buyers get the best floor plans + pre-launch pricing. Can I share the brochure & price list on WhatsApp?" },
  { key: "offer", label: "🏷️ Price / offer", text: "Hi {name}! For a limited time we have a special price on {project}, {city}. Prices revise soon — I'd love to lock today's rate for you. Shall I share the details?" },
  { key: "sitevisit", label: "📅 Site-visit invite", text: "Hi {name}! 🏡 We're hosting site visits at {project}, {city} this weekend with free cab pickup. Would Saturday or Sunday suit you better?" },
  { key: "festive", label: "🪔 Festive greeting", text: "Hi {name}! 🪔 Warm festive wishes to you & your family. Whenever you're ready to explore {project}, {city}, I'm just a message away." },
];

function inrShort(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2).replace(/\.00$/, "")} Cr`;
  if (n >= 100000) return `₹${Math.round(n / 100000)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function personalizePreview(tpl: string, lead?: SampleLead) {
  if (!lead) return tpl;
  const first = lead.name.split(" ")[0];
  return tpl
    .replaceAll("{name}", first)
    .replaceAll("{first_name}", first)
    .replaceAll("{project}", lead.project)
    .replaceAll("{city}", lead.city)
    .replaceAll("{budget}", inrShort(lead.budget));
}

const TIER_DOT: Record<string, string> = { Hot: "bg-rose-500", Warm: "bg-amber-500", Cold: "bg-slate-400" };

export default function BroadcastComposer() {
  const router = useRouter();
  const [tier, setTier] = useState("All");
  const [city, setCity] = useState("All");
  const [source, setSource] = useState("All");
  const [stage, setStage] = useState("All");
  const [message, setMessage] = useState(PRESETS[0].text);
  const [campaign, setCampaign] = useState("launch");

  const [count, setCount] = useState<number | null>(null);
  const [sample, setSample] = useState<SampleLead[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ n: number; names: string[] } | null>(null);

  const filters = { tier, city, source, stage };

  const loadPreview = useCallback(async () => {
    try {
      const res = await fetch("/api/broadcast/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, city, source, stage }),
      });
      const data = await res.json();
      setCount(data.count);
      setSample(data.sample || []);
    } catch {
      setCount(null);
    }
  }, [tier, city, source, stage]);

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  async function draftWithAI() {
    setDrafting(true);
    try {
      const res = await fetch("/api/broadcast/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign }),
      });
      const data = await res.json();
      if (data.text) setMessage(data.text);
    } finally {
      setDrafting(false);
    }
  }

  async function send() {
    if (!message.trim() || !count || sending) return;
    if (!confirm(`Send this WhatsApp broadcast to ${count} lead${count > 1 ? "s" : ""}?`)) return;
    setSending(true);
    setSent(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters, message }),
      });
      const data = await res.json();
      setSent({ n: data.sent, names: data.recipients || [] });
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  const previewLead = sample[0];
  const rendered = personalizePreview(message, previewLead);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      {/* ---- compose ---- */}
      <div className="space-y-5">
        {/* audience */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-800">1 · Choose your audience</h2>
          <p className="mt-0.5 text-xs text-slate-500">Filter down to exactly who should get this message.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Select label="Tier" value={tier} onChange={setTier} options={TIERS} />
            <Select label="City" value={city} onChange={setCity} options={CITIES} />
            <Select label="Source" value={source} onChange={setSource} options={["All", ...SOURCES]} />
            <Select label="Stage" value={stage} onChange={setStage} options={["All", ...STAGES]} />
          </div>
        </section>

        {/* compose */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">2 · Write the message</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Use <code className="rounded bg-slate-100 px-1 text-[11px]">{"{name}"}</code>,{" "}
                <code className="rounded bg-slate-100 px-1 text-[11px]">{"{project}"}</code>,{" "}
                <code className="rounded bg-slate-100 px-1 text-[11px]">{"{city}"}</code> — filled in per lead.
              </p>
            </div>
            <button
              onClick={draftWithAI}
              disabled={drafting}
              className="flex flex-none items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-600 to-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
            >
              {drafting ? "Drafting…" : "✨ Draft with AI"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setMessage(p.text);
                  setCampaign(p.key);
                }}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  campaign === p.key ? "border-brand-300 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm leading-relaxed outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="Type your broadcast message…"
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">{message.length} characters</div>
        </section>

        {/* send */}
        <button
          onClick={send}
          disabled={sending || !message.trim() || !count}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lift transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l16-8-6 16-3-7-7-1z" strokeLinejoin="round" /></svg>
              Send WhatsApp broadcast to {count ?? "…"} lead{count === 1 ? "" : "s"}
            </>
          )}
        </button>

        {sent && (
          <div className="animate-slideup rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
              Broadcast sent to {sent.n} lead{sent.n === 1 ? "" : "s"} on WhatsApp
            </div>
            {sent.names.length > 0 && (
              <p className="mt-2 text-xs leading-relaxed text-emerald-700">
                {sent.names.slice(0, 6).join(", ")}
                {sent.names.length > 6 ? ` +${sent.names.length - 6} more` : ""}. Each got a personalised message and it's logged on their timeline.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ---- live preview ---- */}
      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recipients</h2>
            <span className="text-xs text-slate-400">live</span>
          </div>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-semibold tracking-tight text-slate-900">{count ?? "—"}</span>
            <span className="mb-1 text-sm text-slate-500">lead{count === 1 ? "" : "s"} will receive this</span>
          </div>
          <div className="mt-4 space-y-2">
            {sample.length === 0 && <p className="text-xs text-slate-400">No leads match these filters — widen your audience.</p>}
            {sample.map((l) => (
              <div key={l.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <span className={`h-2 w-2 flex-none rounded-full ${TIER_DOT[l.tier] ?? "bg-slate-400"}`} />
                <span className="truncate text-sm font-medium text-slate-700">{l.name}</span>
                <span className="ml-auto truncate text-[11px] text-slate-400">{l.project}</span>
              </div>
            ))}
            {count != null && count > sample.length && (
              <p className="pt-1 text-center text-[11px] text-slate-400">+ {count - sample.length} more</p>
            )}
          </div>
        </section>

        {/* WhatsApp-style preview */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-sm font-semibold text-slate-800">Preview</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            As {previewLead ? previewLead.name.split(" ")[0] : "a lead"} will see it on WhatsApp
          </p>
          <div className="mt-3 rounded-xl bg-[#e5ddd5] p-3" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,.04) 1px, transparent 1px)", backgroundSize: "14px 14px" }}>
            <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] px-3 py-2 shadow-sm">
              <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-800">{rendered || "Your message preview…"}</div>
              <div className="mt-1 text-right text-[10px] text-slate-500">now ✓✓</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly string[] }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
