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
