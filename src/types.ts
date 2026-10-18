export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: any;
      default?: any;
    }>;
    required?: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  toolName: string;
  output: string;
  isError?: boolean;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
}

export interface SessionStats {
  inputTokens: number;
  outputTokens: number;
  cacheTokens?: number;
  toolCallsCount: number;
  startTime: number;
}

export interface AppConfig {
  provider: "anthropic" | "openai" | "gemini" | "deepseek" | "custom";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  autoApprove?: boolean;
  planMode?: boolean;
  workDir: string;
}
