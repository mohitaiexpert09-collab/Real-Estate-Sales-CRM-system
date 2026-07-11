export const STAGES = [
  "New",
  "Qualified",
  "Site Visit",
  "Negotiation",
  "Booked",
  "Lost",
] as const;

export type Stage = (typeof STAGES)[number];

// Stages that count as an active, live deal for pipeline value.
export const OPEN_STAGES: Stage[] = [
  "New",
  "Qualified",
  "Site Visit",
  "Negotiation",
];

export const SOURCES = [
  "99acres",
  "MagicBricks",
  "Housing",
  "Facebook",
  "Website",
  "WhatsApp",
] as const;

export const SOURCE_STYLES: Record<string, string> = {
  "99acres": "bg-red-50 text-red-700 ring-red-600/20",
  MagicBricks: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Housing: "bg-sky-50 text-sky-700 ring-sky-600/20",
  Facebook: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Website: "bg-violet-50 text-violet-700 ring-violet-600/20",
  WhatsApp: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export const TIER_STYLES: Record<string, string> = {
  Hot: "bg-rose-50 text-rose-700 ring-rose-600/20",
  Warm: "bg-amber-50 text-amber-700 ring-amber-600/20",
  Cold: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const STAGE_STYLES: Record<string, string> = {
  New: "bg-slate-100 text-slate-700",
  Qualified: "bg-indigo-100 text-indigo-700",
  "Site Visit": "bg-sky-100 text-sky-700",
  Negotiation: "bg-amber-100 text-amber-800",
  Booked: "bg-emerald-100 text-emerald-700",
  Lost: "bg-rose-100 text-rose-700",
};
