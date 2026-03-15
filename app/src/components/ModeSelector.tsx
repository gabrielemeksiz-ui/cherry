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
