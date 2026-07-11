import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const a = await prisma.automation.findUnique({ where: { id: params.id } });
  if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });
  const updated = await prisma.automation.update({
    where: { id: params.id },
    data: { enabled: !a.enabled },
  });
  return NextResponse.json({ ok: true, enabled: updated.enabled });
}
