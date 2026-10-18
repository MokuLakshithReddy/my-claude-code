import fs from "fs";
import path from "path";
import fg from "fast-glob";
import { BaseTool } from "./base.js";

export class GrepTool extends BaseTool {
  name = "Grep";
  description = "Searches for regex patterns or text across files in the codebase. Returns matching files, line numbers, and matching lines.";
  parameters = {
    type: "object" as const,
    properties: {
      pattern: {
        type: "string",
        description: "The regular expression pattern to search for in file contents"
      },
      path: {
        type: "string",
        description: "File or directory path to search within (defaults to current working directory)"
      },
      glob: {
        type: "string",
        description: "Optional glob pattern to filter files (e.g., '*.ts', '*.{js,jsx}')"
      },
      case_insensitive: {
        type: "boolean",
        description: "Perform case-insensitive search (default: false)"
      }
    },
    required: ["pattern"]
  };

  private workDir: string;

  constructor(workDir: string = process.cwd()) {
    super();
    this.workDir = workDir;
  }

  async execute(args: { pattern: string; path?: string; glob?: string; case_insensitive?: boolean }): Promise<string> {
    const searchTarget = args.path
      ? (path.isAbsolute(args.path) ? args.path : path.resolve(this.workDir, args.path))
      : this.workDir;

    let regex: RegExp;
    try {
      regex = new RegExp(args.pattern, args.case_insensitive ? "i" : "");
    } catch (e: any) {
      return `Invalid regular expression '${args.pattern}': ${e.message}`;
    }

    let filesToSearch: string[] = [];
    if (fs.existsSync(searchTarget)) {
      const stat = fs.statSync(searchTarget);
      if (stat.isFile()) {
        filesToSearch = [searchTarget];
      } else {
        const filePattern = args.glob || "**/*";
        const found = await fg(filePattern, {
          cwd: searchTarget,
          onlyFiles: true,
          absolute: true,
          ignore: [
            "**/node_modules/**",
            "**/.git/**",
            "**/dist/**",
            "**/build/**",
            "**/.next/**"
          ]
        });
        filesToSearch = found;
      }
    } else {
      return `Error: Search path does not exist: ${args.path}`;
    }

    interface Match {
      file: string;
      lineNum: number;
      line: string;
    }

    const matches: Match[] = [];
    let filesWithMatches = 0;

    for (const filePath of filesToSearch) {
      try {
        const buffer = fs.readFileSync(filePath);
        // Skip binary files
        if (buffer.includes(0)) continue;

        const content = buffer.toString("utf-8");
        const lines = content.split("\n");
        let matchedInFile = false;

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matchedInFile = true;
            matches.push({
              file: path.relative(this.workDir, filePath),
              lineNum: i + 1,
              line: lines[i].trimEnd()
            });

            if (matches.length >= 200) break;
          }
        }

        if (matchedInFile) filesWithMatches++;
        if (matches.length >= 200) break;
      } catch {
        // Skip inaccessible files
      }
    }

    if (matches.length === 0) {
      return `No matches found for pattern '${args.pattern}'`;
    }

    let output = `Found ${matches.length} matches across ${filesWithMatches} files:\n\n`;
    let currentFile = "";
    for (const m of matches) {
      if (m.file !== currentFile) {
        currentFile = m.file;
        output += `\n--- ${m.file} ---\n`;
      }
      output += `${String(m.lineNum).padStart(4, " ")}: ${m.line}\n`;
    }

    if (matches.length >= 200) {
      output += `\n[... capped at 200 matches. Narrow your search pattern or path]`;
    }

    return output.trim();
  }
}
