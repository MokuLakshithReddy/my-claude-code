import { BaseTool } from "./base.js";
import { TodoItem } from "../types.js";
import chalk from "chalk";

export class TodoTool extends BaseTool {
  name = "TodoWrite";
  description = "Manages the multi-step task list for tracking progress on complex requests. Updates task statuses (pending, in_progress, completed) so the user can follow along.";
  parameters = {
    type: "object" as const,
    properties: {
      todos: {
        type: "array",
        description: "The complete list of todo items with their updated statuses",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            content: { type: "string" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "completed"]
            }
          },
          required: ["id", "content", "status"]
        }
      }
    },
    required: ["todos"]
  };

  private currentTodos: TodoItem[] = [];

  getTodos(): TodoItem[] {
    return this.currentTodos;
  }

  async execute(args: { todos: TodoItem[] }): Promise<string> {
    this.currentTodos = args.todos || [];

    const lines = this.currentTodos.map(todo => {
      if (todo.status === "completed") {
        return chalk.green(`  ✔ ${todo.content}`);
      } else if (todo.status === "in_progress") {
        return chalk.hex("#F59E0B")(`  ⏳ ${todo.content} (in progress)`);
      } else {
        return chalk.dim(`  ◻ ${todo.content}`);
      }
    });

    console.log(chalk.bold("\n📋 Updated Task Checklist:"));
    console.log(lines.join("\n") + "\n");

    return `Tasks successfully updated (${this.currentTodos.filter(t => t.status === "completed").length}/${this.currentTodos.length} completed).`;
  }
}
