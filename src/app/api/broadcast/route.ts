import { NextResponse } from "next/server";
import { sendBroadcast } from "@/lib/broadcast";

export async function POST(req: Request) {
  const { filters, message } = await req.json().catch(() => ({}));
  const data = await sendBroadcast(filters || {}, message || "");
  return NextResponse.json(data);
}
