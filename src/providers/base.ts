import { ChatMessage } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";

export interface ProviderResponse {
  message: ChatMessage;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ProviderOptions {
  onChunk?: (text: string) => void;
  planMode?: boolean;
}

export abstract class BaseProvider {
  abstract name: string;
  abstract model: string;

  abstract chat(
    messages: ChatMessage[],
    tools: ToolRegistry,
    options?: ProviderOptions
  ): Promise<ProviderResponse>;
}
