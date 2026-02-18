import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_LEVEL = 255;
const WITHDRAW_RATE = 15000;
const WITHDRAW_MIN = 2000;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-token",
};

type Metrics = {
  level: number;
  xp: number;
  xpNext: number;
  gold: number;
  crystals: number;
  crystalsEarned: number;
  monsterKills: number;
  dungeonRuns: number;
};

const json = (payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const asInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
};

const clampInt = (value: unknown, min: number, max: number) => {
  const parsed = asInt(value, min);
  return Math.max(min, Math.min(max, parsed));
};

const sanitizeName = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 18) || "Hero";

const getMetrics = (state: Record<string, unknown>): Metrics => {
  const player = (state.player as Record<string, unknown> | undefined) ?? {};
  return {
    level: clampInt(player.level, 1, MAX_LEVEL),
    xp: Math.max(0, asInt(player.xp, 0)),
    xpNext: Math.max(1, asInt(player.xpNext, 1)),
    gold: Math.max(0, asInt(state.gold, 0)),
    crystals: Math.max(0, asInt(state.crystals, 0)),
    crystalsEarned: Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0)),
    monsterKills: Math.max(0, asInt(state.monsterKills, 0)),
    dungeonRuns: Math.max(0, asInt(state.dungeonRuns, 0)),
  };
};

const normalizeState = (raw: unknown) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const state = structuredClone(raw) as Record<string, unknown>;
  const playerRaw = (state.player as Record<string, unknown> | undefined) ?? {};
  const player = {
    ...playerRaw,
    level: clampInt(playerRaw.level, 1, MAX_LEVEL),
    xp: Math.max(0, asInt(playerRaw.xp, 0)),
    xpNext: Math.max(1, asInt(playerRaw.xpNext, 1)),
    baseAttack: Math.max(1, asInt(playerRaw.baseAttack, 1)),
    baseAttackSpeed: Math.max(0, Number(playerRaw.baseAttackSpeed ?? 0)),
    baseSpeed: Math.max(0, asInt(playerRaw.baseSpeed, 0)),
    baseRange: Math.max(0, asInt(playerRaw.baseRange, 0)),
  };
  state.player = player;
  state.name = sanitizeName(state.name);
  state.gold = Math.max(0, asInt(state.gold, 0));
  state.crystals = Math.max(0, asInt(state.crystals, 0));
  state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0));
  state.monsterKills = Math.max(0, asInt(state.monsterKills, 0));
  state.dungeonRuns = Math.max(0, asInt(state.dungeonRuns, 0));
  state.energy = Math.max(0, asInt(state.energy, 0));
  state.energyMax = Math.max(1, asInt(state.energyMax, 50));
  state.tickets = clampInt(state.tickets, 0, 30);
  return state;
};

const validateStateTransition = (
  prev: Metrics | null,
  next: Metrics,
  elapsedSec: number,
) => {
  if (!prev) {
    if (next.level > 30) return "Initial profile level is too high.";
    if (next.crystals > 10000) return "Initial profile crystals are too high.";
    if (next.gold > 500000) return "Initial profile gold is too high.";
    return null;
  }

  if (next.level < prev.level) return "Level rollback is not allowed.";
  if (next.monsterKills < prev.monsterKills) return "Monster kill rollback is not allowed.";
  if (next.dungeonRuns < prev.dungeonRuns) return "Dungeon run rollback is not allowed.";
  if (next.crystalsEarned < prev.crystalsEarned) return "Crystals earned rollback is not allowed.";

  const safeElapsed = Math.max(1, elapsedSec);
  const levelDelta = Math.max(0, next.level - prev.level);
  const killsDelta = Math.max(0, next.monsterKills - prev.monsterKills);
  const dungeonDelta = Math.max(0, next.dungeonRuns - prev.dungeonRuns);
  const crystalDelta = Math.max(0, next.crystals - prev.crystals);
  const goldDelta = Math.max(0, next.gold - prev.gold);

  const maxLevelGain = Math.max(2, Math.floor(safeElapsed / 20));
  if (levelDelta > maxLevelGain) return "Suspicious level gain detected.";

  const maxKillGain = Math.max(60, Math.floor(safeElapsed * 8));
  if (killsDelta > maxKillGain) return "Suspicious monster kill gain detected.";

  const maxDungeonGain = Math.max(2, Math.floor(safeElapsed / 5));
  if (dungeonDelta > maxDungeonGain) return "Suspicious dungeon run gain detected.";

  const worldBossAllowance = Math.floor(safeElapsed / (12 * 60 * 60)) * 600 + 600;
  const referralAllowance = Math.floor(safeElapsed / (24 * 60 * 60)) * 5000 + 2000;
  const maxCrystalGain = dungeonDelta * 35 + worldBossAllowance + referralAllowance + 500;
  if (crystalDelta > maxCrystalGain) return "Suspicious crystal gain detected.";

  const maxGoldGain = Math.floor(safeElapsed / 60) * 15000 + killsDelta * 150 + dungeonDelta * 20000 + 100000;
  if (goldDelta > maxGoldGain) return "Suspicious gold gain detected.";

  if (next.level === MAX_LEVEL && next.monsterKills < 20000 && next.dungeonRuns < 150) {
    return "Max level reached too early.";
  }
  if (next.crystals > 70000 && next.dungeonRuns < 20) {
    return "Crystal balance is too high for current progress.";
  }
  if (next.gold > 1000000 && next.monsterKills < 5000) {
    return "Gold balance is too high for current progress.";
  }

  return null;
};

const getSessionWallet = async (
  supabase: ReturnType<typeof createClient>,
  req: Request,
  now: Date,
) => {
  const token = req.headers.get("x-session-token") ?? "";
  if (!token) {
    return { ok: false as const, error: "Missing session token." };
  }
  const { data, error } = await supabase
    .from("wallet_sessions")
    .select("token, wallet, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, error: "Invalid session token." };
  }
  const expiresAtMs = new Date(String(data.expires_at)).getTime();
  if (Number.isNaN(expiresAtMs) || expiresAtMs <= now.getTime()) {
    await supabase.from("wallet_sessions").delete().eq("token", token);
    return { ok: false as const, error: "Session expired. Sign again." };
  }
  return { ok: true as const, wallet: String(data.wallet) };
};

const toWalletList = (raw: string | undefined) =>
  (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

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
  const auth = await getSessionWallet(supabase, req, now);
  if (!auth.ok) return json({ ok: false, error: auth.error });

  if (action === "profile_save") {
    const normalizedState = normalizeState(body.state);
    if (!normalizedState) {
      return json({ ok: false, error: "Invalid profile payload." });
    }

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (existingError) {
      return json({ ok: false, error: "Failed to load profile." });
    }

    const prevState = existing?.state && typeof existing.state === "object"
      ? (existing.state as Record<string, unknown>)
      : null;
    const prevMetrics = prevState ? getMetrics(prevState) : null;
    const nextMetrics = getMetrics(normalizedState);
    const previousUpdatedAtMs = existing?.updated_at ? new Date(String(existing.updated_at)).getTime() : Number.NaN;
    const elapsedSec = Number.isFinite(previousUpdatedAtMs)
      ? Math.max(1, Math.floor((now.getTime() - previousUpdatedAtMs) / 1000))
      : 3600;

    const validationError = validateStateTransition(prevMetrics, nextMetrics, elapsedSec);
    if (validationError) {
      await supabase.from("security_events").insert({
        wallet: auth.wallet,
        kind: "profile_save_rejected",
        details: {
          reason: validationError,
          elapsedSec,
          prev: prevMetrics,
          next: nextMetrics,
        },
      });
      return json({ ok: false, error: validationError });
    }

    const { error } = await supabase.from("profiles").upsert(
      {
        wallet: auth.wallet,
        state: normalizedState,
        updated_at: now.toISOString(),
      },
      { onConflict: "wallet" },
    );
    if (error) return json({ ok: false, error: "Failed to save profile." });
    return json({ ok: true, savedAt: now.toISOString() });
  }

  if (action === "withdraw_submit") {
    const amount = asInt(body.amount, 0);
    if (!Number.isFinite(amount) || amount < WITHDRAW_MIN) {
      return json({ ok: false, error: `Minimum withdrawal is ${WITHDRAW_MIN} crystals.` });
    }

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return json({ ok: false, error: "Profile not found." });
    }

    const state = normalizeState(profileRow.state as unknown);
    if (!state) return json({ ok: false, error: "Invalid profile state." });

    const metrics = getMetrics(state);
    if (amount > metrics.crystals) {
      return json({ ok: false, error: "Not enough crystals." });
    }

    const nextCrystals = metrics.crystals - amount;
    state.crystals = nextCrystals;
    const name = sanitizeName(state.name);
    const solAmount = Number((amount / WITHDRAW_RATE).toFixed(4));
    const createdAt = now.toISOString();

    const expectedUpdatedAt = String(profileRow.updated_at ?? "");
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        state,
        updated_at: now.toISOString(),
      })
      .eq("wallet", auth.wallet)
      .eq("updated_at", expectedUpdatedAt)
      .select("wallet")
      .maybeSingle();

    if (updateError || !updatedProfile) {
      return json({ ok: false, error: "Profile changed concurrently, retry withdrawal." });
    }

    const { data: withdrawalRow, error: insertError } = await supabase
      .from("withdrawals")
      .insert({
        wallet: auth.wallet,
        name,
        crystals: amount,
        sol_amount: solAmount,
        status: "pending",
        created_at: createdAt,
      })
      .select("id, wallet, name, crystals, sol_amount, status, created_at")
      .maybeSingle();

    if (insertError || !withdrawalRow) {
      await supabase
        .from("profiles")
        .update({ state: profileRow.state, updated_at: now.toISOString() })
        .eq("wallet", auth.wallet);
      return json({ ok: false, error: "Failed to submit withdrawal request." });
    }

    return json({
      ok: true,
      withdrawal: withdrawalRow,
      remainingCrystals: nextCrystals,
    });
  }

  if (action === "withdraw_list") {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("id, wallet, name, crystals, sol_amount, status, created_at")
      .eq("wallet", auth.wallet)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return json({ ok: false, error: "Failed to load withdrawals." });
    return json({ ok: true, withdrawals: data ?? [] });
  }

  if (action === "admin_mark_paid") {
    const withdrawalId = String(body.withdrawalId ?? "");
    if (!withdrawalId) return json({ ok: false, error: "Missing withdrawal id." });

    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const { error } = await supabase
      .from("withdrawals")
      .update({ status: "paid" })
      .eq("id", withdrawalId);

    if (error) return json({ ok: false, error: "Failed to update withdrawal." });
    return json({ ok: true });
  }

  return json({ ok: false, error: "Unknown action." });
});
