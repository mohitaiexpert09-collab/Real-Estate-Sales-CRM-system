import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { SourceBadge, TierBadge, StageBadge } from "@/components/Badges";
import LeadWorkspace from "@/components/LeadWorkspace";
import { prisma } from "@/lib/db";
import { inr, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTIVITY_ICON: Record<string, string> = {
  captured: "📥",
  scored: "🧠",
  auto_reply: "⚡",
  reply: "💬",
  stage: "🔀",
  site_visit: "📅",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      agent: true,
      messages: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!lead) notFound();

  return (
    <>
      <PageHeader title={lead.name} subtitle={`${lead.project} · ${lead.city}`} />
      <div className="p-8">
        <Link href="/leads" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
          ← Back to inbox
        </Link>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Left: profile + AI + timeline */}
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SourceBadge source={lead.source} />
                  <TierBadge tier={lead.tier} score={lead.score} />
                </div>
                <StageBadge stage={lead.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Field label="Phone" value={lead.phone} />
                <Field label="Assigned to" value={lead.agent?.name ?? "—"} />
                <Field label="Budget" value={inr(lead.budget)} />
                <Field label="Timeline" value={lead.timeline || "—"} />
                <Field label="Intent" value={lead.intent || "—"} full />
              </div>

              <div className="mt-4 rounded-xl bg-brand-50/70 p-3.5">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                  🧠 AI qualification
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{lead.aiSummary}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" style={{ width: `${lead.score}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{lead.score}/100</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Activity timeline</h2>
              <ol className="space-y-3">
                {lead.activities.map((a) => (
                  <li key={a.id} className="flex gap-3">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-slate-100 text-sm">
                      {ACTIVITY_ICON[a.type] ?? "•"}
                    </span>
                    <div>
                      <div className="text-sm text-slate-700">{a.detail}</div>
                      <div className="text-[11px] text-slate-400">{timeAgo(a.createdAt)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Right: WhatsApp workspace */}
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <LeadWorkspace
                leadId={lead.id}
                status={lead.status}
                hasSiteVisit={Boolean(lead.siteVisitAt)}
                initialMessages={lead.messages.map((m) => ({
                  id: m.id,
                  direction: m.direction,
                  body: m.body,
                  isAuto: m.isAuto,
                  createdAt: m.createdAt.toISOString(),
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, full }: { label: string; value: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 font-medium text-slate-700">{value}</div>
    </div>
  );
}
