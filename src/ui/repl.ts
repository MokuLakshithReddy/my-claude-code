import readline from "readline/promises";
import path from "path";
import chalk from "chalk";

export class TerminalRepl {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async prompt(workDir: string, model: string): Promise<string> {
    const dirName = path.basename(workDir) || workDir;
    const modelBadge = chalk.hex("#A78BFA")(`[${model}]`);
    const promptStr = `${chalk.hex("#F59E0B").bold("claude")} ${chalk.dim(dirName)} ${modelBadge} ❯ `;

    const answer = await this.rl.question(promptStr);
    return answer.trim();
  }

  close(): void {
    this.rl.close();
  }
}
