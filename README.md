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

## Quick start (macOS / Linux)

Three commands and you're done:

```bash
git clone https://github.com/SudoSmitty/dynatrace-kpi-dashboard-generator.git
cd dynatrace-kpi-dashboard-generator
./scripts/install.sh
```

The installer takes care of everything:

- Installs `jq` (if missing).
- Installs / updates `dtctl`.
- Installs the `dtctl`, `dynatrace-for-ai`, **and
  `dynatrace-kpi-dashboard-generator`** agent skills via `npx skills add`.
- If Claude Code (`claude`) is installed, it also installs the Claude
  plugin so `/generate-kpi-dashboard` works **globally** (any cwd) without
  any extra step.

Then authenticate `dtctl` to your tenant and verify:

```bash
dtctl auth login --context my-env --environment "https://<env>.apps.dynatrace.com"
./scripts/check-prereqs.sh
```

You're ready. Skip ahead to [Use it](#use-it).

> **Windows users:** see [Windows install](#windows-install) below.

---

## Use it

Once installed, you can invoke the agent from **any directory** — the
skill is loaded globally.

### Claude Code

```
/generate-kpi-dashboard Acme Corp
```

…or just ask in plain English: *"Generate a KPI dashboard for Acme,
they're a logistics company."*

### GitHub Copilot Chat (VS Code)

In agent mode:

```
Generate a KPI dashboard for Acme.
```

If you want a slash command in Copilot too, link the prompt file:

```bash
mkdir -p "$HOME/Library/Application Support/Code/User/prompts"   # macOS
ln -sfn "$PWD/.github/prompts/generate-kpi-dashboard.prompt.md" \
  "$HOME/Library/Application Support/Code/User/prompts/generate-kpi-dashboard.prompt.md"
```

Linux: `~/.config/Code/User/prompts/`. Windows:
`%APPDATA%\Code\User\prompts\`.

### Any other agent

Point your agent at `AGENTS.md`. It is fully self‑contained.

---

## What the agent does

1. Runs `dtctl auth whoami` and `dtctl ctx current`, **shows you the
   tenant**, and waits for confirmation before touching anything.
2. Asks for company name, industry (optional), logo URL (optional — it'll
   search if you don't provide one).
3. Researches 15–20 industry KPIs and matching event types.
4. Writes the dashboard JSON, injector JS, README, LEARNINGS, and
   SALES‑PITCH into `dashboards/<Company>/`.
5. `dtctl apply` the dashboard, captures the ID.
6. Adds a `<company>_v1` task to the **single** shared injector
   workflow (`1.BizEvents Dashboard Generator`). Never creates a duplicate.
7. `dtctl exec workflow <id>` and waits for `SUCCESS`.
8. Verifies events landed:
   ```dql
   fetch bizevents
   | filter event.provider == "<company>.event.provider"
   | summarize total = count()
   ```
9. Tells you the dashboard URL, workflow ID, and task name.

Full spec: [AGENTS.md](AGENTS.md).

---

## Other install paths

The Quick Start covers 95% of cases. Use these if you need something
different.

### Already have `dtctl` + Dynatrace skills installed?

Just install this one skill (and, optionally, the Claude plugin):

```bash
npx skills add SudoSmitty/dynatrace-kpi-dashboard-generator
```

```bash
# Optional: also install the /generate-kpi-dashboard slash command in Claude Code
claude plugin marketplace add SudoSmitty/dynatrace-kpi-dashboard-generator
claude plugin install dynatrace-kpi-dashboard-generator@dynatrace-kpi-dashboard-generator
```

Updates: `npx skills update` and `claude plugin update …`.

### Local‑only (developing the skill itself)

If you're editing this repo and want changes to show up immediately
without re‑publishing, symlink the bundle into your global agent dirs:

```bash
mkdir -p ~/.agents/skills ~/.claude/commands
ln -sfn "$PWD/skills/dynatrace-kpi-dashboard-generator" \
  ~/.agents/skills/dynatrace-kpi-dashboard-generator
ln -sfn "$PWD/.claude/commands/generate-kpi-dashboard.md" \
  ~/.claude/commands/generate-kpi-dashboard.md
```

After editing `AGENTS.md` or `.example/`, regenerate the skill bundle:

```bash
./scripts/build-skill.sh
```

### Windows install

The installer script doesn't run on Windows. Do it manually in PowerShell:

```powershell
# 1. dtctl + login
irm https://raw.githubusercontent.com/dynatrace-oss/dtctl/main/install.ps1 | iex
dtctl auth login --context my-env --environment "https://<env>.apps.dynatrace.com"

# 2. jq
winget install jqlang.jq

# 3. Skills
npx skills add dynatrace-oss/dtctl
npx skills add dynatrace/dynatrace-for-ai
npx skills add SudoSmitty/dynatrace-kpi-dashboard-generator

# 4. (Optional) Claude Code plugin for /generate-kpi-dashboard slash command
claude plugin marketplace add SudoSmitty/dynatrace-kpi-dashboard-generator
claude plugin install dynatrace-kpi-dashboard-generator@dynatrace-kpi-dashboard-generator
```

Verify with `bash scripts/check-prereqs.sh` from Git Bash or WSL.

---

## Prerequisites

The Quick Start installer handles all of these. They're listed here for
reference / Windows users / debugging.

| Tool | Why | Check |
|------|-----|-------|
| **`dtctl`** authenticated to a Dynatrace Gen 3 tenant | Deploys dashboards + workflows, runs DQL | `dtctl auth whoami` |
| **`dtctl` agent skill** | Teaches your agent how to operate `dtctl` | folder in `~/.agents/skills/dtctl/` |
| **`dynatrace-for-ai` skills** | DQL, dashboards, notebooks domain knowledge | folders `dt-*` in `~/.agents/skills/` |
| **`dynatrace-kpi-dashboard-generator` skill** | This agent | folder `~/.agents/skills/dynatrace-kpi-dashboard-generator/` |
| **`jq`** | Manipulates the workflow JSON when adding tasks | `jq --version` |
| **Node.js / `npx`** | Required by `npx skills add` | `node --version` |
| Network access to fetch logo URLs | Header tile branding | — |

> The agent will **not** install or configure `dtctl` for you. If
> `dtctl auth whoami` fails, log in to `dtctl` first.

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
minutes in your tenant. Each new company is added as a **task** inside
that one workflow — the agent never creates a second injector workflow.

---

## Hard rules the agent follows

- **Gen 3 dashboard JSON only** (matches `.example/example_dashboard.json`).
- **Map tile is required** — `bubbleMap` driven by geo coordinates from
  the injector.
- **Header is two markdown tiles** — logo (`w:6, h:2`) + title
  (`w:18, h:2`).
- **Charts ≥ `h:4`, KPIs `h:2`.**
- **`makeTimeseries` for time charts**, `summarize` for KPIs — never feed
  `summarize` into a chart.
- **One injector workflow per tenant.** New companies = new tasks.
- 3,000–5,000 events per 30‑minute run, batched in 500‑event POSTs.

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
├── skills/
│   └── dynatrace-kpi-dashboard-generator/ # redistributable skill bundle (generated)
│       ├── SKILL.md
│       └── reference/                     # copy of .example/
├── .github/
│   ├── copilot-instructions.md            # Copilot system prompt
│   └── prompts/generate-kpi-dashboard.prompt.md
├── .claude/
│   └── commands/generate-kpi-dashboard.md # Claude Code slash command
├── scripts/
│   ├── install.sh                         # macOS/Linux one-shot installer
│   ├── build-skill.sh                     # regenerate skills/<name>/
│   └── check-prereqs.sh
├── .example/                              # template assets the agent mirrors
└── dashboards/<Company>/                  # generated per company
```

Where each piece is used:

| File | Used by |
|------|---------|
| [.claude-plugin/marketplace.json](.claude-plugin/marketplace.json) | `claude plugin install` |
| [skills/dynatrace-kpi-dashboard-generator/SKILL.md](skills/dynatrace-kpi-dashboard-generator/SKILL.md) | `npx skills add` redistributable bundle |
| [AGENTS.md](AGENTS.md) | **Canonical spec** — source for the skill bundle |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | GitHub Copilot (auto‑loaded in this repo) |
| [.github/prompts/generate-kpi-dashboard.prompt.md](.github/prompts/generate-kpi-dashboard.prompt.md) | Copilot Chat reusable prompt |
| [.claude/commands/generate-kpi-dashboard.md](.claude/commands/generate-kpi-dashboard.md) | Claude Code slash command source |
| [scripts/build-skill.sh](scripts/build-skill.sh) | Regenerates the skill bundle from `AGENTS.md` + `.example/` |

---

## Troubleshooting

- **`dtctl auth whoami` fails** → install or `dtctl auth login` to your
  tenant before invoking the agent.
- **400 when applying the workflow** → two tasks share the same
  `position.{x, y}`; give the new task a unique position.
- **Map tile is empty** → the injector did not populate
  `geo.location.latitude` / `geo.location.longitude` for any event type.
- **Red‑X chart** → query uses `summarize` but the tile is a chart;
  rewrite with `makeTimeseries`.
- **Dashboard shows "Untitled"** → the JSON was applied without the
  `name` / `type` wrapper required by `dtctl apply`.

