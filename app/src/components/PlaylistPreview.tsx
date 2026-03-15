interface Props {
  name: string
  trackCount: number
  onTransfer: () => void
}

export default function PlaylistPreview({ name, trackCount, onTransfer }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#FCE4F1] rounded-[16px] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#2C2C2C]">{name}</p>
          <p className="text-sm text-[#888888]">{trackCount} piste{trackCount > 1 ? 's' : ''}</p>
        </div>
        <span className="text-2xl">🎵</span>
      </div>

      <button
        onClick={onTransfer}
        className="w-full bg-[#E91E8C] hover:bg-[#c91879] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
      >
        Transférer vers Spotify →
      </button>
    </div>
  )
}
