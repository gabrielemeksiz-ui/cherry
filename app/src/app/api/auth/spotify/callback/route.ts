export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return Response.redirect(`${origin}/?spotify_error=access_denied`)
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
  })

  if (!tokenResponse.ok) {
    const errBody = await tokenResponse.text()
    console.error('[Spotify callback] Token exchange failed:', errBody)
    return Response.redirect(`${origin}/?spotify_error=token_failed`)
  }

  const tokens = await tokenResponse.json()
  console.log('[Callback] Token OK:', tokens.access_token?.slice(0, 10))

  // Return a real 200 HTML response with cookies — redirect responses drop cookies in Next.js 16
  const isHttps = new URL(request.url).protocol === 'https:'
  const secure = isHttps ? '; Secure' : ''
  const cookieOptions = `Path=/; Max-Age=${tokens.expires_in}; HttpOnly; SameSite=Lax${secure}`
  const headers = new Headers({ 'Content-Type': 'text/html' })
  headers.append('Set-Cookie', `spotify_access_token=${tokens.access_token}; ${cookieOptions}`)
  if (tokens.refresh_token) {
    headers.append(
      'Set-Cookie',
      `spotify_refresh_token=${tokens.refresh_token}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax${secure}`
    )
  }

  const html = `<!DOCTYPE html><html><head>
    <meta http-equiv="refresh" content="0;url=/">
  </head><body>Connexion réussie, redirection...</body></html>`

  return new Response(html, { headers })
}
