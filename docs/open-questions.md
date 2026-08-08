# Open Questions

Questions that still need answers before (or while) we lock V1 scope.  
Already decided items live in [`base-idea-v3.md`](./base-idea-v3.md) under **Product Decisions**.

---

## Naming & presence

- [ ] What is the product / game name?
- [ ] Do we need a matching `.com` (or is `.app` / `.game` / etc. acceptable)?
- [ ] GitHub repo name — same as product, or different?

---

## Core loop & rules

- [x] Default chain length? → **6** (3 draws + 3 guesses); optional shorter later
- [ ] Timeout duration before a stuck step frees? (spec says 24h — shorter for friend chains?)
- [ ] Can the **creator** kick/skip a stuck player before timeout, or only auto-timeout + re-invite?
- [ ] Can a player appear more than once in the same chain? (recommended default: **yes**, for small friend groups)
- [x] Opening prompt? → **noun + action/state combo**, reroll + optional edit; decks later
- [ ] After reveal, can anyone re-share the gallery link, or only participants?

---

## Identity & notifications

- [x] Phone, email, or either? → **Email for V1**; SMS later; share link is primary turn-pass
- [x] Passwordless + optional account? → **Yes** — passwordless to play; account to save past games
- [ ] How do we handle someone opening a chain link on a new device (claim step vs prove identity)?
- [ ] Email magic-link / opt-in copy details?
- [ ] Web Push in V1 or after?

---

## Drawing experience

- [ ] Exact V1 tool set: which colors, brush sizes, undo depth, eraser — anything else?
- [ ] Canvas aspect ratio — square (best for social), or flexible?
- [ ] Max stroke/time limits per drawing step?
- [ ] Which alternate modes ship in V1, if any? (blind, speed run, palette lock, one-continuous-line)
- [ ] **Dev / solo inspector** — a debug view that shows all chain steps on one screen (for testing without friends). Plan after Phase 4 reveal polish.

---

## Sharing & virality

- [ ] Is stroke time-lapse replay required for V1 reveal, or can static panels ship first?
- [ ] Video / GIF export — V1, V1.1, or later?
- [ ] Spectator / watch-only links for group chats — yes for V1?

---

## Message in a Bottle (later)

- [ ] When do we open Bottle — after friends MVP feels solid, or earlier for growth?
- [ ] Private friend chain: on timeout, re-invite only (never auto-public), correct?
- [ ] Moderation bar for public queues when Bottle ships?

---

## Monetization (post-MVP?)

- [ ] Anything paid in V1, or free until retention is proven?
- [ ] First paid surface if/when: prompt decks, cosmetics, or something else?

---

## Tech & shipping

- [x] Target stack? → **Nuxt + Supabase**
- [ ] PWA install prompt in V1, or “mobile web that works” first?
- [ ] Hosting / storage — default Supabase storage OK?
- [ ] Soft launch audience — just friends, closed beta link, or public?

---

## MVP cut

- [x] **In V1:** create → draw/guess → share link → timeout + re-invite → reveal
- [x] **Out of V1:** Bottle, polished GIF/video, paid decks, alternate modes, Hall of Fame
