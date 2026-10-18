import { BaseTool } from "./base.js";
import { BashTool } from "./bash.js";
import { FileReadTool } from "./file-read.js";
import { FileEditTool } from "./file-edit.js";
import { FileWriteTool } from "./file-write.js";
import { GlobTool } from "./glob.js";
import { GrepTool } from "./grep.js";
import { LsTool } from "./ls.js";
import { TodoTool } from "./todo.js";
import { WebFetchTool } from "./web-fetch.js";
import { ToolDefinition, ToolCall, ToolResult } from "../types.js";

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();
  private aliases: Map<string, string> = new Map();

  constructor(workDir: string = process.cwd()) {
    // Register standard tools
    this.register(new BashTool(workDir));
    this.register(new FileReadTool(workDir));
    this.register(new FileEditTool(workDir));
    this.register(new FileWriteTool(workDir));
    this.register(new GlobTool(workDir));
    this.register(new GrepTool(workDir));
    this.register(new LsTool(workDir));
    this.register(new TodoTool());
    this.register(new WebFetchTool());

    // Register Claude Code aliases
    this.registerAlias("View", "FileRead");
    this.registerAlias("Replace", "FileEdit");
    this.registerAlias("Edit", "FileWrite");
  }

  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  registerAlias(alias: string, target: string): void {
    this.aliases.set(alias, target);
  }

  getTool(name: string): BaseTool | undefined {
    const resolvedName = this.aliases.get(name) || name;
    return this.tools.get(resolvedName);
  }

  getAllDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => t.getDefinition());
  }

  // Anthropic tool schemas
  toAnthropicTools(): any[] {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
  }

  // OpenAI tool schemas
  toOpenAITools(): any[] {
    return Array.from(this.tools.values()).map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }

  // Gemini tool schemas
  toGeminiTools(): any[] {
    return [
      {
        functionDeclarations: Array.from(this.tools.values()).map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }))
      }
    ];
  }

  async execute(call: ToolCall): Promise<ToolResult> {
    const tool = this.getTool(call.name);
    if (!tool) {
      return {
        toolCallId: call.id,
        toolName: call.name,
        output: `Error: Unknown tool '${call.name}'. Available tools: ${Array.from(this.tools.keys()).join(", ")}`,
        isError: true
      };
    }

    try {
      const output = await tool.execute(call.arguments);
      return {
        toolCallId: call.id,
        toolName: call.name,
        output
      };
    } catch (err: any) {
      return {
        toolCallId: call.id,
        toolName: call.name,
        output: `Tool execution error: ${err.message || String(err)}`,
        isError: true
      };
    }
  }
}
