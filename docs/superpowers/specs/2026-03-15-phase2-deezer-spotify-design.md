# Phase 2 Design: Deezer → Spotify Transfer

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Cherry MVP Phase 2 — core transfer feature

---

## Overview

Add a `/transfer` page that lets users paste a public Deezer playlist URL, preview the playlist, then transfer all tracks to their connected Spotify account. Uses streaming via `fetch()` + `ReadableStream` for real-time progress (not `EventSource`, which only supports GET). Deezer OAuth is unavailable (portal closed), so the flow relies on public Deezer API URLs.

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
                         ├─ POST /v1/me/playlists
                         └─ for each batch of 50:
                              search tracks → add to playlist
                              ──stream──▶ { done: N, total: M, unmatchedBatch: [] }
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
    page.tsx              ← Server Component; reads `spotify_access_token` cookie via `cookies()` from `next/headers`; redirects to / if absent. **MVP limitation:** does not validate token expiry at page load — an expired-but-present cookie passes the guard and the user hits the expiry error mid-transfer instead. Acceptable for MVP.
  components/
    TransferPage.tsx      ← Client Component; owns all transfer state
    PlaylistPreview.tsx   ← Displays name, track count, cover after "Analyser"
    TransferProgress.tsx  ← stream consumer (fetch + ReadableStream, newline-delimited JSON); animated real progress bar
    TransferSummary.tsx   ← Final results: counts + unmatched track list
```

**State machine in `TransferPage`:**
```
idle → analyzing → preview → transferring → done (or error)
```

Each state renders a different sub-component. The "Choisir une playlist →" button on the homepage navigates to `/transfer`.

**`TransferProgress`** is mounted by `TransferPage` when transitioning to the `transferring` state. On mount, it immediately fires `fetch('POST /api/spotify/transfer', { body })` and reads the response as a `ReadableStream`, parsing newline-delimited JSON events to update `{ done, total, unmatched }`. Using `fetch` + `ReadableStream` (not `EventSource`) avoids the GET-only limitation. Because the stream begins on the same `fetch` call that starts the transfer, there is no race condition. The client transitions to the `done` state when it receives a chunk where `done === total` and `playlistUrl` is present.

---

## API Routes

### `GET /api/deezer/playlist?url=…`

- Extracts playlist ID from URL via regex
- Fetches `api.deezer.com/playlist/{id}` → name, cover image, total track count
- Paginates `api.deezer.com/playlist/{id}/tracks?limit=100&index=0` until all tracks fetched
- Returns `{ name, trackCount, coverUrl, tracks: [{ title, artist }] }`
- Error cases: invalid URL format, private/not-found playlist (Deezer returns `{ error: { type, message, code } }` — exact code must be verified against live API before implementing; treat any `error` key in the response as a non-public playlist), API unreachable

### `POST /api/spotify/transfer`

**Body:** `{ playlistName: string, tracks: Array<{ title: string, artist: string }> }`

1. Read `spotify_access_token` from httpOnly cookie
2. `POST /v1/me/playlists` — create empty playlist
3. Process tracks in batches of 50:
   - For each track in the batch: `GET /v1/search?q=track:{title}+artist:{artist}&type=track&limit=1` (search is per-track, not batched)
   - Collect found URIs; collect unmatched `{ title, artist }` for this batch
   - `POST /v1/playlists/{id}/tracks` with found URIs (Spotify supports up to 100; 50 chosen for conservative rate-limit headroom)
   - Wait 100ms
   - Stream line: `{"done":N,"total":M,"unmatchedBatch":[...]}\n` — `unmatchedBatch` contains only the unmatched tracks from this batch; client merges into its own accumulated list
4. Final line: `{"done":M,"total":M,"unmatchedBatch":[],"playlistUrl":"..."}\n` — client detects completion by `done === total && playlistUrl present`. No separate terminator needed.

---

## Error Handling

| Scenario | User-facing message (French) |
|---|---|
| Invalid Deezer URL | "URL invalide — colle une URL de playlist Deezer" |
| Private/unfound Deezer playlist | "Cette playlist est privée ou introuvable" |
| Spotify token expired mid-transfer | Silent token refresh is out of scope for MVP. Server streams `{"error":"token_expired"}` and closes; client shows "Session expirée, reconnecte-toi" + link to homepage |
| Spotify 429 rate limit | Server retries once after 1s silently (stream pauses); if still 429, streams `{"error":"rate_limit"}` and closes |
| Track not found on Spotify | Added to `unmatchedBatch[]` for that batch — transfer continues, non-fatal |
| Network drop mid-stream | `fetch` stream breaks; client shows partial summary (tracks transferred so far) with note "Connexion interrompue — transfert partiel". No auto-resume — user must restart. Known MVP limitation. |

All user-facing messages in French. Raw API errors never shown to user.

---

## UI / UX Flow

1. User arrives at `/transfer` (redirected from homepage CTA)
2. **Idle state:** Input field for Deezer URL + "Analyser" button
3. **Analyzing state:** Spinner while fetching Deezer playlist data
4. **Preview state:** Shows playlist name, cover, track count + "Transférer vers Spotify" button
5. **Transferring state:** Animated progress bar with real count (e.g., "187 / 312 pistes") via streaming fetch
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
