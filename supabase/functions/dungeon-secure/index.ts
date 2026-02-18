import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";
import { PublicKey } from "npm:@solana/web3.js@1.98.4";

const TICKETS_MAX = 10;
const SHOP_TICKET_CAP = 30;
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const CHALLENGE_TTL_SECONDS = 5 * 60;
const ITEM_TIER_SCORE_MULTIPLIER = 0.5;

const DUNGEON_BASE_REQUIREMENTS = [
  450, 1673, 3002, 4447, 6133, 7818, 9619, 11536, 13569, 15718,
  18162, 20551, 23056, 25677, 28414, 31267, 34468, 37562, 40771, 44096,
];
const DUNGEON_REQUIREMENTS = DUNGEON_BASE_REQUIREMENTS.map((value) => Math.round(value * 2.5));

const DUNGEON_REWARDS = DUNGEON_REQUIREMENTS.map((_, index) =>
  Math.max(1, Math.round((6 + (index + 1) * 4 + Math.pow(index + 1, 1.1)) / 4))
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

const textEncoder = new TextEncoder();

const json = (payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const todayKeyUtc = (now: Date) => now.toISOString().slice(0, 10);

const randomToken = (bytes = 32) => {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  let binary = "";
  for (const value of data) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const isValidWallet = (wallet: string) => {
  try {
    // Throws if address is invalid.
    new PublicKey(wallet);
    return true;
  } catch {
    return false;
  }
};

const decodeBase64 = (value: string) => {
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
};

const getTierScoreFromState = (state: unknown) => {
  if (!state || typeof state !== "object") return 0;
  const equipment = (state as { equipment?: Record<string, { tierScore?: number } | null> }).equipment ?? {};
  const slots = ["weapon", "armor", "head", "legs", "boots", "artifact"];
  let score = 0;
  for (const slot of slots) {
    const tierScore = Number(equipment[slot]?.tierScore ?? 0);
    if (Number.isFinite(tierScore)) score += Math.max(0, Math.round(tierScore * ITEM_TIER_SCORE_MULTIPLIER));
  }
  return score;
};

type DungeonStateRow = {
  wallet: string;
  tickets: number;
  ticket_day: string;
  dungeon_runs: number;
};

const ensureDungeonState = async (supabase: ReturnType<typeof createClient>, wallet: string, now: Date) => {
  const today = todayKeyUtc(now);
  const { data, error } = await supabase
    .from("dungeon_state")
    .select("wallet, tickets, ticket_day, dungeon_runs")
    .eq("wallet", wallet)
    .maybeSingle();

  if (error) return { ok: false as const, error: "Failed to load dungeon state." };

  if (!data) {
    const initialState: DungeonStateRow = {
      wallet,
      tickets: TICKETS_MAX,
      ticket_day: today,
      dungeon_runs: 0,
    };
    const { error: createError } = await supabase.from("dungeon_state").insert({
      wallet,
      tickets: TICKETS_MAX,
      ticket_day: today,
      dungeon_runs: 0,
      updated_at: now.toISOString(),
    });
    if (createError) return { ok: false as const, error: "Failed to create dungeon state." };
    return { ok: true as const, state: initialState };
  }

  const state: DungeonStateRow = {
    wallet,
    tickets: Math.max(0, Number(data.tickets ?? 0)),
    ticket_day: String(data.ticket_day ?? today),
    dungeon_runs: Math.max(0, Number(data.dungeon_runs ?? 0)),
  };

  if (state.ticket_day !== today) {
    state.ticket_day = today;
    state.tickets = TICKETS_MAX;
    const { error: resetError } = await supabase
      .from("dungeon_state")
      .update({
        tickets: state.tickets,
        ticket_day: state.ticket_day,
        updated_at: now.toISOString(),
      })
      .eq("wallet", wallet);
    if (resetError) return { ok: false as const, error: "Failed to reset daily dungeon keys." };
  }

  return { ok: true as const, state };
};

const getSessionWallet = async (supabase: ReturnType<typeof createClient>, req: Request, now: Date) => {
  const token = req.headers.get("x-session-token") ?? "";
  if (!token) {
    return { ok: false as const, error: "Missing session token." };
  }

  const { data, error } = await supabase
    .from("wallet_sessions")
    .select("token, wallet, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return { ok: false as const, error: "Invalid session token." };
  const expiresAtMs = new Date(String(data.expires_at)).getTime();
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime()) {
    await supabase.from("wallet_sessions").delete().eq("token", token);
    return { ok: false as const, error: "Session expired. Sign again." };
  }
  return { ok: true as const, wallet: String(data.wallet), token };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Missing Supabase env." });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const now = new Date();

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." });
  }

  const action = String(body.action ?? "");

  if (action === "challenge") {
    const wallet = String(body.wallet ?? "");
    if (!isValidWallet(wallet)) return json({ ok: false, error: "Invalid wallet address." });

    const nonce = crypto.randomUUID().replace(/-/g, "");
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + CHALLENGE_TTL_SECONDS * 1000).toISOString();
    const message =
      `DOGE QUEST LOGIN\n` +
      `Wallet: ${wallet}\n` +
      `Nonce: ${nonce}\n` +
      `IssuedAt: ${issuedAt}`;

    const { error } = await supabase.from("wallet_auth_nonces").upsert(
      {
        wallet,
        nonce,
        message,
        expires_at: expiresAt,
        updated_at: issuedAt,
      },
      { onConflict: "wallet" },
    );
    if (error) return json({ ok: false, error: "Failed to create signature challenge." });

    return json({
      ok: true,
      wallet,
      message,
      expiresAt,
    });
  }

  if (action === "login") {
    const wallet = String(body.wallet ?? "");
    const signatureBase64 = String(body.signature ?? "");
    if (!isValidWallet(wallet)) return json({ ok: false, error: "Invalid wallet address." });
    if (!signatureBase64) return json({ ok: false, error: "Missing signature." });

    const { data: challenge, error: challengeError } = await supabase
      .from("wallet_auth_nonces")
      .select("wallet, nonce, message, expires_at")
      .eq("wallet", wallet)
      .maybeSingle();

    if (challengeError || !challenge) return json({ ok: false, error: "Challenge not found." });

    const expiresAtMs = new Date(String(challenge.expires_at)).getTime();
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime()) {
      await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
      return json({ ok: false, error: "Challenge expired. Request a new one." });
    }

    const signature = decodeBase64(signatureBase64);
    if (!signature || signature.length !== 64) return json({ ok: false, error: "Invalid signature format." });

    const messageBytes = textEncoder.encode(String(challenge.message));
    const publicKeyBytes = bs58.decode(wallet);
    const verified = nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes);
    if (!verified) return json({ ok: false, error: "Signature verification failed." });

    await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
    await supabase
      .from("wallet_sessions")
      .delete()
      .eq("wallet", wallet)
      .lte("expires_at", now.toISOString());

    const token = randomToken(32);
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000).toISOString();
    const { error: sessionError } = await supabase.from("wallet_sessions").insert({
      token,
      wallet,
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    });

    if (sessionError) return json({ ok: false, error: "Failed to create session." });
    return json({ ok: true, token, expiresAt });
  }

  const auth = await getSessionWallet(supabase, req, now);
  if (!auth.ok) return json({ ok: false, error: auth.error });

  if (action === "status") {
    const stateResult = await ensureDungeonState(supabase, auth.wallet, now);
    if (!stateResult.ok) return json({ ok: false, error: stateResult.error });
    return json({
      ok: true,
      tickets: stateResult.state.tickets,
      ticketDay: stateResult.state.ticket_day,
      dungeonRuns: stateResult.state.dungeon_runs,
    });
  }

  if (action === "use_key") {
    const stateResult = await ensureDungeonState(supabase, auth.wallet, now);
    if (!stateResult.ok) return json({ ok: false, error: stateResult.error });

    if (stateResult.state.tickets >= SHOP_TICKET_CAP) {
      return json({ ok: false, error: "Key storage is full." });
    }

    const nextTickets = stateResult.state.tickets + 1;
    const { error } = await supabase
      .from("dungeon_state")
      .update({
        tickets: nextTickets,
        updated_at: now.toISOString(),
      })
      .eq("wallet", auth.wallet);

    if (error) return json({ ok: false, error: "Failed to apply key." });
    return json({
      ok: true,
      tickets: nextTickets,
      ticketDay: stateResult.state.ticket_day,
      dungeonRuns: stateResult.state.dungeon_runs,
    });
  }

  if (action === "run") {
    const dungeonId = String(body.dungeonId ?? "");
    const dungeonIndex = Number(dungeonId.replace("crypt-", "")) - 1;
    if (!Number.isInteger(dungeonIndex) || dungeonIndex < 0 || dungeonIndex >= DUNGEON_REQUIREMENTS.length) {
      return json({ ok: false, error: "Invalid dungeon id." });
    }

    const stateResult = await ensureDungeonState(supabase, auth.wallet, now);
    if (!stateResult.ok) return json({ ok: false, error: stateResult.error });

    if (stateResult.state.tickets <= 0) {
      return json({ ok: false, error: "No dungeon keys left." });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (profileError || !profileRow) {
      return json({ ok: false, error: "Profile not found." });
    }

    const tierScore = getTierScoreFromState(profileRow.state as unknown);
    const requirement = DUNGEON_REQUIREMENTS[dungeonIndex];
    if (tierScore < requirement) {
      return json({ ok: false, error: `Requires Tier Score ${requirement}.` });
    }

    const reward = DUNGEON_REWARDS[dungeonIndex];
    const nextTickets = stateResult.state.tickets - 1;
    const nextDungeonRuns = stateResult.state.dungeon_runs + 1;

    const { error: updateError } = await supabase
      .from("dungeon_state")
      .update({
        tickets: nextTickets,
        dungeon_runs: nextDungeonRuns,
        updated_at: now.toISOString(),
      })
      .eq("wallet", auth.wallet);

    if (updateError) return json({ ok: false, error: "Failed to save dungeon result." });

    return json({
      ok: true,
      reward,
      tickets: nextTickets,
      ticketDay: stateResult.state.ticket_day,
      dungeonRuns: nextDungeonRuns,
    });
  }

  return json({ ok: false, error: "Unknown action." });
});
