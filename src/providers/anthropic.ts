import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider, ProviderResponse, ProviderOptions } from "./base.js";
import { ChatMessage, ToolCall } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";

export class AnthropicProvider extends BaseProvider {
  name = "anthropic";
  model: string;
  private client: Anthropic;

  constructor(apiKey: string, model: string = "claude-3-7-sonnet-20250219", baseUrl?: string) {
    super();
    this.model = model;
    this.client = new Anthropic({
      apiKey,
      baseURL: baseUrl
    });
  }

  async chat(
    messages: ChatMessage[],
    tools: ToolRegistry,
    options?: ProviderOptions
  ): Promise<ProviderResponse> {
    const systemMessages = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
    const conversationMessages = messages.filter(m => m.role !== "system");

    // Format messages for Anthropic API
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const msg of conversationMessages) {
      if (msg.role === "user") {
        anthropicMessages.push({
          role: "user",
          content: msg.content
        });
      } else if (msg.role === "assistant") {
        const contentBlocks: Anthropic.ContentBlockParam[] = [];
        if (msg.content) {
          contentBlocks.push({ type: "text", text: msg.content });
        }
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          for (const tc of msg.toolCalls) {
            contentBlocks.push({
              type: "tool_use",
              id: tc.id,
              name: tc.name,
              input: tc.arguments
            });
          }
        }
        anthropicMessages.push({
          role: "assistant",
          content: contentBlocks.length > 0 ? contentBlocks : msg.content || ""
        });
      } else if (msg.role === "tool") {
        // Find previous tool message or create new user message containing tool_result
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId || "",
              content: msg.content
            }
          ]
        });
      }
    }

    const availableTools = options?.planMode ? [] : tools.toAnthropicTools();

    // Streaming call
    const stream = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system: systemMessages,
      messages: anthropicMessages,
      tools: availableTools.length > 0 ? availableTools : undefined,
      stream: true
    });

    let fullText = "";
    const toolCalls: ToolCall[] = [];
    let currentToolCall: Partial<ToolCall> | null = null;
    let toolJsonAccumulator = "";
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const chunk of stream) {
      if (chunk.type === "message_start") {
        inputTokens = chunk.message.usage.input_tokens;
      } else if (chunk.type === "message_delta") {
        outputTokens = chunk.usage.output_tokens;
      } else if (chunk.type === "content_block_start") {
        if (chunk.content_block.type === "tool_use") {
          currentToolCall = {
            id: chunk.content_block.id,
            name: chunk.content_block.name,
            arguments: {}
          };
          toolJsonAccumulator = "";
        }
      } else if (chunk.type === "content_block_delta") {
        if (chunk.delta.type === "text_delta") {
          fullText += chunk.delta.text;
          if (options?.onChunk) {
            options.onChunk(chunk.delta.text);
          }
        } else if (chunk.delta.type === "input_json_delta") {
          toolJsonAccumulator += chunk.delta.partial_json;
        }
      } else if (chunk.type === "content_block_stop") {
        if (currentToolCall) {
          try {
            currentToolCall.arguments = toolJsonAccumulator ? JSON.parse(toolJsonAccumulator) : {};
          } catch {
            currentToolCall.arguments = {};
          }
          toolCalls.push(currentToolCall as ToolCall);
          currentToolCall = null;
          toolJsonAccumulator = "";
        }
      }
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
