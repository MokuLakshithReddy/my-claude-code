import { theme } from "./colors.js";

export function renderDiff(oldStr: string, newStr: string, filePath: string): string {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");

  const output: string[] = [];
  output.push(theme.dimText(`--- a/${filePath}`));
  output.push(theme.dimText(`+++ b/${filePath}`));

  // Show deleted lines followed by added lines
  for (const line of oldLines) {
    output.push(theme.diffDel(line));
  }
  for (const line of newLines) {
    output.push(theme.diffAdd(line));
  }

  return output.join("\n");
}
