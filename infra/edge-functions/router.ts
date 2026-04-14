import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { handler as gameSecureHandler } from "./functions/game-secure/index.ts";
import { handler as dungeonSecureHandler } from "./functions/dungeon-secure/index.ts";
import { handler as telegramStarsWebhookHandler } from "./functions/telegram-stars-webhook/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const port = Number(Deno.env.get("PORT") ?? "8080");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { pathname } = new URL(req.url);
  if (pathname === "/game-secure") return await gameSecureHandler(req);
  if (pathname === "/dungeon-secure") return await dungeonSecureHandler(req);
  if (pathname === "/telegram-stars-webhook") return await telegramStarsWebhookHandler(req);
  if (pathname === "/health") return json({ ok: true });
  return json({ ok: false, error: "Not found." }, 404);
}, { port });
