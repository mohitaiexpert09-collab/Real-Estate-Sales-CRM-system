import { inr } from "./format";
import { getProvider, getOpenAI, getAnthropic, OPENAI_MODEL, ANTHROPIC_CHAT_MODEL } from "./llm";

export { aiEnabled } from "./llm";

export type LeadInput = {
  name: string;
  source: string;
  project: string;
  city: string;
  budget: number;
  message?: string;
};

export type ScoreResult = {
  score: number;
  tier: "Hot" | "Warm" | "Cold";
  intent: string;
  timeline: string;
  summary: string;
  usedAI: boolean;
};

// ---- Deterministic mock (used when no provider or on any AI error) ----
function mockScore(lead: LeadInput): ScoreResult {
  let score = 45;
  const srcBoost: Record<string, number> = { WhatsApp: 22, Website: 16, Housing: 10, "99acres": 12, MagicBricks: 11, Facebook: 6 };
  score += srcBoost[lead.source] ?? 5;
  if (lead.budget >= 15000000) score += 18;
  else if (lead.budget >= 9000000) score += 12;
  else if (lead.budget >= 6000000) score += 7;
  const msg = (lead.message ?? "").toLowerCase();
  const hot = ["site visit", "ready to buy", "loan approved", "urgent", "this week", "book", "token", "final"];
  const warm = ["price", "emi", "floor plan", "brochure", "availability", "possession"];
  if (hot.some((k) => msg.includes(k))) score += 16;
  else if (warm.some((k) => msg.includes(k))) score += 8;
  score = Math.max(8, Math.min(98, score));
  const tier: ScoreResult["tier"] = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  const timeline = tier === "Hot" ? "0–30 days" : tier === "Warm" ? "1–3 months" : "3–6 months";
  const intent = tier === "Hot" ? "Ready buyer, high purchase intent" : tier === "Warm" ? "Evaluating options, needs nurturing" : "Early research stage";
  const summary = `${lead.name} is a ${tier.toLowerCase()} lead for ${lead.project}, ${lead.city} with a ~${inr(lead.budget)} budget from ${lead.source}. ${intent}. Recommended action: ${
    tier === "Hot" ? "call within 5 minutes and lock a site visit." : tier === "Warm" ? "share brochure + EMI plan and follow up in 2 days." : "add to drip nurture and re-engage in a week."
  }`;
  return { score, tier, intent, timeline, summary, usedAI: false };
}

function mockReply(lead: LeadInput): string {
  const first = lead.name.split(" ")[0];
  return `Hi ${first}! 🙏 Thanks for your interest in ${lead.project}, ${lead.city}. Based on your ~${inr(lead.budget)} budget we have some great options. I can share the brochure, floor plans & current pricing on WhatsApp right away. Would you prefer a site visit this weekend or a quick call today?`;
}

const SCORE_SYS = "You are a real-estate lead qualification engine for an Indian property CRM. Score inbound leads for purchase intent. Respond ONLY with a JSON object.";
const SCORE_INSTRUCTION = (lead: LeadInput) =>
  `Qualify this lead and return JSON with keys: score (integer 0-100), tier ("Hot"|"Warm"|"Cold"), intent (short phrase), timeline (short phrase), summary (2-3 sentences with a recommended next action for the agent). Lead: ${JSON.stringify(lead)}`;

function normalizeScore(data: any): ScoreResult {
  return {
    score: Math.max(0, Math.min(100, Number(data.score) || 50)),
    tier: (["Hot", "Warm", "Cold"].includes(data.tier) ? data.tier : "Warm") as ScoreResult["tier"],
    intent: String(data.intent || ""),
    timeline: String(data.timeline || ""),
    summary: String(data.summary || ""),
    usedAI: true,
  };
}

export async function scoreLead(lead: LeadInput): Promise<ScoreResult> {
  const provider = getProvider();

  if (provider === "openai") {
    const ai = getOpenAI();
    if (!ai) return mockScore(lead);
    try {
      const res = await ai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SCORE_SYS },
          { role: "user", content: SCORE_INSTRUCTION(lead) },
        ],
      });
      return normalizeScore(JSON.parse(res.choices[0].message.content || "{}"));
    } catch {
      return mockScore(lead);
    }
  }

  if (provider === "anthropic") {
    const ac = getAnthropic();
    if (!ac) return mockScore(lead);
    try {
      const res: any = await ac.messages.create({
        model: ANTHROPIC_CHAT_MODEL,
        max_tokens: 400,
        system: SCORE_SYS,
        messages: [{ role: "user", content: SCORE_INSTRUCTION(lead) + " Respond with only the JSON." }],
      });
      const text = res.content.find((b: any) => b.type === "text");
      return normalizeScore(JSON.parse(text.text));
    } catch {
      return mockScore(lead);
    }
  }

  return mockScore(lead);
}

const REPLY_SYS =
  "You are a friendly, professional WhatsApp sales concierge for an Indian real-estate developer. Write concise, warm replies (2-4 sentences) that qualify the lead and push toward a site visit or call. Use ₹ and Indian phrasing. No markdown.";
const REPLY_INSTRUCTION = (lead: LeadInput, last?: string) =>
  `Draft a WhatsApp reply to this lead.\nLead: ${JSON.stringify(lead)}\nTheir last message: "${last ?? "(new enquiry)"}"`;

export async function draftReply(lead: LeadInput, lastInbound?: string): Promise<{ text: string; usedAI: boolean }> {
  const provider = getProvider();

  if (provider === "openai") {
    const ai = getOpenAI();
    if (!ai) return { text: mockReply(lead), usedAI: false };
    try {
      const res = await ai.chat.completions.create({
        model: OPENAI_MODEL,
        max_tokens: 300,
        messages: [
          { role: "system", content: REPLY_SYS },
          { role: "user", content: REPLY_INSTRUCTION(lead, lastInbound) },
        ],
      });
      return { text: (res.choices[0].message.content || mockReply(lead)).trim(), usedAI: true };
    } catch {
      return { text: mockReply(lead), usedAI: false };
    }
  }

  if (provider === "anthropic") {
    const ac = getAnthropic();
    if (!ac) return { text: mockReply(lead), usedAI: false };
    try {
      const res: any = await ac.messages.create({
        model: ANTHROPIC_CHAT_MODEL,
        max_tokens: 300,
        system: REPLY_SYS,
        messages: [{ role: "user", content: REPLY_INSTRUCTION(lead, lastInbound) }],
      });
      const text = res.content.find((b: any) => b.type === "text");
      return { text: (text?.text ?? mockReply(lead)).trim(), usedAI: true };
    } catch {
      return { text: mockReply(lead), usedAI: false };
    }
  }

  return { text: mockReply(lead), usedAI: false };
}
