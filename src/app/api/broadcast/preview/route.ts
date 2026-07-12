import { NextResponse } from "next/server";
import { previewAudience } from "@/lib/broadcast";

export async function POST(req: Request) {
  const filters = await req.json().catch(() => ({}));
  const data = await previewAudience(filters || {});
  return NextResponse.json(data);
}
