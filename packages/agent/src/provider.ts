/**
 * Single MODEL_PROVIDER client wrapper (nrp | anthropic | mock).
 * Teammates: never call OpenAI/Anthropic SDKs outside this file.
 */

import OpenAI from "openai";

export type ModelProviderName = "nrp" | "anthropic" | "mock";

export interface ProviderClient {
  name: ModelProviderName;
  model: string;
  client: OpenAI | null;
}

export function resolveProvider(
  env: NodeJS.ProcessEnv = process.env
): ProviderClient {
  const name = (env.MODEL_PROVIDER ?? "mock").toLowerCase() as ModelProviderName;

  if (name === "anthropic") {
    const key = env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("ANTHROPIC_API_KEY required when MODEL_PROVIDER=anthropic");
    }
    return {
      name,
      model: env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
      client: new OpenAI({
        apiKey: key,
        baseURL: "https://api.anthropic.com/v1",
      }),
    };
  }

  if (name === "nrp") {
    const key = env.NRP_API_KEY;
    const baseURL = env.NRP_BASE_URL;
    if (!key || !baseURL) {
      throw new Error(
        "NRP_API_KEY and NRP_BASE_URL required when MODEL_PROVIDER=nrp"
      );
    }
    return {
      name,
      model: env.NRP_MODEL ?? "gpt-oss",
      client: new OpenAI({ apiKey: key, baseURL }),
    };
  }

  // mock — offline teammate / CI path; no network
  return { name: "mock", model: "mock-extractor", client: null };
}
