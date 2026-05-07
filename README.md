# Business Event Generator

An installable **AI agent** that, for any company you name, generates a
Dynatrace **Gen 3 KPI dashboard** plus a **30‑minute BizEvents injector**,
deploys both with `dtctl`, and verifies events are flowing.

Works with **Claude Code**, **GitHub Copilot**, **Cursor**, or any agent
runtime that respects `AGENTS.md`.

---

## What you get for each company

```
dashboards/<Company>/
  <company>-dashboard-v1.json     # Gen 3 dashboard (logo, KPIs, charts, map)
  <company>-injector.js           # 30-min BizEvents injector
  README.md                       # IDs + deploy commands
  LEARNINGS.md                    # DQL/layout notes
  SALES-PITCH.md                  # 1-page value pitch
```

A single shared workflow `1.BizEvents Dashboard Generator` runs every 30
minutes in your tenant. Each new company is added as a **task** inside that
one workflow — the agent never creates a second injector workflow.

---

## Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| **`dtctl`** authenticated to a Dynatrace Gen 3 tenant | Deploys dashboards + workflows, runs DQL | `dtctl auth whoami` |
| **`dtctl` agent skill** | Teaches your agent how to operate `dtctl` | folder in `~/.agents/skills/dtctl/` |
| **`dynatrace-for-ai` skills** | DQL, dashboards, notebooks, observability domain knowledge | folders `dt-*` in `~/.agents/skills/` |
| **`jq`** | Manipulates the workflow JSON when adding tasks | `jq --version` |
| **Node.js / `npx`** (for the `npx skills add ...` installer) | Installs the agent skills | `node --version` |
| Network access to fetch logo URLs | Header tile branding | — |

> The agent will **not** install or configure `dtctl` for you. If
> `dtctl auth whoami` fails, install/login to `dtctl` first.

---

## Install

This is a plain Git repository — no package install required. Clone it into
the workspace where you want the company folders to live:

```bash
git clone https://github.com/SudoSmitty/dynatrace-kpi-dashboard-generator.git
cd dynatrace-kpi-dashboard-generator
```

### Make the agent available *anywhere* (recommended)

The repo is packaged three ways. Pick whichever matches your agent and how
you want updates delivered:

#### Option A — Claude Code plugin (skill + slash command, one command)

If you use Claude Code and want **both** the skill **and** the
`/generate-kpi-dashboard` slash command installed globally with a single
command:

```bash
claude plugin marketplace add SudoSmitty/dynatrace-kpi-dashboard-generator
claude plugin install dynatrace-kpi-dashboard-generator@dynatrace-kpi-dashboard-generator
```

Update later with:

```bash
claude plugin marketplace update && \
  claude plugin update dynatrace-kpi-dashboard-generator@dynatrace-kpi-dashboard-generator
```

This is the closest equivalent to `npx skills add` for Claude Code, but it
also ships the slash command — no manual symlinks.

#### Option B — `npx skills add` (skill only, any agent)

Works with Claude Code, GitHub Copilot, Cursor, and every other
[skills.sh](https://agentskills.io)‑compatible agent:

```bash
npx skills add SudoSmitty/dynatrace-kpi-dashboard-generator
```

That copies `skills/dynatrace-kpi-dashboard-generator/` into
`~/.agents/skills/` (and the equivalent paths for each supported agent) so
the skill auto‑loads in any cwd. Updates land via `npx skills update`.

`npx skills add` does not install slash commands. To get
`/generate-kpi-dashboard` globally in Claude Code or Copilot Chat without
the plugin install, use Option C below.

#### Option C — Symlink locally (no publish required)

If you're just running it on your own machines, symlink the bundle and the
slash commands directly:

```bash
# Skill bundle — auto-loaded by Claude Code, Copilot, Cursor, etc.
mkdir -p ~/.agents/skills
ln -sfn "$PWD/skills/dynatrace-kpi-dashboard-generator" \
  ~/.agents/skills/dynatrace-kpi-dashboard-generator

# Claude Code slash command — /generate-kpi-dashboard <company> from anywhere
mkdir -p ~/.claude/commands
ln -sfn "$PWD/.claude/commands/generate-kpi-dashboard.md" \
  ~/.claude/commands/generate-kpi-dashboard.md

# VS Code Copilot prompt — /generate-kpi-dashboard in Copilot Chat from anywhere
mkdir -p "$HOME/Library/Application Support/Code/User/prompts"
ln -sfn "$PWD/.github/prompts/generate-kpi-dashboard.prompt.md" \
  "$HOME/Library/Application Support/Code/User/prompts/generate-kpi-dashboard.prompt.md"
```

Linux Copilot prompt path: `~/.config/Code/User/prompts/`. Windows:
`%APPDATA%\Code\User\prompts\`.

#### Keeping the skill bundle in sync

`AGENTS.md` and `.example/` at the repo root are the canonical sources. The
redistributable bundle under `skills/dynatrace-kpi-dashboard-generator/` is
generated from them. After editing `AGENTS.md` or anything in `.example/`,
rebuild with:

```bash
./scripts/build-skill.sh
```

Generated company folders still go into whatever repo your cwd is in —
the skill only ships the *recipe*, not the outputs.

### macOS / Linux (one command)

```bash
./scripts/install.sh
```

Installs `dtctl`, `jq`, the `dtctl` agent skill, the `dynatrace-for-ai`
skills, **and the `dynatrace-kpi-dashboard-generator` skill**. If Claude
Code (`claude`) is detected on the machine, it also installs the Claude
plugin so `/generate-kpi-dashboard` works globally without any extra step.

Then authenticate and verify:

```bash
dtctl auth login --context my-env --environment "https://<env>.apps.dynatrace.com"
./scripts/check-prereqs.sh
```

### Windows

Follow the upstream install instructions for each tool:

1. **`dtctl`** — https://github.com/dynatrace-oss/dtctl#install
   ```powershell
   irm https://raw.githubusercontent.com/dynatrace-oss/dtctl/main/install.ps1 | iex
   dtctl auth login --context my-env --environment "https://<env>.apps.dynatrace.com"
   ```
2. **`dtctl` agent skill** — https://github.com/dynatrace-oss/dtctl#ai-agent-skills
   ```powershell
   npx skills add dynatrace-oss/dtctl
   ```
3. **`dynatrace-for-ai` skills** — https://github.com/Dynatrace/dynatrace-for-ai#installation
   ```powershell
   npx skills add dynatrace/dynatrace-for-ai
   ```
4. **`dynatrace-kpi-dashboard-generator` skill**
   ```powershell
   npx skills add SudoSmitty/dynatrace-kpi-dashboard-generator
   ```
   And, if you use Claude Code:
   ```powershell
   claude plugin marketplace add SudoSmitty/dynatrace-kpi-dashboard-generator
   claude plugin install dynatrace-kpi-dashboard-generator@dynatrace-kpi-dashboard-generator
   ```
5. **`jq`** — https://jqlang.github.io/jq/download/  (or `winget install jqlang.jq`).

Then verify with `bash scripts/check-prereqs.sh` (Git Bash / WSL).

The agent definitions live in:

| File | Used by |
|------|---------|
| [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) | Claude Code plugin marketplace manifest — enables `claude plugin install` |
| [plugins/dynatrace-kpi-dashboard-generator/](plugins/dynatrace-kpi-dashboard-generator/) | Claude Code plugin (skill + slash command, via symlinks) |
| [skills/dynatrace-kpi-dashboard-generator/SKILL.md](skills/dynatrace-kpi-dashboard-generator/SKILL.md) | Redistributable skill bundle — installable via `npx skills add` or symlink into `~/.agents/skills/` |
| [AGENTS.md](AGENTS.md) | **Canonical spec** — source for the skill bundle; used directly by Claude Code, Cursor, any AGENTS-aware agent in this repo |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | GitHub Copilot (auto‑loaded in this repo) |
| [.github/prompts/generate-kpi-dashboard.prompt.md](.github/prompts/generate-kpi-dashboard.prompt.md) | Copilot Chat reusable prompt |
| [.claude/commands/generate-kpi-dashboard.md](.claude/commands/generate-kpi-dashboard.md) | Claude Code `/generate-kpi-dashboard` slash command |
| [.example/](.example/) | Reference dashboard, injector, and workflow JSON the agent mirrors |
| [scripts/build-skill.sh](scripts/build-skill.sh) | Rebuilds the skill bundle from `AGENTS.md` + `.example/` |

---

## Usage

### Claude Code

```
/generate-kpi-dashboard Acme Corp
```

Or just ask: *"Generate a KPI dashboard for Acme, they're a logistics
company."*

### GitHub Copilot Chat

In agent mode in this workspace:

```
Generate a KPI dashboard for Acme.
```

Copilot auto‑loads `.github/copilot-instructions.md`. You can also pin the
prompt file: pick **`generate-kpi-dashboard`** from the prompt picker.

### Any other agent

Point your agent at `AGENTS.md`. That file is fully self‑contained.

---

## What the agent does, end to end

1. Verifies `dtctl auth whoami`.
2. **Shows the active `dtctl` context (tenant URL + identity) and asks you to
   confirm before touching the tenant.**
3. Asks for company name, industry (optional), logo URL (optional — searches
   if not provided).
4. Researches 15–20 industry KPIs and matching event types.
5. Writes the dashboard JSON and injector JS into
   `dashboards/<Company>/`, mirroring the example folder.
6. `dtctl apply -f <company>-dashboard-v1.json` and captures the dashboard
   ID.
7. Looks up the existing injector workflow:
   ```bash
   dtctl get workflows -o json --plain | \
     jq '.[] | select(.title | test("BizEvents Dashboard Generator|injector"; "i"))'
   ```
   - If found, appends a new task `<company>_v1` and re‑applies it.
   - If not found (first ever run on this tenant), creates the workflow
     from the example template.
8. `dtctl exec workflow <id>` and waits for `SUCCESS`.
9. Verifies ingestion:
   ```dql
   fetch bizevents
   | filter event.provider == "<company>.event.provider"
   | summarize total = count()
   ```
10. Writes `README.md`, `LEARNINGS.md`, `SALES-PITCH.md` and tells you the
    dashboard URL, workflow ID, and task name.

---

## Hard rules the agent follows

- **Gen 3 dashboard JSON only** (matches `example/example_dashboard.json`).
- **Map tile is required** — `bubbleMap` driven by geo coordinates emitted
  by the injector.
- **Header is two markdown tiles** — logo (`w:6, h:2`) + title (`w:18, h:2`).
- **Charts ≥ `h:4`, KPIs `h:2`.**
- **`makeTimeseries` for time charts**, `summarize` for KPIs — never feed
  `summarize` into a chart.
- **One injector workflow per tenant.** New companies = new tasks.
- 3,000–5,000 events per 30‑minute run, batched in 500‑event POSTs.

Full spec: [AGENTS.md](AGENTS.md).

---

## Repository layout

```
.
├── AGENTS.md                              # canonical agent instructions
├── README.md                              # this file
├── .claude-plugin/
│   └── marketplace.json                   # Claude Code plugin marketplace manifest
├── plugins/
│   └── dynatrace-kpi-dashboard-generator/ # Claude Code plugin (skill + command via symlinks)
│       ├── .claude-plugin/plugin.json
│       ├── skills/                         # → ../../skills/dynatrace-kpi-dashboard-generator
│       └── commands/                       # → ../../.claude/commands/generate-kpi-dashboard.md
├── skills/
│   └── dynatrace-kpi-dashboard-generator/  # redistributable skill bundle (generated)
│       ├── SKILL.md
│       └── reference/                      # copy of .example/
├── .github/
│   ├── copilot-instructions.md            # Copilot system prompt
│   └── prompts/
│       └── generate-kpi-dashboard.prompt.md
├── .claude/
│   └── commands/
│       └── generate-kpi-dashboard.md      # Claude Code slash command
├── scripts/
│   ├── install.sh             # macOS/Linux one-shot installer
│   ├── build-skill.sh         # regenerate skills/<name>/ from AGENTS.md + .example/
│   └── check-prereqs.sh
├── .example/                              # template assets the agent copies
│   ├── example_dashboard.json
│   ├── example_data_injector.workflow.json
│   └── example-injector.js
└── dashboards/
    └── <Company>/                         # generated per company
```

---

## Troubleshooting

- **`dtctl auth whoami` fails** → install or `dtctl login` to your tenant before
  invoking the agent.
- **400 when applying the workflow** → two tasks share the same
  `position.{x, y}`; give the new task a unique position.
- **Map tile is empty** → the injector did not populate
  `geo.location.latitude` / `geo.location.longitude` for any event type.
- **Red‑X chart** → query uses `summarize` but the tile is a chart; rewrite
  with `makeTimeseries`.
- **Dashboard shows "Untitled"** → the JSON was applied without the
  `name`/`type` wrapper required by `dtctl apply`.
