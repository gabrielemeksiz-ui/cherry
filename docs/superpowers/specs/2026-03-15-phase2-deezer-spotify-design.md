# Phase 2 Design: Deezer → Spotify Transfer

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Cherry MVP Phase 2 — core transfer feature

---

## Overview

Add a `/transfer` page that lets users paste a public Deezer playlist URL, preview the playlist, then transfer all tracks to their connected Spotify account. Uses Server-Sent Events (SSE) for real-time progress. Deezer OAuth is unavailable (portal closed), so the flow relies on public Deezer API URLs.

---

## Architecture

```
Browser                    Next.js API Routes           External APIs
──────                     ──────────────────           ─────────────
/transfer page
  │
  ├─ paste URL → GET /api/deezer/playlist?url=…  ──→  api.deezer.com/playlist/{id}
  │              ← { name, trackCount, tracks[] }      (+ paginate /tracks?index=…)
  │
  └─ click Transfer → POST /api/spotify/transfer
                       body: { tracks[], playlistName }
                         │
                         ├─ reads spotify_access_token cookie
                         ├─ POST spotify/v1/users/{id}/playlists
                         └─ for each batch of 50:
                              search tracks → add to playlist
                              ──SSE──▶ { done: N, total: M, unmatched: [] }
```

**Constraints:**
- Spotify `access_token` read from httpOnly cookie server-side — never exposed to browser
- Deezer public API — no auth needed, paginated at 100 tracks per request
- 100ms delay between Spotify batches (rate limit compliance)
- All external API calls server-side (CORS bypass)

---

## Pages & Components

```
app/
  transfer/
    page.tsx              ← Server Component; redirects to / if Spotify not connected
  components/
    TransferPage.tsx      ← Client Component; owns all transfer state
    PlaylistPreview.tsx   ← Displays name, track count, cover after "Analyser"
    TransferProgress.tsx  ← SSE consumer; animated real progress bar
    TransferSummary.tsx   ← Final results: counts + unmatched track list
```

**State machine in `TransferPage`:**
```
idle → analyzing → preview → transferring → done (or error)
```

Each state renders a different sub-component. The "Choisir une playlist →" button on the homepage navigates to `/transfer`.

**`TransferProgress`** opens an `EventSource` to the SSE endpoint and updates `{ done, total, unmatched }` state on each message. On the final `[DONE]` event, transitions to the summary state.

---

## API Routes

### `GET /api/deezer/playlist?url=…`

- Extracts playlist ID from URL via regex
- Fetches `api.deezer.com/playlist/{id}` → name, cover image, total track count
- Paginates `api.deezer.com/playlist/{id}/tracks?limit=100&index=0` until all tracks fetched
- Returns `{ name, trackCount, coverUrl, tracks: [{ title, artist }] }`
- Error cases: invalid URL format, private playlist (Deezer error code 4), API unreachable

### `POST /api/spotify/transfer`

**Body:** `{ playlistName: string, tracks: Array<{ title: string, artist: string }> }`

1. Read `spotify_access_token` from httpOnly cookie
2. `POST /v1/me/playlists` — create empty playlist
3. For each batch of 50 tracks:
   - `GET /v1/search?q=track:{title}+artist:{artist}&type=track&limit=1` per track
   - Collect found URIs; add unmatched to running list
   - `POST /v1/playlists/{id}/tracks` with found URIs
   - Wait 100ms
   - SSE: `data: {"done":N,"total":M,"unmatched":[...]}\n\n`
4. Final event: `data: {"done":M,"total":M,"unmatched":[...],"playlistUrl":"..."}\n\n`
5. Terminator: `data: [DONE]\n\n`

---

## Error Handling

| Scenario | User-facing message (French) |
|---|---|
| Invalid Deezer URL | "URL invalide — colle une URL de playlist Deezer" |
| Private/unfound Deezer playlist | "Cette playlist est privée ou introuvable" |
| Spotify token expired mid-transfer | "Session expirée, reconnecte-toi" + link to homepage |
| Spotify 429 rate limit | Retry once after 1s; if still failing, surface error to user |
| Track not found on Spotify | Added to `unmatched[]` — transfer continues, non-fatal |
| Network drop during SSE | `EventSource` auto-reconnects; partial summary shown with note |

All user-facing messages in French. Raw API errors never shown to user.

---

## UI / UX Flow

1. User arrives at `/transfer` (redirected from homepage CTA)
2. **Idle state:** Input field for Deezer URL + "Analyser" button
3. **Analyzing state:** Spinner while fetching Deezer playlist data
4. **Preview state:** Shows playlist name, cover, track count + "Transférer vers Spotify" button
5. **Transferring state:** Animated progress bar with real count (e.g., "187 / 312 pistes") using SSE
6. **Done state:** Summary card
   - "312 pistes transférées ✅" + "8 introuvables"
   - List of unmatched track titles
   - Link to open playlist in Spotify
   - "Transférer une autre playlist" button (resets to idle)

---

## Testing Plan

Manual browser verification after each feature (per CLAUDE.md — no unit tests for MVP).

| Test | Expected result |
|---|---|
| Valid public Deezer URL | Preview shows correct name + track count |
| Invalid URL (garbage text) | French error message appears inline |
| Private Deezer playlist | "Cette playlist est privée ou introuvable" |
| Small playlist (< 50 tracks) | All tracks transferred, accurate summary |
| Large playlist (100+ tracks) | Pagination works, progress bar advances correctly |
| Unmatched tracks | Appear in summary list after transfer |
| Token expiry mid-transfer | Graceful error with reconnect link |
| Mobile (iPhone Safari) | Responsive layout, touch-friendly buttons |
