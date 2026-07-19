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

// Monochrome system — sources read as uniform quiet labels (differentiated by name)
const SOURCE_MONO = "bg-transparent text-muted ring-line";
export const SOURCE_STYLES: Record<string, string> = {
  "99acres": SOURCE_MONO,
  MagicBricks: SOURCE_MONO,
  Housing: SOURCE_MONO,
  Facebook: SOURCE_MONO,
  Website: SOURCE_MONO,
  WhatsApp: SOURCE_MONO,
};

// Tiers differentiated by fill weight: Hot = solid, Warm = outline, Cold = faint
export const TIER_STYLES: Record<string, string> = {
  Hot: "bg-accent text-accent-fg ring-transparent",
  Warm: "bg-transparent text-content ring-line",
  Cold: "bg-elevated text-faint ring-transparent",
};

// Stages as an emphasis progression toward the win (Booked = solid)
export const STAGE_STYLES: Record<string, string> = {
  New: "bg-elevated text-faint",
  Qualified: "bg-elevated text-muted",
  "Site Visit": "bg-transparent text-content ring-1 ring-inset ring-line",
  Negotiation: "bg-content/[0.08] text-content ring-1 ring-inset ring-line",
  Booked: "bg-accent text-accent-fg",
  Lost: "bg-elevated text-faint",
};
