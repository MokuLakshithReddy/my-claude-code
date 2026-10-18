import fs from "fs";
import path from "path";
import { BaseTool } from "./base.js";

export class FileWriteTool extends BaseTool {
  name = "FileWrite";
  description = "Writes full content to a file, creating it if it doesn't exist or overwriting it if it does. Automatically creates any missing parent directories.";
  parameters = {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "The path to the file to create or write"
      },
      content: {
        type: "string",
        description: "The complete content to write into the file"
      }
    },
    required: ["file_path", "content"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { file_path: string; content: string }): Promise<string> {
    const targetPath = path.isAbsolute(args.file_path)
      ? args.file_path
      : path.resolve(this.workDir, args.file_path);

    try {
      const parentDir = path.dirname(targetPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const existed = fs.existsSync(targetPath);
      fs.writeFileSync(targetPath, args.content, "utf-8");

      const lineCount = args.content.split("\n").length;
      const relPath = path.relative(this.workDir, targetPath);
      return `Successfully ${existed ? "overwrote" : "created"} ${relPath} (${lineCount} lines, ${args.content.length} bytes).`;
    } catch (err: any) {
      return `Error writing file ${args.file_path}: ${err.message}`;
    }
  }
}
