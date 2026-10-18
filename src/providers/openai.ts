import OpenAI from "openai";
import { BaseProvider, ProviderResponse, ProviderOptions } from "./base.js";
import { ChatMessage, ToolCall } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";

export class OpenAIProvider extends BaseProvider {
  name = "openai";
  model: string;
  private client: OpenAI;

  constructor(apiKey: string, model: string = "gpt-4o", baseUrl?: string) {
    super();
    this.model = model;
    this.client = new OpenAI({
      apiKey,
      baseURL: baseUrl
    });
  }

  async chat(
    messages: ChatMessage[],
    tools: ToolRegistry,
    options?: ProviderOptions
  ): Promise<ProviderResponse> {
    const openAiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === "system") {
        openAiMessages.push({ role: "system", content: msg.content });
      } else if (msg.role === "user") {
        openAiMessages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        const assistantParam: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
          role: "assistant",
          content: msg.content || null
        };
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          assistantParam.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments)
            }
          }));
        }
        openAiMessages.push(assistantParam);
      } else if (msg.role === "tool") {
        openAiMessages.push({
          role: "tool",
          tool_call_id: msg.toolCallId || "",
          content: msg.content
        });
      }
    }

    const availableTools = options?.planMode ? undefined : tools.toOpenAITools();

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: openAiMessages,
      tools: availableTools && availableTools.length > 0 ? availableTools : undefined,
      stream: true,
      stream_options: { include_usage: true }
    });

    let fullText = "";
    const toolCallsMap: Map<number, { id: string; name: string; args: string }> = new Map();
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens;
        outputTokens = chunk.usage.completion_tokens;
      }

      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        fullText += delta.content;
        if (options?.onChunk) {
          options.onChunk(delta.content);
        }
      }

      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          if (!toolCallsMap.has(idx)) {
            toolCallsMap.set(idx, {
              id: tc.id || `call_${Date.now()}_${idx}`,
              name: tc.function?.name || "",
              args: ""
            });
          }
          const existing = toolCallsMap.get(idx)!;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.args += tc.function.arguments;
        }
      }
    }

    const toolCalls: ToolCall[] = [];
    for (const [_, item] of toolCallsMap.entries()) {
      let parsedArgs = {};
      try {
        parsedArgs = item.args ? JSON.parse(item.args) : {};
      } catch {
        parsedArgs = {};
      }
      toolCalls.push({
        id: item.id,
        name: item.name,
        arguments: parsedArgs
      });
    }

    return {
      message: {
        role: "assistant",
        content: fullText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      },
      usage: {
        inputTokens,
        outputTokens
      }
    };
  }
}
