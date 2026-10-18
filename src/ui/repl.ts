import readline from "readline";
import path from "path";
import chalk from "chalk";
import { theme } from "./colors.js";

export class TerminalRepl {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });
  }

  prompt(workDir: string, model: string): Promise<string> {
    const dirName = path.basename(workDir) || workDir;
    const modelBadge = chalk.hex("#A78BFA")(`[${model}]`);
    const promptStr = `${chalk.hex("#F59E0B").bold("claude")} ${chalk.dim(dirName)} ${modelBadge} ❯ `;

    return new Promise((resolve) => {
      this.rl.question(promptStr, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  close(): void {
    this.rl.close();
  }
}
