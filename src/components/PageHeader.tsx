import { aiEnabled, providerLabel } from "@/lib/llm";
import GlobalActions from "./GlobalActions";
import ThemeToggle from "./ThemeToggle";

export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/80 px-8 py-4 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tightest text-content">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">
        <GlobalActions aiEnabled={aiEnabled()} label={providerLabel()} />
        <ThemeToggle />
      </div>
    </header>
  );
}
