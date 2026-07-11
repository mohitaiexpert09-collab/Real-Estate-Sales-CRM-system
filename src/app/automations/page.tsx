import PageHeader from "@/components/PageHeader";
import AutomationToggle from "@/components/AutomationToggle";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = {
  instant_reply: "⚡",
  ai_qualify: "🧠",
  followup_drip: "🔁",
  sitevisit_reminder: "📅",
  cold_reactivation: "🛟",
  marketing_engine: "📣",
};

export default async function AutomationsPage() {
  const automations = await prisma.automation.findMany({ orderBy: { order: "asc" } });
  const totalRuns = automations.reduce((a, x) => a + x.runs, 0);
  const active = automations.filter((a) => a.enabled).length;

  return (
    <>
      <PageHeader title="Automations" subtitle="The engine that answers, qualifies & follows up — so no lead is ever ignored" />
      <div className="p-8">
        <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Active automations" value={`${active}/${automations.length}`} />
          <Stat label="Total actions run" value={totalRuns.toLocaleString("en-IN")} />
          <Stat label="Working" value="24 × 7" />
        </div>

        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-card transition ${
                a.enabled ? "border-slate-200" : "border-slate-200 opacity-70"
              }`}
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-brand-50 text-xl">{ICONS[a.key] ?? "⚙️"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-800">{a.name}</h3>
                  {a.key === "marketing_engine" && (
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-600/20">Phase 2</span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{a.description}</p>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-sm font-semibold text-slate-800">{a.runs.toLocaleString("en-IN")}</div>
                <div className="text-[11px] text-slate-400">actions run</div>
              </div>
              <AutomationToggle id={a.id} enabled={a.enabled} />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center">
          <p className="text-sm text-slate-500">
            These automations map to the 3 concepts pitched: <span className="font-medium text-slate-700">AI Lead-to-Deal CRM</span> (this product),{" "}
            <span className="font-medium text-slate-700">WhatsApp Sales Concierge</span> (instant reply + qualification), and{" "}
            <span className="font-medium text-slate-700">Listing &amp; Marketing Engine</span> (Phase 2).
          </p>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
    </div>
  );
}
