import fs from "fs";
import path from "path";
import { BaseTool } from "./base.js";
import { renderDiff } from "../ui/diff.js";

export class FileEditTool extends BaseTool {
  name = "FileEdit";
  description = "Modifies an existing file by replacing old_string with new_string. The old_string must uniquely match within the file unless replace_all is set to true.";
  parameters = {
    type: "object" as const,
    properties: {
      file_path: {
        type: "string",
        description: "The path to the file to modify"
      },
      old_string: {
        type: "string",
        description: "The exact existing text to replace"
      },
      new_string: {
        type: "string",
        description: "The new text to insert in place of old_string"
      },
      replace_all: {
        type: "boolean",
        description: "Replace all occurrences of old_string instead of just one (default false)"
      }
    },
    required: ["file_path", "old_string", "new_string"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { file_path: string; old_string: string; new_string: string; replace_all?: boolean }): Promise<string> {
    const targetPath = path.isAbsolute(args.file_path)
      ? args.file_path
      : path.resolve(this.workDir, args.file_path);

    if (!fs.existsSync(targetPath)) {
      return `Error: File not found: ${args.file_path}`;
    }

    try {
      const content = fs.readFileSync(targetPath, "utf-8");
      const { old_string, new_string, replace_all = false } = args;

      if (!content.includes(old_string)) {
        return `Error: old_string not found in ${args.file_path}. Please check line endings and exact characters.`;
      }

      if (!replace_all) {
        const firstIdx = content.indexOf(old_string);
        const secondIdx = content.indexOf(old_string, firstIdx + old_string.length);
        if (secondIdx !== -1) {
          return `Error: old_string matches multiple locations in ${args.file_path}. Provide more surrounding context lines to make it unique, or set replace_all=true.`;
        }
      }

      const updated = replace_all
        ? content.split(old_string).join(new_string)
        : content.replace(old_string, new_string);

      fs.writeFileSync(targetPath, updated, "utf-8");

      const diff = renderDiff(old_string, new_string, path.relative(this.workDir, targetPath));
      return `Successfully modified ${path.relative(this.workDir, targetPath)}:\n${diff}`;
    } catch (err: any) {
      return `Error editing file ${args.file_path}: ${err.message}`;
    }
  }
}
