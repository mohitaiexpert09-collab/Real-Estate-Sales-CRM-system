import { NextResponse } from "next/server";
import { runAgentJob } from "@/lib/agents";

export async function POST(_req: Request, { params }: { params: { key: string } }) {
  const result = await runAgentJob(params.key);
  return NextResponse.json(result);
}
