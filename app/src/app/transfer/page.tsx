import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TransferPage from '@/components/TransferPage'

export default async function Page() {
  const cookieStore = await cookies()
  const isConnected = !!cookieStore.get('spotify_access_token')

  if (!isConnected) {
    redirect('/')
  }

  return <TransferPage />
}
