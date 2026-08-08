# PenPass (working title)

Async friends-first Telestrations-style drawing game. Stack: **Nuxt + Supabase**.

## Docs

- [Base idea](./docs/base-idea-v3.md)
- [Architecture](./docs/architecture.md)
- [Open questions](./docs/open-questions.md)
- [Build prompt](./docs/build-prompt.md)

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000` — start a chain at `/play/new`, or use `/lab` for the canvas-only playground.

### Supabase (Phase 2)

1. Copy `.env.example` → `.env` and set project URL + publishable key.
2. Apply the migration in `supabase/migrations/` (SQL editor, or `supabase db push` after `supabase link`).
3. Confirm RPCs `create_chain`, `get_play_payload`, `submit_step`, `get_reveal` exist.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
