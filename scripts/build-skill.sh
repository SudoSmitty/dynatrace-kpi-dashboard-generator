#!/usr/bin/env bash
# Build the redistributable skill bundle at skills/dynatrace-kpi-dashboard-generator/
# from the canonical sources (AGENTS.md + .example/). Run this whenever you
# update AGENTS.md or the example files so `npx skills add` consumers get the
# latest content.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_NAME="dynatrace-kpi-dashboard-generator"
SKILL_DIR="$ROOT/skills/$SKILL_NAME"
REF_DIR="$SKILL_DIR/reference"

mkdir -p "$REF_DIR"

# --- SKILL.md = frontmatter + AGENTS.md (with .example/ -> reference/ rewrites)
cat > "$SKILL_DIR/SKILL.md" <<'FRONTMATTER'
---
name: dynatrace-kpi-dashboard-generator
description: Generate a Dynatrace Gen 3 **KPI dashboard** (15–20 business KPIs, required map tile, branded section dividers) and a matching 30‑minute BizEvents injector for a named company, then deploy both via `dtctl`. Use this skill ONLY when the user explicitly asks for a Dynatrace KPI dashboard, business-event KPI demo, BizEvents injector, or a "KPI dashboard for <company>" — do NOT use for generic Dynatrace dashboards (SRE, infra, k8s, services, RUM) or for editing existing non-KPI dashboards. Triggers include phrases like "generate a KPI dashboard", "build a BizEvents demo for <company>", "spin up a KPI dashboard + injector", "/generate-kpi-dashboard". Requires `dtctl` authenticated to a Dynatrace Gen 3 tenant.
---

FRONTMATTER

# Append AGENTS.md, rewriting `.example/` references to the bundled `reference/` path
sed 's|\.example/|reference/|g' "$ROOT/AGENTS.md" >> "$SKILL_DIR/SKILL.md"

# --- reference/ = copy of .example/
rm -f "$REF_DIR"/*
cp "$ROOT/.example/"* "$REF_DIR/"

echo "Built skill bundle at: $SKILL_DIR"
ls -la "$SKILL_DIR"
echo "---"
ls -la "$REF_DIR"
