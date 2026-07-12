import { NextResponse } from "next/server";
import { draftBroadcast } from "@/lib/broadcast";

export async function POST(req: Request) {
  const { campaign } = await req.json().catch(() => ({ campaign: "launch" }));
  const data = await draftBroadcast(campaign || "launch");
  return NextResponse.json(data);
}
