import fs from "fs";
import path from "path";

export class MemoryManager {
  private workDir: string;
  private claudeMdPath: string;

  constructor(workDir: string = process.cwd()) {
    this.workDir = workDir;
    this.claudeMdPath = path.join(workDir, "CLAUDE.md");
  }

  hasMemory(): boolean {
    return fs.existsSync(this.claudeMdPath);
  }

  readMemory(): string | null {
    try {
      if (fs.existsSync(this.claudeMdPath)) {
        return fs.readFileSync(this.claudeMdPath, "utf-8");
      }
    } catch {
      // Ignored
    }
    return null;
  }

  writeMemory(content: string): void {
    fs.writeFileSync(this.claudeMdPath, content, "utf-8");
  }

  appendMemory(section: string, text: string): void {
    let current = this.readMemory() || "# Project Guidelines\n";
    if (!current.includes(`## ${section}`)) {
      current += `\n## ${section}\n${text}\n`;
    } else {
      current = current.replace(`## ${section}`, `## ${section}\n${text}`);
    }
    this.writeMemory(current);
  }

  generateInitialMemory(): string {
    const pkgPath = path.join(this.workDir, "package.json");
    let buildCommands = "- Build: `npm run build`\n- Test: `npm test`\n- Dev: `npm run dev`";
    let projName = path.basename(this.workDir);

    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        projName = pkg.name || projName;
        const scripts = pkg.scripts || {};
        const cmds: string[] = [];
        if (scripts.build) cmds.push(`- Build: \`npm run build\``);
        if (scripts.test) cmds.push(`- Test: \`npm test\``);
        if (scripts.dev) cmds.push(`- Dev: \`npm run dev\``);
        if (scripts.lint) cmds.push(`- Lint: \`npm run lint\``);
        if (cmds.length > 0) buildCommands = cmds.join("\n");
      } catch {
        // fallback
      }
    }

    return `# ${projName} - Project Memory

## Common Commands
${buildCommands}

## Code Style & Conventions
- Maintain consistent typing and clean modular architecture.
- Keep functions focused and well-tested.
- Follow existing directory structure and patterns.

## Architecture Notes
- Working directory: \`${this.workDir}\`
`;
  }
}
