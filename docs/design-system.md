# DoodleLoop design system

Working title: **Clean Neo-Brutal + Sketch**. This is the seed “design bible” — update it as the look settles.

## Intent

Feel like a friends doodle night, not a SaaS dashboard. Flat, fast, legible — with ink personality. No glossy gel, leather, paper folds, or purple glow.

## Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0f172a` | Borders, text, hard shadows |
| `--paper` | `#e8eef5` | App chrome / page ground |
| `--surface` | `#ffffff` | Pills, docks, cards |
| `--canvas` | `#f8fafc` | Drawing surface only |
| `--accent` | `#84cc16` | Highlight (“Repeat.”), badges |
| `--font-ui` | DM Sans | Controls, Done, body |
| `--font-sketch` | Shantell Sans | Brand, prompts, playful headlines |

Utilities live in [`app/assets/css/main.css`](../app/assets/css/main.css): `.bg-dot-grid`, `.shadow-block`, `.btn-ink`, `.btn-accent`, `.chip-sketch`, `.panel-sketch`, `.dock-sketch`, `.font-sketch`.

## Rules

1. **Hard offset shadows** (`2–3px 0 blur`) on chrome — never soft multi-layer blur on primary UI.
2. **Sketch type only for prompts + marketing titles.** Keep Done / Undo / system labels in UI sans.
3. **Dot-grid on the page**, not on the ink canvas.
4. **No Rough.js (yet).** Prefer CSS neo-brutal chrome; add wobbly SVG later only if it still feels flat.
5. **One accent (lime).** Don’t rainbow the UI.

## Surfaces

- **Landing / pass / hub:** dot-grid paper + block shadows + sketch headlines.
- **Draw shell:** same tokens on home chip, prompt pill, Done, bottom dock; canvas stays plain.
- **Canvas artboard:** calm rectangle; no neo-brutal clip on strokes.

## Out of scope (for now)

- Rough.js / Wired Elements on every control  
- Skeuomorphic textures  
- Dark mode  

---

If this direction sticks after playtesting, expand this doc into full component recipes (button states, sheets, share card).
