"use client";

import { useState } from "react";

type Integration = {
  key: string;
  name: string;
  blurb: string;
  monogram: string;
  tint: string; // tailwind classes for the logo tile
  defaultConnected: boolean;
};

const INTEGRATIONS: Integration[] = [
  { key: "whatsapp", name: "WhatsApp Business", blurb: "Instant replies & broadcasts", monogram: "W", tint: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", defaultConnected: true },
  { key: "99acres", name: "99acres", blurb: "Auto-capture portal leads", monogram: "99", tint: "bg-red-50 text-red-700 ring-red-600/20", defaultConnected: true },
  { key: "magicbricks", name: "MagicBricks", blurb: "Auto-capture portal leads", monogram: "M", tint: "bg-orange-50 text-orange-700 ring-orange-600/20", defaultConnected: true },
  { key: "housing", name: "Housing.com", blurb: "Auto-capture portal leads", monogram: "H", tint: "bg-sky-50 text-sky-700 ring-sky-600/20", defaultConnected: true },
  { key: "facebook", name: "Facebook Lead Ads", blurb: "Sync new leads in real time", monogram: "f", tint: "bg-blue-50 text-blue-700 ring-blue-600/20", defaultConnected: true },
  { key: "calendar", name: "Google Calendar", blurb: "Book & sync site visits", monogram: "C", tint: "bg-violet-50 text-violet-700 ring-violet-600/20", defaultConnected: true },
  { key: "sheets", name: "Google Sheets", blurb: "Export leads & reporting", monogram: "S", tint: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", defaultConnected: false },
  { key: "salesforce", name: "Salesforce", blurb: "Two-way contact sync", monogram: "SF", tint: "bg-sky-50 text-sky-700 ring-sky-600/20", defaultConnected: false },
];

function StatusPill({ connected }: { connected: boolean }) {
  return connected ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-content ring-1 ring-line">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Connected
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-line">
      Not connected
    </span>
  );
}

export default function IntegrationsBoard() {
  const [connected, setConnected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTEGRATIONS.map((i) => [i.key, i.defaultConnected])),
  );
  const [zoho, setZoho] = useState(false);
  const [zohoBusy, setZohoBusy] = useState(false);

  function connectZoho() {
    if (zoho) {
      setZoho(false);
      return;
    }
    setZohoBusy(true);
    // Simulate the OAuth round-trip so the demo shows the connected state.
    setTimeout(() => {
      setZohoBusy(false);
      setZoho(true);
    }, 1100);
  }

  const liveCount = Object.values(connected).filter(Boolean).length + (zoho ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Zoho — the headline integration */}
      <section className="animate-rise overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="pointer-events-none h-[3px] bg-accent" />
        <div className="flex flex-col gap-6 p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 flex-none place-items-center rounded-2xl bg-elevated text-lg font-bold text-content ring-1 ring-line">
              Zoho
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-semibold tracking-tight text-content">Zoho CRM</h2>
                <StatusPill connected={zoho} />
              </div>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
                Already on Zoho? Keep it. PropPulse syncs leads, stages and notes both ways — your team runs on
                PropPulse&apos;s speed while Zoho stays your system of record. No migration, no data lock-in.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Two-way lead sync", "Stage mapping", "Notes & owner sync", "Nothing to migrate"].map((t) => (
                  <span key={t} className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-medium text-muted ring-1 ring-line">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={connectZoho}
            disabled={zohoBusy}
            className={`flex-none rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-70 ${
              zoho
                ? "border border-line bg-surface text-muted hover:text-content"
                : "bg-accent text-accent-fg shadow-lift hover:opacity-90"
            }`}
          >
            {zohoBusy ? "Connecting…" : zoho ? "Disconnect" : "Connect Zoho"}
          </button>
        </div>
      </section>

      {/* Everything else */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-content">Channels & tools</h3>
          <span className="text-xs text-faint">{liveCount} live connections</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((it) => {
            const isOn = connected[it.key];
            return (
              <div key={it.key} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:shadow-lift">
                <div className="flex items-start justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-elevated text-sm font-bold text-muted ring-1 ring-line">
                    {it.monogram}
                  </div>
                  <StatusPill connected={isOn} />
                </div>
                <div className="mt-3 text-sm font-semibold text-content">{it.name}</div>
                <div className="mt-0.5 text-xs text-muted">{it.blurb}</div>
                <button
                  onClick={() => setConnected((c) => ({ ...c, [it.key]: !c[it.key] }))}
                  className={`mt-4 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    isOn
                      ? "border-line bg-surface text-muted hover:text-content"
                      : "border-line bg-elevated text-content hover:bg-line"
                  }`}
                >
                  {isOn ? "Manage" : "Connect"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
