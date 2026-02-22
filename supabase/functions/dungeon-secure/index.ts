import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nacl from "npm:tweetnacl@1.0.3";
import bs58 from "npm:bs58@6.0.0";
import { PublicKey } from "npm:@solana/web3.js@1.98.4";

const TICKETS_MAX = 5;
const SHOP_TICKET_CAP = 30;
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const CHALLENGE_TTL_SECONDS = 5 * 60;
const CHALLENGE_REUSE_WINDOW_SECONDS = 10;
const ITEM_TIER_SCORE_MULTIPLIER = 0.5;
const PREMIUM_DUNGEON_CRYSTAL_MULTIPLIER = 1.5;
const BLOCKED_ERROR_MESSAGE = "You have been banned for cheating.";

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

const auditEvent = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  kind: string,
  details: Record<string, unknown> = {},
) => {
  await supabase.from("security_events").insert({
    wallet,
    kind,
    details,
  });
};

const getBlockedWallet = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("blocked_wallets")
    .select("wallet, reason")
    .eq("wallet", wallet)
    .maybeSingle();
  if (error || !data) return null;
  return {
    wallet: String(data.wallet),
    reason: String(data.reason ?? "Cheating"),
  };
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

const asInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
};

type DungeonStateRow = {
  wallet: string;
  tickets: number;
  ticket_day: string;
  dungeon_runs: number;
  updated_at?: string;
};

const toDungeonState = (
  wallet: string,
  row: Record<string, unknown>,
  fallbackIso: string,
): DungeonStateRow => ({
  wallet,
  tickets: Math.max(0, asInt(row.tickets, 0)),
  ticket_day: String(row.ticket_day ?? ""),
  dungeon_runs: Math.max(0, asInt(row.dungeon_runs, 0)),
  updated_at: String(row.updated_at ?? fallbackIso),
});

const ensureDungeonState = async (supabase: ReturnType<typeof createClient>, wallet: string, now: Date) => {
  const dayKey = todayKeyUtc(now);
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from("dungeon_state")
      .select("wallet, tickets, ticket_day, dungeon_runs, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();
    if (error) return { ok: false as const, error: "Failed to load dungeon state." };

    let current: DungeonStateRow;
    if (data) {
      current = toDungeonState(wallet, data as Record<string, unknown>, nowIso);
    } else {
      const initial: DungeonStateRow = {
        wallet,
        tickets: TICKETS_MAX,
        ticket_day: dayKey,
        dungeon_runs: 0,
        updated_at: nowIso,
      };
      const { error: insertError } = await supabase
        .from("dungeon_state")
        .insert(initial);
      if (insertError) continue;
      current = initial;
    }

    if (current.ticket_day === dayKey) {
      return { ok: true as const, state: current };
    }

    const { data: updated, error: updateError } = await supabase
      .from("dungeon_state")
      .update({
        tickets: TICKETS_MAX,
        ticket_day: dayKey,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("ticket_day", current.ticket_day)
      .eq("tickets", current.tickets)
      .eq("dungeon_runs", current.dungeon_runs)
      .select("wallet, tickets, ticket_day, dungeon_runs, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Failed to sync dungeon state." };
};

const addDungeonTicket = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const nowIso = now.toISOString();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureDungeonState(supabase, wallet, now);
    if (!ensured.ok) return ensured;

    const current = ensured.state;
    if (current.tickets >= SHOP_TICKET_CAP) {
      return { ok: false as const, error: "Key storage is full.", state: current };
    }

    const nextTickets = current.tickets + 1;
    const { data: updated, error: updateError } = await supabase
      .from("dungeon_state")
      .update({
        tickets: nextTickets,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("ticket_day", current.ticket_day)
      .eq("tickets", current.tickets)
      .eq("dungeon_runs", current.dungeon_runs)
      .select("wallet, tickets, ticket_day, dungeon_runs, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Dungeon key conflict, retry." };
};

const spendDungeonTicket = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const nowIso = now.toISOString();
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureDungeonState(supabase, wallet, now);
    if (!ensured.ok) return ensured;

    const current = ensured.state;
    if (current.tickets <= 0) {
      return { ok: false as const, error: "No dungeon keys left.", state: current };
    }

    const nextTickets = current.tickets - 1;
    const nextDungeonRuns = current.dungeon_runs + 1;
    const { data: updated, error: updateError } = await supabase
      .from("dungeon_state")
      .update({
        tickets: nextTickets,
        dungeon_runs: nextDungeonRuns,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("ticket_day", current.ticket_day)
      .eq("tickets", current.tickets)
      .eq("dungeon_runs", current.dungeon_runs)
      .select("wallet, tickets, ticket_day, dungeon_runs, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Dungeon run conflict, retry." };
};

const rollbackDungeonTicketSpend = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  spentState: DungeonStateRow,
  now: Date,
) => {
  const nowIso = now.toISOString();
  const revertedTickets = Math.max(0, asInt(spentState.tickets, 0) + 1);
  const revertedRuns = Math.max(0, asInt(spentState.dungeon_runs, 0) - 1);
  const { data: updated, error } = await supabase
    .from("dungeon_state")
    .update({
      tickets: revertedTickets,
      dungeon_runs: revertedRuns,
      updated_at: nowIso,
    })
    .eq("wallet", wallet)
    .eq("ticket_day", spentState.ticket_day)
    .eq("tickets", spentState.tickets)
    .eq("dungeon_runs", spentState.dungeon_runs)
    .select("wallet")
    .maybeSingle();
  return !error && Boolean(updated);
};

const creditDungeonRewardToProfile = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  reward: number,
  dungeonRuns: number,
  now: Date,
) => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();
    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return { ok: false as const, error: "Profile not found." };
    }

    const nextState = structuredClone(profileRow.state) as Record<string, unknown>;
    const currentCrystals = Math.max(0, asInt(nextState.crystals, 0));
    const currentCrystalsEarned = Math.max(0, asInt(nextState.crystalsEarned ?? nextState.crystals, 0));
    const currentDungeonRuns = Math.max(0, asInt(nextState.dungeonRuns, 0));
    nextState.crystals = currentCrystals + reward;
    nextState.crystalsEarned = currentCrystalsEarned + reward;
    nextState.dungeonRuns = Math.max(currentDungeonRuns, Math.max(0, asInt(dungeonRuns, 0)));

    const expectedUpdatedAt = String(profileRow.updated_at ?? "");
    const updatedAt = now.toISOString();
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        state: nextState,
        updated_at: updatedAt,
      })
      .eq("wallet", wallet)
      .eq("updated_at", expectedUpdatedAt)
      .select("wallet, updated_at")
      .maybeSingle();
    if (!updateError && updated) {
      return {
        ok: true as const,
        state: nextState,
        updatedAt: String((updated as { updated_at?: string }).updated_at ?? updatedAt),
      };
    }
  }
  return { ok: false as const, error: "Profile changed concurrently, retry." };
};

const consumeDungeonKeyFromProfile = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  consumableId: number | null,
  now: Date,
) => {
  const hasTargetId = typeof consumableId === "number" && Number.isFinite(consumableId) && consumableId > 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();

    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return { ok: false as const, error: "Profile not found." };
    }

    const nextState = structuredClone(profileRow.state) as Record<string, unknown>;
    const rawConsumables = Array.isArray(nextState.consumables) ? [...nextState.consumables] : [];
    let removed = false;
    const nextConsumables: unknown[] = [];
    let maxId = 0;

    for (const entry of rawConsumables) {
      if (!entry || typeof entry !== "object") {
        nextConsumables.push(entry);
        continue;
      }
      const row = entry as Record<string, unknown>;
      const entryId = Math.max(0, asInt(row.id, 0));
      maxId = Math.max(maxId, entryId);
      const entryType = String(row.type ?? "");
      const matchesTarget = hasTargetId ? entryId === consumableId : true;
      if (!removed && entryType === "key" && matchesTarget) {
        removed = true;
        continue;
      }
      nextConsumables.push(row);
    }

    if (!removed) {
      return { ok: false as const, error: "Dungeon key item not found." };
    }

    nextState.consumables = nextConsumables;
    nextState.consumableId = Math.max(asInt(nextState.consumableId, 0), maxId);

    const expectedUpdatedAt = String(profileRow.updated_at ?? "");
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        state: nextState,
        updated_at: now.toISOString(),
      })
      .eq("wallet", wallet)
      .eq("updated_at", expectedUpdatedAt)
      .select("wallet")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const };
    }
  }

  return { ok: false as const, error: "Profile changed concurrently, retry." };
};

const refundDungeonKeyToProfile = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();
    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return false;
    }

    const nextState = structuredClone(profileRow.state) as Record<string, unknown>;
    const rawConsumables = Array.isArray(nextState.consumables) ? [...nextState.consumables] : [];
    let maxId = Math.max(0, asInt(nextState.consumableId, 0));
    for (const entry of rawConsumables) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      maxId = Math.max(maxId, Math.max(0, asInt(row.id, 0)));
    }

    const nextId = maxId + 1;
    const keyItem = {
      id: nextId,
      type: "key",
      name: "Dungeon Key",
      description: "+1 dungeon entry.",
      icon: "",
    };

    nextState.consumables = [keyItem, ...rawConsumables];
    nextState.consumableId = nextId;

    const expectedUpdatedAt = String(profileRow.updated_at ?? "");
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        state: nextState,
        updated_at: now.toISOString(),
      })
      .eq("wallet", wallet)
      .eq("updated_at", expectedUpdatedAt)
      .select("wallet")
      .maybeSingle();

    if (!updateError && updated) {
      return true;
    }
  }

  return false;
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
  const wallet = String(data.wallet);
  const blocked = await getBlockedWallet(supabase, wallet);
  if (blocked) {
    await supabase.from("wallet_sessions").delete().eq("token", token);
    await auditEvent(supabase, wallet, "blocked_session_denied", { reason: blocked.reason });
    return { ok: false as const, error: BLOCKED_ERROR_MESSAGE };
  }
  return { ok: true as const, wallet, token };
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

    const blocked = await getBlockedWallet(supabase, wallet);
    if (blocked) {
      await auditEvent(supabase, wallet, "blocked_login_attempt", { reason: blocked.reason, action: "challenge" });
      return json({ ok: false, error: BLOCKED_ERROR_MESSAGE });
    }

    await supabase.from("wallet_auth_nonces").delete().lt("expires_at", now.toISOString());

    const { data: existingChallenge, error: existingChallengeError } = await supabase
      .from("wallet_auth_nonces")
      .select("wallet, nonce, message, expires_at, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();

    if (existingChallengeError) {
      return json({ ok: false, error: "Failed to load signature challenge." });
    }

    if (existingChallenge) {
      const expiresAtMs = new Date(String(existingChallenge.expires_at)).getTime();
      const updatedAtMs = new Date(String(existingChallenge.updated_at ?? existingChallenge.expires_at)).getTime();
      const stillValid = Number.isFinite(expiresAtMs) && expiresAtMs > now.getTime();
      const recentlyIssued = Number.isFinite(updatedAtMs) &&
        now.getTime() - updatedAtMs <= CHALLENGE_REUSE_WINDOW_SECONDS * 1000;
      if (stillValid && recentlyIssued) {
        await auditEvent(supabase, wallet, "wallet_challenge_reused");
        return json({
          ok: true,
          wallet,
          message: String(existingChallenge.message),
          expiresAt: String(existingChallenge.expires_at),
        });
      }
    }

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

    await auditEvent(supabase, wallet, "wallet_challenge_issued", {
      expiresAt,
    });

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

    const blocked = await getBlockedWallet(supabase, wallet);
    if (blocked) {
      await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
      await supabase.from("wallet_sessions").delete().eq("wallet", wallet);
      await auditEvent(supabase, wallet, "blocked_login_attempt", { reason: blocked.reason, action: "login" });
      return json({ ok: false, error: BLOCKED_ERROR_MESSAGE });
    }

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
    if (!signature || signature.length !== 64) {
      await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
      await auditEvent(supabase, wallet, "wallet_login_failed", { reason: "invalid_signature_format" });
      return json({ ok: false, error: "Invalid signature format. Request a new challenge." });
    }

    const messageBytes = textEncoder.encode(String(challenge.message));
    const publicKeyBytes = bs58.decode(wallet);
    const verified = nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes);
    if (!verified) {
      await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
      await supabase.from("security_events").insert({
        wallet,
        kind: "wallet_login_failed",
        details: { reason: "signature_verification_failed", at: now.toISOString() },
      });
      return json({ ok: false, error: "Signature verification failed. Request a new challenge." });
    }

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
    await auditEvent(supabase, wallet, "wallet_login_success");
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
    const consumableIdRaw = Math.max(0, asInt(body.consumableId, 0));
    const consumableId = consumableIdRaw > 0 ? consumableIdRaw : null;

    const stateCheck = await ensureDungeonState(supabase, auth.wallet, now);
    if (!stateCheck.ok) return json({ ok: false, error: stateCheck.error });
    if (stateCheck.state.tickets >= SHOP_TICKET_CAP) {
      return json({ ok: false, error: "Key storage is full." });
    }

    const consumeResult = await consumeDungeonKeyFromProfile(supabase, auth.wallet, consumableId, now);
    if (!consumeResult.ok) {
      await auditEvent(supabase, auth.wallet, "dungeon_key_use_denied", {
        consumableId,
        reason: consumeResult.error,
      });
      return json({ ok: false, error: consumeResult.error });
    }

    const ticketResult = await addDungeonTicket(supabase, auth.wallet, now);
    if (!ticketResult.ok) {
      const refunded = await refundDungeonKeyToProfile(supabase, auth.wallet, now);
      await auditEvent(supabase, auth.wallet, "dungeon_key_refund_attempt", {
        consumableId,
        reason: ticketResult.error,
        refunded,
      });
      return json({ ok: false, error: ticketResult.error || "Failed to apply key." });
    }

    await auditEvent(supabase, auth.wallet, "dungeon_key_used", {
      consumableId,
      tickets: ticketResult.state.tickets,
      ticketDay: ticketResult.state.ticket_day,
    });
    return json({
      ok: true,
      tickets: ticketResult.state.tickets,
      ticketDay: ticketResult.state.ticket_day,
      dungeonRuns: ticketResult.state.dungeon_runs,
    });
  }

  if (action === "run") {
    const dungeonId = String(body.dungeonId ?? "");
    const dungeonIndex = Number(dungeonId.replace("crypt-", "")) - 1;
    if (!Number.isInteger(dungeonIndex) || dungeonIndex < 0 || dungeonIndex >= DUNGEON_REQUIREMENTS.length) {
      return json({ ok: false, error: "Invalid dungeon id." });
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

    const ticketSpend = await spendDungeonTicket(supabase, auth.wallet, now);
    if (!ticketSpend.ok) {
      return json({ ok: false, error: ticketSpend.error || "No dungeon keys left." });
    }

    const baseReward = DUNGEON_REWARDS[dungeonIndex];
    const profileStateForPremium = profileRow.state && typeof profileRow.state === "object"
      ? (profileRow.state as Record<string, unknown>)
      : null;
    const premiumEndsAt = Math.max(0, asInt(profileStateForPremium?.premiumEndsAt, 0));
    const premiumActive = premiumEndsAt > now.getTime();
    const reward = premiumActive
      ? Math.max(0, Math.round(baseReward * PREMIUM_DUNGEON_CRYSTAL_MULTIPLIER))
      : baseReward;

    const creditResult = await creditDungeonRewardToProfile(
      supabase,
      auth.wallet,
      reward,
      ticketSpend.state.dungeon_runs,
      now,
    );
    if (!creditResult.ok || !creditResult.state) {
      const rolledBack = await rollbackDungeonTicketSpend(supabase, auth.wallet, ticketSpend.state, now);
      await auditEvent(supabase, auth.wallet, "dungeon_run_credit_failed", {
        dungeonId,
        dungeonIndex: dungeonIndex + 1,
        reward,
        premiumActive,
        rollbackApplied: rolledBack,
        reason: creditResult.error || "credit_failed",
      });
      return json({ ok: false, error: "Failed to credit dungeon reward. Please retry." });
    }

    await auditEvent(supabase, auth.wallet, "dungeon_run", {
      dungeonId,
      dungeonIndex: dungeonIndex + 1,
      reward,
      premiumActive,
      tickets: ticketSpend.state.tickets,
      dungeonRuns: ticketSpend.state.dungeon_runs,
    });

    return json({
      ok: true,
      reward,
      tickets: ticketSpend.state.tickets,
      ticketDay: ticketSpend.state.ticket_day,
      dungeonRuns: ticketSpend.state.dungeon_runs,
      crystals: Math.max(0, asInt(creditResult.state.crystals, 0)),
      crystalsEarned: Math.max(0, asInt(creditResult.state.crystalsEarned, 0)),
      savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
    });
  }

  return json({ ok: false, error: "Unknown action." });
});
