import { prisma } from "./db";
import { draftReply } from "./ai";
import { inr } from "./format";
import { STAGES, OPEN_STAGES } from "./constants";
import { sendBroadcast } from "./broadcast";

// ---- Tool schemas exposed to Claude ----
export const TOOL_DEFS = [
  {
    name: "list_leads",
    description:
      "Search and list leads in the CRM. Use to find leads by tier (Hot/Warm/Cold), pipeline stage, source, or city, or to find leads that are waiting for a reply. Returns lead ids, names, projects, budgets, scores, stage and whether they are awaiting a response.",
    input_schema: {
      type: "object",
      properties: {
        tier: { type: "string", enum: ["Hot", "Warm", "Cold"], description: "Filter by AI tier" },
        stage: { type: "string", enum: [...STAGES], description: "Filter by pipeline stage" },
        source: { type: "string", description: "Filter by lead source e.g. 99acres, WhatsApp" },
        city: { type: "string", description: "City substring, e.g. Pune, Mumbai, Bangalore" },
        awaiting_reply: { type: "boolean", description: "Only leads whose last message is from the customer (waiting on us)" },
        limit: { type: "integer", description: "Max leads to return (default 12)" },
      },
    },
  },
  {
    name: "pipeline_summary",
    description:
      "Get an overview of the whole pipeline: total leads, counts per stage, open pipeline value, booked value, conversion rate and average first-response time.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "send_whatsapp",
    description:
      "Send a WhatsApp message to a lead. If 'text' is omitted, an AI-personalised reply is drafted and sent automatically. Use this to follow up with leads.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "The lead id to message" },
        text: { type: "string", description: "Optional message text. Omit to auto-draft." },
      },
      required: ["lead_id"],
    },
  },
  {
    name: "move_stage",
    description: "Move a lead to a different pipeline stage.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string" },
        stage: { type: "string", enum: [...STAGES] },
      },
      required: ["lead_id", "stage"],
    },
  },
  {
    name: "schedule_site_visit",
    description: "Book a site visit for a lead (auto-sends a confirmation + reminder on WhatsApp).",
    input_schema: {
      type: "object",
      properties: { lead_id: { type: "string" } },
      required: ["lead_id"],
    },
  },
  {
    name: "send_broadcast",
    description:
      "Send the SAME WhatsApp message to a whole filtered audience at once (a bulk broadcast / campaign). Use for announcements like a new launch, a price offer or a festive greeting. The message may contain {name}, {project}, {city} placeholders that get personalised per lead. Filter the audience by tier, city, source and/or stage.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "The broadcast text. Include {name} and {project} to personalise." },
        tier: { type: "string", enum: ["Hot", "Warm", "Cold", "All"], description: "Audience tier (default All)" },
        city: { type: "string", description: "City filter e.g. Pune, Mumbai, Bangalore (default all cities)" },
        source: { type: "string", description: "Lead source filter (default all sources)" },
        stage: { type: "string", enum: [...STAGES, "All"], description: "Pipeline stage filter (default all stages)" },
      },
      required: ["message"],
    },
  },
];

export type ToolResult = { result: unknown; action?: string };

async function listLeads(input: any): Promise<ToolResult> {
  const where: any = {};
  if (input.tier) where.tier = input.tier;
  if (input.stage) where.status = input.stage;
  if (input.source) where.source = input.source;
  if (input.city) where.city = { contains: input.city };
  const limit = Math.min(Number(input.limit) || 12, 25);

  let leads = await prisma.lead.findMany({
    where,
    orderBy: [{ score: "desc" }],
    take: input.awaiting_reply ? 60 : limit,
    include: { agent: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (input.awaiting_reply) {
    leads = leads.filter((l) => l.messages[0]?.direction === "in").slice(0, limit);
  }

  return {
    result: leads.map((l) => ({
      id: l.id,
      name: l.name,
      project: l.project,
      city: l.city,
      budget: inr(l.budget),
      tier: l.tier,
      score: l.score,
      stage: l.status,
      agent: l.agent?.name ?? null,
      awaiting_reply: l.messages[0]?.direction === "in",
    })),
  };
}

async function pipelineSummary(): Promise<ToolResult> {
  const leads = await prisma.lead.findMany({
    select: { status: true, budget: true, firstResponseSecs: true },
  });
  const total = leads.length;
  const byStage = STAGES.map((s) => ({ stage: s, count: leads.filter((l) => l.status === s).length }));
  const booked = leads.filter((l) => l.status === "Booked");
  const openValue = leads.filter((l) => (OPEN_STAGES as string[]).includes(l.status)).reduce((a, l) => a + l.budget, 0);
  const bookedValue = booked.reduce((a, l) => a + l.budget, 0);
  const frs = leads.map((l) => l.firstResponseSecs ?? 60);
  const avg = Math.round(frs.reduce((a, b) => a + b, 0) / (frs.length || 1));
  return {
    result: {
      total_leads: total,
      by_stage: byStage,
      open_pipeline_value: inr(openValue),
      booked_value: inr(bookedValue),
      conversion_rate: `${total ? Math.round((booked.length / total) * 1000) / 10 : 0}%`,
      avg_first_response_seconds: avg,
    },
  };
}

async function sendWhatsapp(input: any): Promise<ToolResult> {
  const lead = await prisma.lead.findUnique({
    where: { id: input.lead_id },
    include: { messages: { where: { direction: "in" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!lead) return { result: { error: "lead not found" } };

  let text = String(input.text ?? "").trim();
  if (!text) {
    const d = await draftReply(
      { name: lead.name, source: lead.source, project: lead.project, city: lead.city, budget: lead.budget },
      lead.messages[0]?.body,
    );
    text = d.text;
  }
  await prisma.message.create({ data: { leadId: lead.id, direction: "out", body: text, isAuto: false } });
  await prisma.activity.create({ data: { leadId: lead.id, type: "reply", detail: "Copilot sent a WhatsApp follow-up" } });

  return { result: { ok: true, lead: lead.name, sent: text }, action: `Sent WhatsApp to ${lead.name}` };
}

async function moveStage(input: any): Promise<ToolResult> {
  if (!(STAGES as readonly string[]).includes(input.stage)) return { result: { error: "invalid stage" } };
  const lead = await prisma.lead.update({ where: { id: input.lead_id }, data: { status: input.stage } });
  await prisma.activity.create({
    data: { leadId: lead.id, type: "stage", detail: input.stage === "Booked" ? "Deal booked 🎉 (by Copilot)" : `Copilot moved to ${input.stage}` },
  });
  return { result: { ok: true, lead: lead.name, stage: input.stage }, action: `Moved ${lead.name} → ${input.stage}` };
}

async function scheduleVisit(input: any): Promise<ToolResult> {
  const lead = await prisma.lead.findUnique({ where: { id: input.lead_id } });
  if (!lead) return { result: { error: "lead not found" } };
  const visit = new Date(Date.now() + 2 * 86400000);
  await prisma.lead.update({
    where: { id: lead.id },
    data: { siteVisitAt: visit, status: ["New", "Qualified"].includes(lead.status) ? "Site Visit" : lead.status },
  });
  await prisma.message.create({
    data: { leadId: lead.id, direction: "out", isAuto: true, body: "📅 Site visit confirmed for this Saturday, 11 AM. Location pin & reminder will be sent on WhatsApp." },
  });
  await prisma.activity.create({ data: { leadId: lead.id, type: "site_visit", detail: "Copilot booked a site visit + reminder" } });
  return { result: { ok: true, lead: lead.name }, action: `Booked site visit for ${lead.name}` };
}

async function sendBroadcastTool(input: any): Promise<ToolResult> {
  const filters = { tier: input.tier, city: input.city, source: input.source, stage: input.stage };
  const { sent, recipients, error } = await sendBroadcast(filters, String(input.message ?? ""));
  if (error) return { result: { error } };
  return {
    result: { ok: true, sent, recipients: recipients.slice(0, 10) },
    action: sent > 0 ? `Broadcast sent to ${sent} lead${sent > 1 ? "s" : ""}` : "Broadcast matched 0 leads",
  };
}

export async function executeTool(name: string, input: any): Promise<ToolResult> {
  switch (name) {
    case "list_leads":
      return listLeads(input);
    case "pipeline_summary":
      return pipelineSummary();
    case "send_whatsapp":
      return sendWhatsapp(input);
    case "move_stage":
      return moveStage(input);
    case "schedule_site_visit":
      return scheduleVisit(input);
    case "send_broadcast":
      return sendBroadcastTool(input);
    default:
      return { result: { error: `unknown tool ${name}` } };
  }
}
