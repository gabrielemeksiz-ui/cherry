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
      library = plist.parse(text) as unknown as ItunesLibrary
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
