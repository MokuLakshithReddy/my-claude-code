import chalk from "chalk";

export const theme = {
  // Brand colors
  brand: chalk.hex("#D97706"), // Terracotta
  brandBright: chalk.hex("#F59E0B"),
  claudePurple: chalk.hex("#A78BFA"),
  
  // Status
  success: chalk.hex("#10B981"),
  error: chalk.hex("#EF4444"),
  warning: chalk.hex("#F59E0B"),
  info: chalk.hex("#3B82F6"),
  dim: chalk.hex("#6B7280"),
  
  // Elements
  tool: chalk.hex("#06B6D4"),
  path: chalk.hex("#38BDF8"),
  code: chalk.hex("#E2E8F0"),
  highlight: chalk.hex("#FDE047"),
  prompt: chalk.hex("#F59E0B").bold,
  
  // Formatting helpers
  banner: (text: string) => chalk.bgHex("#1E1E2E").hex("#F59E0B").bold(` ${text} `),
  badge: (label: string, color = "#8B5CF6") => chalk.bgHex(color).black.bold(` ${label} `),
  dimText: (text: string) => chalk.hex("#6B7280")(text),
  boldText: (text: string) => chalk.bold(text),
  
  // Tool output headers
  toolHeader: (toolName: string, detail?: string) => {
    const icon = "⚙ ";
    const nameStr = chalk.hex("#06B6D4").bold(`${icon}${toolName}`);
    const detailStr = detail ? chalk.hex("#94A3B8")(` (${detail})`) : "";
    return `${nameStr}${detailStr}`;
  },
  
  // Diff formatting
  diffAdd: (line: string) => chalk.hex("#10B981")(`+ ${line}`),
  diffDel: (line: string) => chalk.hex("#EF4444")(`- ${line}`),
  diffContext: (line: string) => chalk.hex("#64748B")(`  ${line}`)
};
