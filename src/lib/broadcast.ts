import { prisma } from "./db";
import { inr } from "./format";
import { getProvider, getOpenAI, getAnthropic, OPENAI_MODEL, ANTHROPIC_CHAT_MODEL } from "./llm";

// ─────────────────────────────────────────────────────────────
//  Bulk WhatsApp broadcast — send one message to a filtered
//  audience, personalised per lead with {tokens}.
// ─────────────────────────────────────────────────────────────
export type BroadcastFilters = {
  tier?: string; // Hot | Warm | Cold | All
  city?: string; // Mumbai | Pune | Bangalore | All
  source?: string; // 99acres ... | All
  stage?: string; // New ... | All
};

const ALL = (v?: string) => !v || v === "All";

export function buildWhere(f: BroadcastFilters) {
  const where: any = {};
  if (!ALL(f.tier)) where.tier = f.tier;
  if (!ALL(f.city)) where.city = { contains: f.city };
  if (!ALL(f.source)) where.source = f.source;
  if (!ALL(f.stage)) where.status = f.stage;
  return where;
}

type LeadLike = { name: string; project: string; city: string; budget: number };

export function personalize(template: string, lead: LeadLike): string {
  const first = lead.name.split(" ")[0];
  return (template || "")
    .replaceAll("{name}", first)
    .replaceAll("{first_name}", first)
    .replaceAll("{project}", lead.project)
    .replaceAll("{city}", lead.city)
    .replaceAll("{budget}", inr(lead.budget));
}

export async function previewAudience(f: BroadcastFilters) {
  const where = buildWhere(f);
  const count = await prisma.lead.count({ where });
  const sample = await prisma.lead.findMany({
    where,
    orderBy: { score: "desc" },
    take: 8,
    select: { id: true, name: true, project: true, city: true, budget: true, tier: true },
  });
  return { count, sample };
}

const MAX_RECIPIENTS = 500;

export async function sendBroadcast(f: BroadcastFilters, message: string) {
  const text = (message || "").trim();
  if (!text) return { sent: 0, recipients: [] as string[], error: "Message is empty" };

  const leads = await prisma.lead.findMany({ where: buildWhere(f), take: MAX_RECIPIENTS });
  const recipients: string[] = [];
  for (const l of leads) {
    const body = personalize(text, l);
    await prisma.message.create({ data: { leadId: l.id, direction: "out", channel: "WhatsApp", isAuto: true, body } });
    await prisma.activity.create({ data: { leadId: l.id, type: "broadcast", detail: `Broadcast sent: "${text.slice(0, 40)}${text.length > 40 ? "…" : ""}"` } });
    recipients.push(l.name);
  }
  return { sent: leads.length, recipients };
}

// ---- AI: draft campaign copy (one call, tokens fill per lead on send) ----
const CAMPAIGNS: Record<string, string> = {
  launch: "a NEW PROJECT LAUNCH announcement — invite them to be among the first to book at a pre-launch price",
  offer: "a LIMITED-TIME PRICE OFFER / festive discount on the project — create urgency",
  sitevisit: "a SITE-VISIT INVITE for this weekend, with a free cab pickup offer",
  festive: "a warm FESTIVE GREETING that gently reminds them about the project",
  reengage: "a friendly RE-ENGAGEMENT nudge for a lead who went quiet",
};

function mockDraft(campaign: string): string {
  switch (campaign) {
    case "offer":
      return "Hi {name}! 🎉 For a limited time, we have a special festive price on {project}, {city}. Prices revise from next month — I'd love to lock today's rate for you. Shall I share the offer details on WhatsApp?";
    case "sitevisit":
      return "Hi {name}! 🏡 We're hosting site visits at {project}, {city} this weekend — free cab pickup included. Would Saturday or Sunday suit you better?";
    case "festive":
      return "Hi {name}! 🪔 Wishing you and your family joy and prosperity from all of us. Whenever you're ready to explore {project}, {city}, I'm just a message away.";
    case "reengage":
      return "Hi {name}! Just checking in on your interest in {project}, {city}. A few good units are still available in your ~{budget} range — want me to share the latest options?";
    default:
      return "Hi {name}! 🎉 Exciting news — we're launching {project} in {city}, and early buyers get the best floor + pre-launch pricing. Can I share the brochure and price list on WhatsApp?";
  }
}

const DRAFT_SYS =
  "You are a WhatsApp marketing copywriter for an Indian real-estate developer. Write ONE short broadcast message (2-3 sentences), warm and professional, with a clear call to action. You MUST include the placeholders {name} and {project} literally so they can be personalised. Use ₹ and Indian phrasing. No markdown, no quotes around the message.";

export async function draftBroadcast(campaign: string): Promise<{ text: string; usedAI: boolean }> {
  const brief = CAMPAIGNS[campaign] || CAMPAIGNS.launch;
  const instruction = `Write the broadcast for: ${brief}. Remember to include {name} and {project} placeholders.`;
  const provider = getProvider();

  if (provider === "openai") {
    const ai = getOpenAI();
    if (ai) {
      try {
        const res = await ai.chat.completions.create({
          model: OPENAI_MODEL,
          max_tokens: 220,
          messages: [
            { role: "system", content: DRAFT_SYS },
            { role: "user", content: instruction },
          ],
        });
        const text = (res.choices[0].message.content || "").trim();
        if (text) return { text: ensureTokens(text), usedAI: true };
      } catch {}
    }
  }

  if (provider === "anthropic") {
    const ac = getAnthropic();
    if (ac) {
      try {
        const res: any = await ac.messages.create({
          model: ANTHROPIC_CHAT_MODEL,
          max_tokens: 220,
          system: DRAFT_SYS,
          messages: [{ role: "user", content: instruction }],
        });
        const block = res.content.find((b: any) => b.type === "text");
        const text = (block?.text || "").trim();
        if (text) return { text: ensureTokens(text), usedAI: true };
      } catch {}
    }
  }

  return { text: mockDraft(campaign), usedAI: false };
}

// Guarantee the personalisation tokens survive even if the model omitted them.
function ensureTokens(text: string): string {
  let out = text;
  if (!out.includes("{name}")) out = "Hi {name}! " + out;
  if (!out.includes("{project}")) out = out.replace(/\.$/, "") + " — regarding {project}.";
  return out;
}
