import { NextRequest, NextResponse } from "next/server";
import { runAgent, AgentMsg } from "@/lib/agent";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const history: AgentMsg[] = Array.isArray(body.messages) ? body.messages : [];
  if (!history.length) return NextResponse.json({ error: "no messages" }, { status: 400 });

  // Keep only role/content, cap history length to stay snappy
  const clean = history
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12);

  const result = await runAgent(clean);
  return NextResponse.json(result);
}
