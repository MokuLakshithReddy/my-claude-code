import chalk from "chalk";
import { AgentSession } from "../agent/loop.js";
import { theme } from "../ui/colors.js";
import { MemoryManager } from "../config/memory.js";

export interface SlashCommand {
  name: string;
  description: string;
  execute: (session: AgentSession, args: string[]) => Promise<boolean | void>;
}

export const slashCommands: Record<string, SlashCommand> = {
  help: {
    name: "help",
    description: "Show available slash commands and usage guide",
    execute: async () => {
      console.log(chalk.bold("\nAvailable Commands:"));
      for (const [key, cmd] of Object.entries(slashCommands)) {
        console.log(`  ${chalk.hex("#F59E0B")(`/${key.padEnd(12)}`)} ${chalk.dim(cmd.description)}`);
      }
      console.log(chalk.bold("\nKeyboard Shortcuts:"));
      console.log(`  ${chalk.hex("#06B6D4")("Ctrl+C")}       Cancel current response or exit prompt`);
      console.log(`  ${chalk.hex("#06B6D4")("Up/Down")}      Navigate prompt history\n`);
    }
  },

  clear: {
    name: "clear",
    description: "Clear conversation history to reset context",
    execute: async (session) => {
      session.clearHistory();
      console.log(theme.success("✔ Conversation history cleared."));
    }
  },

  compact: {
    name: "compact",
    description: "Compact conversation history to reduce context window usage",
    execute: async (session) => {
      console.log(theme.dimText("Compacting conversation history..."));
      await session.compactHistory();
      console.log(theme.success("✔ Context compacted successfully."));
    }
  },

  cost: {
    name: "cost",
    description: "Show total token usage and session statistics",
    execute: async (session) => {
      const stats = session.getStats();
      const elapsed = Math.round((Date.now() - stats.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;

      console.log(chalk.bold("\n📊 Session Statistics:"));
      console.log(`  Input tokens:     ${chalk.hex("#38BDF8")(stats.inputTokens.toLocaleString())}`);
      console.log(`  Output tokens:    ${chalk.hex("#A78BFA")(stats.outputTokens.toLocaleString())}`);
      console.log(`  Total tokens:     ${chalk.hex("#F59E0B")((stats.inputTokens + stats.outputTokens).toLocaleString())}`);
      console.log(`  Tool executions:  ${chalk.hex("#10B981")(stats.toolCallsCount)}`);
      console.log(`  Session duration: ${minutes}m ${seconds}s\n`);
    }
  },

  doctor: {
    name: "doctor",
    description: "Check the health and configuration of your installation",
    execute: async (session) => {
      console.log(chalk.bold("\n🏥 Claude Code Health Check:"));
      console.log(`  Node.js:          ${chalk.green(process.version)}`);
      console.log(`  OS Platform:      ${chalk.green(process.platform)} (${process.arch})`);
      console.log(`  Working Directory:${chalk.green(session.config.workDir)}`);
      console.log(`  Provider:         ${chalk.hex("#F59E0B")(session.config.provider)}`);
      console.log(`  Model:            ${chalk.hex("#A78BFA")(session.config.model)}`);
      console.log(`  API Key:          ${session.config.apiKey ? chalk.green("Configured (Valid)") : chalk.red("Missing")}`);
      console.log(`  Memory (CLAUDE.md):${new MemoryManager(session.config.workDir).hasMemory() ? chalk.green("Found") : chalk.dim("Not created yet (run /init)")}\n`);
    }
  },

  init: {
    name: "init",
    description: "Initialize or refresh CLAUDE.md memory file with codebase guidelines",
    execute: async (session) => {
      const memMgr = new MemoryManager(session.config.workDir);
      if (memMgr.hasMemory()) {
        console.log(theme.warning("CLAUDE.md already exists in this directory."));
      } else {
        const initial = memMgr.generateInitialMemory();
        memMgr.writeMemory(initial);
        console.log(theme.success("✔ Created CLAUDE.md with project conventions and commands."));
      }
    }
  },

  plan: {
    name: "plan",
    description: "Toggle architectural plan mode on/off",
    execute: async (session) => {
      session.config.planMode = !session.config.planMode;
      const status = session.config.planMode ? chalk.hex("#F59E0B").bold("ENABLED") : chalk.dim("DISABLED");
      console.log(`Plan mode is now ${status}. ${session.config.planMode ? "(Tool actions will be read-only)" : ""}`);
    }
  },

  exit: {
    name: "exit",
    description: "Exit the session",
    execute: async () => {
      console.log(theme.dimText("Goodbye!"));
      process.exit(0);
    }
  }
};
