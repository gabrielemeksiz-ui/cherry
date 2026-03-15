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
