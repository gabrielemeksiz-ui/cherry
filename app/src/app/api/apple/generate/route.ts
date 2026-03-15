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
