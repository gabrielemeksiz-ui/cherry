import { cookies } from 'next/headers'
import HomePage from '@/components/HomePage'

export default async function Page() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map(c => c.name)
  console.log('[Page] Cookies présents:', allCookies)
  const isSpotifyConnected = !!cookieStore.get('spotify_access_token')

  return <HomePage isSpotifyConnected={isSpotifyConnected} />
}
