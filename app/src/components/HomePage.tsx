'use client'

interface Props {
  isSpotifyConnected: boolean
}

export default function HomePage({ isSpotifyConnected }: Props) {
  function connectSpotify() {
    window.location.href = '/api/auth/spotify'
  }

  function disconnectSpotify() {
    window.location.href = '/api/auth/spotify/logout'
  }

  function goToTransfer() {
    window.location.href = '/transfer'
  }

  return (
    <main className="min-h-screen bg-[#FCE4F1] flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl font-bold text-[#E91E8C] tracking-tight">
          Cherry 🍒
        </h1>
        <p className="mt-3 text-lg text-[#2C2C2C] font-medium">
          Transfère tes playlists. Sans limite. Gratuitement.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-[24px] shadow-lg w-full max-w-md p-8 flex flex-col gap-5">

        {/* Spotify */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
            Étape 1 — Connecte Spotify
          </p>

          {isSpotifyConnected ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-[16px] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <span className="font-semibold text-[#2C2C2C]">Spotify connecté</span>
              </div>
              <button
                onClick={disconnectSpotify}
                className="text-xs text-[#888888] hover:text-red-400 transition-colors cursor-pointer"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={connectSpotify}
              className="flex items-center justify-center gap-3 w-full bg-[#1DB954] hover:bg-[#17a349] text-white font-semibold rounded-[16px] px-5 py-4 transition-all hover:shadow-md active:scale-[0.98] cursor-pointer"
            >
              <SpotifyIcon />
              Connecter Spotify
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[#F8BBD9]" />

        {/* CTA */}
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-[#888888] uppercase tracking-wider">
            Étape 2 — Choisir une direction
          </p>
          <button
            onClick={goToTransfer}
            disabled={!isSpotifyConnected}
            className={`flex items-center justify-center gap-2 w-full font-semibold rounded-[16px] px-5 py-4 transition-all
              ${isSpotifyConnected
                ? 'bg-[#E91E8C] hover:bg-[#c91879] text-white hover:shadow-md active:scale-[0.98] cursor-pointer'
                : 'bg-[#F8BBD9] text-[#E91E8C] opacity-60 cursor-not-allowed'
              }`}
          >
            Choisir une direction →
          </button>
          {!isSpotifyConnected && (
            <p className="text-center text-xs text-[#888888]">
              Connecte Spotify d&apos;abord 👆
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#888888] text-center">
        Apple Music ↔ Spotify · 100% gratuit · Aucun mot de passe stocké
      </p>
    </main>
  )
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}
