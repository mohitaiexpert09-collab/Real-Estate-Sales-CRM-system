import PageHeader from "@/components/PageHeader";
import PipelineBoard from "@/components/PipelineBoard";
import { prisma } from "@/lib/db";
import { inr } from "@/lib/format";
import { OPEN_STAGES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const leads = await prisma.lead.findMany({
    orderBy: { score: "desc" },
    include: { agent: true },
  });

  const openValue = leads
    .filter((l) => (OPEN_STAGES as string[]).includes(l.status))
    .reduce((a, l) => a + l.budget, 0);

  return (
    <>
      <PageHeader title="Sales Pipeline" subtitle={`${inr(openValue)} in open opportunities · drag deals forward`} />
      <div className="p-8">
        <PipelineBoard
          leads={leads.map((l) => ({
            id: l.id,
            name: l.name,
            project: l.project,
            city: l.city,
            budget: l.budget,
            tier: l.tier,
            score: l.score,
            status: l.status,
            agent: l.agent?.name ?? "—",
          }))}
        />
      </div>
    </>
  );
}
