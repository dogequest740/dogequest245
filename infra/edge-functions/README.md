# Edge Functions Migration

This repo can move the busy Supabase Edge functions to a separate runtime without moving the database.

## What to move first

Move these functions first because they consume almost all player traffic:

- `game-secure`
- `dungeon-secure`
- `telegram-stars-webhook`

`world-boss-tick` is already triggered through GitHub Actions and Vercel, so it is not part of the urgent Supabase Edge cutover.

## Runtime

Use the Docker image in `infra/edge-functions/Dockerfile`. It runs the same Deno functions with the official Supabase Edge Runtime image.

## Recommended host

For the fastest emergency move, deploy this container to Railway or Render as a single always-on service.

Why this path:

- no database migration
- no function rewrite to Node
- keeps the same function code
- only frontend env and webhook URLs need to change

## Required environment variables

Set these on the new service:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SOLANA_RPC_URL`
- `ADMIN_WALLETS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `TON_API_KEY`
- every other secret currently used by the moved functions

## Public base URL

After deploy, note the new public URL, for example:

- `https://dogequest-edge.up.railway.app`

The standalone runtime exposes functions directly at:

- `https://dogequest-edge.up.railway.app/game-secure`
- `https://dogequest-edge.up.railway.app/dungeon-secure`
- `https://dogequest-edge.up.railway.app/telegram-stars-webhook`

## Frontend cutover

Set this in Vercel:

- `VITE_EDGE_FUNCTIONS_BASE_URL=https://dogequest-edge.up.railway.app`

The client will then call the external runtime instead of `supabase.co/functions/v1`.

## Telegram webhook cutover

Re-point the bot webhook to the new runtime:

- `https://dogequest-edge.up.railway.app/telegram-stars-webhook`

## Health checks to run after deploy

1. Open the browser game and confirm login works.
2. Enter a dungeon and verify `dungeon-secure` responds.
3. Buy a Stars item in Telegram and verify the webhook credits it.
4. Watch Supabase Edge invocation usage stop climbing sharply.

## Rollback

If anything goes wrong, remove `VITE_EDGE_FUNCTIONS_BASE_URL` from Vercel. The frontend will fall back to `SUPABASE_URL/functions/v1`.
