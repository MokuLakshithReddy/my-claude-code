import { exec } from "child_process";
import { BaseTool } from "./base.js";
import { theme } from "../ui/colors.js";

export class BashTool extends BaseTool {
  name = "Bash";
  description = "Executes a command in the shell. Use this to run scripts, build projects, execute tests, or check git status. On Windows, runs via PowerShell. Always inspect command output.";
  parameters = {
    type: "object" as const,
    properties: {
      command: {
        type: "string",
        description: "The command line string to execute"
      },
      timeout: {
        type: "number",
        description: "Optional timeout in milliseconds (default: 60000ms, max 300000ms)"
      },
      description: {
        type: "string",
        description: "Clear, concise 5-10 word active description of what the command does"
      }
    },
    required: ["command"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { command: string; timeout?: number; description?: string }): Promise<string> {
    const { command, timeout = 60000 } = args;
    const isWindows = process.platform === "win32";

    const shell = isWindows ? "powershell.exe" : "/bin/bash";
    const shellArgs = isWindows ? ["-NoProfile", "-Command", command] : ["-c", command];

    return new Promise((resolve) => {
      const child = exec(command, {
        cwd: this.workDir,
        timeout: Math.min(timeout, 300000),
        maxBuffer: 10 * 1024 * 1024,
        shell
      }, (error, stdout, stderr) => {
        let output = "";
        if (stdout && stdout.trim()) {
          output += stdout;
        }
        if (stderr && stderr.trim()) {
          output += (output ? "\n[stderr]\n" : "") + stderr;
        }

        if (error) {
          if (error.killed) {
            output += `\nCommand timed out after ${timeout}ms`;
          } else {
            output += `\nCommand exited with code ${error.code ?? 1}`;
          }
        }

        if (!output.trim()) {
          output = "(Command executed with no output)";
        }

        // Truncate excessively large output to prevent context exhaustion
        const MAX_LINES = 500;
        const lines = output.split("\n");
        if (lines.length > MAX_LINES) {
          const truncated = lines.slice(0, MAX_LINES).join("\n");
          output = `${truncated}\n\n[... truncated ${lines.length - MAX_LINES} lines of output]`;
        }

        resolve(output.trim());
      });
    });
  }
}
