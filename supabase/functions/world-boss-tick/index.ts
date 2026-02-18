import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      deprecated: true,
      message: "World boss writes were moved to game-secure. Disable world-boss-tick schedule.",
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
