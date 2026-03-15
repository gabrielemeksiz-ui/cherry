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
