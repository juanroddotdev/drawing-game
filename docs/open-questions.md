# Open Questions

Questions that still need answers before (or while) we lock V1 scope.  
Already decided items live in [`base-idea-v3.md`](./base-idea-v3.md) under **Product Decisions**.

---

## Naming & presence

- [x] What is the product / game name? → **DoodleLoop**
- [ ] Do we need a matching `.com` (or is `.app` / `.game` / etc. acceptable)?
- [x] GitHub repo name — can stay `drawing-game` for now; rename later if desired
- [x] Timeout duration? → **24h** default; creator-configurable rules later
- [x] Same player twice? → **allow for now**
- [x] Creator kick before timeout? → **deferred** (timeout + re-invite only)
- [x] Dev inspector → **local `npm run dev` only**

---

## Core loop & rules

- [x] Default chain length? → **6** (3 draws + 3 guesses); optional shorter later
- [x] Timeout duration before a stuck step frees? → **24h** (creator rules later)
- [x] Can the **creator** kick/skip a stuck player before timeout? → **deferred**
- [x] Can a player appear more than once in the same chain? → **yes for now**
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
- [x] **Dev / solo inspector** — `/c/:slug/dev` shows all steps; mint play link for solo testing. (Gate with `NUXT_PUBLIC_DEV_INSPECTOR_KEY`; remove/harden before public launch.)

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
