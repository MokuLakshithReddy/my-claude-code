# My Claude Code (Engineered Edition)

> An autonomous agentic coding assistant CLI engineered directly from Anthropic's Claude Code architecture using evidence-driven reverse engineering methodology.

---

## 🎯 Architecture & Capabilities

Engineered following the inspection methodology of **REA (`morluto/rea`)** and decompiled analysis of **Claude Code (`anthropics/claude-code`)**, this CLI delivers the complete Claude Code experience with enhanced multi-provider flexibility:

### 1. Interactive Terminal REPL & CLI Mode
- **Interactive REPL**: Rich terminal interface with model badges, path tracking, and live streaming tokens.
- **Single-shot Execution**: `myclaude "fix the failing tests"` or `myclaude -p "explain index.ts"`.
- **Architectural Plan Mode**: Run with `--plan` or `/plan` for read-only planning before modifying files.

### 2. Core Agentic Toolset (Faithful to Claude Code Contracts)
- **`Bash`**: Runs commands with real-time feedback, timeouts, and safe error capture.
- **`FileRead` (`View`)**: Read files with line numbers (`1: content`) and section paging (`offset` / `limit`).
- **`FileEdit` (`Replace`)**: Precise search-and-replace edits with unique hunk verification and colorized diff output.
- **`FileWrite` (`Edit`)**: Create new files or overwrite files with automatic directory provisioning.
- **`Glob`**: Ultra-fast file pattern matching across the repository.
- **`Grep`**: Deep regex and string content searching with line numbers and file grouping.
- **`LS`**: Directory listing with file metadata and tree overview.
- **`TodoWrite`**: Dynamic multi-step task list tracking (`pending`, `in_progress`, `completed`).
- **`WebFetch`**: Fetch documentation and web content.

### 3. Multi-Provider LLM Engine
Unlike official Claude Code which is restricted exclusively to Anthropic Claude, this edition supports:
- **Anthropic Claude**: `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku`, `claude-3-opus`
- **OpenAI**: `gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`
- **DeepSeek**: `deepseek-chat`, `deepseek-coder`
- **Google Gemini**: `gemini-2.5-flash`, `gemini-2.5-pro`
- **Local Models**: Ollama, vLLM, and any OpenAI-compatible API endpoint via `OPENAI_BASE_URL`.

### 4. Memory System (`CLAUDE.md`)
- Auto-detects and loads project build commands, testing procedures, style conventions, and architecture notes from `CLAUDE.md`.
- Proactively suggests writing new test/build commands to memory so it remembers them next time.

### 5. Slash Commands
| Command | Action |
|---|---|
| `/help` | Display command menu and keyboard shortcuts |
| `/clear` | Clear conversation history and reset context |
| `/compact` | Compact conversation history to reduce context window usage |
| `/cost` | Display total tokens (input/output), tool counts, and session duration |
| `/doctor` | Run health check on environment, git, and API credentials |
| `/init` | Auto-generate `CLAUDE.md` with project guidelines |
| `/plan` | Toggle architectural plan mode on/off |
| `/exit` | Exit the CLI session |

---

## 🚀 Quick Start

### 1. Installation
```bash
git clone <repo-url>
cd My_Version_of_ClaudeCode
npm install
npm run build
```

### 2. Configure Your API Key
Copy the `.env.example` to `.env` and set at least one model provider key:
```bash
cp .env.example .env
```
For example:
```env
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=AIza...
# or
DEEPSEEK_API_KEY=sk-...
```

### 3. Launch
Run interactively:
```bash
npm start
# or
node bin/myclaude.js
```

Or install globally into your PATH:
```bash
npm link
myclaude
```

---

## 🛠️ Verification & Health Check

Run the built-in diagnostic tool anytime:
```bash
myclaude /doctor
```
Or inside the REPL, type `/doctor`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

