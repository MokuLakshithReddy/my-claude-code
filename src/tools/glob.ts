import fg from "fast-glob";
import path from "path";
import { BaseTool } from "./base.js";

export class GlobTool extends BaseTool {
  name = "Glob";
  description = "Fast file pattern matching across the project directory. Use this to find files by wildcard patterns (e.g., '**/*.ts', 'src/**/*.tsx', 'docs/*.md').";
  parameters = {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: "The glob pattern to match files against"
      },
      path: {
        type: "string",
        description: "Optional subfolder to search in (defaults to project root)"
      }
    },
    required: ["pattern"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { pattern: string; path?: string }): Promise<string> {
    const searchBase = args.path
      ? (path.isAbsolute(args.path) ? args.path : path.resolve(this.workDir, args.path))
      : this.workDir;

    try {
      const entries = await fg(args.pattern, {
        cwd: searchBase,
        dot: false,
        onlyFiles: true,
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/dist/**",
          "**/build/**",
          "**/.next/**",
          "**/coverage/**"
        ]
      });

      if (entries.length === 0) {
        return `No files matched pattern '${args.pattern}' in ${path.relative(this.workDir, searchBase) || "."}`;
      }

      const total = entries.length;
      const MAX_DISPLAY = 150;
      const sliced = entries.slice(0, MAX_DISPLAY);

      let result = `Matched ${total} files for pattern '${args.pattern}':\n`;
      result += sliced.join("\n");
      if (total > MAX_DISPLAY) {
        result += `\n\n[... and ${total - MAX_DISPLAY} more files]`;
      }

      return result;
    } catch (err: any) {
      return `Error executing glob pattern '${args.pattern}': ${err.message}`;
    }
  }
}
