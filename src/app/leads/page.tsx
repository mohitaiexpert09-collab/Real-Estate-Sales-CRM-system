import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { SourceBadge, TierBadge, StageBadge } from "@/components/Badges";
import { prisma } from "@/lib/db";
import { inr, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "Hot", label: "🔥 Hot" },
  { key: "Warm", label: "☀️ Warm" },
  { key: "Cold", label: "❄️ Cold" },
];

export default async function LeadsPage({ searchParams }: { searchParams: { tier?: string } }) {
  const tier = searchParams.tier;
  const where = tier && tier !== "all" ? { tier } : {};
  const leads = await prisma.lead.findMany({
    where,
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: { agent: true },
  });

  const counts = {
    all: await prisma.lead.count(),
    Hot: await prisma.lead.count({ where: { tier: "Hot" } }),
    Warm: await prisma.lead.count({ where: { tier: "Warm" } }),
    Cold: await prisma.lead.count({ where: { tier: "Cold" } }),
  } as Record<string, number>;

  return (
    <>
      <PageHeader title="Leads Inbox" subtitle="Every enquiry captured, scored & assigned automatically" />
      <div className="p-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => {
            const active = (tier ?? "all") === f.key;
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/leads" : `/leads?tier=${f.key}`}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active ? "bg-accent text-accent-fg shadow-lift" : "border border-line bg-surface text-muted hover:bg-elevated"
                }`}
              >
                {f.label} <span className="opacity-70">· {counts[f.key]}</span>
              </Link>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-elevated text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">AI score</th>
                <th className="px-4 py-3 font-medium">Interest / Budget</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="group border-b border-line-soft transition hover:bg-elevated">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.id}`} className="block">
                      <div className="font-medium text-slate-800 group-hover:text-brand-700">{l.name}</div>
                      <div className="text-xs text-slate-400">{l.phone}</div>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><SourceBadge source={l.source} /></td>
                  <td className="px-4 py-3"><TierBadge tier={l.tier} score={l.score} /></td>
                  <td className="px-4 py-3">
                    <div className="text-slate-700">{l.project}</div>
                    <div className="text-xs font-medium text-slate-500">{inr(l.budget)}</div>
                  </td>
                  <td className="px-4 py-3"><StageBadge stage={l.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{l.agent?.name.split(" ")[0] ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div className="p-8 text-center text-sm text-slate-400">No leads in this view.</div>}
        </div>
      </div>
    </>
  );
}
