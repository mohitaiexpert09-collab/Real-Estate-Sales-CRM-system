"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AutomationToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    setOn((v) => !v);
    await fetch(`/api/automations/${id}`, { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`relative h-6 w-11 flex-none rounded-full transition ${on ? "bg-accent" : "bg-line"} ${busy ? "opacity-60" : ""}`}
      aria-pressed={on}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
