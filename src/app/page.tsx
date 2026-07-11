import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SourceBarChart, ResponseTrendChart } from "@/components/Charts";
import { getDashboardStats } from "@/lib/stats";
import { prisma } from "@/lib/db";
import { inr, humanDuration, timeAgo } from "@/lib/format";
import { STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

function Kpi({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  accent: string;
  icon: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg text-sm ${accent}`}>{icon}</span>
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export default async function DashboardPage() {
  const s = await getDashboardStats();
  const hotLeads = await prisma.lead.findMany({
    where: { tier: "Hot", status: { in: ["New", "Qualified"] } },
    orderBy: { score: "desc" },
    take: 6,
    include: { agent: true },
  });

  const maxFunnel = Math.max(...s.funnel.map((f) => f.count), 1);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Sunrise Realty · live lead performance" />
      <div className="space-y-6 p-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi label="Leads captured" value={String(s.total)} sub="across 6 channels" accent="bg-brand-50 text-brand-600" icon="📥" />
          <Kpi
            label="Avg response"
            value={humanDuration(s.avgFirstResponse)}
            sub={<span className="text-emerald-600">↓ from 4h manually</span>}
            accent="bg-emerald-50 text-emerald-600"
            icon="⚡"
          />
          <Kpi label="Lead→Booking" value={`${s.conversion}%`} sub={`${s.booked} deals booked`} accent="bg-indigo-50 text-indigo-600" icon="🎯" />
          <Kpi label="Pipeline value" value={inr(s.pipelineValue)} sub="open opportunities" accent="bg-amber-50 text-amber-600" icon="💼" />
          <Kpi label="Leads rescued" value={String(s.rescued)} sub="saved from going cold" accent="bg-rose-50 text-rose-600" icon="🛟" />
          <Kpi label="Revenue attributed" value={inr(s.revenue)} sub={`on ${inr(s.bookedValue)} booked`} accent="bg-emerald-50 text-emerald-600" icon="₹" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Leads by source</h2>
              <span className="text-xs text-slate-400">last 14 days</span>
            </div>
            <SourceBarChart data={s.bySource} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">Pipeline funnel</h2>
            <div className="space-y-2.5">
              {s.funnel.map((f) => (
                <div key={f.stage}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-slate-600">{f.stage}</span>
                    <span className="font-semibold text-slate-800">{f.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500"
                      style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trend + hot leads */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Avg first-response time</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">SLA &lt; 60s</span>
            </div>
            <ResponseTrendChart data={s.trend} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">🔥 Hot leads · act now</h2>
              <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {hotLeads.length === 0 && <p className="text-sm text-slate-400">No hot leads pending — great work!</p>}
              {hotLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50"
                >
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                    {l.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{l.name}</div>
                    <div className="truncate text-xs text-slate-500">
                      {l.project} · {inr(l.budget)}
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">{timeAgo(l.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-slate-400">
          {STAGES.length}-stage pipeline · Claude-powered qualification · WhatsApp automation · built for Indian real estate
        </p>
      </div>
    </>
  );
}
