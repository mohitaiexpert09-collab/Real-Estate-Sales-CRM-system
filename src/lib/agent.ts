import { TOOL_DEFS, executeTool } from "./agentTools";
import { getProvider, getOpenAI, getAnthropic, OPENAI_MODEL, AGENT_MODEL } from "./llm";

const SYSTEM = `You are "PropPulse Copilot", an AI sales agent that operates a real-estate CRM for an Indian property developer (Sunrise Realty). You work leads across Mumbai, Pune and Bangalore.

You have tools to read leads, summarise the pipeline, send WhatsApp messages, move pipeline stages and book site visits. When the user asks you to DO something across leads, actually use the tools to do it — don't just describe it. First list_leads to find the right leads, then act on each.

Rules:
- Always use tools for data; never invent lead names, budgets or counts.
- Money is in Indian ₹ (Lakh/Crore) — keep values as returned by the tools.
- Be concise and action-oriented. After acting, confirm exactly what you did with numbers.
- If a request is ambiguous, make a sensible default choice and proceed (this is a fast-moving sales desk).`;

export type AgentMsg = { role: "user" | "assistant"; content: string };
export type AgentResult = { reply: string; actions: string[]; usedAI: boolean };

export async function runAgent(history: AgentMsg[]): Promise<AgentResult> {
  const provider = getProvider();
  if (provider === "openai") return runOpenAI(history);
  if (provider === "anthropic") return runAnthropic(history);
  return runMock(history);
}

// ---- OpenAI function-calling loop ----
async function runOpenAI(history: AgentMsg[]): Promise<AgentResult> {
  const ai = getOpenAI();
  if (!ai) return runMock(history);

  const tools = TOOL_DEFS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema as any },
  }));

  try {
    const messages: any[] = [{ role: "system", content: SYSTEM }, ...history.map((m) => ({ role: m.role, content: m.content }))];
    const actions: string[] = [];

    for (let i = 0; i < 6; i++) {
      const res = await ai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 1200,
        messages,
        tools,
        tool_choice: "auto",
      });
      const msg = res.choices[0].message;

      if (msg.tool_calls && msg.tool_calls.length) {
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          const fn = (tc as any).function;
          let args: any = {};
          try {
            args = JSON.parse(fn.arguments || "{}");
          } catch {}
          const { result, action } = await executeTool(fn.name, args);
          if (action) actions.push(action);
          messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 6000) });
        }
        continue;
      }

      return { reply: (msg.content || "Done.").trim(), actions, usedAI: true };
    }
    return { reply: "I've completed as many steps as I could in one go.", actions, usedAI: true };
  } catch {
    return runMock(history);
  }
}

// ---- Anthropic tool-use loop ----
async function runAnthropic(history: AgentMsg[]): Promise<AgentResult> {
  const client = getAnthropic();
  if (!client) return runMock(history);

  try {
    const messages: any[] = history.map((m) => ({ role: m.role, content: m.content }));
    const actions: string[] = [];

    for (let i = 0; i < 6; i++) {
      const res: any = await client.messages.create({
        model: AGENT_MODEL,
        max_tokens: 1200,
        system: SYSTEM,
        tools: TOOL_DEFS as any,
        messages,
      });

      if (res.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: res.content });
        const toolResults: any[] = [];
        for (const block of res.content) {
          if (block.type === "tool_use") {
            const { result, action } = await executeTool(block.name, block.input);
            if (action) actions.push(action);
            toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result).slice(0, 6000) });
          }
        }
        messages.push({ role: "user", content: toolResults });
        continue;
      }

      const reply = res.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
      return { reply: reply || "Done.", actions, usedAI: true };
    }
    return { reply: "I've completed as many steps as I could in one go.", actions, usedAI: true };
  } catch {
    return runMock(history);
  }
}

// ---- Deterministic mock (no provider / on error). Still runs real DB actions. ----
async function runMock(history: AgentMsg[]): Promise<AgentResult> {
  const q = (history[history.length - 1]?.content || "").toLowerCase();
  const actions: string[] = [];
  const wants = (...w: string[]) => w.some((x) => q.includes(x));

  if (wants("summary", "pipeline", "overview", "how many", "conversion", "performance", "report", "doing")) {
    const { result }: any = await executeTool("pipeline_summary", {});
    const stages = result.by_stage.map((s: any) => `${s.stage}: ${s.count}`).join(" · ");
    return {
      reply: `Here's your pipeline right now:\n\n• ${result.total_leads} total leads\n• ${stages}\n• Open pipeline value: ${result.open_pipeline_value}\n• Booked: ${result.booked_value}\n• Lead→Booking conversion: ${result.conversion_rate}\n• Avg first response: ${result.avg_first_response_seconds}s\n\nWant me to follow up with the hot leads that are still waiting?`,
      actions,
      usedAI: false,
    };
  }

  if (wants("follow", "message", "reach out", "nudge", "whatsapp", "text", "reply")) {
    const city = ["pune", "mumbai", "bangalore", "thane", "powai"].find((c) => q.includes(c));
    const tier = wants("warm") ? "Warm" : wants("cold") ? "Cold" : "Hot";
    const { result: leads }: any = await executeTool("list_leads", {
      tier,
      city: city ? city[0].toUpperCase() + city.slice(1) : undefined,
      awaiting_reply: wants("waiting", "awaiting", "not replied", "pending", "unanswered") || undefined,
      limit: 5,
    });
    if (!leads.length) return { reply: `No ${tier.toLowerCase()} leads${city ? " in " + city : ""} matched — try another filter.`, actions, usedAI: false };
    for (const l of leads) {
      const { action } = await executeTool("send_whatsapp", { lead_id: l.id });
      if (action) actions.push(action);
    }
    return {
      reply: `Done ✅ I sent personalised WhatsApp follow-ups to ${leads.length} ${tier.toLowerCase()} lead${leads.length > 1 ? "s" : ""}${city ? " in " + city : ""}:\n\n${leads.map((l: any) => `• ${l.name} — ${l.project} (${l.budget})`).join("\n")}\n\nShall I book site visits for the hottest ones?`,
      actions,
      usedAI: false,
    };
  }

  if (wants("hot", "hottest", "best", "top", "waiting", "awaiting", "priorit")) {
    const awaiting = wants("waiting", "awaiting", "not replied", "pending", "unanswered");
    const { result: leads }: any = await executeTool("list_leads", { tier: "Hot", awaiting_reply: awaiting || undefined, limit: 8 });
    if (!leads.length) return { reply: "No matching hot leads right now — nice, inbox is clear!", actions, usedAI: false };
    return {
      reply: `Your top ${leads.length} hot lead${leads.length > 1 ? "s" : ""}${awaiting ? " still waiting on us" : ""}:\n\n${leads.map((l: any) => `• ${l.name} — ${l.project}, ${l.budget} (score ${l.score}, ${l.stage})`).join("\n")}\n\nWant me to send follow-ups to all of them?`,
      actions,
      usedAI: false,
    };
  }

  return {
    reply: `I'm your PropPulse Copilot — I can operate the whole CRM for you. Try:\n\n• "Show my hottest leads that are still waiting"\n• "Send a follow-up to all hot leads in Pune"\n• "Give me a pipeline summary"\n• "Move Amit to Qualified"\n\nWhat should I do?`,
    actions,
    usedAI: false,
  };
}
