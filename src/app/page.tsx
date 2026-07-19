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
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-card transition hover:shadow-lift">
      <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tightest text-content">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
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
        {/* Outcome hero — lead with the result, not the features */}
        <section className="animate-rise overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <div className="grid gap-px bg-line md:grid-cols-[1.4fr_1fr_1fr]">
            {/* headline result */}
            <div className="relative bg-surface p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-brand-sheen" />
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-brand-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Revenue attributed
              </div>
              <div className="mt-3 text-[42px] font-semibold leading-none tracking-tightest text-content">
                {inr(s.revenue)}
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                From <span className="font-semibold text-content">{s.booked} deals booked</span> on{" "}
                {inr(s.bookedValue)} of closed inventory — every one sourced from a lead answered in under a minute.
              </p>
            </div>

            {/* speed result */}
            <div className="flex flex-col justify-center bg-surface p-7">
              <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Avg first response</div>
              <div className="mt-2 text-3xl font-semibold tracking-tightest text-content">
                {humanDuration(s.avgFirstResponse)}
              </div>
              <div className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                ↓ from 4 hours by hand
              </div>
            </div>

            {/* conversion result */}
            <div className="flex flex-col justify-center bg-surface p-7">
              <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-faint">Lead → Booking</div>
              <div className="mt-2 text-3xl font-semibold tracking-tightest text-content">{s.conversion}%</div>
              <div className="mt-1.5 text-xs text-muted">
                {s.rescued} cold leads rescued by follow-up
              </div>
            </div>
          </div>
        </section>

        {/* Supporting KPI strip */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label="Leads captured" value={String(s.total)} sub="across 6 channels" />
          <Kpi label="Pipeline value" value={inr(s.pipelineValue)} sub="open opportunities" />
          <Kpi label="Leads rescued" value={String(s.rescued)} sub="saved from going cold" />
          <Kpi label="Booked GMV" value={inr(s.bookedValue)} sub={`${s.booked} deals closed`} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-content">Leads by source</h2>
              <span className="text-xs text-faint">last 14 days</span>
            </div>
            <SourceBarChart data={s.bySource} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-content">Pipeline funnel</h2>
            <div className="space-y-2.5">
              {s.funnel.map((f) => (
                <div key={f.stage}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted">{f.stage}</span>
                    <span className="font-semibold text-content">{f.count}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-brand-sheen"
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
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-content">Avg first-response time</h2>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                SLA &lt; 60s
              </span>
            </div>
            <ResponseTrendChart data={s.trend} />
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-content">Hot leads · act now</h2>
              <Link href="/leads" className="text-xs font-medium text-brand-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-1">
              {hotLeads.length === 0 && <p className="text-sm text-faint">No hot leads pending — great work!</p>}
              {hotLeads.map((l) => (
                <Link
                  key={l.id}
                  href={`/leads/${l.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-elevated"
                >
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700">
                    {l.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-content">{l.name}</div>
                    <div className="truncate text-xs text-muted">
                      {l.project} · {inr(l.budget)}
                    </div>
                  </div>
                  <span className="text-[11px] text-faint">{timeAgo(l.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="pb-2 text-center text-xs text-faint">
          {STAGES.length}-stage pipeline · Claude-powered qualification · WhatsApp automation · built for Indian real estate
        </p>
      </div>
    </>
  );
}
