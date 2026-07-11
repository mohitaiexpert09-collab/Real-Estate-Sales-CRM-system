import PageHeader from "@/components/PageHeader";
import AgentCard from "@/components/AgentCard";
import { getAgentStats } from "@/lib/agents";
import { aiEnabled, providerLabel } from "@/lib/llm";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const agents = await getAgentStats();
  const totalActions = agents.reduce((a, x) => a + (x.runs ?? 0), 0);
  const realtime = agents.filter((a) => a.trigger === "real-time").length;

  return (
    <>
      <PageHeader title="AI Agents" subtitle="Your always-on AI sales team — each agent has a job and works your leads in real time" />
      <div className="p-8">
        {/* summary strip */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Agents on duty" value={`${agents.length}`} />
          <Stat label="Real-time agents" value={`${realtime}`} />
          <Stat label="Actions taken" value={totalActions.toLocaleString("en-IN")} />
          <Stat label="AI engine" value={aiEnabled() ? providerLabel() : "Demo mode"} accent={aiEnabled()} />
        </div>

        {/* how it works */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-ink-900 to-ink-800 p-5 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-brand-500 to-emerald-500">✨</span>
            How your AI team works
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
            Every agent is a role + a toolkit. They fire <span className="font-medium text-white">automatically</span> as leads arrive —
            qualifying, replying, following up and booking visits — and you can trigger any of them yourself with
            <span className="font-medium text-white"> Run now</span>. Same engine, new roster = it re-points to any business (clinic, gym,
            dealership) by swapping the config.
          </p>
        </div>

        {/* roster */}
        <div className="grid gap-4 lg:grid-cols-2">
          {agents.map((a) => (
            <AgentCard
              key={a.key}
              agentKey={a.key}
              name={a.name}
              emoji={a.emoji}
              tagline={a.tagline}
              description={a.description}
              trigger={a.trigger}
              tools={a.tools}
              runs={a.runs}
              runnable={a.runnable}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-semibold tracking-tight ${accent ? "text-emerald-600" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
