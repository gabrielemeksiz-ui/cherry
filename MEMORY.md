# System Memory & Context 🧠
<!--
AGENTS: Update this file after every major milestone, structural change, or resolved bug.
DO NOT delete historical context if it is still relevant. Compress older completed items.
-->

## 🏗️ Active Phase & Goal
**Current Task:** Phase 3 — History + Polish
**Next Steps:**
1. Save each transfer to Supabase (table `transfers`: name, source, date, track count, status)
2. History page listing all past transfers
3. Test on mobile (iPhone + Android)
4. Test with 500+ song playlist
5. Fix any visual bugs found

## 📂 Architectural Decisions
- 2026-03-15 — Choisi Next.js (VSCode + Claude) plutôt que Lovable — plus de contrôle nécessaire
- 2026-03-15 — Spotify OAuth implémenté en DIRECT (sans Supabase Auth) — Supabase échouait avec "Error getting user profile from external provider"
- 2026-03-15 — **Cookie fix critique** : Next.js 16 drop les cookies sur les réponses 307 redirect. Workaround : retourner une réponse HTML 200 avec `<meta http-equiv="refresh">` au lieu de `NextResponse.redirect()` dans le callback
- 2026-03-15 — **PIVOT** : Deezer abandonné (portal fermé, API publique ne donne pas accès aux playlists utilisateur). Focus principal : Apple Music ↔ Spotify.
- 2026-03-15 — Apple Music → Spotify : via export XML (File → Library → Export Library dans Music.app)
- 2026-03-15 — Spotify → Apple Music : génère un iTunes Library XML téléchargeable, user l'importe dans Music.app sur Mac. Gratuit, zéro API Apple. Limitation : matching dépend de l'abo Apple Music du user.
- 2026-03-15 — Apple Music supporté via export XML uniquement (API officielle = 99$/an)
- 2026-03-15 — Supabase utilisé uniquement pour la DB (table `transfers`) — PAS pour l'auth
- 2026-03-15 — Spotify rate limit : délai 100ms entre chaque batch de 100 tracks

## 🐛 Known Issues & Quirks
- Next.js 16 proxy.ts (ex-middleware) doit exclure `/api/` du matcher sinon interfère avec les cookies
- Spotify callback utilise `127.0.0.1:3001` (pas `localhost`) — Spotify refusait localhost comme redirect URI non sécurisé

## 📜 Completed Phases
- [x] Phase 1 — Foundation (Spotify OAuth, homepage rose, cookie auth)
- [x] Phase 2 — Apple Music ↔ Spotify transfer
- [ ] Phase 3 — Apple Music XML import
- [ ] Phase 4 — History + Polish
- [ ] Phase 5 — Launch
