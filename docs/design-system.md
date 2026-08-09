# DoodleLoop design system

Working title: **Restrained neo-brutal** (ink borders + hard offset, limited sketch type).

Playful peak (more doodle / Shantell everywhere): git commit `5070557` on `feat/sketch-neo-brutal` — restore with `git checkout 5070557 -- app/ docs/design-system.md` if you want that look back.

## Intent

Friends doodle night, not SaaS — but calm enough for a draw session. Sharp ink edges, light paper, one lime accent. No glossy gel, leather, folds, or purple glow.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0f172a` | Borders, text, hard shadows |
| `--paper` | `#eef2f6` | App chrome / page ground |
| `--surface` | `#ffffff` | Chips, docks, cards |
| `--canvas` | `#f8fafc` | Drawing surface only |
| `--accent` | `#84cc16` | Done / highlights |
| `--font-ui` | DM Sans | Almost everything |
| `--font-sketch` | Shantell Sans | **Brand wordmark only** |

Utilities: [`app/assets/css/main.css`](../app/assets/css/main.css) — `.bg-dot-grid`, `.shadow-block`, `.btn-ink`, `.btn-accent`, `.btn-quiet`, `.chip-sketch`, `.panel-sketch`, `.dock-sketch`, `.font-sketch`.

## Rules

1. **1px ink borders + 2px hard offset shadows** on chrome (not soft blur).
2. **Sketch type only for “DoodleLoop”.** Prompts and UI stay DM Sans.
3. **Very faint dot-grid** on the page; canvas stays plain.
4. **Accent (lime) for Done** and sparse highlights — not rainbow UI. Hierarchy: `.btn-accent` / `.btn-ink` for primary, `.btn-quiet` for dismiss / low-emphasis.
5. **No Rough.js** unless we consciously reintroduce wobble later.

## Surfaces

- Landing / pass: faint grid + block chips / panels.
- Draw shell: same tokens on home, prompt, Done, dock.
- Canvas artboard: calm; no neo-brutal clip on strokes.

---

Expand with component recipes once this middle ground sticks in playtesting.

### Sketch toast

Use [`UiSketchToast`](../app/components/ui/SketchToast.vue) for ephemeral tips **and** confirms (e.g. Clear drawing) — sticky-note yellow (`--toast-note`) or coral alert (`--toast-alert`), ink border + hard offset, slight tilt. Never `window.confirm` / system dialogs for in-app flows.

### Submit sheet

[`UiPlayerSubmitSheet`](../app/components/ui/PlayerSubmitSheet.vue) — `panel-sketch` dialog, `chip-sketch` inputs, `btn-quiet` Cancel, `btn-accent` primary. Same tokens as draw chrome; no soft SaaS shadows.

Draw flows pass `:preview` (stroke doc) → tilted ~150px sketch card (ink border + hard offset, −2°) above the nickname fields. No Polaroid, tear edge, or 3D flip. Guess flows omit preview.
