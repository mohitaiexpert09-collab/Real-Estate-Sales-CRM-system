"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS: { label: string; items: { href: string; label: string; icon: string }[] }[] = [
  {
    label: "Sell",
    items: [
      { href: "/", label: "Dashboard", icon: "grid" },
      { href: "/leads", label: "Leads Inbox", icon: "inbox" },
      { href: "/pipeline", label: "Pipeline", icon: "columns" },
    ],
  },
  {
    label: "Automate",
    items: [
      { href: "/broadcast", label: "Broadcast", icon: "send" },
      { href: "/agents", label: "AI Agents", icon: "spark" },
      { href: "/automations", label: "Automations", icon: "bolt" },
    ],
  },
  {
    label: "Connect",
    items: [{ href: "/integrations", label: "Integrations", icon: "plug" }],
  },
];

function Icon({ name }: { name: string }) {
  const common = "h-[18px] w-[18px]";
  switch (name) {
    case "grid":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "inbox":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 13l2.5-7h11L20 13v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5z" /><path d="M4 13h4l1.5 2h5L16 13h4" />
        </svg>
      );
    case "columns":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="5" height="16" rx="1.2" /><rect x="9.5" y="4" width="5" height="11" rx="1.2" /><rect x="16" y="4" width="5" height="14" rx="1.2" />
        </svg>
      );
    case "bolt":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
        </svg>
      );
    case "send":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12l16-8-6 16-3-7-7-1z" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" strokeLinejoin="round" />
          <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" strokeLinejoin="round" />
        </svg>
      );
    case "plug":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 2v6M15 2v6" strokeLinecap="round" />
          <path d="M6 8h12v3a6 6 0 0 1-12 0V8z" strokeLinejoin="round" />
          <path d="M12 17v5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-fg shadow-lift">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 19v-5h6v5" />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none tracking-tightest text-content">PropPulse</div>
          <div className="mt-1.5 text-[11px] font-medium tracking-wide text-faint">Lead-to-Deal OS</div>
        </div>
      </div>

      <nav className="mt-1 flex-1 space-y-5 px-3">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-elevated text-content"
                        : "text-muted hover:bg-elevated/70 hover:text-content"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
                    )}
                    <span className={active ? "text-content" : "text-faint group-hover:text-muted"}>
                      <Icon name={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Outcome card — this is what the CRM is for */}
      <div className="mx-3 mb-3 rounded-xl border border-line bg-elevated p-3.5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Live outcome
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Every lead answered in <span className="font-semibold text-content">under 60s</span>. Zero follow-ups dropped.
        </p>
      </div>

      <div className="border-t border-line px-5 py-4 text-[11px] text-faint">
        Sunrise Realty · Mumbai · Pune · Blr
      </div>
    </aside>
  );
}
