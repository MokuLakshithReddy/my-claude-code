import { GoogleGenAI } from "@google/genai";
import { BaseProvider, ProviderResponse, ProviderOptions } from "./base.js";
import { ChatMessage, ToolCall } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";

export class GeminiProvider extends BaseProvider {
  name = "gemini";
  model: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    super();
    this.model = model;
    this.client = new GoogleGenAI({ apiKey });
  }

  async chat(
    messages: ChatMessage[],
    tools: ToolRegistry,
    options?: ProviderOptions
  ): Promise<ProviderResponse> {
    const systemPrompt = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
    const contents: any[] = [];

    for (const msg of messages) {
      if (msg.role === "system") continue;

      if (msg.role === "user") {
        contents.push({
          role: "user",
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === "assistant") {
        const parts: any[] = [];
        if (msg.content) parts.push({ text: msg.content });
        if (msg.toolCalls) {
          for (const tc of msg.toolCalls) {
            parts.push({
              functionCall: {
                name: tc.name,
                args: tc.arguments
              }
            });
          }
        }
        contents.push({
          role: "model",
          parts: parts.length > 0 ? parts : [{ text: "" }]
        });
      } else if (msg.role === "tool") {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: msg.name || "tool",
                response: { output: msg.content }
              }
            }
          ]
        });
      }
    }

    const geminiTools = options?.planMode ? undefined : tools.toGeminiTools();

    const response = await this.client.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
        tools: geminiTools
      }
    });

    let fullText = "";
    const toolCalls: ToolCall[] = [];

    const candidates = response.candidates || [];
    if (candidates.length > 0) {
      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.text) {
          fullText += part.text;
          if (options?.onChunk) {
            options.onChunk(part.text);
          }
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: part.functionCall.name || "",
            arguments: (part.functionCall.args as Record<string, any>) || {}
          });
        }
      }
    }

    const usage = response.usageMetadata;
    return {
      message: {
        role: "assistant",
        content: fullText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      },
      usage: {
        inputTokens: usage?.promptTokenCount || 0,
        outputTokens: usage?.candidatesTokenCount || 0
      }
    };
  }
}
