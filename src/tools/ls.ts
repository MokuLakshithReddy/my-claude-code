import fs from "fs";
import path from "path";
import { BaseTool } from "./base.js";

export class LsTool extends BaseTool {
  name = "LS";
  description = "Lists files and subdirectories in a directory with file size, type, and count.";
  parameters = {
    type: "object" as const,
    properties: {
      path: {
        type: "string",
        description: "Directory path to list (defaults to current working directory)"
      }
    }
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { path?: string }): Promise<string> {
    const targetDir = args.path
      ? (path.isAbsolute(args.path) ? args.path : path.resolve(this.workDir, args.path))
      : this.workDir;

    if (!fs.existsSync(targetDir)) {
      return `Error: Directory not found: ${args.path || "."}`;
    }

    try {
      const entries = fs.readdirSync(targetDir, { withFileTypes: true });
      const dirs: string[] = [];
      const files: string[] = [];

      for (const entry of entries) {
        if (entry.name === ".git" || entry.name === "node_modules") continue;

        if (entry.isDirectory()) {
          dirs.push(`📁 ${entry.name}/`);
        } else {
          let sizeStr = "";
          try {
            const stat = fs.statSync(path.join(targetDir, entry.name));
            sizeStr = ` (${stat.size} bytes)`;
          } catch {}
          files.push(`📄 ${entry.name}${sizeStr}`);
        }
      }

      dirs.sort();
      files.sort();

      const rel = path.relative(this.workDir, targetDir) || ".";
      let res = `Directory listing for ${rel}:\n`;
      if (dirs.length > 0) {
        res += `Directories (${dirs.length}):\n  ${dirs.join("\n  ")}\n\n`;
      }
      if (files.length > 0) {
        res += `Files (${files.length}):\n  ${files.join("\n  ")}`;
      }
      if (dirs.length === 0 && files.length === 0) {
        res += "(Empty directory)";
      }

      return res;
    } catch (err: any) {
      return `Error listing directory ${args.path || "."}: ${err.message}`;
    }
  }
}
