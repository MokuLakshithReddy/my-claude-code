import chalk from "chalk";
import { ChatMessage, AppConfig, SessionStats, ToolCall } from "../types.js";
import { ToolRegistry } from "../tools/registry.js";
import { BaseProvider } from "../providers/base.js";
import { createProvider } from "../providers/factory.js";
import { buildSystemPrompt } from "./prompts.js";
import { MemoryManager } from "../config/memory.js";
import { theme } from "../ui/colors.js";

export class AgentSession {
  public config: AppConfig;
  private provider: BaseProvider;
  private tools: ToolRegistry;
  private memoryMgr: MemoryManager;
  private messages: ChatMessage[] = [];
  private stats: SessionStats;

  constructor(config: AppConfig) {
    this.config = config;
    this.provider = createProvider(config);
    this.tools = new ToolRegistry(config.workDir);
    this.memoryMgr = new MemoryManager(config.workDir);

    this.stats = {
      inputTokens: 0,
      outputTokens: 0,
      toolCallsCount: 0,
      startTime: Date.now()
    };

    this.initSystemPrompt();
  }

  private initSystemPrompt(): void {
    const systemPromptText = buildSystemPrompt(
      this.config.workDir,
      this.config.model,
      this.memoryMgr,
      this.config.planMode
    );

    this.messages = [
      {
        role: "system",
        content: systemPromptText
      }
    ];
  }

  clearHistory(): void {
    this.initSystemPrompt();
  }

  getStats(): SessionStats {
    return this.stats;
  }

  async compactHistory(): Promise<void> {
    const userAndAssistant = this.messages.filter(m => m.role === "user" || m.role === "assistant");
    if (userAndAssistant.length <= 4) return;

    // Ask model to compact context
    const compactMessages: ChatMessage[] = [
      ...userAndAssistant,
      {
        role: "user",
        content: "Please summarize our conversation so far into concise bullet points capturing key facts, changes made, and current status, so we can continue with a clean context."
      }
    ];

    const response = await this.provider.chat(compactMessages, this.tools, { planMode: true });
    const summary = response.message.content || "Previous conversation context summarized.";

    this.initSystemPrompt();
    this.messages.push({
      role: "assistant",
      content: `[Context Compacted]:\n${summary}`
    });
  }

  async run(userInput: string): Promise<void> {
    this.messages.push({
      role: "user",
      content: userInput
    });

    let keepLooping = true;
    let iteration = 0;
    const MAX_ITERATIONS = 25;

    while (keepLooping && iteration < MAX_ITERATIONS) {
      iteration++;

      // Print thinking / spinner indicator
      process.stdout.write(chalk.dim("● Thinking...\r"));

      let streamedText = false;
      const response = await this.provider.chat(
        this.messages,
        this.tools,
        {
          planMode: this.config.planMode,
          onChunk: (chunk) => {
            if (!streamedText) {
              process.stdout.write("\r\x1b[K"); // Clear the "Thinking..." line
              streamedText = true;
            }
            process.stdout.write(chunk);
          }
        }
      );

      if (!streamedText) {
        process.stdout.write("\r\x1b[K");
      }

      if (response.usage) {
        this.stats.inputTokens += response.usage.inputTokens;
        this.stats.outputTokens += response.usage.outputTokens;
      }

      const assistantMsg = response.message;
      this.messages.push(assistantMsg);

      if (streamedText && assistantMsg.content) {
        console.log(""); // newline after stream
      }

      // Check if model made tool calls
      if (assistantMsg.toolCalls && assistantMsg.toolCalls.length > 0) {
        for (const tc of assistantMsg.toolCalls) {
          this.stats.toolCallsCount++;
          await this.executeToolCall(tc);
        }
      } else {
        // No tool calls, turn complete
        keepLooping = false;
      }
    }
  }

  private async executeToolCall(call: ToolCall): Promise<void> {
    const detail = call.arguments.file_path || call.arguments.command || call.arguments.pattern || call.arguments.url;
    console.log(theme.toolHeader(call.name, detail));

    // Execute the tool
    const result = await this.tools.execute(call);

    // Render preview of tool output
    if (result.isError) {
      console.log(chalk.red(`  ✖ ${result.output}\n`));
    } else {
      const lines = result.output.split("\n");
      if (lines.length <= 8) {
        console.log(chalk.dim(`  ${lines.join("\n  ")}\n`));
      } else {
        console.log(chalk.dim(`  ${lines.slice(0, 5).join("\n  ")}`));
        console.log(chalk.dim(`  [... ${lines.length - 5} more lines]\n`));
      }
    }

    // Add tool response to conversation
    this.messages.push({
      role: "tool",
      name: call.name,
      toolCallId: call.id,
      content: result.output
    });
  }
}
