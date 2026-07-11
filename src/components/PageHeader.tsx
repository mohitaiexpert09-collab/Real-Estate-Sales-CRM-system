import { aiEnabled, providerLabel } from "@/lib/llm";
import GlobalActions from "./GlobalActions";

export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#f6f7fb]/85 px-8 py-4 backdrop-blur">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      <GlobalActions aiEnabled={aiEnabled()} label={providerLabel()} />
    </header>
  );
}
