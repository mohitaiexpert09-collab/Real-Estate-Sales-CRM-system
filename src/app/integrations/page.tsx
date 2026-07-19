import PageHeader from "@/components/PageHeader";
import IntegrationsBoard from "@/components/IntegrationsBoard";

export const dynamic = "force-dynamic";

const COMPARISON: { dimension: string; pp: string; zoho: string }[] = [
  { dimension: "First response to a new lead", pp: "Under 60s, fully automated", zoho: "Manual — or rules you build yourself" },
  { dimension: "Time to go live", pp: "Same day, pre-built for real estate", zoho: "Weeks of consultant configuration" },
  { dimension: "AI qualification & scoring", pp: "Built in on every lead", zoho: "Zia add-on, priced per credit" },
  { dimension: "WhatsApp + Indian portals", pp: "Native (99acres, MagicBricks, Housing)", zoho: "Third-party plugins" },
  { dimension: "Built for", pp: "Brokers & developers", zoho: "Generic sales teams" },
];

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader title="Integrations" subtitle="Connect your stack — or replace the parts that slow you down" />
      <div className="space-y-8 p-8">
        <IntegrationsBoard />

        {/* Better-than-Zoho, result-focused */}
        <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
          <div className="border-b border-line px-7 py-5">
            <h2 className="text-base font-semibold tracking-tight text-content">Why teams switch from Zoho</h2>
            <p className="mt-1 text-sm text-muted">
              You don&apos;t have to choose. Run PropPulse for speed, keep Zoho as your record — or move fully across when
              you&apos;re ready.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">What matters</th>
                  <th className="px-5 py-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-accent-fg shadow-lift">
                      PropPulse
                    </span>
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">Zoho CRM</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.dimension} className={i % 2 ? "bg-elevated/40" : ""}>
                    <td className="px-7 py-3.5 font-medium text-content">{row.dimension}</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-2 text-content">
                        <span className="grid h-4 w-4 flex-none place-items-center rounded-full bg-accent text-[10px] font-bold text-accent-fg">
                          ✓
                        </span>
                        {row.pp}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted">{row.zoho}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-line px-7 py-4 text-xs text-faint">
            Zoho is a trademark of Zoho Corporation. PropPulse is an independent product and integrates with Zoho via its
            public API.
          </div>
        </section>
      </div>
    </>
  );
}
