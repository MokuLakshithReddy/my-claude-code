import fs from "fs";
import path from "path";
import { BaseTool } from "./base.js";

export class FileReadTool extends BaseTool {
  name = "FileRead";
  description = "Reads the content of a file from the filesystem. Returns line-numbered contents. Supports offset and limit for inspecting specific sections of large files.";
  parameters = {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "The path to the file to read (relative or absolute)"
      },
      offset: {
        type: "number",
        description: "The line number to start reading from (1-indexed)"
      },
      limit: {
        type: "number",
        description: "The number of lines to read. Default is 500 lines."
      }
    },
    required: ["file_path"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { file_path: string; offset?: number; limit?: number }): Promise<string> {
    const targetPath = path.isAbsolute(args.file_path)
      ? args.file_path
      : path.resolve(this.workDir, args.file_path);

    if (!fs.existsSync(targetPath)) {
      return `Error: File not found: ${args.file_path}`;
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return `Error: ${args.file_path} is a directory, not a file. Use LS or Glob instead.`;
    }

    try {
      const content = fs.readFileSync(targetPath, "utf-8");
      const lines = content.split("\n");
      const totalLines = lines.length;

      const start = Math.max(1, args.offset || 1);
      const lineLimit = Math.min(args.limit || 500, 2000);
      const end = Math.min(totalLines, start + lineLimit - 1);

      const slice = lines.slice(start - 1, end);
      const numbered = slice.map((line, idx) => {
        const lineNum = start + idx;
        return `${String(lineNum).padStart(5, " ")}: ${line}`;
      });

      let header = `File: ${path.relative(this.workDir, targetPath)} (Total lines: ${totalLines})`;
      if (start > 1 || end < totalLines) {
        header += ` [Viewing lines ${start}-${end}]`;
      }

      return `${header}\n${numbered.join("\n")}`;
    } catch (err: any) {
      return `Error reading file ${args.file_path}: ${err.message}`;
    }
  }
}
