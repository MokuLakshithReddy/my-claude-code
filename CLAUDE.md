# My Claude Code - Project Guidelines

## Common Commands
- Build: `npm run build`
- Dev mode: `npm run dev`
- Run CLI: `npm start` or `node bin/myclaude.js`

## Architecture
- `src/cli.ts`: Main entry point and interactive REPL
- `src/agent/`: Autonomous multi-turn agent loop and system prompt builder
- `src/tools/`: Suite of agent tools (Bash, FileRead, FileEdit, FileWrite, Glob, Grep, LS, TodoWrite, WebFetch)
- `src/providers/`: Multi-model adapters (Anthropic Claude, OpenAI, DeepSeek, Google Gemini)
- `src/config/`: Configuration loader and CLAUDE.md memory manager
- `src/ui/`: Terminal styling, colors, and diff viewer
