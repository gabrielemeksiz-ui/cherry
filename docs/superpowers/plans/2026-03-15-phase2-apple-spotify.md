# Phase 2: Apple Music ↔ Spotify Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build bidirectional playlist transfer between Apple Music and Spotify — Apple Music → Spotify via XML upload, Spotify → Apple Music via iTunes XML download.

**Architecture:** A `/transfer` page with a mode selector renders either `AppleToSpotify` (XML upload → parse → stream transfer to Spotify) or `SpotifyToApple` (list Spotify playlists → select → download iTunes XML). All Spotify API calls are server-side (token stays in httpOnly cookie). Apple Music uses no external API — only file parsing and XML generation. Streaming transfer uses `fetch` + `ReadableStream` with newline-delimited JSON.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, `plist` npm package (Apple Music XML parsing), native Web APIs (ReadableStream, FormData)

> **Note on `plist` vs `xml2js`:** The spec mentions `xml2js` but the plan uses the `plist` package instead. Apple Music exports are Apple plist files — `plist` parses these natively into clean JS objects, while `xml2js` cannot correctly handle the alternating `<key>`/value plist structure. The spec reference to `xml2js` is stale; `plist` is the correct choice.

---

## Chunk 1: Foundation — Dependencies, Homepage, Transfer Page Scaffold

### Task 1: Install `plist` dependency

**Files:**
- Modify: `app/package.json`

- [ ] **Step 1.1: Install plist**

```bash
cd app && npm install plist @types/plist
```

Expected output: `added N packages`

- [ ] **Step 1.2: Verify build still passes**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 1.3: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "deps: add plist for Apple Music XML parsing"
```

---

### Task 2: Update HomePage — remove Deezer, add transfer CTA

**Files:**
- Modify: `app/src/components/HomePage.tsx`

- [ ] **Step 2.1: Replace the component entirely**

Replace `app/src/components/HomePage.tsx` with:

```tsx
'use client'

interface Props {
  isSpotifyConnected: boolean
}

export default function HomePage({ isSpotifyConnected }: Props) {
  function connectSpotify() {
    window.location.href = '/api/auth/spotify'
  }

  function disconnectSpotify() {
    window.location.href = '/api/auth/spotify/logout'
  }

  function goToTransfer() {
    window.location.href = '/transfer'
  }

  return (
    <main className="min-h-screen bg-[#FCE4F1] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-[#E91E8C] tracking-tight">
          Cherry 🍒
        </h1>
        <p className="mt-3 text-lg text-[#2C2C2C] font-medium">
          Transfère tes playlists. Sans limite. Gratuitement.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[24px] shadow-lg w-full max-w-md p-8 flex flex-col gap-5">

        {/* Spotify */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
            Étape 1 — Connecte Spotify
          </p>

          {isSpotifyConnected ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[16px] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <span className="font-semibold text-[#2C2C2C]">Spotify connecté</span>
              </div>
              <button
                onClick={disconnectSpotify}
                className="text-xs text-[#888888] hover:text-red-400 transition-colors cursor-pointer"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={connectSpotify}
              className="flex items-center justify-center gap-3 w-full bg-[#1DB954] hover:bg-[#17a349] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <SpotifyIcon />
              Connecter Spotify
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#F8BBD9]" />

        {/* CTA */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
            Étape 2 — Choisir une direction
          </p>
          <button
            onClick={goToTransfer}
            disabled={!isSpotifyConnected}
            className={`flex items-center justify-center gap-2 w-full font-semibold rounded-[16px] px-5 py-4 transition-all
              ${isSpotifyConnected
                ? 'bg-[#E91E8C] hover:bg-[#c91879] text-white hover:shadow-md active:scale-[0.98] cursor-pointer'
                : 'bg-[#F8BBD9] text-[#E91E8C] opacity-60 cursor-not-allowed'
              }`}
          >
            Choisir une direction →
          </button>
          {!isSpotifyConnected && (
            <p className="text-center text-xs text-[#888888]">
              Connecte Spotify d&apos;abord 👆
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#888888] text-center">
        Apple Music ↔ Spotify · 100% gratuit · Aucun mot de passe stocké
      </p>
    </main>
  )
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
```

- [ ] **Step 2.2: Verify in browser**

Run `npm run dev` (in `app/` directory). Open `http://127.0.0.1:3000`.
- Deezer button is gone
- "Choisir une direction →" button is disabled until Spotify is connected
- After connecting Spotify, button is active and pink

- [ ] **Step 2.3: Commit**

```bash
git add app/src/components/HomePage.tsx
git commit -m "feat: update homepage — remove Deezer, add Apple Music ↔ Spotify CTA"
```

---

### Task 3: Create `/transfer` page — auth guard + scaffold

**Files:**
- Create: `app/src/app/transfer/page.tsx`
- Create: `app/src/components/TransferPage.tsx`

- [ ] **Step 3.1: Create the Server Component page**

Create `app/src/app/transfer/page.tsx`:

```tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TransferPage from '@/components/TransferPage'

export default async function Page() {
  const cookieStore = await cookies()
  const isConnected = !!cookieStore.get('spotify_access_token')

  if (!isConnected) {
    redirect('/')
  }

  return <TransferPage />
}
```

- [ ] **Step 3.2: Create TransferPage client component (scaffold)**

Create `app/src/components/TransferPage.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import ModeSelector from './ModeSelector'
import AppleToSpotify from './AppleToSpotify'
import SpotifyToApple from './SpotifyToApple'

type Mode = 'apple-to-spotify' | 'spotify-to-apple' | null

export default function TransferPage() {
  const [mode, setMode] = useState<Mode>(null)

  if (mode === 'apple-to-spotify') {
    return (
      <Layout>
        <BackButton onClick={() => setMode(null)} />
        <AppleToSpotify />
      </Layout>
    )
  }

  if (mode === 'spotify-to-apple') {
    return (
      <Layout>
        <BackButton onClick={() => setMode(null)} />
        <SpotifyToApple />
      </Layout>
    )
  }

  return (
    <Layout>
      <ModeSelector onSelect={setMode} />
    </Layout>
  )
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FCE4F1] flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <a href="/" className="text-3xl font-bold text-[#E91E8C] tracking-tight">
          Cherry 🍒
        </a>
      </div>
      <div className="bg-white rounded-[24px] shadow-lg w-full max-w-md p-8">
        {children}
      </div>
    </main>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 flex items-center gap-2 text-sm text-[#888888] hover:text-[#E91E8C] transition-colors cursor-pointer"
    >
      ← Retour
    </button>
  )
}
```

- [ ] **Step 3.3: Create ModeSelector component**

Create `app/src/components/ModeSelector.tsx`:

```tsx
type Mode = 'apple-to-spotify' | 'spotify-to-apple'

interface Props {
  onSelect: (mode: Mode) => void
}

export default function ModeSelector({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider mb-2">
        Que veux-tu faire ?
      </p>

      <button
        onClick={() => onSelect('apple-to-spotify')}
        className="flex flex-col items-start gap-1 w-full bg-[#F8BBD9] hover:bg-[#f3a8ca] rounded-[16px] px-6 py-5 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer text-left"
      >
        <span className="text-lg font-bold text-[#E91E8C]">🎵 Apple Music → Spotify</span>
        <span className="text-sm text-[#2C2C2C]">Importe ton fichier XML Apple Music</span>
      </button>

      <button
        onClick={() => onSelect('spotify-to-apple')}
        className="flex flex-col items-start gap-1 w-full border-2 border-[#E91E8C] hover:bg-[#FCE4F1] rounded-[16px] px-6 py-5 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer text-left"
      >
        <span className="text-lg font-bold text-[#E91E8C]">🟢 Spotify → Apple Music</span>
        <span className="text-sm text-[#2C2C2C]">Génère un fichier à importer dans Musique</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 3.4: Create placeholder AppleToSpotify and SpotifyToApple**

Create `app/src/components/AppleToSpotify.tsx`:

```tsx
export default function AppleToSpotify() {
  return <p className="text-center text-[#888888]">Apple Music → Spotify (bientôt)</p>
}
```

Create `app/src/components/SpotifyToApple.tsx`:

```tsx
export default function SpotifyToApple() {
  return <p className="text-center text-[#888888]">Spotify → Apple Music (bientôt)</p>
}
```

- [ ] **Step 3.5: Verify build compiles before browser testing**

```bash
npm run build
```

Expected: no TypeScript errors (all four new component files must compile cleanly).

- [ ] **Step 3.6: Verify in browser**

Open `http://127.0.0.1:3000/transfer` without Spotify connected → should redirect to `/`.
Connect Spotify → click "Choisir une direction →" → should arrive at `/transfer` with two mode cards.
Click "Apple Music → Spotify" → placeholder text appears, Back button returns to mode selector.
Click "Spotify → Apple Music" → same.

- [ ] **Step 3.7: Commit**

```bash
git add app/src/app/transfer/page.tsx app/src/components/TransferPage.tsx app/src/components/ModeSelector.tsx app/src/components/AppleToSpotify.tsx app/src/components/SpotifyToApple.tsx
git commit -m "feat: add /transfer page with mode selector scaffold"
```

---

## Chunk 2: Mode A — Apple Music → Spotify

### Task 4: POST /api/apple/parse — parse uploaded Apple Music XML

**Files:**
- Create: `app/src/app/api/apple/parse/route.ts`

- [ ] **Step 4.1: Create the parse route**

Create `app/src/app/api/apple/parse/route.ts`:

```typescript
import plist from 'plist'

interface ItunesTrack {
  'Track ID': number
  Name: string
  Artist: string
  Album?: string
}

interface ItunesPlaylistItem {
  'Track ID': number
}

interface ItunesPlaylist {
  Name: string
  'Playlist ID': number
  'Playlist Items'?: ItunesPlaylistItem[]
  'Distinguished Kind'?: number
  Master?: boolean
}

interface ItunesLibrary {
  Tracks: Record<string, ItunesTrack>
  Playlists: ItunesPlaylist[]
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return Response.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    if (!file.name.endsWith('.xml')) {
      return Response.json(
        { error: 'Fichier invalide — exporte un fichier .xml depuis Apple Music' },
        { status: 400 }
      )
    }

    const text = await file.text()

    let library: ItunesLibrary
    try {
      library = plist.parse(text) as ItunesLibrary
    } catch {
      return Response.json(
        { error: 'Fichier invalide — exporte un fichier .xml depuis Apple Music' },
        { status: 400 }
      )
    }

    if (!library.Tracks || !library.Playlists) {
      return Response.json(
        { error: 'Aucune playlist trouvée dans ce fichier' },
        { status: 400 }
      )
    }

    const playlists = library.Playlists
      // Exclude smart playlists (Library, Music, Recently Added, etc.)
      .filter(p =>
        p['Playlist Items'] &&
        p['Playlist Items'].length > 0 &&
        !p['Distinguished Kind'] &&
        !p.Master
      )
      .map(p => ({
        name: p.Name,
        trackCount: p['Playlist Items']!.length,
        tracks: p['Playlist Items']!
          .map(item => library.Tracks[String(item['Track ID'])])
          .filter(Boolean)
          .map(t => ({ title: t.Name, artist: t.Artist })),
      }))

    if (playlists.length === 0) {
      return Response.json(
        { error: 'Aucune playlist trouvée dans ce fichier' },
        { status: 400 }
      )
    }

    return Response.json({ playlists })
  } catch {
    return Response.json({ error: 'Erreur lors de la lecture du fichier' }, { status: 500 })
  }
}
```

- [ ] **Step 4.2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 4.3: Commit**

```bash
git add app/src/app/api/apple/parse/route.ts
git commit -m "feat: add /api/apple/parse route for Apple Music XML parsing"
```

---

### Task 5: POST /api/spotify/transfer — streaming transfer to Spotify

**Files:**
- Create: `app/src/app/api/spotify/transfer/route.ts`

- [ ] **Step 5.1: Create the streaming transfer route**

Create `app/src/app/api/spotify/transfer/route.ts`:

```typescript
import { cookies } from 'next/headers'

interface Track {
  title: string
  artist: string
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value ?? null

  if (!accessToken) {
    return Response.json({ error: 'token_expired' }, { status: 401 })
  }

  const { playlistName, tracks }: { playlistName: string; tracks: Track[] } =
    await request.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))
      }

      try {
        // Create Spotify playlist
        const createRes = await fetch('https://api.spotify.com/v1/me/playlists', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: playlistName, public: false }),
        })

        if (createRes.status === 401) {
          send({ error: 'token_expired' })
          controller.close()
          return
        }

        if (!createRes.ok) {
          send({ error: 'create_playlist_failed' })
          controller.close()
          return
        }

        const { id: playlistId } = await createRes.json()
        const total = tracks.length
        let done = 0
        const BATCH_SIZE = 50

        for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
          const batch = tracks.slice(i, i + BATCH_SIZE)
          const unmatchedBatch: Track[] = []
          const uris: string[] = []

          for (const track of batch) {
            const q = encodeURIComponent(`track:${track.title} artist:${track.artist}`)
            const searchRes = await fetch(
              `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            )

            if (searchRes.ok) {
              const data = await searchRes.json()
              const uri = data.tracks?.items?.[0]?.uri
              if (uri) uris.push(uri)
              else unmatchedBatch.push(track)
            } else {
              unmatchedBatch.push(track)
            }
          }

          if (uris.length > 0) {
            const addRes = await fetch(
              `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uris }),
              }
            )

            if (addRes.status === 429) {
              // Retry once after 1 second
              await new Promise(r => setTimeout(r, 1000))
              const retryRes = await fetch(
                `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
                {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ uris }),
                }
              )
              if (retryRes.status === 429) {
                send({ error: 'rate_limit' })
                controller.close()
                return
              }
            }
          }

          done += batch.length
          const isLast = done >= total

          send({
            done,
            total,
            unmatchedBatch,
            ...(isLast ? { playlistUrl: `https://open.spotify.com/playlist/${playlistId}` } : {}),
          })

          // Rate limit delay between batches
          if (!isLast) {
            await new Promise(r => setTimeout(r, 100))
          }
        }

        controller.close()
      } catch {
        send({ error: 'unknown' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
```

- [ ] **Step 5.2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5.3: Commit**

```bash
git add app/src/app/api/spotify/transfer/route.ts
git commit -m "feat: add /api/spotify/transfer streaming route"
```

---

### Task 6: Shared components — PlaylistPreview, TransferProgress, TransferSummary

**Files:**
- Create: `app/src/components/PlaylistPreview.tsx`
- Create: `app/src/components/TransferProgress.tsx`
- Create: `app/src/components/TransferSummary.tsx`

- [ ] **Step 6.1: Create PlaylistPreview**

Create `app/src/components/PlaylistPreview.tsx`:

```tsx
interface Props {
  name: string
  trackCount: number
  onTransfer: () => void
}

export default function PlaylistPreview({ name, trackCount, onTransfer }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#FCE4F1] rounded-[16px] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#2C2C2C]">{name}</p>
          <p className="text-sm text-[#888888]">{trackCount} piste{trackCount > 1 ? 's' : ''}</p>
        </div>
        <span className="text-2xl">🎵</span>
      </div>

      <button
        onClick={onTransfer}
        className="w-full bg-[#E91E8C] hover:bg-[#c91879] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
      >
        Transférer vers Spotify →
      </button>
    </div>
  )
}
```

- [ ] **Step 6.2: Create TransferProgress**

Create `app/src/components/TransferProgress.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

interface Track {
  title: string
  artist: string
}

interface ProgressState {
  done: number
  total: number
  unmatched: Track[]
}

interface DoneState {
  done: number
  total: number
  unmatched: Track[]
  playlistUrl: string
}

interface Props {
  playlistName: string
  tracks: Track[]
  onDone: (result: DoneState) => void
  onError: (error: string) => void
}

export default function TransferProgress({ playlistName, tracks, onDone, onError }: Props) {
  const [progress, setProgress] = useState<ProgressState>({
    done: 0,
    total: tracks.length,
    unmatched: [],
  })

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        const response = await fetch('/api/spotify/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playlistName, tracks }),
        })

        if (!response.ok || !response.body) {
          onError('unknown')
          return
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let allUnmatched: Track[] = []

        while (!cancelled) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.trim()) continue

            const event = JSON.parse(line)

            if (event.error) {
              onError(event.error)
              return
            }

            allUnmatched = [...allUnmatched, ...(event.unmatchedBatch ?? [])]

            if (event.done === event.total && event.playlistUrl) {
              onDone({
                done: event.done,
                total: event.total,
                unmatched: allUnmatched,
                playlistUrl: event.playlistUrl,
              })
              return
            }

            setProgress({ done: event.done, total: event.total, unmatched: allUnmatched })
          }
        }
      } catch {
        if (!cancelled) onError('network_error')
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
        Transfert en cours...
      </p>

      <div className="bg-[#FCE4F1] rounded-full h-4 overflow-hidden">
        <div
          className="bg-[#E91E8C] h-4 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-center text-sm text-[#2C2C2C]">
        {progress.done} / {progress.total} pistes
      </p>

      <p className="text-center text-xs text-[#888888]">
        🎵 Ne ferme pas cette page...
      </p>
    </div>
  )
}
```

- [ ] **Step 6.3: Create TransferSummary**

Create `app/src/components/TransferSummary.tsx`:

```tsx
interface Track {
  title: string
  artist: string
}

interface Props {
  done: number
  total: number
  unmatched: Track[]
  playlistUrl: string
  onReset: () => void
}

export default function TransferSummary({ done, total, unmatched, playlistUrl, onReset }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <span className="text-4xl">🎉</span>
        <h2 className="mt-2 text-xl font-bold text-[#2C2C2C]">Transfert terminé !</h2>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-[16px] px-5 py-4 flex items-center justify-between">
        <span className="text-green-700 font-semibold">{done - unmatched.length} pistes transférées ✅</span>
      </div>

      {unmatched.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-[#888888]">
            {unmatched.length} introuvable{unmatched.length > 1 ? 's' : ''} sur Spotify :
          </p>
          <ul className="bg-[#FCE4F1] rounded-[12px] px-4 py-3 flex flex-col gap-1 max-h-40 overflow-y-auto">
            {unmatched.map((t, i) => (
              <li key={i} className="text-sm text-[#2C2C2C]">
                {t.title} — {t.artist}
              </li>
            ))}
          </ul>
        </div>
      )}

      <a
        href={playlistUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full bg-[#1DB954] hover:bg-[#17a349] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md"
      >
        Ouvrir dans Spotify →
      </a>

      <button
        onClick={onReset}
        className="text-sm text-[#888888] hover:text-[#E91E8C] transition-colors cursor-pointer text-center"
      >
        Transférer une autre playlist
      </button>
    </div>
  )
}
```

- [ ] **Step 6.4: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 6.5: Commit**

```bash
git add app/src/components/PlaylistPreview.tsx app/src/components/TransferProgress.tsx app/src/components/TransferSummary.tsx
git commit -m "feat: add PlaylistPreview, TransferProgress, TransferSummary shared components"
```

---

### Task 7: AppleToSpotify — full Mode A flow

**Files:**
- Modify: `app/src/components/AppleToSpotify.tsx`

- [ ] **Step 7.1: Replace placeholder with full implementation**

Replace `app/src/components/AppleToSpotify.tsx`:

```tsx
'use client'

import { useState, useRef } from 'react'
import PlaylistPreview from './PlaylistPreview'
import TransferProgress from './TransferProgress'
import TransferSummary from './TransferSummary'

interface Track {
  title: string
  artist: string
}

interface ParsedPlaylist {
  name: string
  trackCount: number
  tracks: Track[]
}

interface DoneState {
  done: number
  total: number
  unmatched: Track[]
  playlistUrl: string
}

type State = 'idle' | 'parsing' | 'preview' | 'transferring' | 'done' | 'error'

export default function AppleToSpotify() {
  const [state, setState] = useState<State>('idle')
  const [playlists, setPlaylists] = useState<ParsedPlaylist[]>([])
  const [selectedPlaylist, setSelectedPlaylist] = useState<ParsedPlaylist | null>(null)
  const [result, setResult] = useState<DoneState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setState('parsing')
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/apple/parse', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Erreur lors de la lecture du fichier')
        setState('error')
        return
      }

      setPlaylists(data.playlists)
      setSelectedPlaylist(data.playlists[0])
      setState('preview')
    } catch {
      setError('Erreur réseau — réessaie')
      setState('error')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleTransferDone(r: DoneState) {
    setResult(r)
    setState('done')
  }

  function handleError(err: string) {
    const messages: Record<string, string> = {
      token_expired: 'Session expirée — reconnecte-toi à Spotify',
      rate_limit: 'Limite Spotify atteinte — réessaie dans quelques minutes',
      network_error: 'Connexion interrompue — transfert partiel',
      unknown: 'Une erreur est survenue — réessaie',
    }
    setError(messages[err] ?? messages.unknown)
    setState('error')
  }

  function reset() {
    setState('idle')
    setPlaylists([])
    setSelectedPlaylist(null)
    setResult(null)
    setError(null)
  }

  if (state === 'done' && result) {
    return (
      <TransferSummary
        done={result.done}
        total={result.total}
        unmatched={result.unmatched}
        playlistUrl={result.playlistUrl}
        onReset={reset}
      />
    )
  }

  if (state === 'transferring' && selectedPlaylist) {
    return (
      <TransferProgress
        playlistName={selectedPlaylist.name}
        tracks={selectedPlaylist.tracks}
        onDone={handleTransferDone}
        onError={handleError}
      />
    )
  }

  if (state === 'preview' && selectedPlaylist) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
          Playlist trouvée
        </p>

        {playlists.length > 1 && (
          <select
            value={selectedPlaylist.name}
            onChange={e =>
              setSelectedPlaylist(playlists.find(p => p.name === e.target.value) ?? playlists[0])
            }
            className="w-full border border-[#F8BBD9] rounded-[12px] px-4 py-3 text-[#2C2C2C] text-sm focus:outline-none focus:border-[#E91E8C]"
          >
            {playlists.map(p => (
              <option key={p.name} value={p.name}>
                {p.name} ({p.trackCount} pistes)
              </option>
            ))}
          </select>
        )}

        <PlaylistPreview
          name={selectedPlaylist.name}
          trackCount={selectedPlaylist.trackCount}
          onTransfer={() => setState('transferring')}
        />
      </div>
    )
  }

  if (state === 'parsing') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-8 h-8 border-4 border-[#F8BBD9] border-t-[#E91E8C] rounded-full animate-spin" />
        <p className="text-sm text-[#888888]">Lecture du fichier...</p>
      </div>
    )
  }

  // idle or error
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
        Apple Music → Spotify
      </p>

      <div className="bg-[#FCE4F1] rounded-[12px] px-4 py-3 text-sm text-[#2C2C2C]">
        <p className="font-semibold mb-1">Comment exporter depuis Apple Music :</p>
        <ol className="list-decimal list-inside space-y-1 text-[#555555]">
          <li>Ouvre l&apos;app <strong>Musique</strong> sur Mac</li>
          <li>Menu <strong>Fichier → Bibliothèque → Exporter la bibliothèque</strong></li>
          <li>Enregistre le fichier <code className="bg-white px-1 rounded">.xml</code></li>
          <li>Reviens ici et importe-le 👇</li>
        </ol>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#F8BBD9] hover:border-[#E91E8C] rounded-[16px] px-6 py-10 flex flex-col items-center gap-3 cursor-pointer transition-colors"
      >
        <span className="text-3xl">📂</span>
        <p className="text-sm font-semibold text-[#E91E8C]">Clique ou glisse ton fichier .xml ici</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  )
}
```

- [ ] **Step 7.2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 7.3: Manual browser test — Mode A full flow**

1. Go to `/transfer` → click "Apple Music → Spotify"
2. Export a real XML from Music.app (or create a minimal test XML — see below)
3. Upload the file → playlists should appear
4. Select a playlist → click "Transférer vers Spotify"
5. Progress bar should advance in real time
6. Summary should show transferred count + any unmatched tracks
7. "Ouvrir dans Spotify" link should open the new playlist

**Minimal test XML** (save as `test.xml` to test without Music.app):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Tracks</key>
  <dict>
    <key>100</key>
    <dict>
      <key>Track ID</key><integer>100</integer>
      <key>Name</key><string>Blinding Lights</string>
      <key>Artist</key><string>The Weeknd</string>
    </dict>
    <key>101</key>
    <dict>
      <key>Track ID</key><integer>101</integer>
      <key>Name</key><string>Shape of You</string>
      <key>Artist</key><string>Ed Sheeran</string>
    </dict>
  </dict>
  <key>Playlists</key>
  <array>
    <dict>
      <key>Name</key><string>Ma playlist test</string>
      <key>Playlist ID</key><integer>1</integer>
      <key>Playlist Items</key>
      <array>
        <dict><key>Track ID</key><integer>100</integer></dict>
        <dict><key>Track ID</key><integer>101</integer></dict>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

- [ ] **Step 7.4: Commit**

```bash
git add app/src/components/AppleToSpotify.tsx
git commit -m "feat: implement Apple Music → Spotify full transfer flow (Mode A)"
```

---

## Chunk 3: Mode B — Spotify → Apple Music

### Task 8: GET /api/spotify/playlists — list user's playlists

**Files:**
- Create: `app/src/app/api/spotify/playlists/route.ts`

- [ ] **Step 8.1: Create the playlists route**

Create `app/src/app/api/spotify/playlists/route.ts`:

```typescript
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value ?? null

  if (!accessToken) {
    return Response.json({ error: 'token_expired' }, { status: 401 })
  }

  try {
    const playlists: Array<{ id: string; name: string; trackCount: number; coverUrl?: string }> = []
    let url: string | null = 'https://api.spotify.com/v1/me/playlists?limit=50'

    while (url) {
      const res: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.status === 401) {
        return Response.json({ error: 'token_expired' }, { status: 401 })
      }

      if (!res.ok) {
        return Response.json({ error: 'Impossible de charger tes playlists Spotify' }, { status: 500 })
      }

      const data = await res.json()

      for (const item of data.items) {
        playlists.push({
          id: item.id,
          name: item.name,
          trackCount: item.tracks.total,
          coverUrl: item.images?.[0]?.url,
        })
      }

      url = data.next ?? null
    }

    return Response.json({ playlists })
  } catch {
    return Response.json({ error: 'Impossible de charger tes playlists Spotify' }, { status: 500 })
  }
}
```

- [ ] **Step 8.2: Commit**

```bash
git add app/src/app/api/spotify/playlists/route.ts
git commit -m "feat: add /api/spotify/playlists route"
```

---

### Task 9: GET /api/spotify/playlist/[id]/tracks — fetch all tracks for a playlist

**Files:**
- Create: `app/src/app/api/spotify/playlist/[id]/tracks/route.ts`

- [ ] **Step 9.1: Create the tracks route**

Create `app/src/app/api/spotify/playlist/[id]/tracks/route.ts`:

```typescript
import { cookies } from 'next/headers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('spotify_access_token')?.value ?? null

  if (!accessToken) {
    return Response.json({ error: 'token_expired' }, { status: 401 })
  }

  const { id } = await params

  try {
    const tracks: Array<{ title: string; artist: string; album: string }> = []
    let url: string | null =
      `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100&fields=next,items(track(name,artists,album(name)))`

    while (url) {
      const res: Response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (res.status === 401) {
        return Response.json({ error: 'token_expired' }, { status: 401 })
      }

      if (!res.ok) {
        return Response.json({ error: 'Impossible de charger les pistes' }, { status: 500 })
      }

      const data = await res.json()

      for (const item of data.items) {
        if (!item.track) continue // skip null tracks (deleted songs)
        tracks.push({
          title: item.track.name,
          artist: item.track.artists?.[0]?.name ?? '',
          album: item.track.album?.name ?? '',
        })
      }

      url = data.next ?? null
    }

    return Response.json({ tracks })
  } catch {
    return Response.json({ error: 'Impossible de charger les pistes' }, { status: 500 })
  }
}
```

- [ ] **Step 9.2: Commit**

```bash
git add "app/src/app/api/spotify/playlist/[id]/tracks/route.ts"
git commit -m "feat: add /api/spotify/playlist/[id]/tracks route"
```

---

### Task 10: POST /api/apple/generate — generate iTunes XML for download

**Files:**
- Create: `app/src/app/api/apple/generate/route.ts`

- [ ] **Step 10.1: Create the generate route**

> **Note:** The spec listed this as `GET /api/apple/generate?playlistId={id}` but that is impractical — track lists are too large for a query string. This is implemented as `POST /api/apple/generate` with a JSON body `{ playlistName, tracks[] }`. No state is stored server-side; the client sends the full track list it fetched in the previous step. iTunes XML is hand-rolled (no `plist` needed for output, only for parsing input).

Create `app/src/app/api/apple/generate/route.ts`:

```typescript
interface Track {
  title: string
  artist: string
  album?: string
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateItunesXml(playlistName: string, tracks: Track[]): string {
  const trackEntries = tracks
    .map(
      (t, i) => `    <key>${i + 1}</key>
    <dict>
      <key>Track ID</key><integer>${i + 1}</integer>
      <key>Name</key><string>${escapeXml(t.title)}</string>
      <key>Artist</key><string>${escapeXml(t.artist)}</string>
      ${t.album ? `<key>Album</key><string>${escapeXml(t.album)}</string>` : ''}
    </dict>`
    )
    .join('\n')

  const playlistItems = tracks
    .map((_, i) => `        <dict><key>Track ID</key><integer>${i + 1}</integer></dict>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Major Version</key><integer>1</integer>
  <key>Minor Version</key><integer>1</integer>
  <key>Application Version</key><string>12.8.2</string>
  <key>Tracks</key>
  <dict>
${trackEntries}
  </dict>
  <key>Playlists</key>
  <array>
    <dict>
      <key>Name</key><string>${escapeXml(playlistName)}</string>
      <key>Playlist ID</key><integer>1</integer>
      <key>Playlist Items</key>
      <array>
${playlistItems}
      </array>
    </dict>
  </array>
</dict>
</plist>`
}

export async function POST(request: Request) {
  try {
    const { playlistName, tracks }: { playlistName: string; tracks: Track[] } =
      await request.json()

    if (!playlistName || !tracks?.length) {
      return Response.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const xml = generateItunesXml(playlistName, tracks)
    const filename = `${playlistName.replace(/[^a-zA-Z0-9\s-]/g, '').trim()}.xml`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return Response.json({ error: 'Erreur lors de la génération du fichier' }, { status: 500 })
  }
}
```

- [ ] **Step 10.2: Commit**

```bash
git add app/src/app/api/apple/generate/route.ts
git commit -m "feat: add /api/apple/generate route for iTunes XML export"
```

---

### Task 11: SpotifyToApple — full Mode B flow

**Files:**
- Modify: `app/src/components/SpotifyToApple.tsx`

- [ ] **Step 11.1: Replace placeholder with full implementation**

Replace `app/src/components/SpotifyToApple.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'

interface SpotifyPlaylist {
  id: string
  name: string
  trackCount: number
  coverUrl?: string
}

type State = 'loading' | 'idle' | 'generating' | 'download-ready' | 'error'

export default function SpotifyToApple() {
  const [state, setState] = useState<State>('loading')
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [selected, setSelected] = useState<SpotifyPlaylist | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [downloadName, setDownloadName] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spotify/playlists')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error === 'token_expired'
            ? 'Session expirée — reconnecte-toi à Spotify'
            : data.error)
          setState('error')
          return
        }
        setPlaylists(data.playlists)
        if (data.playlists.length > 0) setSelected(data.playlists[0])
        setState('idle')
      })
      .catch(() => {
        setError('Impossible de charger tes playlists Spotify — réessaie')
        setState('error')
      })
  }, [])

  async function generate() {
    if (!selected) return
    setState('generating')
    setError(null)

    try {
      // Fetch all tracks for the selected playlist
      const tracksRes = await fetch(`/api/spotify/playlist/${selected.id}/tracks`)
      const tracksData = await tracksRes.json()

      if (!tracksRes.ok || tracksData.error) {
        setError(tracksData.error === 'token_expired'
          ? 'Session expirée — reconnecte-toi à Spotify'
          : 'Impossible de charger les pistes — réessaie')
        setState('error')
        return
      }

      // Generate iTunes XML
      const genRes = await fetch('/api/apple/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistName: selected.name, tracks: tracksData.tracks }),
      })

      if (!genRes.ok) {
        setError('Erreur lors de la génération du fichier — réessaie')
        setState('error')
        return
      }

      const blob = await genRes.blob()
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setDownloadName(`${selected.name}.xml`)
      setState('download-ready')
    } catch {
      setError('Erreur réseau — réessaie')
      setState('error')
    }
  }

  function reset() {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl(null)
    setDownloadName('')
    setSelected(playlists[0] ?? null)
    setState('idle')
    setError(null)
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-8 h-8 border-4 border-[#F8BBD9] border-t-[#E91E8C] rounded-full animate-spin" />
        <p className="text-sm text-[#888888]">Chargement de tes playlists...</p>
      </div>
    )
  }

  if (state === 'generating') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-8 h-8 border-4 border-[#F8BBD9] border-t-[#E91E8C] rounded-full animate-spin" />
        <p className="text-sm text-[#888888]">Génération du fichier Apple Music...</p>
      </div>
    )
  }

  if (state === 'download-ready' && downloadUrl) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <span className="text-4xl">✅</span>
          <h2 className="mt-2 text-xl font-bold text-[#2C2C2C]">Fichier prêt !</h2>
        </div>

        <a
          href={downloadUrl}
          download={downloadName}
          className="flex items-center justify-center gap-2 w-full bg-[#E91E8C] hover:bg-[#c91879] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md"
        >
          ⬇️ Télécharger {downloadName}
        </a>

        <div className="bg-[#FCE4F1] rounded-[12px] px-4 py-3 text-sm text-[#2C2C2C]">
          <p className="font-semibold mb-1">Comment importer dans Apple Music :</p>
          <ol className="list-decimal list-inside space-y-1 text-[#555555]">
            <li>Ouvre l&apos;app <strong>Musique</strong> sur Mac</li>
            <li>Menu <strong>Fichier → Importer</strong></li>
            <li>Sélectionne le fichier <code className="bg-white px-1 rounded">.xml</code> téléchargé</li>
            <li>Ta playlist apparaît dans ta bibliothèque 🎵</li>
          </ol>
        </div>

        <button
          onClick={reset}
          className="text-sm text-[#888888] hover:text-[#E91E8C] transition-colors cursor-pointer text-center"
        >
          Exporter une autre playlist
        </button>
      </div>
    )
  }

  // idle or error
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
        Spotify → Apple Music
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <p className="text-sm text-[#555555]">Choisis une playlist Spotify à exporter :</p>

      <select
        value={selected?.id ?? ''}
        onChange={e => setSelected(playlists.find(p => p.id === e.target.value) ?? null)}
        className="w-full border border-[#F8BBD9] rounded-[12px] px-4 py-3 text-[#2C2C2C] text-sm focus:outline-none focus:border-[#E91E8C]"
      >
        {playlists.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.trackCount} pistes)
          </option>
        ))}
      </select>

      {selected && (
        <button
          onClick={generate}
          className="w-full bg-[#E91E8C] hover:bg-[#c91879] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
        >
          Générer le fichier Apple Music →
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 11.2: Verify build**

```bash
npm run build
```

Expected: no TypeScript errors, build succeeds.

- [ ] **Step 11.3: Manual browser test — Mode B full flow**

1. Go to `/transfer` → click "Spotify → Apple Music"
2. Your Spotify playlists should load in the dropdown
3. Select a playlist → click "Générer le fichier Apple Music →"
4. Spinner appears while fetching tracks and generating XML
5. Download button appears with the `.xml` file
6. Download the file → open Music.app → File → Import → select the file (**Mac only — human step, cannot be automated**)
7. Playlist should appear in your Apple Music library

- [ ] **Step 11.4: Commit**

```bash
git add app/src/components/SpotifyToApple.tsx
git commit -m "feat: implement Spotify → Apple Music full export flow (Mode B)"
```

---

### Task 12: Final verification

- [ ] **Step 12.1: Full build check**

```bash
npm run build && npm run lint
```

Expected: clean build, no lint errors.

- [ ] **Step 12.2: End-to-end browser test checklist**

- [ ] Homepage shows "Choisir une direction →" only when Spotify is connected
- [ ] `/transfer` redirects to `/` if not connected
- [ ] Mode selector shows both options
- [ ] Back button returns to mode selector from either mode
- [ ] Mode A: invalid file shows French error
- [ ] Mode A: valid XML shows playlist list
- [ ] Mode A: transfer progress bar advances in real time
- [ ] Mode A: summary shows correct counts and unmatched list
- [ ] Mode A: "Ouvrir dans Spotify" link opens correct playlist
- [ ] Mode B: playlists load correctly
- [ ] Mode B: XML downloads and imports into Music.app
- [ ] Mobile: layout usable on iPhone Safari

- [ ] **Step 12.3: Update AGENTS.md**

In `AGENTS.md`, update the `## Current State` section:

```markdown
**Last Updated:** 2026-03-15
**Working On:** Phase 3 — History + Polish
**Recently Completed:** Phase 2 — Apple Music ↔ Spotify transfer (both directions: XML upload + streaming transfer, Spotify playlist export to iTunes XML)
**Blocked By:** Rien — Phase 2 ✅
```

Mark all Phase 2 checkboxes as `[x]`.

- [ ] **Step 12.4: Update MEMORY.md**

In `MEMORY.md`, update `## 🏗️ Active Phase & Goal`:

```markdown
**Current Task:** Phase 3 — History + Polish
**Next Steps:**
1. Save each transfer to Supabase (table `transfers`: name, source, date, track count, status)
2. History page listing all past transfers
3. Test on mobile (iPhone + Android)
4. Test with 500+ song playlist
5. Fix any visual bugs found
```

Mark Phase 2 as complete in `## 📜 Completed Phases`.

- [ ] **Step 12.5: Final commit**

```bash
git add AGENTS.md MEMORY.md
git commit -m "docs: mark Phase 2 complete, update status to Phase 3"
```
