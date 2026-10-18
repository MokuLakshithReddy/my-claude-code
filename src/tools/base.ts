import { ToolDefinition } from "../types.js";

export abstract class BaseTool {
  abstract name: string;
  abstract description: string;
  abstract parameters: ToolDefinition["parameters"];

  abstract execute(args: Record<string, any>): Promise<string>;

  getDefinition(): ToolDefinition {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters
    };
  }
}
