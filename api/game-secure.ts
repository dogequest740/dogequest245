import type { VercelRequest, VercelResponse } from '@vercel/node'
import forwardSecureRequest from './_secureProxy'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return forwardSecureRequest(req, res, 'game-secure')
}
