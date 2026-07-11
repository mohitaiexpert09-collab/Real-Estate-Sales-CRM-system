import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { draftReply } from "@/lib/ai";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { messages: { where: { direction: "in" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const mode = body.mode ?? "draft";
  const lastInbound = lead.messages[0]?.body;

  if (mode === "draft") {
    const { text, usedAI } = await draftReply(
      { name: lead.name, source: lead.source, project: lead.project, city: lead.city, budget: lead.budget },
      lastInbound,
    );
    return NextResponse.json({ text, usedAI });
  }

  // mode === "send"
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });

  await prisma.message.create({
    data: { leadId: lead.id, direction: "out", body: text, isAuto: false },
  });
  await prisma.activity.create({
    data: { leadId: lead.id, type: "reply", detail: "Agent replied on WhatsApp" },
  });

  return NextResponse.json({ ok: true });
}
