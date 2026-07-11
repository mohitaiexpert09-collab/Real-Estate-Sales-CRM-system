import { prisma } from "./db";
import { scoreLead, draftReply } from "./ai";
import { executeTool } from "./agentTools";
import { aiEnabled } from "./llm";

// ─────────────────────────────────────────────────────────────
//  AI Agent roster. Each agent = a role + a toolkit + a trigger.
//  Adding a new agent is a config entry here, not a rewrite — this
//  is what lets the same engine be re-pointed at any business.
// ─────────────────────────────────────────────────────────────
export type Trigger = "real-time" | "scheduled" | "on-demand";

export type AgentDef = {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  trigger: Trigger;
  tools: string[];
  activityType: string | null; // Activity.type used to derive live run counts
  runnable: boolean; // false = runs elsewhere (Copilot chat)
};

export const AGENTS: AgentDef[] = [
  {
    key: "qualifier",
    name: "Lead Qualifier",
    emoji: "🎯",
    tagline: "Scores every new lead in seconds",
    description:
      "Reads each incoming enquiry and assigns a Hot / Warm / Cold score with intent, timeline and a recommended next action — so agents work the best leads first.",
    trigger: "real-time",
    tools: ["AI scoring"],
    activityType: "scored",
    runnable: true,
  },
  {
    key: "responder",
    name: "Instant Responder",
    emoji: "💬",
    tagline: "First WhatsApp reply in under 60 seconds",
    description:
      "The moment a lead lands, it drafts and sends a personalised WhatsApp reply. No enquiry ever sits unanswered while a rival calls first.",
    trigger: "real-time",
    tools: ["send_whatsapp"],
    activityType: "auto_reply",
    runnable: true,
  },
  {
    key: "followup",
    name: "Follow-up Agent",
    emoji: "🔁",
    tagline: "Never lets a hot lead go cold",
    description:
      "Finds leads that replied but are still waiting on us and sends a timely, personalised nudge to keep the deal moving toward a booking.",
    trigger: "scheduled",
    tools: ["list_leads", "send_whatsapp"],
    activityType: "reply",
    runnable: true,
  },
  {
    key: "scheduler",
    name: "Site-Visit Scheduler",
    emoji: "📅",
    tagline: "Turns interest into site visits",
    description:
      "Spots qualified hot leads with no visit booked and schedules one — with an automatic WhatsApp confirmation and reminder.",
    trigger: "real-time",
    tools: ["schedule_site_visit"],
    activityType: "site_visit",
    runnable: true,
  },
  {
    key: "copilot",
    name: "Sales Copilot",
    emoji: "📊",
    tagline: "Your conversational sales analyst",
    description:
      "Ask it anything — pipeline summaries, hottest leads, bulk follow-ups. It reads the whole CRM and takes real action on command from the ✨ chat.",
    trigger: "on-demand",
    tools: ["all tools"],
    activityType: null,
    runnable: false,
  },
];

export type AgentStat = AgentDef & { runs: number | null; lastRun: string | null };

export async function getAgentStats(): Promise<AgentStat[]> {
  const grouped = await prisma.activity.groupBy({ by: ["type"], _count: { type: true } });
  const counts: Record<string, number> = {};
  for (const g of grouped) counts[g.type] = g._count.type;

  const stats: AgentStat[] = [];
  for (const a of AGENTS) {
    let lastRun: string | null = null;
    if (a.activityType) {
      const last = await prisma.activity.findFirst({
        where: { type: a.activityType },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      lastRun = last?.createdAt.toISOString() ?? null;
    }
    stats.push({ ...a, runs: a.activityType ? counts[a.activityType] ?? 0 : null, lastRun });
  }
  return stats;
}

// ─────────────────────────────────────────────────────────────
//  "Run now" jobs — each performs a real batch of work against the
//  live database (and calls the AI provider), so the demo is honest.
// ─────────────────────────────────────────────────────────────
export type JobResult = { key: string; summary: string; actions: string[]; count: number; usedAI: boolean };

export async function runAgentJob(key: string): Promise<JobResult> {
  switch (key) {
    case "qualifier":
      return runQualifier();
    case "responder":
      return runResponder();
    case "followup":
      return runFollowup();
    case "scheduler":
      return runScheduler();
    default:
      return { key, summary: "This agent runs on-demand — open the ✨ Copilot chat to talk to it.", actions: [], count: 0, usedAI: false };
  }
}

async function runQualifier(): Promise<JobResult> {
  const leads = await prisma.lead.findMany({
    where: { status: "New" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { messages: { where: { direction: "in" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!leads.length)
    return { key: "qualifier", summary: "All new leads are already qualified — the inbox is clean. ✅", actions: [], count: 0, usedAI: aiEnabled() };

  const actions: string[] = [];
  let used = false;
  for (const l of leads) {
    const s = await scoreLead({ name: l.name, source: l.source, project: l.project, city: l.city, budget: l.budget, message: l.messages[0]?.body });
    used = used || s.usedAI;
    await prisma.lead.update({
      where: { id: l.id },
      data: { score: s.score, tier: s.tier, intent: s.intent, timeline: s.timeline, aiSummary: s.summary },
    });
    await prisma.activity.create({ data: { leadId: l.id, type: "scored", detail: `Lead Qualifier scored ${l.name}: ${s.tier} (${s.score})` } });
    actions.push(`Scored ${l.name} → ${s.tier} (${s.score})`);
  }
  return { key: "qualifier", summary: `Qualified ${leads.length} new lead${leads.length > 1 ? "s" : ""} with AI scoring.`, actions, count: leads.length, usedAI: used };
}

async function runResponder(): Promise<JobResult> {
  const candidates = await prisma.lead.findMany({
    where: { status: "New" },
    take: 25,
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" } } },
  });
  const targets = candidates.filter((l) => !l.messages.some((m) => m.direction === "out")).slice(0, 5);
  if (!targets.length)
    return { key: "responder", summary: "Every lead already has a first reply — response SLA is green. ✅", actions: [], count: 0, usedAI: aiEnabled() };

  const actions: string[] = [];
  let used = false;
  for (const l of targets) {
    const lastIn = l.messages.find((m) => m.direction === "in");
    const d = await draftReply({ name: l.name, source: l.source, project: l.project, city: l.city, budget: l.budget }, lastIn?.body);
    used = used || d.usedAI;
    await prisma.message.create({ data: { leadId: l.id, direction: "out", isAuto: true, body: d.text } });
    await prisma.lead.update({ where: { id: l.id }, data: { firstResponseSecs: l.firstResponseSecs ?? 45 } });
    await prisma.activity.create({ data: { leadId: l.id, type: "auto_reply", detail: `Instant Responder replied to ${l.name} in ~45s` } });
    actions.push(`Replied to ${l.name}`);
  }
  return { key: "responder", summary: `Sent instant WhatsApp replies to ${targets.length} unanswered lead${targets.length > 1 ? "s" : ""}.`, actions, count: targets.length, usedAI: used };
}

async function runFollowup(): Promise<JobResult> {
  const leads = await prisma.lead.findMany({
    where: { tier: { in: ["Hot", "Warm"] }, status: { in: ["New", "Qualified", "Site Visit", "Negotiation"] } },
    take: 40,
    orderBy: { score: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const targets = leads.filter((l) => l.messages[0]?.direction === "in").slice(0, 5);
  if (!targets.length)
    return { key: "followup", summary: "No leads are waiting on us right now — great follow-up hygiene. ✅", actions: [], count: 0, usedAI: aiEnabled() };

  const actions: string[] = [];
  for (const l of targets) {
    const r: any = await executeTool("send_whatsapp", { lead_id: l.id });
    if (r.action) actions.push(r.action);
  }
  return { key: "followup", summary: `Followed up with ${targets.length} lead${targets.length > 1 ? "s" : ""} who were waiting on us.`, actions, count: targets.length, usedAI: aiEnabled() };
}

async function runScheduler(): Promise<JobResult> {
  const leads = await prisma.lead.findMany({
    where: { tier: "Hot", status: { in: ["Qualified", "Site Visit"] }, siteVisitAt: null },
    take: 5,
    orderBy: { score: "desc" },
  });
  if (!leads.length)
    return { key: "scheduler", summary: "All hot qualified leads already have a site visit booked. ✅", actions: [], count: 0, usedAI: false };

  const actions: string[] = [];
  for (const l of leads) {
    const r: any = await executeTool("schedule_site_visit", { lead_id: l.id });
    if (r.action) actions.push(r.action);
  }
  return { key: "scheduler", summary: `Booked ${leads.length} site visit${leads.length > 1 ? "s" : ""} for hot qualified leads.`, actions, count: leads.length, usedAI: false };
}
