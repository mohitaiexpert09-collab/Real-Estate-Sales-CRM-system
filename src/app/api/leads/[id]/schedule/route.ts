import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const visit = new Date(Date.now() + 2 * 86400000);

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      siteVisitAt: visit,
      status: lead.status === "New" || lead.status === "Qualified" ? "Site Visit" : lead.status,
    },
  });
  await prisma.message.create({
    data: {
      leadId: lead.id,
      direction: "out",
      isAuto: true,
      body: "📅 Site visit confirmed for this Saturday, 11 AM. Our team will share the location pin & reminder on WhatsApp.",
    },
  });
  await prisma.activity.create({
    data: { leadId: lead.id, type: "site_visit", detail: "Site visit scheduled + reminder automation queued" },
  });

  return NextResponse.json({ ok: true });
}
