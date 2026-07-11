import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreLead, draftReply } from "@/lib/ai";

const POOL = {
  names: ["Rajesh Menon", "Sneha Kapoor", "Aditya Rao", "Fatima Sheikh", "Vikas Agarwal", "Priyanka Nair", "Harish Bhat", "Simran Kaur"],
  sources: ["99acres", "MagicBricks", "Housing", "Facebook", "Website", "WhatsApp"],
  projects: [
    { project: "Lodha Amara", city: "Thane, Mumbai", base: 9500000 },
    { project: "Prestige Lakeside Habitat", city: "Whitefield, Bangalore", base: 14500000 },
    { project: "Kolte Patil Life Republic", city: "Hinjewadi, Pune", base: 7200000 },
    { project: "Hiranandani Gardens", city: "Powai, Mumbai", base: 21000000 },
    { project: "Sobha Dream Acres", city: "Panathur, Bangalore", base: 8500000 },
  ],
  messages: [
    "Hi, I want a 3BHK. Loan already approved, can we do a site visit this weekend?",
    "Please share pricing and floor plans for 2BHK.",
    "Interested in this project. What is the possession date and EMI?",
    "Looking to buy urgently, budget around 1.2 crore. Please call.",
    "Just checking options in this area, share a brochure.",
  ],
};

function rnd<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

export async function POST() {
  const p = rnd(POOL.projects);
  const source = rnd(POOL.sources);
  const name = rnd(POOL.names);
  const message = rnd(POOL.messages);
  const budget = Math.round((p.base * (0.85 + Math.random() * 0.4)) / 100000) * 100000;
  const frs = 20 + Math.floor(Math.random() * 40);

  const leadInput = { name, source, project: p.project, city: p.city, budget, message };
  const score = await scoreLead(leadInput);
  const reply = await draftReply(leadInput, message);

  const agents = await prisma.agent.findMany();
  const agent = agents[Math.floor(Math.random() * agents.length)];

  const lead = await prisma.lead.create({
    data: {
      name,
      phone: `+91 9${Math.floor(700000000 + Math.random() * 99999999).toString().slice(0, 9)}`,
      source,
      project: p.project,
      city: p.city,
      budget,
      status: "New",
      score: score.score,
      tier: score.tier,
      intent: score.intent,
      timeline: score.timeline,
      aiSummary: score.summary,
      agentId: agent?.id,
      firstResponseSecs: frs,
    },
  });

  const now = Date.now();
  await prisma.message.create({ data: { leadId: lead.id, direction: "in", body: message } });
  await prisma.message.create({
    data: { leadId: lead.id, direction: "out", isAuto: true, body: reply.text, createdAt: new Date(now + frs * 1000) },
  });
  await prisma.activity.createMany({
    data: [
      { leadId: lead.id, type: "captured", detail: `Lead captured from ${source}` },
      { leadId: lead.id, type: "scored", detail: `AI scored ${score.score}/100 — ${score.tier}` },
      { leadId: lead.id, type: "auto_reply", detail: `Instant WhatsApp reply sent (${frs}s)` },
    ],
  });

  // Bump the automations that just fired
  await prisma.automation.updateMany({
    where: { key: { in: ["instant_reply", "ai_qualify"] } },
    data: { runs: { increment: 1 } },
  });

  return NextResponse.json({
    lead: {
      id: lead.id,
      name: lead.name,
      source: lead.source,
      project: lead.project,
      city: lead.city,
      budget: lead.budget,
      score: lead.score,
      tier: lead.tier,
    },
    reply: reply.text,
    usedAI: score.usedAI || reply.usedAI,
  });
}
