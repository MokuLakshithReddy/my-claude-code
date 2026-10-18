import { BaseProvider } from "./base.js";
import { AnthropicProvider } from "./anthropic.js";
import { OpenAIProvider } from "./openai.js";
import { GeminiProvider } from "./gemini.js";
import { AppConfig } from "../types.js";

export function createProvider(config: AppConfig): BaseProvider {
  const { provider, model, apiKey, baseUrl } = config;

  if (!apiKey) {
    const keyEnvMap: Record<string, string> = {
      anthropic: "ANTHROPIC_API_KEY",
      openai: "OPENAI_API_KEY",
      gemini: "GEMINI_API_KEY or GOOGLE_API_KEY",
      deepseek: "DEEPSEEK_API_KEY"
    };
    throw new Error(
      `No API key found for provider '${provider}'. Please set ${keyEnvMap[provider] || "API_KEY"} in your environment or .env file.`
    );
  }

  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey, model, baseUrl);
    case "openai":
      return new OpenAIProvider(apiKey, model, baseUrl);
    case "deepseek":
      return new OpenAIProvider(apiKey, model, baseUrl || "https://api.deepseek.com/v1");
    case "gemini":
      return new GeminiProvider(apiKey, model);
    default:
      // Default to OpenAI-compatible provider
      return new OpenAIProvider(apiKey, model, baseUrl);
  }
}
