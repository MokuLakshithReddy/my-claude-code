import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import os from "os";
import { AppConfig } from "../types.js";

// Load workspace .env and user home .env
dotenv.config();

const homeConfigDir = path.join(os.homedir(), ".myclaude");
const homeConfigFile = path.join(homeConfigDir, "config.json");

export function loadStoredConfig(): Partial<AppConfig> {
  try {
    if (fs.existsSync(homeConfigFile)) {
      return JSON.parse(fs.readFileSync(homeConfigFile, "utf-8"));
    }
  } catch {
    // Ignored
  }
  return {};
}

export function saveStoredConfig(config: Partial<AppConfig>): void {
  try {
    if (!fs.existsSync(homeConfigDir)) {
      fs.mkdirSync(homeConfigDir, { recursive: true });
    }
    const current = loadStoredConfig();
    const updated = { ...current, ...config };
    fs.writeFileSync(homeConfigFile, JSON.stringify(updated, null, 2), "utf-8");
  } catch {
    // Ignored
  }
}

export function resolveConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const stored = loadStoredConfig();
  const workDir = overrides.workDir || process.cwd();

  // Determine provider and model based on environment or settings
  let provider: AppConfig["provider"] = overrides.provider || stored.provider || "anthropic";
  let model = overrides.model || stored.model || "";
  let apiKey = overrides.apiKey || stored.apiKey;
  let baseUrl = overrides.baseUrl || stored.baseUrl || process.env.OPENAI_BASE_URL;

  // Auto-detection of available provider if not explicitly configured
  if (!apiKey) {
    if (process.env.ANTHROPIC_API_KEY) {
      provider = "anthropic";
      apiKey = process.env.ANTHROPIC_API_KEY;
      if (!model) model = "claude-3-7-sonnet-20250219";
    } else if (process.env.OPENAI_API_KEY) {
      provider = "openai";
      apiKey = process.env.OPENAI_API_KEY;
      if (!model) model = "gpt-4o";
    } else if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      provider = "gemini";
      apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!model) model = "gemini-2.5-flash";
    } else if (process.env.DEEPSEEK_API_KEY) {
      provider = "deepseek";
      apiKey = process.env.DEEPSEEK_API_KEY;
      baseUrl = "https://api.deepseek.com/v1";
      if (!model) model = "deepseek-chat";
    } else {
      // Default to anthropic
      provider = "anthropic";
      model = "claude-3-7-sonnet-20250219";
    }
  }

  if (!model) {
    if (provider === "anthropic") model = "claude-3-7-sonnet-20250219";
    else if (provider === "openai") model = "gpt-4o";
    else if (provider === "gemini") model = "gemini-2.5-flash";
    else if (provider === "deepseek") model = "deepseek-chat";
  }

  return {
    provider,
    model,
    apiKey,
    baseUrl,
    maxTokens: overrides.maxTokens || 4096,
    temperature: overrides.temperature ?? 0,
    autoApprove: overrides.autoApprove ?? stored.autoApprove ?? false,
    planMode: overrides.planMode ?? false,
    workDir
  };
}
