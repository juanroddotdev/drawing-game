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

- [ ] Default chain length? (spec says 6 — keep, or offer Quick 4 / Epic 8 at create?)
- [ ] Timeout duration before a stuck step frees? (spec says 24h — shorter for friend chains?)
- [ ] Can the **creator** kick/skip a stuck player before timeout, or only auto-timeout + re-invite?
- [ ] Can a player appear more than once in the same chain?
- [ ] Who picks the opening prompt — creator types it, random from a free deck, or both?
- [ ] After reveal, can anyone re-share the gallery link, or only participants?

---

## Identity & notifications

- [ ] Phone, email, or either for “your turn” / “game finished”?
- [ ] Is a passwordless magic link / SMS code enough, or do we need a fuller account later?
- [ ] How do we handle someone opening a chain link on a new device (claim step vs prove identity)?
- [ ] Opt-in wording and frequency limits for SMS (compliance / spam feel)?

---

## Drawing experience

- [ ] Exact V1 tool set: which colors, brush sizes, undo depth, eraser — anything else?
- [ ] Canvas aspect ratio — square (best for social), or flexible?
- [ ] Max stroke/time limits per drawing step?
- [ ] Which alternate modes ship in V1, if any? (blind, speed run, palette lock, one-continuous-line)

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

- [ ] Target stack preferences? (e.g. Next.js + Supabase, or no preference)
- [ ] PWA install prompt in V1, or “mobile web that works” first?
- [ ] Hosting / storage preferences for stroke JSON and assets?
- [ ] Soft launch audience — just friends, closed beta link, or public?

---

## MVP cut

- [ ] What is explicitly **in** V1?
- [ ] What is explicitly **out** of V1 (even if in the full vision)?
