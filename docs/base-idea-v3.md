# Base Idea V3 — Asynchronous Telestrations Drawing Game

**Document Overview:** This document serves as the comprehensive design specification for an asynchronous, web-based drawing and guessing game inspired by Telestrations and Telephone. It outlines the core gameplay loop, user experience, data architecture, live engagement mechanics, developer optimization solutions, social viral loops, gamification mechanics, and monetization strategies.

---

## 1. Core Product Concept

The game is a multi-step "Telephone" loop played asynchronously across web browsers. A player initiates a chain by drawing a prompt or word, then forwards a unique link to another player (either via direct messaging or a global queue). Players alternate between drawing and guessing until the predetermined chain limit is reached, at which point the full history is revealed to all participants.

### Key Strategic Pillars

- **Zero-Friction Access:** Built as a Web App (PWA) so players do not need to download an app from an app store or go through complex sign-up forms.
- **Asynchronous Play:** Removes the need for players to be online simultaneously in a real-time lobby.
- **Flexible Forwarding:** Supports passing chains directly to friends via messaging apps (iMessage, WhatsApp, SMS) or dropping them into a global community pool.
- **Continuous Player Retention:** Real-time progress updates and cross-chain participation eliminate waiting friction and keep users engaged.
- **Inherent Social Virality:** Built-in video time-lapses and social export tools turn every finished chain into shareable content.

---

## 2. Gameplay Mechanics & Step-by-Step Flow

| Step | Actor | Action | Visibility & Constraints |
| --- | --- | --- | --- |
| Step 1: Initiation | Creator (Player 1) | Receives or inputs a prompt. Draws the image on canvas and submits. | Prompt is visible to Creator only. Generates a unique chain link. |
| Step 2: Guessing | Player 2 | Opens link, views Player 1's drawing, and submits a text guess. | Sees only Player 1's drawing. Cannot see the original prompt. |
| Step 3: Drawing | Player 3 | Opens link, reads Player 2's text guess, and draws it. | Sees only Player 2's text guess. Cannot see prior drawings. |
| Step 4–N: Continuation | Players 4 to N | The guess/draw alternation repeats until the chain length limit is met. | Configurable max steps (default: 6 steps). |
| Final Step: Reveal | All Participants | The full sequence (original prompt → draw → guess → … → final reveal) is unlocked. | Notifications sent via Web Push, email, or direct share link to view the gallery. |

---

## 3. Social & Viral Engine (The "Shareability" Layer)

### A. Animated Time-Lapse Replays

Because stroke coordinates are saved as vector JSON paths, the reveal gallery doesn't just show static images—it renders an animated time-lapse replay of each artist drawing their piece stroke-by-stroke.

### B. 1-Tap Video / GIF Export

Players can generate and download an mp4/GIF recap of the entire chain formatted for TikTok, Instagram Stories, and YouTube Shorts, complete with sound effects and dramatic plot-twist reveals.

### C. Community "Hall of Fame" Feed

Public chains dropped into the "Message in a Bottle" queue can be submitted to a curated community feed where users vote on the worst miscommunications and hilarious drawings.

---

## 4. Alternative Game Modes & Rulesets

To prevent drawing fatigue, game creators can enable optional constraints during step initiation:

- **Blind Drawing Mode:** The canvas stays invisible/masked until the artist lifts their finger off the screen.
- **Speed Run Mode:** Players are given a strict 15-second timer per drawing step.
- **Palette Lock Mode:** Restricts the canvas palette to only two high-contrast colors (e.g., Neon Pink & Charcoal Black).
- **One-Continuous-Line:** Disables lifting the brush until the drawing is completed.

---

## 5. Progression, Gamification & Monetization

### A. Progression & Badges

- **Title Badges:** Unlock titles based on play style (e.g., "The Abstract Picasso", "Chaos Agent", "Literalist").
- **Friend Chain Streaks:** A daily streak counter between specific friends for completing 2-player or group chains.

### B. PWA Monetization Strategies

- **Custom Prompt Decks ($0.99 – $1.99):** Base prompts are free, while specialized decks (e.g., 90s Nostalgia, Gaming Legends, Adult/After Dark, Inside Jokes) are purchasable via Stripe/Web Payments.
- **Cosmetic Packs:** Monetized brush textures (Glow, Neon, Crayon, Pixel Art) and custom gallery reveal frames.

---

## 6. Mobile Developer Optimization & Edge-Case Solutions

### A. Resolving "Dead-End Chains" (Auto-Timeout)

If a player fails to complete a step within 24 hours, the step automatically expires for that individual and is re-routed into the global queue or bounced back to the sender.

### B. Canvas & Input Standardization Across Devices

- Enforces strict CSS touch-action rules (`touch-action: none`) to prevent accidental mobile gestures (swipe-to-back, pull-to-refresh).
- Stores drawings as vector paths (SVG/JSON stroke data) ensuring crisp rendering and resolution independence across mobile, tablet, and desktop screens.

### C. Safety & Content Moderation

Automated image moderation APIs screen drawings in public queues before distribution, paired with a 1-tap "Report & Skip" feature for player protection.

---

## 7. Technical Blueprint & Data Schema

```json
{
  "chain_id": "chain_7f8a9b2c",
  "created_at": "2026-08-06T22:00:00Z",
  "max_steps": 6,
  "game_mode": "standard",
  "status": "active",
  "creator_id": "usr_anon_101",
  "steps": [
    {
      "step_number": 1,
      "type": "draw",
      "author_nickname": "Alex",
      "vector_stroke_data": "https://storage.provider.com/strokes/step_1.json",
      "timestamp": "2026-08-06T22:05:00Z"
    },
    {
      "step_number": 2,
      "type": "guess",
      "author_nickname": "Jordan",
      "content": "A cat surfing on a pizza slice",
      "timestamp": "2026-08-06T22:15:00Z"
    }
  ]
}
```

`game_mode` options: `standard`, `blind`, `speed_run`, `palette_lock`.

---

## Product Decisions (from brainstorm)

1. **Primary vibe — friends first, Bottle later**  
   Launch as a friend-group / share-link game. Keep Message in a Bottle / community discovery in the design as a future expansion, not the day-one center of gravity.

2. **Drawing bar — middle ground**  
   Not bare marker-only, not a full art suite. Aim for: a few colors, brush sizes, undo, maybe eraser — enough to make decent doodles without layers or complex tools.

3. **Identity — light play + optional account**  
   Passwordless to play (nickname + contact). Optional account upgrade to save / revisit past games. Not fully anonymous.

4. **Stuck steps — timeout + open invite**  
   If someone doesn’t go (timeout), that slot frees and the chain stays alive. Example: Player 2 ghosts → timeout → Player 1 (or the last person who completed a step) gets the link back and can forward it to **anyone** for the next step, repeating as needed until the chain hits max steps. Creator kick/skip can coexist with auto-timeout; exact creator controls TBD.

5. **Opening prompts — combo + edit**  
   V1 prompts are generated from small drawable word banks (e.g. noun + action/state → “a penguin late for work”). Creator can **reroll** a few times and **edit** freely before drawing. Themed/paid decks later; no blank-only free-text as the default path.

6. **MVP cut**  
   **In:** create chain → draw/guess alternate → share link → timeout + re-invite → reveal (static panels; simple stroke replay if cheap).  
   **Out for V1:** Bottle/community, GIF/video export polish, paid decks, alternate modes, Hall of Fame.

7. **Notifications — email first, SMS later**  
   V1 uses **email** for “your turn” / “game finished” (cheap, global, simple). The share link itself is the main turn-pass mechanic among friends. Optional **Web Push** (PWA) when installed. **SMS later** when volume or monetization justifies Twilio/etc. cost and US A2P registration.

8. **Stack — Nuxt + Supabase**  
   Vue-based (**Nuxt**) so we build on existing familiarity; **Supabase** for Auth (magic link), DB, and stroke/file storage. Best velocity vs learning Next.js from scratch for this async link game.

9. **Chain length — default 6**  
   Default max **6 steps** = typically **3 drawings + 3 guesses** (draw → guess → draw → guess → draw → guess). Doesn’t require 6 people online or even 6 unique friends: async forward fills seats; same small group can pass it around. Optional shorter length (e.g. 4) can be a create-time choice later.

10. **Product name — DoodleLoop**  
    App name is **DoodleLoop** (repo may still be `drawing-game`).

11. **Timeout — 24h default; creator rules later**  
    Keep **24 hours** for V1. Longer-term: loop creators can configure timeout and other rules at create time.

12. **Same player twice — allow for now**  
    Allowed so small groups and solo testing work. Revisit when creator rules land (optional “unique players only”).

13. **Creator kick — deferred**  
    “Creator kick” = creator can skip a stuck friend *before* the 24h timeout. V1 stays timeout + re-invite only.

14. **Dev inspector — closed beta (LAUNCH: strip)**  
    When `NUXT_PUBLIC_DEV_INSPECTOR_KEY` is set, `/dev`, Pass **Play next myself**, and `/c/:slug/dev` appear in **any** build (including Vercel). Re-lock to local-only or remove before public launch.
