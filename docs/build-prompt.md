# Build Prompt — PenPass (working title)

Use this when kicking off implementation (or handing off to another agent). It reflects current product decisions in `base-idea-v3.md` and `open-questions.md`.

---

Act as a senior full-stack engineer. We are building **PenPass** (working title): an asynchronous, web-first PWA — a friends-first Telestrations / telephone drawing-and-guessing game.

Read the product decisions and MVP cut below. **Do not write application code yet.** First acknowledge the constraints, then propose a Nuxt-idiomatic folder/file structure and a short Phase 1 plan. Wait for confirmation before implementing Phase 1.

### Product decisions (locked)

- **Friends first** — share-link chains; Message in a Bottle / community later (out of V1).
- **MVP in:** create chain → draw/guess alternate → share link → timeout + re-invite → reveal.
- **MVP out:** Bottle, polished GIF/video export, paid decks, alternate modes, Hall of Fame.
- **Prompts:** drawable noun + action/state combos, with reroll + optional edit before drawing.
- **Chain length:** default **6** steps (typically 3 drawings + 3 guesses).
- **Stuck steps:** on timeout, seat frees; last completer can forward the link to anyone for the next step.
- **Identity:** passwordless to play (nickname + **email**); optional account to save past games. SMS later, not V1.
- **Drawing tools:** mid-weight — few colors, brush sizes, undo, maybe eraser (no layers).
- **Name:** PenPass is a working title; keep it easy to rename (env, title, manifest).

### Tech stack (locked)

- **Frontend:** Nuxt 3/4 (Vue 3) + Tailwind CSS.
- **Backend:** Supabase (Postgres, Auth magic link, Storage). Prefer fetch-on-load / mutations for async play; Realtime subscriptions are optional, not required for V1.
- **Canvas:** HTML5 Canvas with smooth strokes; persist **JSON vector paths** (points, color, width, timestamps) — not PNG/base64 as source of truth.
- **PWA:** mobile-web that works first; installability when it doesn’t slow Phase 1.

### Execution rules

1. **Architecture first** — modular app (routes/pages, canvas engine, Supabase client, chain domain logic). No single mega-file app.
2. **Iterative phases** — implement only the current phase unless asked to continue.
3. **Code quality** — clear, production-minded TypeScript; comment *non-obvious* intent only. Mobile: `touch-action: none`, responsive canvas scaling, handling for missing/expired chain IDs.
4. **Do not invent scope** — stay inside MVP unless a phase explicitly adds something (e.g. time-lapse).

### Build phases

| Phase | Deliverable |
| --- | --- |
| **1** | Vector drawing canvas: draw, undo, colors/sizes, export JSON paths, re-render from JSON |
| **2** | Chain state machine + Supabase schema: prompt → draw → guess → … → complete; timeout/re-invite fields |
| **3** | Deep links + Web Share: pass-a-turn URLs, claim/play step, basic email hooks as needed |
| **4** | Reveal gallery + optional stroke time-lapse replay from stored vectors |

### What to output now

1. Confirm you understand the constraints (short).
2. Propose a clean **Nuxt + Supabase** folder/file structure.
3. Outline **Phase 1** (files to touch, component API). Do **not** implement Phase 1 until confirmed.

### Spec reference

See repo docs:

- `docs/base-idea-v3.md` — full vision + product decisions
- `docs/open-questions.md` — remaining open items (use sensible defaults if blocked)
