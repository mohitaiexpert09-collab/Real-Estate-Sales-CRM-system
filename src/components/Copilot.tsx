"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; actions?: string[]; usedAI?: boolean };

const SUGGESTIONS = [
  "Give me a pipeline summary",
  "Show my hottest leads still waiting on us",
  "Send a follow-up to all hot leads in Pune",
  "Book site visits for my top 3 hot leads",
];

export default function Copilot() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply, actions: data.actions, usedAI: data.usedAI }]);
      router.refresh(); // reflect any actions the agent took on the underlying pages
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I hit an error. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg shadow-lift transition hover:opacity-90"
        >
          <span className="text-base">✨</span> Ask Copilot
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-slate-900/20" onClick={() => setOpen(false)} />
          <div className="flex w-full max-w-md flex-col bg-white shadow-2xl animate-slideup">
            {/* header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-ink-900 px-4 py-3.5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-fg text-base">✨</span>
                <div>
                  <div className="text-sm font-semibold leading-none">PropPulse Copilot</div>
                  <div className="mt-1 text-[11px] text-slate-400">Your AI sales agent · operates the CRM</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-ink-800 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
              </button>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="scroll-thin flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
              {messages.length === 0 && (
                <div className="mt-2">
                  <p className="text-sm text-slate-500">
                    I can read your leads and <span className="font-medium text-slate-700">take real actions</span> — draft & send WhatsApp
                    replies, move deals, book site visits. Try:
                  </p>
                  <div className="mt-3 space-y-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                      m.role === "user" ? "rounded-br-sm bg-accent text-accent-fg" : "rounded-bl-sm bg-white text-slate-800"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                        {m.actions.map((a, j) => (
                          <div key={j} className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                            <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-100 text-[9px]">✓</span> {a}
                          </div>
                        ))}
                      </div>
                    )}
                    {m.role === "assistant" && m.usedAI !== undefined && (
                      <div className="mt-1.5 text-[10px] text-slate-400">{m.usedAI ? "Live AI agent" : "Demo agent"}</div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white px-3.5 py-3 shadow-sm">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
                    <span className="ml-1 text-xs text-slate-400">working…</span>
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <div className="border-t border-slate-100 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(input);
                    }
                  }}
                  rows={1}
                  placeholder="Ask your Copilot to do something…"
                  className="max-h-28 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-accent text-accent-fg transition hover:opacity-90 disabled:opacity-40"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12l16-8-6 16-3-7-7-1z" strokeLinejoin="round" /></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
