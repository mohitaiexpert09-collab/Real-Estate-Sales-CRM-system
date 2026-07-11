# PropPulse — AI Lead-to-Deal CRM (Real Estate, India)

A real, clickable full-stack product that captures every property lead, replies on WhatsApp in
seconds, qualifies it with AI, and drives it through the pipeline — so **no lead is ever ignored**.

Built for Indian developers & brokers. Leads from 99acres, MagicBricks, Housing.com, Facebook,
Website & WhatsApp. Currency in ₹ (Lakh / Crore).

## Run it (2 minutes)

```bash
npm install
npx prisma db push        # creates the local SQLite DB (first time only)
npm run seed              # loads 42 realistic Indian leads
npm run dev               # http://localhost:3000
```

The database is a single local SQLite file (`dev.db`) — zero setup.

### Optional: live Claude AI

The app runs fully on a built-in **deterministic AI mock** with no key (great for an offline demo).
To switch lead scoring + WhatsApp reply drafting to **live Claude**, add to `.env`:

```
ANTHROPIC_API_KEY="sk-ant-..."
```

The header badge shows **“Claude AI live”** vs **“AI: demo mode”**. Everything works either way.

## Demo script (5 minutes)

1. **Dashboard** — KPIs that speak money & time: response time (⚡ ~50s vs 4h manual),
   pipeline value in ₹ Cr, leads rescued from going cold, revenue attributed. Charts: leads by
   source, pipeline funnel, response-time trend, and a live "🔥 Hot leads · act now" list.
2. **Leads Inbox** — every lead auto-captured, source-badged, AI-scored Hot/Warm/Cold. Filter by tier.
3. **Open a lead** — AI qualification summary (budget, intent, timeline, 0–100 score), a live
   **WhatsApp thread**, an **AI-suggested reply** you can edit & send, book a site visit, move stage,
   and a full activity timeline.
4. **Pipeline** — Kanban New → Qualified → Site Visit → Negotiation → Booked → Lost. Move deals with
   the ‹ › controls; column values update.
5. **Automations** — toggle the engine: instant reply, AI qualification, follow-up drip, site-visit
   reminder, cold-lead reactivation, and the Phase-2 marketing engine.
6. **⚡ Simulate inbound lead** (top-right, any page) — **the money shot**: watch a brand-new portal
   lead fire the whole chain live — captured → AI-scored → instant WhatsApp reply → lands in the
   pipeline — then click through to the new lead.
7. **Reset demo** restores the original 42 leads anytime.

## The 3 automation concepts pitched

1. **AI Lead-to-Deal CRM** — this product (flagship).
2. **AI WhatsApp Sales Concierge** — shipped inside as the instant-reply + qualification modules.
3. **Automated Listing & Marketing Engine** — Phase-2 upsell (shown as a toggle).

## How it's sold

**Setup ₹50k–₹1L** (branding, portal + WhatsApp connection, agent onboarding, data import) +
**monthly retainer** (WhatsApp BSP + AI usage + support). ROI framing: *one extra booking pays for a
year.* Real WhatsApp BSP (AiSensy/Gupshup/Meta), portal webhooks, auth/multi-tenant, and ERP/SAP
back-office sync are the paid Phase-2 scope — simulated in-app for the demo.

## Stack

Next.js 14 (App Router, TypeScript) · Tailwind CSS · Prisma + SQLite · Recharts ·
`@anthropic-ai/sdk` (`claude-haiku-4-5`) with a deterministic mock fallback.
