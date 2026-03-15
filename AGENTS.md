# AGENTS.md — Master Plan for Cherry 🍒

## Project Overview & Stack
**App:** Cherry 🍒
**Overview:** Cherry lets users transfer their playlists from Deezer or Apple Music to Spotify — completely free, without the 200-song limit imposed by tools like Soundiiz. Built for Léa (and anyone like her) who wants to move her music library without paying or spending hours doing it manually.
**Stack:** React (generated via Lovable) · Supabase (PostgreSQL + Edge Functions + Auth) · xml2js · Vercel/Lovable hosting
**Critical Constraints:** 100% free stack · No tokens stored server-side · Responsive (mobile + desktop) · No user accounts needed

## Setup & Commands
- **Setup:** `npm install`
- **Development:** `npm run dev`
- **Testing:** `npm test`
- **Linting & Formatting:** `npm run lint`
- **Build:** `npm run build`

> ⚠️ If using Lovable: development, preview, and deploy are handled inside the Lovable UI. Use VSCode + Claude only when you export the code or need to debug complex logic.

## Protected Areas
Do NOT modify these without explicit approval:
- **Supabase migrations** — existing migration files in `supabase/migrations/`
- **OAuth configurations** — Spotify and Deezer client IDs/secrets
- **Environment variables** — `.env` / Lovable secrets panel

## How I Should Think
1. **Understand Intent First** — Before answering, identify what the user actually needs
2. **Ask If Unsure** — If critical information is missing, ask before proceeding
3. **Plan Before Coding** — Propose a plan, get approval, then implement
4. **Verify After Changes** — Run tests/checks after each change; fix failures before moving on
5. **Explain Trade-offs** — When recommending something, mention alternatives

## Plan → Execute → Verify
1. **Plan:** Outline a brief approach and ask for approval before coding
2. **Execute:** Implement one feature at a time
3. **Verify:** Test manually in the browser (or run `npm test`) after each feature; fix before moving on

## Context Files
Load only when needed:
- `agent_docs/tech_stack.md` — Full tech stack details, env vars, API references
- `agent_docs/project_brief.md` — Coding conventions and persistent project rules
- `agent_docs/product_requirements.md` — Features, user stories, success metrics
- `agent_docs/testing.md` — Test strategy and verification steps
- `MEMORY.md` — Current state, decisions, known issues

## Current State
**Last Updated:** 2026-03-15
**Working On:** Phase 3 — History + Polish
**Recently Completed:** Phase 2 — Apple Music ↔ Spotify transfer (both directions: XML upload + streaming transfer, Spotify playlist export to iTunes XML)
**Blocked By:** Rien — Phase 2 ✅

## Roadmap

### Phase 1: Foundation ✅
- [x] Comptes créés : Supabase, Spotify Developer
- [x] Spotify Client ID + Secret récupérés
- [x] Deezer ignoré (portal fermé) — bouton désactivé "bientôt disponible"
- [x] Next.js app avec thème Cherry rose
- [x] Spotify OAuth direct (bypass Supabase Auth — voir MEMORY.md)
- [x] Cookie httpOnly via réponse HTML 200 (fix bug Next.js 16)
- [x] Statut de connexion sur homepage (connecté / déconnecté)

### Phase 2: Core Transfer — Apple Music ↔ Spotify (Jour 3-4)
**Direction A — Apple Music → Spotify**
- [x] Homepage: remove Deezer button, single CTA "Choisir une direction →"
- [x] /transfer page: mode selector (two cards)
- [x] XML upload (drag & drop) + parse with xml2js
- [x] Show playlist list from XML, user selects one
- [x] Transfer to Spotify with streaming progress bar
- [x] Summary: X transferred, Y not found + unmatched list

**Direction B — Spotify → Apple Music**
- [x] Fetch and display user's Spotify playlists
- [x] Generate iTunes Library XML from selected playlist
- [x] Download XML + instructions to import into Music.app on Mac

### Phase 4: History + Polish (Jour 4-5)
- [ ] Save each transfer to Supabase (name, source, date, counts)
- [ ] History page showing all past transfers
- [ ] Test on mobile (iPhone + Android)
- [ ] Test with 500+ song playlist
- [ ] Fix visual bugs

### Phase 5: Launch
- [ ] Deploy via Lovable Publish or Vercel
- [ ] Verify Léa can access without a developer account
- [ ] Share link with Léa 🎉

## What NOT To Do
- Do NOT delete files without explicit confirmation
- Do NOT modify database schemas without a backup plan
- Do NOT add features not in the current phase
- Do NOT skip tests for "simple" changes
- Do NOT store OAuth tokens in plaintext or log them
- Do NOT bypass rate limits — add 100ms delay between Spotify batch requests
- Do NOT use deprecated libraries or patterns
