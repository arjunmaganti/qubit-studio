# Qubit Studio — design system

Established 2026-09-11 from `design/reference-pack/` (REFERENCES.md, CLAUDE-CHATGPT-PROMPT.md,
reference-board.jpg) and the shipped values in `ui/app/globals.css`. Scope: the CAD-style
simulation workbench under `ui/`. Not a landing page, not a marketing site.

Supersedes the graphite/cyan palette proposed in `docs/quantum-design-lab-design.md` §6.

## Direction

**Utility & Function, with Data & Analysis.** An object-centred CAD workbench, explicitly in the
spirit of SOLIDWORKS made approachable. The chip is the hero; chrome is compact, light and
tool-like. Feel: precise, calm, technically credible, readable at projector distance.

Reference roles (transform principles, do not clone):

| Ref | Borrow |
|-----|--------|
| A SOLIDWORKS | Workspace skeleton: compact top bar, named parts tree left, large viewport, docked inspector right |
| B Onshape | Exploded parts stay aligned; dashed guides preserve attachment; selection survives separation |
| C Mechanical Watch | One large outlined object on a pale field; one slider reveals internals; explanation is progressive |
| D Falstad | Schematic, parameters and results share one spatial frame; results stay visible while editing |
| E Shapr3D modeling | Dark edge lines, gray solids, accent reserved for the meaningful part; compact labelled controls |
| F Shapr3D visualization | Materials read as distinct surfaces without reflections; appearance is not physics |

Never: oversized page title, decorative dashboard cards, bento grid, sidebar chatbot, neon or
particles, gauges, a generic "performance score", black/neon Falstad styling, red doc-site header.

## Depth: borders only

One approach, everywhere. Panes are separated by a 1px `--line` hairline (grid `gap: 1px` on a
`--line` background). No box-shadows. No card-on-card. Elevation is expressed by surface step
(`--surface` → `--surface-2` → `--surface-3`) and by border weight (`--line` → `--line-strong`).

The only "floating" elements are viewport overlays (badges, the orbit hint) which sit on a
translucent white pill, no shadow.

## Spacing: 4px base

| Token | Value | Use |
|-------|-------|-----|
| row | 26px | Tree rows, control height |
| top bar | 40px | Shell row 1 |
| pane pad | 8px 10px | Tree, toolbar, hint |
| section pad | 10px 12px | Inspector sections, metrics, charts |
| control pad | 4px 9–10px | Buttons, segmented controls |
| field gap | 12px | Between inspector fields |
| pane gap | 1px | Hairline between regions |

Keep padding symmetrical. Nothing wider than 48px.
Known drift to clean up on next audit: a few 7px / 9px / 5px values in `globals.css` (hint,
panel-head, seg buttons). Round to 8 / 8 / 4.

## Shell layout

```
grid-template-columns: 232px minmax(0,1fr) 296px;
grid-template-rows:    40px  minmax(0,1fr)  auto;
areas: "top top top" / "tree stage inspector" / "tree dock inspector"
```

- ≤1100px: tree 196px, inspector and dock stack full-width below the stage.
- ≤720px: single column, order top → stage → tree → inspector → dock.
- Stage: toolbar row (view segmented control, Reset view, Assembly scrubber, selection label) over
  the viewport; Split divides viewport and schematic with a 1px hairline.
- Results dock: metric strip (`auto-fit, minmax(168px,1fr)`) over a two-column chart row
  (`1fr / 1.4fr`, collapses ≤860px).

## Color

Cool light neutrals. Gray builds structure; one blue means selection/action; amber means
"illustrative / stale"; red means error. No other hue.

| Token | Value | Role |
|-------|-------|------|
| `--canvas` | #dfe3e8 | Viewport field (radial to `--canvas-grad` #eef1f4 at 50% 38%) |
| `--surface` | #ffffff | Panes |
| `--surface-2` | #f5f6f8 | Panel heads, hover, body background |
| `--surface-3` | #eceef1 | Pressed / inset |
| `--line` | #d2d7de | Hairlines |
| `--line-strong` | #b7bec8 | Control borders |
| `--text` | #1b2027 | Primary |
| `--text-2` | #5c6672 | Secondary, labels |
| `--text-3` | #878f9b | Tertiary, units, captions |
| `--accent` | #1a6fe0 | Selection, primary action, f01 trace; hover #155cbd |
| `--accent-soft` | #e6effc | Selected row fill, hint background |
| `--warn` / `--warn-soft` | #a8620a / #fdf2e2 | Illustrative notice, Updating badge |
| `--bad` / `--bad-soft` | #b3261e / #fdeceb | Invalid input, disconnected, error box |
| `--ok` | #1a7f4b | Constraint satisfied pill only |

3D object: gray solids with dark edge lines; selected part gets an accent outline **and** a text
label. Substrate and ground plane are visibly quieter (context, not modelled).

Deltas are neutral (`--text-2`), never red/green: in free exploration up is not good or bad.

## Typography

- UI: system stack, 13px / 1.45. `-apple-system, "Segoe UI", Inter, Roboto, sans-serif`.
- Data: `--mono` (`ui-monospace, "SF Mono", Menlo, Consolas`). Every number, symbol, unit and
  parameter name is mono. Metric values 17px, letter-spacing -0.02em.
- Panel heads and chart titles: 11px, 650, uppercase, tracking 0.06em, `--text-2`.
- Inspector title: 14px / 650. Brand: 13px / 650, subtitle 400 `--text-3`.
- Captions, units, tags: 11px `--text-3`.
- No display headings. Weight max 650.

## Radius

4px inputs · 5px buttons, segmented controls, hints, notices · 2px swatches · 999px pills/badges.
Nothing larger.

## Component patterns

**Segmented control** (`.seg`): 1px `--line-strong` frame, buttons separated by `--line`,
pressed = `--accent-soft` fill + `--accent` text + 600.

**Button** (`.btn`): 1px `--line-strong`, `--surface`, `--text-2`; hover `--surface-2` + `--text`;
disabled opacity .45. `.primary` = solid accent, white text. Never a dead button.

**Tree row**: 26px, 2px left border transparent → `--accent` when selected, `--accent-soft` fill,
9px swatch, plain-language label, mono symbol tag right (`EJ/h`), eye toggle.

**Panel head**: sticky, `--surface-2`, hairline below, uppercase micro-label.

**Parameter field**: label (600, 12px) + mono symbol + Reset link right; row = range slider
(`accent-color`) + 78px mono numeric input + 28px unit. Invalid = `--bad` border, `--bad-soft`
fill, message below. One edit = one undo step.

**Metric tile**: label 11px `--text-2` with mono symbol, value 17px mono, delta 11px mono
neutral, note 11px `--text-3`. Null/unresolved = "—" in `--text-3` at 13px, never `0`.

**Badge** (status pill): `live` accent-soft · `stale` warn-soft "Updating" · `err` bad-soft.
Stale keeps the previous numbers visible; it does not blank them.

**Hint**: accent-soft box, 12px, dismissible, one per screen, optional.

**Illustrative notice** (`.illus`): warn-soft box for "appearance only, not a model input".

**Technical disclosure** (`details.tech`): accent summary link, `dl` grid with mono `dt`.

**Charts**: SVG only from returned arrays. Title 11px uppercase, caption 11px `--text-3`,
current trace `--accent`, pinned baseline dashed gray. Same scales before/after.
Below-reporting-floor values show the status text, not a fabricated zero.

## Interaction

- Empty-space drag orbits; handles edit. No auto-spin, no gimbal lock.
- Click is selection truth in 3D, schematic and tree; hover may preview. Cross-highlight all three.
- Micro-interactions ≤150ms, ease-out. `prefers-reduced-motion` disables all transitions.
- Explode is view-only: continuous slider, dashed guides, numbers never change.
- Focus ring: 2px `--accent`, offset 1px, on every control.
- Selection and status are always outline/fill **plus** text, never color alone.

## Honesty rules (design-level)

- Disconnected: dashes, empty charts, Pin disabled, explicit error box. No "typical" placeholders.
- Materials and geometry are illustrative until a numerical contract exists; say so quietly.
- Copy says "simplified model, not a real-device prediction" once, in the inspector, not as a banner.
