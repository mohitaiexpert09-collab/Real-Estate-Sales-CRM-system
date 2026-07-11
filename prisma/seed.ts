import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AGENTS = ["Priya Sharma", "Rahul Mehta", "Aisha Khan", "Vikram Nair"];

const PROJECTS: { project: string; city: string; base: number }[] = [
  { project: "Lodha Amara", city: "Thane, Mumbai", base: 9500000 },
  { project: "Godrej Emerald", city: "Thane, Mumbai", base: 12500000 },
  { project: "Hiranandani Gardens", city: "Powai, Mumbai", base: 21000000 },
  { project: "Kalpataru Vista", city: "Andheri, Mumbai", base: 32000000 },
  { project: "Kolte Patil Life Republic", city: "Hinjewadi, Pune", base: 7200000 },
  { project: "Godrej Woodsville", city: "Hinjewadi, Pune", base: 8800000 },
  { project: "Mahindra Centralis", city: "Pimpri, Pune", base: 6400000 },
  { project: "Prestige Lakeside Habitat", city: "Whitefield, Bangalore", base: 14500000 },
  { project: "Brigade Cornerstone", city: "Whitefield, Bangalore", base: 11000000 },
  { project: "Sobha Dream Acres", city: "Panathur, Bangalore", base: 8500000 },
];

const FIRST = ["Amit", "Sneha", "Rohit", "Kavya", "Arjun", "Meera", "Deepak", "Ananya", "Karan", "Divya", "Suresh", "Pooja", "Nikhil", "Ritu", "Sanjay", "Neha", "Manish", "Isha", "Gaurav", "Tanvi"];
const LAST = ["Patel", "Reddy", "Iyer", "Gupta", "Singh", "Desai", "Rao", "Joshi", "Kulkarni", "Verma", "Shah", "Malhotra"];

const SOURCES = ["99acres", "MagicBricks", "Housing", "Facebook", "Website", "WhatsApp"];

const INBOUND_MSGS = [
  "Hi, is this project ready to move in? What is the price for 3BHK?",
  "Please share the brochure and floor plans.",
  "I want to book a site visit this weekend. Loan is already approved.",
  "What is the EMI for a 2BHK? Any offers going on?",
  "Interested. What is the possession date?",
  "Can you share availability and current pricing?",
  "Looking to buy urgently, budget around 1 crore. Call me.",
  "Just researching options in this area for now.",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function scoreOf(source: string, budget: number, msg: string) {
  let score = 45;
  const srcBoost: Record<string, number> = { WhatsApp: 22, Website: 16, Housing: 10, "99acres": 12, MagicBricks: 11, Facebook: 6 };
  score += srcBoost[source] ?? 5;
  if (budget >= 15000000) score += 18;
  else if (budget >= 9000000) score += 12;
  else if (budget >= 6000000) score += 7;
  const m = msg.toLowerCase();
  if (["site visit", "ready to buy", "loan approved", "urgent", "book", "urgently"].some((k) => m.includes(k))) score += 16;
  else if (["price", "emi", "brochure", "availability", "possession"].some((k) => m.includes(k))) score += 8;
  score = Math.max(8, Math.min(98, score));
  const tier = score >= 75 ? "Hot" : score >= 50 ? "Warm" : "Cold";
  return { score, tier };
}

async function main() {
  await prisma.message.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.automation.deleteMany();

  const agents = [];
  for (const name of AGENTS) {
    agents.push(await prisma.agent.create({ data: { name } }));
  }

  const automations = [
    { key: "instant_reply", name: "Instant WhatsApp Reply", description: "AI replies to every new portal/WhatsApp lead within seconds, 24×7.", enabled: true, runs: 1284, order: 1 },
    { key: "ai_qualify", name: "AI Lead Qualification", description: "Scores & tags every lead Hot/Warm/Cold with budget, intent & timeline.", enabled: true, runs: 1284, order: 2 },
    { key: "followup_drip", name: "Follow-up Drip Sequence", description: "Auto follow-ups on Day 1, 3 & 7 until the lead responds or books.", enabled: true, runs: 3450, order: 3 },
    { key: "sitevisit_reminder", name: "Site-Visit Reminder", description: "WhatsApp + SMS reminders before a scheduled site visit to cut no-shows.", enabled: true, runs: 214, order: 4 },
    { key: "cold_reactivation", name: "Cold-Lead Reactivation", description: "Re-engages cold leads after 30 days with new inventory & offers.", enabled: false, runs: 640, order: 5 },
    { key: "marketing_engine", name: "Listing & Marketing Engine", description: "Auto-generates listing copy + brochures and posts to portals & social. (Phase 2)", enabled: false, runs: 0, order: 6 },
  ];
  for (const a of automations) await prisma.automation.create({ data: a });

  const N = 42;
  // Distribution of stages so pipeline & funnel look realistic
  const stagePlan: string[] = [
    ...Array(11).fill("New"),
    ...Array(9).fill("Qualified"),
    ...Array(7).fill("Site Visit"),
    ...Array(5).fill("Negotiation"),
    ...Array(6).fill("Booked"),
    ...Array(4).fill("Lost"),
  ];

  for (let i = 0; i < N; i++) {
    const p = pick(PROJECTS, i * 3 + 1);
    const source = pick(SOURCES, i * 5 + 2);
    const budgetJitter = Math.round((p.base * (0.85 + ((i * 37) % 40) / 100)) / 100000) * 100000;
    const budget = budgetJitter;
    const name = `${pick(FIRST, i)} ${pick(LAST, i * 2 + 1)}`;
    const msg = pick(INBOUND_MSGS, i * 7 + 3);
    const { score, tier } = scoreOf(source, budget, msg);
    const status = stagePlan[i % stagePlan.length];
    const agent = pick(agents, i);
    const daysAgo = (i % 14);
    const createdAt = new Date(Date.now() - daysAgo * 86400000 - (i % 24) * 3600000);
    const frs = 30 + ((i * 13) % 70); // 30–99s first response

    const intent = tier === "Hot" ? "Ready buyer, high purchase intent" : tier === "Warm" ? "Evaluating options, needs nurturing" : "Early research stage";
    const timeline = tier === "Hot" ? "0–30 days" : tier === "Warm" ? "1–3 months" : "3–6 months";
    const summary = `${name.split(" ")[0]} is a ${tier.toLowerCase()} lead for ${p.project} (${p.city}) with a budget near ₹${(budget / 100000).toFixed(0)}L, captured from ${source}. ${intent}.`;

    const siteVisitAt = ["Site Visit", "Negotiation", "Booked"].includes(status)
      ? new Date(createdAt.getTime() + 2 * 86400000)
      : null;

    const lead = await prisma.lead.create({
      data: {
        name,
        phone: `+91 9${(800000000 + i * 137911).toString().slice(0, 9)}`,
        source,
        project: p.project,
        city: p.city,
        budget,
        status,
        score,
        tier,
        intent,
        timeline,
        aiSummary: summary,
        agentId: agent.id,
        firstResponseSecs: frs,
        siteVisitAt,
        createdAt,
      },
    });

    // Conversation thread
    await prisma.message.create({
      data: { leadId: lead.id, direction: "in", body: msg, createdAt, channel: source === "WhatsApp" ? "WhatsApp" : "WhatsApp" },
    });
    await prisma.message.create({
      data: {
        leadId: lead.id,
        direction: "out",
        isAuto: true,
        body: `Hi ${name.split(" ")[0]}! 🙏 Thanks for your interest in ${p.project}, ${p.city}. We have great options around ₹${(budget / 100000).toFixed(0)}L. Shall I share the brochure & pricing and book a site visit this weekend?`,
        createdAt: new Date(createdAt.getTime() + frs * 1000),
      },
    });
    if (["Qualified", "Site Visit", "Negotiation", "Booked"].includes(status)) {
      await prisma.message.create({
        data: { leadId: lead.id, direction: "in", body: "Yes please share the details.", createdAt: new Date(createdAt.getTime() + 6 * 3600000) },
      });
    }

    // Activity timeline
    await prisma.activity.create({ data: { leadId: lead.id, type: "captured", detail: `Lead captured from ${source}`, createdAt } });
    await prisma.activity.create({ data: { leadId: lead.id, type: "scored", detail: `AI scored ${score}/100 — ${tier}`, createdAt: new Date(createdAt.getTime() + 2000) } });
    await prisma.activity.create({ data: { leadId: lead.id, type: "auto_reply", detail: `Instant WhatsApp reply sent (${frs}s)`, createdAt: new Date(createdAt.getTime() + frs * 1000) } });
    if (siteVisitAt) await prisma.activity.create({ data: { leadId: lead.id, type: "site_visit", detail: "Site visit scheduled", createdAt: new Date(createdAt.getTime() + 86400000) } });
    if (status === "Booked") await prisma.activity.create({ data: { leadId: lead.id, type: "stage", detail: "Deal booked 🎉", createdAt: new Date(createdAt.getTime() + 4 * 86400000) } });
  }

  const count = await prisma.lead.count();
  console.log(`Seeded ${count} leads, ${AGENTS.length} agents, ${automations.length} automations.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
