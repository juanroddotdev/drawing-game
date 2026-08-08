# DoodleLoop

Async friends-first Telestrations-style drawing game. Stack: **Nuxt + Supabase**.

## Docs

- [Base idea](./docs/base-idea-v3.md)
- [Architecture](./docs/architecture.md)
- [Open questions](./docs/open-questions.md)
- [Build prompt](./docs/build-prompt.md)

## Setup

```bash
cp .env.example .env
# fill Supabase URL + publishable key
# optional: RESEND_API_KEY for finish/turn emails
npm install
npm run dev
```

Open `http://localhost:3000` — start a loop at `/play/new`, or use `/lab` for the canvas-only playground.

### Dev mode (closed beta)

- When `NUXT_PUBLIC_DEV_INSPECTOR_KEY` is set (local **or** Vercel), the app shows **Dev mode** (`/dev`), Pass **Play next myself**, and `/c/:slug/dev`.
- **LAUNCH:** remove or re-gate to `import.meta.dev` only before public launch — the public key is visible in the client bundle.

### Supabase

1. Apply migrations in `supabase/migrations/` (`supabase db push` or SQL editor).
2. Confirm RPCs exist (`create_chain`, `get_play_payload`, `submit_step`, `get_reveal`, …).

### Email (Resend)

1. Create an API key at [resend.com](https://resend.com)
2. Set `RESEND_API_KEY` and optionally `RESEND_FROM_EMAIL` (verified domain for production)
3. `POST /api/notify` with `{ type: 'turn'|'finished', to, playUrl|revealUrl }`

Until a domain is verified, Resend’s test sender `onboarding@resend.dev` only delivers to your own account / test addresses.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run test` | Unit tests |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
