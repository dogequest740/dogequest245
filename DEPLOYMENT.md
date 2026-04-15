# Deployment

## Production Overview

- Frontend domain: `https://dogequest.fun`
- Frontend hosting: `Vercel`
- Backend runtime: `Supabase Edge Functions`
- Database and player progress: `Supabase Postgres`
- Telegram bot webhook: `https://ybnheuyaddwtqevelsck.supabase.co/functions/v1/telegram-stars-webhook`

## Live Services

- `game-secure`
- `dungeon-secure`
- `telegram-stars-webhook`
- `world-boss-tick`

All production gameplay requests must go through:

- `https://ybnheuyaddwtqevelsck.supabase.co/functions/v1`

## Payments

### Web

- `SOL`

### Telegram Mini App

- `Stars`
- `TON`
- `USDT on TON`

Payment creation and crediting are handled by `game-secure`.

## What Stores Player Progress

Player progress lives in `Supabase`, not in `Vercel` or `Telegram`.

This includes:

- profiles
- seasons
- referrals
- dungeon state
- fortune state
- miners state
- payment records
- world boss state

## Normal Release Flow

### Frontend changes

If you change UI, client logic, or assets:

1. Commit and push to `main`
2. `Vercel` deploys the site
3. Hard refresh the site or reopen the Telegram mini app to test

### Supabase function changes

If you change server gameplay logic:

1. Deploy the changed function with the Supabase CLI
2. Verify the function is active
3. Test the affected feature live

Typical commands:

```powershell
npx supabase functions deploy game-secure --project-ref ybnheuyaddwtqevelsck --no-verify-jwt
npx supabase functions deploy dungeon-secure --project-ref ybnheuyaddwtqevelsck --no-verify-jwt
npx supabase functions deploy telegram-stars-webhook --project-ref ybnheuyaddwtqevelsck --no-verify-jwt
```

## Environment Expectations

### Vercel production

Expected important env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SOLANA_RPC`
- `VITE_ADMIN_WALLETS`
- `VITE_ENABLE_VILLAGE`
- Telegram analytics vars if Apps Center tracking is needed

Do not point production to any external edge runtime override.

### Supabase secrets

Important production secrets include:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `SOLANA_RPC_URL`
- `ADMIN_WALLETS`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_STARS_WEBHOOK_SECRET`
- `TONCENTER_API_KEY`
- payment provider secrets used by the active flows

## Telegram Notes

- The mini app uses the same production site, not a separate frontend
- The webhook must stay on the Supabase function URL
- After Telegram-related frontend deploys, fully close and reopen the mini app before testing

## Current Infrastructure Rule

- Production uses `Supabase`
- `Railway` is not part of the live stack anymore
