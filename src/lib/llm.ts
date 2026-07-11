import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export type Provider = "openai" | "anthropic" | "none";

// Decide which LLM provider to use.
// LLM_PROVIDER=openai|anthropic forces a choice (falls back if that key is missing).
// Otherwise: OpenAI key wins, then Anthropic key, else the built-in mock.
export function getProvider(): Provider {
  const forced = (process.env.LLM_PROVIDER || "").toLowerCase();
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  if (forced === "openai" && hasOpenAI) return "openai";
  if (forced === "anthropic" && hasAnthropic) return "anthropic";

  if (hasOpenAI) return "openai";
  if (hasAnthropic) return "anthropic";
  return "none";
}

export function aiEnabled(): boolean {
  return getProvider() !== "none";
}

export function providerLabel(): string {
  const p = getProvider();
  return p === "openai" ? "OpenAI live" : p === "anthropic" ? "Claude live" : "AI: demo mode";
}

export function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    return new OpenAI({ apiKey: key });
  } catch {
    return null;
  }
}

export function getAnthropic(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    return new Anthropic({ apiKey: key });
  } catch {
    return null;
  }
}

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
export const ANTHROPIC_CHAT_MODEL = "claude-haiku-4-5";
// Copilot agent model (Anthropic path). OpenAI path uses OPENAI_MODEL.
export const AGENT_MODEL = process.env.AGENT_MODEL || "claude-opus-4-8";
