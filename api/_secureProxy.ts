import type { VercelRequest, VercelResponse } from '@vercel/node'

const forwardSecureRequest = async (
  req: VercelRequest,
  res: VercelResponse,
  functionName: 'game-secure' | 'dungeon-secure',
) => {
  if (req.method === 'OPTIONS') {
    res.status(204)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'content-type, apikey, authorization, x-session-token')
      .end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed.' })
    return
  }

  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').trim()
  const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (!supabaseUrl || !anonKey) {
    res.status(500).json({ ok: false, error: 'Supabase proxy is not configured.' })
    return
  }

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    apikey: anonKey,
    authorization: `Bearer ${anonKey}`,
  }

  const sessionToken = req.headers['x-session-token']
  if (typeof sessionToken === 'string' && sessionToken.trim()) {
    headers['x-session-token'] = sessionToken.trim()
  }

  try {
    const upstream = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body ?? {}),
    })
    const text = await upstream.text()
    const contentType = upstream.headers.get('content-type') || 'application/json; charset=utf-8'
    res.status(upstream.status)
    res.setHeader('content-type', contentType)
    res.send(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    res.status(502).json({ ok: false, error: `Proxy request failed. ${message}` })
  }
}

export default forwardSecureRequest
