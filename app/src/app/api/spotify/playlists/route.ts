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
        const body = await res.text()
        console.error('[playlists] Spotify error', res.status, body)
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
