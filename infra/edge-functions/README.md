# Edge Functions Archive

Production now runs fully on Supabase Edge Functions again.

Current live routing:

- browser and Telegram clients call `SUPABASE_URL/functions/v1`
- Telegram Stars webhook points to `SUPABASE_URL/functions/v1/telegram-stars-webhook`
- player progress remains in the same Supabase project and database

This `infra/edge-functions` folder is kept only as an archive of the temporary external-runtime experiment. It is not part of the current production path.

## Current production functions

- `game-secure`
- `dungeon-secure`
- `telegram-stars-webhook`
- `world-boss-tick`

## Current deployment notes

1. Deploy gameplay functions with the Supabase CLI.
2. Keep frontend env pointed at `VITE_SUPABASE_URL`.
3. Do not point Vercel production at any external edge-runtime override.
4. Keep the Telegram webhook pointed at the Supabase function URL.

## Why this note exists

We previously tested an external runtime to reduce Supabase Edge invocations. That path has been retired because production stability matters more than keeping a second runtime in the loop.
