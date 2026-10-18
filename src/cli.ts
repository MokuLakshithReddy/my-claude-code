import path from "path";
import chalk from "chalk";
import { resolveConfig } from "./config/config.js";
import { AgentSession } from "./agent/loop.js";
import { TerminalRepl } from "./ui/repl.js";
import { slashCommands } from "./commands/slash-commands.js";
import { theme } from "./ui/colors.js";

function printBanner(version: string, model: string, workDir: string) {
  console.log("");
  console.log(chalk.hex("#D97706").bold("  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗"));
  console.log(chalk.hex("#F59E0B").bold(" ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝"));
  console.log(chalk.hex("#FBBF24").bold(" ██║     ██║     ███████║██║   ██║██║  ██║█████╗  "));
  console.log(chalk.hex("#F59E0B").bold(" ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  "));
  console.log(chalk.hex("#D97706").bold(" ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗"));
  console.log(chalk.hex("#B45309").bold("  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝") + chalk.dim(`  v${version} [Engineered Edition]`) + "\n");

  console.log(`  ${chalk.dim("Directory:")} ${chalk.hex("#38BDF8")(workDir)}`);
  console.log(`  ${chalk.dim("Model:")}     ${chalk.hex("#A78BFA")(model)}`);
  console.log(`  ${chalk.dim("Commands:")}  ${chalk.hex("#F59E0B")("/help")}, ${chalk.hex("#F59E0B")("/compact")}, ${chalk.hex("#F59E0B")("/cost")}, ${chalk.hex("#F59E0B")("/doctor")}, ${chalk.hex("#F59E0B")("/init")}\n`);
}

function printHelp() {
  console.log(`
Usage: myclaude [options] [prompt]

Options:
  -p, --print <prompt>      Run a one-shot query non-interactively and print output
  -m, --model <model>       Model to use (e.g., claude-3-7-sonnet, gpt-4o, gemini-2.5-flash)
  --provider <provider>     AI provider: anthropic, openai, gemini, deepseek
  --plan                    Start session in architectural plan mode
  --auto-approve            Automatically approve tool actions without prompting
  -h, --help                Show this help message
  -v, --version             Show version number

Examples:
  myclaude
  myclaude "Explain how this project is structured"
  myclaude -p "Find and fix bugs in src/index.ts"
  myclaude --model gpt-4o
`);
}

export async function main() {
  const args = process.argv.slice(2);
  const version = "1.0.0";

  if (args.includes("-h") || args.includes("--help")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("-v") || args.includes("--version")) {
    console.log(`my-claude-code v${version}`);
    process.exit(0);
  }

  // Parse options
  let model: string | undefined;
  let provider: any;
  let planMode = false;
  let autoApprove = false;
  let promptText = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-m" || arg === "--model") {
      model = args[++i];
    } else if (arg === "--provider") {
      provider = args[++i];
    } else if (arg === "--plan") {
      planMode = true;
    } else if (arg === "--auto-approve" || arg === "--dangerously-skip-permissions") {
      autoApprove = true;
    } else if (arg === "-p" || arg === "--print") {
      promptText = args[++i] || "";
    } else if (!arg.startsWith("-")) {
      promptText = args.slice(i).join(" ");
      break;
    }
  }

  const workDir = process.cwd();
  const config = resolveConfig({
    model,
    provider,
    planMode,
    autoApprove,
    workDir
  });

  let session: AgentSession;
  try {
    session = new AgentSession(config);
  } catch (err: any) {
    console.error(chalk.red(`\nInitialization Error: ${err.message}`));
    console.log(chalk.dim("Run /doctor or configure your API key in .env\n"));
    process.exit(1);
  }

  // Non-interactive mode (prompt provided on CLI)
  if (promptText) {
    console.log(chalk.dim(`\nRunning query: "${promptText}"\n`));
    await session.run(promptText);
    process.exit(0);
  }

  // Interactive REPL mode
  printBanner(version, session.config.model, workDir);

  const repl = new TerminalRepl();

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    console.log("\n" + theme.dimText("(Interrupted by user. Type /exit to quit)"));
  });

  while (true) {
    const input = await repl.prompt(workDir, session.config.model);
    if (!input) continue;

    // Handle slash commands
    if (input.startsWith("/")) {
      const parts = input.slice(1).split(" ");
      const cmdName = parts[0].toLowerCase();
      const cmdArgs = parts.slice(1);

      const command = slashCommands[cmdName];
      if (command) {
        await command.execute(session, cmdArgs);
      } else {
        console.log(theme.error(`Unknown command: /${cmdName}. Type /help for available commands.`));
      }
      continue;
    }

    // Run agent turn
    try {
      await session.run(input);
    } catch (err: any) {
      console.error(chalk.red(`\nExecution Error: ${err.message || String(err)}\n`));
    }
  }
}

main().catch(err => {
  console.error(chalk.red(`Fatal Error: ${err.message}`));
  process.exit(1);
});
