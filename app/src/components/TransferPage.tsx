'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import ModeSelector from './ModeSelector'
import AppleToSpotify from './AppleToSpotify'
import SpotifyToApple from './SpotifyToApple'

type Mode = 'apple-to-spotify' | 'spotify-to-apple' | null

export default function TransferPage() {
  const [mode, setMode] = useState<Mode>(null)

  if (mode === 'apple-to-spotify') {
    return (
      <Layout>
        <BackButton onClick={() => setMode(null)} />
        <AppleToSpotify />
      </Layout>
    )
  }

  if (mode === 'spotify-to-apple') {
    return (
      <Layout>
        <BackButton onClick={() => setMode(null)} />
        <SpotifyToApple />
      </Layout>
    )
  }

  return (
    <Layout>
      <ModeSelector onSelect={setMode} />
    </Layout>
  )
}

function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[#FCE4F1] flex flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 text-center">
        <Link href="/" className="text-3xl font-bold text-[#E91E8C] tracking-tight">
          Cherry 🍒
        </Link>
      </div>
      <div className="bg-white rounded-[24px] shadow-lg w-full max-w-md p-8">
        {children}
      </div>
    </main>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 flex items-center gap-2 text-sm text-[#888888] hover:text-[#E91E8C] transition-colors cursor-pointer"
    >
      ← Retour
    </button>
  )
}
