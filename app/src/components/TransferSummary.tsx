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
