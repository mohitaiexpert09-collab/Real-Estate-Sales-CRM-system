"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/leads", label: "Leads Inbox", icon: "inbox" },
  { href: "/pipeline", label: "Pipeline", icon: "columns" },
  { href: "/agents", label: "AI Agents", icon: "spark" },
  { href: "/automations", label: "Automations", icon: "bolt" },
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
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" strokeLinejoin="round" />
          <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-ink-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-emerald-500 text-white shadow-lift">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 11l9-7 9 7" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v9h14v-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 19v-5h6v5" />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-semibold leading-none text-white">PropPulse</div>
          <div className="mt-1 text-[11px] tracking-wide text-slate-400">AI Lead-to-Deal CRM</div>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-brand-600 text-white shadow-lift" : "text-slate-300 hover:bg-ink-800 hover:text-white"
              }`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-xl bg-ink-800 p-3.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Value delivered
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
          Every lead answered in <span className="text-white">under 60s</span>. Zero follow-ups dropped.
        </p>
      </div>

      <div className="px-5 pb-5 text-[11px] text-slate-500">
        Sunrise Realty · Mumbai · Pune · Blr
      </div>
    </aside>
  );
}
