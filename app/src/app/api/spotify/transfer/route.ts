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
