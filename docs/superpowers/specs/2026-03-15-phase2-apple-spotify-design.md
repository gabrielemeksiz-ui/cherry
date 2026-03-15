# Phase 2 Design: Apple Music ↔ Spotify Transfer

**Date:** 2026-03-15
**Status:** Approved
**Scope:** Cherry MVP Phase 2 — core transfer feature (replaces Deezer spec, which is superseded)
**Supersedes:** `2026-03-15-phase2-deezer-spotify-design.md`

---

## Overview

Cherry's primary use case is transferring playlists between Apple Music and Spotify — in both directions — completely free. The Deezer direction is dropped (portal closed, no viable public API for user playlists). Two transfer modes:

1. **Apple Music → Spotify**: user exports XML from the Music app → uploads to Cherry → Cherry parses tracks → transfers to Spotify
2. **Spotify → Apple Music**: Cherry fetches user's Spotify playlists → generates an iTunes Library XML file → user downloads and imports into the Music app on Mac

Both modes are 100% free (no Apple Music API, no Deezer API).

---

## Architecture

```
Browser                    Next.js API Routes            External APIs
──────                     ──────────────────            ─────────────

Homepage (/)
  └─ Connect Spotify → /api/auth/spotify (existing)

/transfer page (mode selection)
  │
  ├─ Mode A: Apple Music → Spotify
  │   Upload XML ──→ POST /api/apple/parse
  │                  ← { playlists: [{ name, trackCount, tracks[] }] }
  │   Select playlist + Transfer
  │   ──────────→ POST /api/spotify/transfer
  │               body: { playlistName, tracks[] }
  │               ←── stream: { done, total, unmatchedBatch[] }
  │
  └─ Mode B: Spotify → Apple Music
      List playlists → GET /api/spotify/playlists
                       ← { playlists: [{ id, name, trackCount }] }
      Select playlist → GET /api/spotify/playlist/{id}/tracks
                        ← { tracks: [{ title, artist, album }] }
      Generate XML  → GET /api/apple/generate?playlistId={id}
                      ← iTunes Library XML file (download)
```

**Constraints:**
- Spotify `access_token` read from httpOnly cookie server-side — never exposed to browser
- Apple Music: no API used in either direction — XML only
- All Spotify API calls server-side (token stays in cookie)
- 100ms delay between Spotify add-track batches (rate limit)

---

## Pages & Components

```
app/
  page.tsx                    ← Server Component; checks spotify_access_token cookie;
                                shows Connect Spotify or "Choisir une direction →" CTA
  transfer/
    page.tsx                  ← Server Component; reads spotify_access_token via
                                cookies() from next/headers; redirects to / if absent.
                                MVP limitation: does not validate token expiry at load.
  components/
    HomePage.tsx              ← Updated: removes Deezer button; single CTA post-connect
    TransferPage.tsx          ← Client Component; owns mode selection + all transfer state
    ModeSelector.tsx          ← Two cards: "Apple Music → Spotify" and "Spotify → Apple Music"
    AppleToSpotify.tsx        ← Mode A: XML upload → playlist preview → transfer + progress
    SpotifyToApple.tsx        ← Mode B: Spotify playlist list → select → download XML
    PlaylistPreview.tsx       ← Shared: shows playlist name + track count before transferring
    TransferProgress.tsx      ← Shared: stream consumer (fetch + ReadableStream, newline-delimited JSON)
    TransferSummary.tsx       ← Shared: counts + unmatched track list after transfer
```

**State machine in `AppleToSpotify`:**
```
idle → parsing → preview → transferring → done (or error)
```

**State machine in `SpotifyToApple`:**
```
idle → loading → playlist-selected → generating → download-ready (or error)
```

---

## API Routes

### `POST /api/apple/parse`
**Body:** `multipart/form-data` with XML file

- Parses uploaded XML with `xml2js`
- Extracts all playlists: name, track list (`{ title, artist, album }`)
- Returns `{ playlists: [{ name, trackCount, tracks: [{ title, artist, album }] }] }`
- Error cases: invalid file format, empty file, XML parse failure

### `POST /api/spotify/transfer`
**Body:** `{ playlistName: string, tracks: Array<{ title: string, artist: string }> }`

1. Read `spotify_access_token` from httpOnly cookie
2. `POST /v1/me/playlists` — create empty Spotify playlist
3. Process tracks in batches of 50:
   - Per track: `GET /v1/search?q=track:{title}+artist:{artist}&type=track&limit=1`
   - Collect found URIs; collect unmatched `{ title, artist }` for this batch
   - `POST /v1/playlists/{id}/tracks` with found URIs (50 per call; conservative rate-limit headroom)
   - Wait 100ms
   - Stream line: `{"done":N,"total":M,"unmatchedBatch":[...]}\n`
     — `unmatchedBatch` contains only that batch's unmatched; client merges into accumulated list
4. Final line: `{"done":M,"total":M,"unmatchedBatch":[],"playlistUrl":"..."}\n`
   — client transitions to `done` when `done === total && playlistUrl present`

### `GET /api/spotify/playlists`
- Reads `spotify_access_token` from cookie
- `GET /v1/me/playlists?limit=50` with pagination until all fetched
- Returns `{ playlists: [{ id, name, trackCount, coverUrl }] }`

### `GET /api/spotify/playlist/[id]/tracks`
- Reads `spotify_access_token` from cookie
- `GET /v1/playlists/{id}/tracks` paginated (100 per page)
- Returns `{ tracks: [{ title, artist, album }] }`

### `GET /api/apple/generate?playlistId={id}`
- Reads playlist data from query params or session (tracks passed as JSON body, or fetched again)
- Generates iTunes Library XML (plist format) with track metadata
- Returns XML file as download (`Content-Disposition: attachment; filename="{playlistName}.xml"`)
- **Note:** Music app on Mac imports this and attempts to match tracks against Apple Music catalog. Matching works for Apple Music subscribers; non-subscribers may see tracks as unavailable in Music app. This is an Apple limitation, not Cherry's.

---

## Error Handling

| Scenario | User-facing message (French) |
|---|---|
| Invalid or non-XML file uploaded | "Fichier invalide — exporte un fichier .xml depuis Apple Music" |
| XML parses but has no playlists | "Aucune playlist trouvée dans ce fichier" |
| Spotify token expired mid-transfer | Streams `{"error":"token_expired"}`; client shows "Session expirée, reconnecte-toi" + link to homepage. Silent refresh out of scope for MVP. |
| Spotify 429 rate limit | Server retries once after 1s silently (stream pauses); if still 429, streams `{"error":"rate_limit"}` and closes |
| Track not found on Spotify | Added to `unmatchedBatch[]` — transfer continues, non-fatal |
| Network drop mid-stream | `fetch` stream breaks; client shows partial summary with "Connexion interrompue — transfert partiel". No auto-resume — user must restart. Known MVP limitation. |
| Spotify playlists fetch fails | "Impossible de charger tes playlists Spotify — réessaie" |
| XML generation fails | "Erreur lors de la génération du fichier — réessaie" |

All user-facing messages in French. Raw API errors never shown to user.

---

## UI / UX Flow

### Mode A: Apple Music → Spotify
1. `/transfer` → user clicks "Apple Music → Spotify"
2. **Idle:** File upload zone (drag & drop or click) + instructions: "Exporte tes playlists depuis Musique > Fichier > Bibliothèque > Exporter la bibliothèque"
3. **Parsing:** Spinner while parsing XML
4. **Preview:** List of playlists found in XML; user selects one; shows track count
5. **Transferring:** Real progress bar ("187 / 312 pistes") via streaming fetch
6. **Done:** Summary — "312 pistes transférées ✅ · 8 introuvables" + unmatched list + Spotify playlist link

### Mode B: Spotify → Apple Music
1. `/transfer` → user clicks "Spotify → Apple Music"
2. **Loading:** Fetches and shows user's Spotify playlists (name + track count)
3. **Selected:** User picks a playlist; "Générer le fichier Apple Music" button appears
4. **Generating:** Brief spinner while generating XML
5. **Download ready:** Download button for the `.xml` file + instructions: "Ouvre Musique sur Mac > Fichier > Importer > choisis ce fichier"

---

## Homepage Update

Remove the disabled Deezer button. After Spotify is connected, show a single CTA:

```
✅ Spotify connecté   [Déconnecter]

[ Choisir une direction → ]      ← navigates to /transfer
```

---

## Testing Plan

Manual browser verification after each feature (per CLAUDE.md — no unit tests for MVP).

| Test | Expected result |
|---|---|
| Valid Apple Music XML upload | Playlists listed with correct names + track counts |
| Invalid file upload (e.g. .txt) | French error message, no crash |
| XML with 0 playlists | "Aucune playlist trouvée" message |
| Small Apple Music playlist (< 50 tracks) | All tracks transferred, accurate summary |
| Large Apple Music playlist (100+ tracks) | Pagination works, progress bar advances |
| Unmatched tracks (Apple Music → Spotify) | Appear in summary list |
| Spotify playlist listing | All playlists shown with correct names |
| Spotify → Apple Music XML download | File downloads, imports correctly into Music app on Mac |
| Token expiry mid-transfer | Graceful error with reconnect link |
| Mobile | Layout is responsive and usable |
