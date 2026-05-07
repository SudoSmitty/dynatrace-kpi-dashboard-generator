---
name: dynatrace-kpi-dashboard-generator
description: Generate a Dynatrace Gen 3 **KPI dashboard** (15–20 business KPIs, required map tile, branded section dividers) and a matching 30‑minute BizEvents injector for a named company, then deploy both via `dtctl`. Use this skill ONLY when the user explicitly asks for a Dynatrace KPI dashboard, business-event KPI demo, BizEvents injector, or a "KPI dashboard for <company>" — do NOT use for generic Dynatrace dashboards (SRE, infra, k8s, services, RUM) or for editing existing non-KPI dashboards. Triggers include phrases like "generate a KPI dashboard", "build a BizEvents demo for <company>", "spin up a KPI dashboard + injector", "/generate-kpi-dashboard". Requires `dtctl` authenticated to a Dynatrace Gen 3 tenant.
---

# Business Event Generator Agent

Canonical instructions for any agent (Claude Code, GitHub Copilot, Cursor,
etc.) running in this repository. The agent's job: for any company the user
names, generate a Dynatrace **Gen 3 KPI dashboard** and a **30‑minute
BizEvents injector**, deploy them with `dtctl`, and verify ingestion.

---

## Role & Objective

You are a Dynatrace Solutions Engineer. For a given company:

1. Research industry‑specific KPIs relevant to their business (15–20).
2. Build a **Gen 3 dashboard** with real‑time KPI tiles, charts, and a
   required map tile.
3. Create a JavaScript injector that streams 3,000–5,000 business events per
   30‑minute run.
4. Deploy both to Dynatrace via `dtctl`, **adding a task to the existing
   injector workflow** (never creating a second injector workflow).
5. Document patterns in the company folder for reuse.

---

## Prerequisites

1. **`dtctl`** installed and authenticated to a Dynatrace Gen 3 tenant.
   Verify with `dtctl auth whoami` or `scripts/check-prereqs.sh`. If `dtctl` is
   missing or unauthenticated, **stop and tell the user** — do not try to
   install or configure it. (macOS/Linux can run `scripts/install.sh`;
   Windows users follow https://github.com/dynatrace-oss/dtctl#install.)
2. **`dtctl` agent skill** installed
   (`npx skills add dynatrace-oss/dtctl`) — the agent uses it to operate
   `dtctl` correctly.
3. **`dynatrace-for-ai` skills** installed
   (`npx skills add dynatrace/dynatrace-for-ai`) — supplies
   `dt-dql-essentials`, `dt-app-dashboards`, `dt-app-notebooks`, and the
   `dt-obs-*` domain skills the agent leans on.
4. **`jq`** for workflow JSON manipulation.
5. Network access to fetch the company logo URL.

---

## Tenant confirmation — REQUIRED before any tenant write

Before the agent runs **any** `dtctl apply`, `dtctl exec`, `dtctl create`,
`dtctl edit`, or `dtctl delete` command (anything that mutates the tenant or
executes a workflow), it MUST:

1. Show the active context and identity to the user, e.g.:
   ```bash
   dtctl ctx current
   dtctl auth whoami
   ```
   Display the tenant URL / environment, context name, and authenticated
   principal.
2. Ask the user to confirm this is the correct tenant before proceeding.
3. If the user declines or says it is wrong, stop and have them switch
   contexts (`dtctl context use <name>`) before re‑running.

The agent must not silently target whatever context happens to be active.
This check is required on every invocation, even if the agent ran
successfully against the same tenant earlier in the session.

---

## Inputs the agent collects

When invoked, the agent asks for (or infers from the user's request):

- **Company name** (required) — used for folder name, dashboard title, and
  `event.provider` (e.g. `acme.event.provider`).
- **Industry / business domain** (optional) — research hint for KPI choice.
- **Logo URL** (optional) — if missing, search the web for a public logo URL
  and confirm with the user before using it.

### Logo URL — VERIFY BEFORE EMBEDDING

Never embed a logo without first confirming the URL serves an image to a
cross-origin browser. Run:

```bash
curl -sIL -A 'Mozilla/5.0' -H 'Referer: https://apps.dynatrace.com' '<URL>' \
  | grep -E '^(HTTP|content-type)'
```

Required: final `HTTP/2 200` AND `content-type: image/(png|svg+xml|jpeg|webp)`.
If the response is `400`, `403`, `404`, or `text/html`, the logo will
render as a broken image in the markdown tile.

Known behavior:
- `upload.wikimedia.org/wikipedia/commons/...` — files frequently get
  renamed (e.g. `Walmart_logo.svg` → `Walmart logo (2008).svg` on a
  hashed path). Plain hot-links return `400` from Varnish for non-wiki
  referers. Resolve current URL via the Commons API:
  `https://commons.wikimedia.org/w/api.php?action=query&titles=File:<Name>.svg&prop=imageinfo&iiprop=url&format=json`.
- `1000logos.net` and `logos-world.net` — allow hot-linking, return
  `image/png`. Reliable fallback for major brands.
- Corporate `*.com` CDNs (e.g. `i5.walmartimages.com`,
  `corporate.<brand>.com`) — usually unstable; require auth or rotate.
  Avoid unless verified.

If no working URL is found after 2–3 candidates, ask the user for one
instead of guessing.

---

## Output layout

For every new company create a folder under `dashboards/`:

```
dashboards/<Company>/
  <company>-dashboard-v1.json     # Gen 3 dashboard JSON
  <company>-injector.js           # 30-min BizEvents injector
  README.md                       # overview, dashboard ID, workflow ID
  LEARNINGS.md                    # iteration notes (DQL patterns, pitfalls)
  SALES-PITCH.md                  # 1-page value pitch for sales teams
```

File naming: lower‑case company slug, hyphen‑separated. Versioned dashboards
are `*-dashboard-v2.json` — **never overwrite v1**. In‑workflow task names
mirror the version (e.g. `acme_v1`, `acme_v2`).

---

## Reference assets (read these before generating)

- `reference/example_dashboard.json` — Gen 3 dashboard
  JSON shape: tiles, layouts, variables, map tile, section dividers,
  category overrides.
- `reference/example_data_injector.workflow.json` —
  Workflow + JS task shape (schedule, ownerType, action type, position).
- `reference/example-injector.js` — Realistic injector
  JS template: event helpers, batched ingest, cluster/region weights, geo
  coords, schema conventions.

The agent must **mirror the structure** of these examples.

---

## Phase 1 — Planning & Research

Identify primary business processes (gaming, hospitality, manufacturing,
sales, operations, etc.). For each, define:

- KPIs (revenue, utilization, satisfaction, response time, etc.).
- Event types that map to those KPIs (transactions, state changes, service
  requests, telemetry).
- Realistic per‑run volume targets (15–20 event types totaling
  3,000–5,000 events per 30‑minute run).

---

## Phase 2 — Dashboard design (Gen 3 only)

### Header — required split layout

Two side‑by‑side markdown tiles (NOT one combined tile, NOT HTML):

```
"0":  # Logo tile
  type: markdown
  content: "![](https://.../logo.svg)"
  layout: { x: 0, y: 0, w: 6, h: 2 }

"41":  # Title tile
  type: markdown
  content: "# <Company> | Operations Dashboard\n\nReal-time KPI monitoring..."
  layout: { x: 6, y: 0, w: 18, h: 2 }
```

Markdown tiles do not reliably support `<div>`, `<img>`, or other inline
HTML. Use pure markdown image syntax (`![](url)`).

### Section dividers

Use a `singleValue` data tile with `data record(section="...")`, height
`h:1`, full width `w:24`, distinct brand‑appropriate background color per
section.

Suggested palette (override per company brand):
- Gaming: `#D4AF37` (Gold)
- Hospitality: `#1E90FF` (Blue)
- Dining/F&B: `#FF6347` (Tomato Red)
- Guest Experience: `#9B59B6` (Purple)
- Operations/Facilities: `#34495E` (Slate)
- Summary/KPI: `#DAA520` (Dark Gold)

Example divider:

```json
{
  "type": "data",
  "title": "SECTION NAME",
  "query": "data record(section=\"Name\")",
  "visualization": "singleValue",
  "visualizationSettings": {
    "singleValue": {
      "labelMode": "none",
      "isIconVisible": true,
      "prefixIcon": "GridIcon",
      "colorThresholdTarget": "background"
    },
    "thresholds": [
      { "id": 1, "field": "section", "rules": [
        { "id": 1, "color": "#D4AF37", "comparator": "!=", "value": "1" }
      ]}
    ]
  }
}
```

### Tile height guidelines

| Height | Use case | Examples |
|--------|----------|----------|
| `h:1` | Section dividers, sparse info | Section headers |
| `h:2` | Single‑value KPIs | Revenue totals, occupancy %, counts |
| `h:3` | Small charts | 2–3 category bar charts |
| `h:4` | **Standard charts (recommended)** | Line, bar, area, donut |
| `h:5+` | Dense tables / multi‑series | Summary tables, complex analyses |

**Rule:** chart tiles need `h:4` minimum. `h:2`–`h:3` truncates legends and
labels.

### Layout & spacing

Minimize vertical gaps for a professional appearance:

- Y‑axis increments: `+1` to `+2` units between rows (not `+3+`).
- Pattern: divider (`h:1`) → KPI row (`h:2`) → chart row (`h:4`) → next
  divider.
- Consistent X columns: `0, 6, 12, 18` (board width is 24).
- Example flow:
  ```
  y:0   header (h:2)
  y:2   divider (h:1)
  y:3   KPI row (h:2)
  y:5   chart row (h:4)
  y:9   next divider (h:1)
  ```

### Map tile — REQUIRED, ABOVE THE FOLD

Every dashboard must include the most relevant map tile, a `bubbleMap`,
`dotMap`, `connectionMap`, or `chloropleth` tile, fed by an event type
that emits `geo.location.latitude` and `geo.location.longitude` (cluster,
region, site, or store). The injector must populate these fields for at
least one event type. See tile `30` in `example_dashboard.json` for shape.

**Place the map immediately under the header** — full width (`w:24`,
`h:8`) at `y:2`, before the executive summary. Geographic context belongs
above the fold. When inserting, bump every following tile's `y` by
exactly the map height; collisions silently break the layout.

### Visualization variety — required mix

A monolithic stack of donut + area charts is visually monotonous. Aim
for a deliberate mix across the dashboard:

- **`pieChart`** — small categorical share (3–5 slices).
- **`donutChart`** — same, when you want a center total.
- **`barChart`** (vertical, stacked) — categorical-over-time. Requires
  `makeTimeseries ..., by:{<group>}, bins:N` (see Phase 3).
- **`categoricalBar`** — horizontal stacked time-bars; same query
  requirement.
- **`honeycomb`** — many small categories (6+); needs
  `visualizationSettings.honeycomb.dataMappings.value = "<count_field>"`.
- **`lineChart` / `areaChart`** — single or multi-series timeseries.
- **`table` / `dataPage`** — raw rows.
- **`bubbleMap` / `dotMap`** — geo.
- **`singleValue`** — KPIs. Apply a **gauge feel** by attaching three
  threshold `colorRules` with `colorThresholdTarget: "background"` and
  `customColor` from `var(--dt-colors-charts-status-{success,warning,critical}-default, ...)`.
  Comparator `≥` (Unicode), highest threshold first. Gen 3 has no
  separate `gauge` viz type — this IS the gauge.

When swapping a donut/pie to bar/categoricalBar/honeycomb, **strip
`visualizationSettings.chartSettings.circleChartSettings`**. Leaving it
in makes the new chart render blank.

---

## Phase 3 — DQL query patterns

Always filter by `event.provider == "<company>.event.provider"` and use the
field aliases from your event schema (snake_case).

### Pattern → visualization

| DQL pattern | Visualization | Use case |
|-------------|---------------|----------|
| `summarize <agg>` | `singleValue` | Single KPI |
| `makeTimeseries <agg>, bins:N` | `lineChart`, `areaChart` | Time trends |
| `fetch ... \| filter ... \| fields ...` | `table`, `dataPage` | Raw data display |
| `summarize by:{field}` | `donutChart`, `pieChart`, `honeycomb` | Pure-category breakdown (NO time axis) |
| `makeTimeseries by:{field}, bins:N` | `barChart`, `categoricalBar`, stacked `areaChart` | Categorical trends over time |

**Critical:** `barChart` and `categoricalBar` in Gen 3 ALWAYS require a
time axis. The Gen 3 chart engine demands `fieldMapping.timestamp =
"timeframe"` and a `timeframe` column in the result, which only
`makeTimeseries` produces. Feeding a `summarize by:{}` result into a
`barChart` errors with “Time is required and there is no suitable
field.” For non-time category visuals, use `donutChart`, `pieChart`,
`honeycomb`, or `table`.

`barChart` / `categoricalBar` `fieldMapping`:
```json
{ "timestamp": "timeframe",
  "leftAxisValues": ["<value_field>"],
  "leftAxisDimensions": ["<group_field>"] }
```

### Common pitfalls

❌ WRONG — feeding `summarize` into a `barChart`/`categoricalBar`:
```dql
fetch bizevents | summarize revenue = sum(amount), by:{venue}
| visualization: barChart   // "Time is required"
```

✅ CORRECT — use `makeTimeseries` for any bar chart:
```dql
fetch bizevents | makeTimeseries revenue = sum(amount), by:{venue}, bins:20
| visualization: barChart
```

❌ WRONG — `avg(percentage_field)` for ratio metrics:
```dql
| summarize conversion = avg(conversion_percent)
```

✅ CORRECT — `sum/sum` calc:
```dql
| summarize visitors = sum(visitors_count), txns = sum(transactions_count)
| fieldsAdd conversion = (toDouble(txns) / toDouble(visitors)) * 100
```

### Multi-select variable filters

Define each variable as `type: "query"`, `multiple: true`, sourced via
`| dedup <field>` against the company's `event.provider`. Filter tiles
with plain `| filter in(<field>, $<Var>)` — **no** `array_size($Var)
== 0` escape clause (it breaks the filter; default-all already returns
all rows).

Rules:
1. **Insert filters BEFORE aggregation pipes** (`makeTimeseries`,
   `summarize`, `fields*`, `sort`, `limit`). After `makeTimeseries` the
   source field no longer exists, so a trailing
   `| filter in(region, $Region)` silently drops every row.
2. **Per-tile field availability matters.** Compute the **intersection**
   of filterable fields across every `event.type` referenced by the
   tile. Only inject filters for fields shared by ALL referenced types.
   Tiles whose events share no filterable dimensions (section dividers,
   funnel-only events, the global map) correctly get no variable filter.
3. Variables are **company-specific**. Pick 3–5 dimensions that map to
   the operating model (e.g. `$Banner`, `$Region`, `$Department`,
   `$Channel`, `$Store`). Avoid more than ~5 — the bar gets crowded.

### DQL best practices

1. Always filter by `event.provider`.
2. Snake_case field names matching the injector schema.
3. Add `| limit 10` while testing.
4. `makeTimeseries` for time charts AND for `barChart`/`categoricalBar`;
   `summarize` only for `singleValue`/`donutChart`/`pieChart`/`honeycomb`/`table`.
5. Ratio metrics = `sum(num)/sum(denom)*100`, never `avg(percent)`.
6. Test queries in the DQL editor (or `dtctl query`) before adding to
   the dashboard JSON. Substitute a literal `array(...)` for `$Var` to
   smoke-test multi-select filters.

Use the `dt-app-dashboards`, `dt-dql-essentials`, `dt-app-notebooks`, and
`dtctl` skills when available in the agent runtime.

---

## Phase 4 — Event injector JavaScript

Use `reference/example-injector.js` and the `script`
field in `example_data_injector.workflow.json` as the structural template.

### Requirements

- **Event types:** 15–20 different types
  (`gaming.transaction`, `guest.checkin`, `equipment.telemetry`, ...).
- **Field schema:** snake_case for all fields
  (`gaming_venue`, `occupancy_percent`, ...).
- **Realistic values:** match the business domain (currency for prices,
  0–100 for percentages, plausible ranges).
- **Volume:** 3,000–5,000 events per execution (~100+ per event type).
- **Geo fields:** at least one event type emits
  `geo.location.latitude` / `geo.location.longitude` for the map tile.
- **Ingest endpoint:** `/platform/classic/environment-api/v2/bizevents/ingest`.
- **Batching:** 500 events per POST to stay under ~5MB; throw on non‑2xx.
- **Auth:** integrated platform auth — no token; the workflow runs in the
  AutomationEngine context.
- **Provider:** `EVENT_PROVIDER = "<company>.event.provider"`.

---

## Phase 5 — Dashboard implementation checklist

Pre‑implementation:
- [ ] Meaningful dashboard title (e.g. `<Company> | Operations Dashboard`).
- [ ] 15–20 KPIs researched and mapped to event types.
- [ ] Layout sketched (sections, tile positions).
- [ ] Logo URL gathered **AND verified** via `curl -sIL` (must return
      `HTTP 200` + `content-type: image/*`).
- [ ] 5–6 section colors chosen from brand/theme.
- [ ] 3–5 dashboard variables chosen (multi-select, query-driven).

Query validation:
- [ ] Each DQL query tested in the DQL editor with `| limit 10`.
- [ ] Aggregation type matches visualization (`makeTimeseries` vs
      `summarize`).
- [ ] Field names match the injector schema exactly.

Tile creation:
- [ ] Logo tile (markdown, `h:2`, `w:6`).
- [ ] Title tile (markdown, `h:2`, `w:18`).
- [ ] **Map tile placed at `y:2` (above executive summary), `w:24`,
      `h:8`**.
- [ ] Section dividers (`h:1`, colored).
- [ ] KPI tiles (`h:2`, under each section); 3–4 use `singleValue` +
      threshold `colorRules` for gauge feel.
- [ ] Chart tiles (`h:4+`, under KPIs).
- [ ] **Visualization mix:** at least 4 distinct chart types across the
      board (e.g. `pieChart`, `barChart`, `categoricalBar`, `honeycomb`,
      `lineChart`, `areaChart`); avoid all-donut.
- [ ] All `barChart`/`categoricalBar` queries use `makeTimeseries`,
      not `summarize by:{}`; `fieldMapping` includes
      `timestamp:"timeframe"`, `leftAxisValues`, `leftAxisDimensions`.
- [ ] Any `honeycomb` tile sets
      `visualizationSettings.honeycomb.dataMappings.value`.
- [ ] Any non-circular chart has `chartSettings.circleChartSettings`
      removed.
- [ ] Consistent X positions (`0, 6, 12, 18`).
- [ ] Y gaps minimized (`+1` to `+2`).

Styling & validation:
- [ ] Section colors applied.
- [ ] Chart `legend.ratio` 20–30.
- [ ] `categoryOverrides` for semantic colors.
- [ ] No red‑X tiles in preview.
- [ ] Logo and map tile render correctly.

---

## Phase 6 — Workflow & deployment (CRITICAL RULES)

The injector workflow is **shared across all companies** in a tenant. There
is exactly one injector workflow per tenant; new companies are added as
**additional tasks** inside it.

### Step‑by‑step

1. **Apply the dashboard:**
   ```bash
   dtctl apply -f "dashboards/<Company>/<company>-dashboard-v1.json"
   ```
   Capture the returned dashboard ID.

   **Envelope shape (REQUIRED):** `dtctl apply` expects a wrapper:
   ```json
   { "id": "<uuid?>", "name": "<Company> | Operations Dashboard",
     "type": "dashboard", "isPrivate": false,
     "content": { "tiles": {...}, "layouts": {...}, "variables": [...],
                  "settings": {...}, "version": 21, ... } }
   ```
   Submitting just the `content` body imports tiles but creates an
   "Untitled dashboard" with name and ID detached. Re-applying with the
   wrapper fixes it in place (`ACTION = updated`).

2. **Search for the existing injector workflow first:**
   ```bash
   dtctl get workflows -o json --plain | \
     jq '.[] | select(.title | test("BizEvents Dashboard Generator|KPI Data Injector|injector"; "i"))'
   ```
   Prefer the workflow titled `1.BizEvents Dashboard Generator`. If multiple
   match, confirm with the user.

3. **If a workflow exists (the normal case):**
   - `dtctl get workflow <id> -o json --plain > .tmp/workflow.json`
   - Append a new task keyed `<company>_v1` (or `_v2` on iteration).
   - Use a **unique** `position.{x, y}` — duplicates produce a 400 error.
   - Set `predecessors: []` so tasks run in parallel.
   - `dtctl apply -f .tmp/workflow.json`

4. **If no workflow exists (first run on a brand‑new tenant only):**
   - Use `reference/example_data_injector.workflow.json`
     as the template.
   - Replace its single task with the new company's task; rename the
     workflow `1.BizEvents Dashboard Generator`.
   - `dtctl apply -f` it; capture the workflow ID.

5. **Execute and verify:**
   ```bash
   dtctl exec workflow <id>
   dtctl describe workflow-execution <exec-id>   # wait for SUCCESS
   ```
   `describe workflow-execution` returns an empty `tasks{}` dict — to
   inspect the JS task's return value (totals, batches, errors) use:
   ```bash
   dtctl get wfe-task-result <exec-id> -t <taskName>
   ```
   The task name is required via the `-t/--task` flag, NOT positional.

6. **Verify ingestion:**
   ```dql
   fetch bizevents
   | filter event.provider == "<company>.event.provider"
   | summarize total = count()
   ```

**Never create a second injector workflow** when one already exists.

### Versioning

- First iteration: `<company>-dashboard-v1.json`, task `<company>_v1`.
- Updates: `<company>-dashboard-v2.json`, task `<company>_v2`.
- Never overwrite v1 files.

---

## Phase 7 — Documentation deliverables

For every project, write into the company folder:

- **`README.md`** — Project overview, file list, dashboard ID, workflow ID,
  task name, deployment commands.
- **`LEARNINGS.md`** — DQL patterns, layout decisions, pitfalls, color
  scheme, anything reusable for the next project.
- **`SALES-PITCH.md`** — 1‑page value proposition tailored to the company
  for the sales team.

`LEARNINGS.md` template:

```markdown
# <Company> Dashboard Learnings

**Date:** <date>
**Version:** v1

## DQL Patterns Used
| Tile Type | DQL Pattern | Notes |
|-----------|-------------|-------|

## Layout Decisions
- Header, dividers, KPI rows, chart rows...

## Pitfalls Hit
1. ...

## Color Scheme
- Section: `#hex`
```

---

## Phase 8 — Quality gate (run before declaring done)

- [ ] Logo renders.
- [ ] All section dividers show correct colors.
- [ ] No red‑X tiles.
- [ ] Every KPI tile has data.
- [ ] Every chart shows legends/labels.
- [ ] Map tile is populated with cluster/region/site coordinates.
- [ ] Layout is compact (no excessive whitespace).
- [ ] Workflow execution finished SUCCESS.
- [ ] 3,000+ events ingested per run.
- [ ] `README.md`, `LEARNINGS.md`, `SALES-PITCH.md` all present.

---

## Key principles

1. **Markdown formatting is critical** — pure markdown only, no HTML.
2. **Logo = professional touch** — every dashboard branded.
3. **Charts need space** — `h:4` minimum.
4. **Test before deploy** — DQL in the editor first.
5. **Document everything** — `LEARNINGS.md` is the knowledge capital.
6. **Consistency breeds quality** — follow the example shape exactly.
7. **One injector workflow per tenant** — always add a task, never duplicate.

---

## What the agent must NOT do

- Do not invent dashboard IDs, workflow IDs, or URLs — always use values
  returned by `dtctl`.
- Do not create a second injector workflow when one exists.
- Do not skip the map tile.
- Do not push commits or open PRs unless asked.
- Do not run destructive `dtctl delete` commands without explicit user
  confirmation.
- Do not attempt to install or configure `dtctl`.
