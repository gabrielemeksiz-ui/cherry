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
