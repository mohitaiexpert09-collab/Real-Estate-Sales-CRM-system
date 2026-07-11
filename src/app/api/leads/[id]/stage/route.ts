import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { STAGES } from "@/lib/constants";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const stage = String(body.stage ?? "");
  if (!(STAGES as readonly string[]).includes(stage)) {
    return NextResponse.json({ error: "invalid stage" }, { status: 400 });
  }

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: { status: stage },
  });
  await prisma.activity.create({
    data: {
      leadId: lead.id,
      type: stage === "Booked" ? "stage" : "stage",
      detail: stage === "Booked" ? "Deal booked 🎉" : `Moved to ${stage}`,
    },
  });

  return NextResponse.json({ ok: true, status: stage });
}
