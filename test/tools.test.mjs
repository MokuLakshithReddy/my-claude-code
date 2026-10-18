import assert from "node:assert";
import test from "node:test";
import { ToolRegistry } from "../dist/tools/registry.js";
import { MemoryManager } from "../dist/config/memory.js";

test("ToolRegistry initializes with core tools and aliases", () => {
  const registry = new ToolRegistry(process.cwd());
  assert.ok(registry.getTool("Bash"), "Bash tool must exist");
  assert.ok(registry.getTool("FileRead"), "FileRead tool must exist");
  assert.ok(registry.getTool("View"), "View alias must resolve to FileRead");
  assert.ok(registry.getTool("FileEdit"), "FileEdit tool must exist");
  assert.ok(registry.getTool("Replace"), "Replace alias must resolve to FileEdit");
  assert.ok(registry.getTool("FileWrite"), "FileWrite tool must exist");
  assert.ok(registry.getTool("Glob"), "Glob tool must exist");
  assert.ok(registry.getTool("Grep"), "Grep tool must exist");
  assert.ok(registry.getTool("LS"), "LS tool must exist");
  assert.ok(registry.getTool("TodoWrite"), "TodoWrite tool must exist");
});

test("MemoryManager generates valid CLAUDE.md schema", () => {
  const mem = new MemoryManager(process.cwd());
  const initial = mem.generateInitialMemory();
  assert.ok(initial.includes("Common Commands"), "Initial memory must contain commands");
});

test("Tool execution: Glob and FileRead work as expected", async () => {
  const registry = new ToolRegistry(process.cwd());
  const globTool = registry.getTool("Glob");
  const result = await globTool.execute({ pattern: "package.json" });
  assert.ok(result.includes("package.json"), "Glob should find package.json");

  const readTool = registry.getTool("FileRead");
  const fileContent = await readTool.execute({ file_path: "package.json", limit: 5 });
  assert.ok(fileContent.includes("my-claude-code"), "FileRead should read package.json");
});
