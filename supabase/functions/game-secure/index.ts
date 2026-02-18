import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MAX_LEVEL = 255;
const WITHDRAW_RATE = 15000;
const WITHDRAW_MIN = 2000;
const MAX_TICKETS = 30;
const WORLD_BOSS_DURATION_SECONDS = 12 * 60 * 60;
const WORLD_BOSS_PRIZE_POOL = 500;
const WORLD_BOSS_DAMAGE_PER_SEC_CAP = 5000;
const REFERRAL_LEVEL_TARGET = 15;
const REFERRAL_KEY_BONUS = 3;
const REFERRAL_CRYSTAL_RATE = 0.05;
const PREMIUM_MAX_FUTURE_DAYS = 180;
const PREMIUM_MAX_EXTENSION_DAYS = 90;
const STAKE_MIN_AMOUNT = 50;
const STAKE_MAX_AMOUNT = 1_000_000;
const STAKE_BONUS_RATE = 0.1;
const STAKE_MAX_COUNT = 128;

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

type StakeEntryState = {
  id: number;
  amount: number;
  endsAt: number;
};

type WorldBossRow = {
  id: number;
  cycle_start: string;
  cycle_end: string;
  prize_pool: number;
  last_cycle_start: string | null;
  last_cycle_end: string | null;
  last_prize_pool: number | null;
  updated_at?: string;
};

type WorldBossParticipantRow = {
  wallet: string;
  cycle_start: string;
  name: string;
  damage: number;
  joined: boolean;
  reward_claimed: boolean;
  updated_at?: string;
};

type ReferralRow = {
  referrer_wallet: string;
  referee_wallet: string;
  level_bonus_claimed: boolean;
  last_referee_crystals: number;
  pending_keys: number;
  pending_crystals: number;
  claimed_keys: number;
  claimed_crystals: number;
  crystals_earned: number;
  created_at: string;
  updated_at?: string;
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

const isWalletLike = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

const normalizeStakes = (raw: unknown, fallbackId = 1): StakeEntryState[] => {
  if (Array.isArray(raw)) {
    return raw
      .map((entry, index) => {
        const row = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
        const id = Math.max(1, asInt(row.id, index + 1));
        const amount = Math.max(0, asInt(row.amount, 0));
        const endsAt = Math.max(0, asInt(row.endsAt, 0));
        return { id, amount, endsAt };
      })
      .filter((entry) => entry.amount > 0 && entry.endsAt > 0);
  }

  if (raw && typeof raw === "object") {
    const legacy = raw as Record<string, unknown>;
    const active = Boolean(legacy.active);
    const amount = Math.max(0, asInt(legacy.amount, 0));
    const endsAt = Math.max(0, asInt(legacy.endsAt, 0));
    if (active && amount > 0 && endsAt > 0) {
      return [{ id: Math.max(1, fallbackId), amount, endsAt }];
    }
  }

  return [];
};

const stakeStats = (state: Record<string, unknown>) => {
  const fallbackId = Math.max(1, asInt(state.stakeId, 1));
  const stakes = normalizeStakes(state.stake, fallbackId);
  const byId = new Map<number, StakeEntryState>();
  let total = 0;
  for (const entry of stakes) {
    total += entry.amount;
    if (!byId.has(entry.id)) {
      byId.set(entry.id, entry);
    }
  }
  return { stakes, byId, total: Math.max(0, total) };
};

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
  state.starterPackPurchased = Boolean(state.starterPackPurchased);
  state.premiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
  state.premiumClaimDay = String(state.premiumClaimDay ?? "").slice(0, 10);
  const stakeId = Math.max(0, asInt(state.stakeId, 0));
  const stakes = normalizeStakes(state.stake, stakeId || 1);
  const maxStakeId = stakes.reduce((max, entry) => Math.max(max, entry.id), stakeId);
  state.stake = stakes;
  state.stakeId = maxStakeId;
  return state;
};

const validateStateTransition = (
  prevState: Record<string, unknown> | null,
  nextState: Record<string, unknown>,
  prev: Metrics | null,
  next: Metrics,
  elapsedSec: number,
  nowMs: number,
) => {
  const nextPremiumEndsAt = Math.max(0, asInt(nextState.premiumEndsAt, 0));
  const maxPremiumFutureMs = nowMs + PREMIUM_MAX_FUTURE_DAYS * 24 * 60 * 60 * 1000;
  if (nextPremiumEndsAt > maxPremiumFutureMs) return "Premium expiry is too far in the future.";

  const nextStake = stakeStats(nextState);
  if (nextStake.stakes.length > STAKE_MAX_COUNT) return "Too many active stakes.";
  for (const entry of nextStake.stakes) {
    if (entry.amount < STAKE_MIN_AMOUNT) return "Invalid stake amount.";
    if (entry.amount > STAKE_MAX_AMOUNT) return "Stake amount is too high.";
    if (entry.endsAt > nowMs + 30 * 24 * 60 * 60 * 1000) return "Stake lock time is invalid.";
  }

  if (!prev) {
    if (next.level > 30) return "Initial profile level is too high.";
    if (next.crystals > 10000) return "Initial profile crystals are too high.";
    if (next.gold > 500000) return "Initial profile gold is too high.";
    if (nextPremiumEndsAt > nowMs + PREMIUM_MAX_EXTENSION_DAYS * 24 * 60 * 60 * 1000) {
      return "Initial premium duration is too high.";
    }
    if (nextStake.total > 5000) return "Initial stake balance is too high.";
    return null;
  }

  if (!prevState) return "Previous profile state is invalid.";

  if (next.level < prev.level) return "Level rollback is not allowed.";
  if (next.monsterKills < prev.monsterKills) return "Monster kill rollback is not allowed.";
  if (next.dungeonRuns < prev.dungeonRuns) return "Dungeon run rollback is not allowed.";
  if (next.crystalsEarned < prev.crystalsEarned) return "Crystals earned rollback is not allowed.";

  const prevPremiumEndsAt = Math.max(0, asInt(prevState.premiumEndsAt, 0));
  const maxPremiumExtensionMs = PREMIUM_MAX_EXTENSION_DAYS * 24 * 60 * 60 * 1000 + 60_000;
  if (nextPremiumEndsAt > prevPremiumEndsAt + maxPremiumExtensionMs) {
    return "Suspicious premium extension detected.";
  }

  const prevStarter = Boolean(prevState.starterPackPurchased);
  const nextStarter = Boolean(nextState.starterPackPurchased);
  if (prevStarter && !nextStarter) return "Starter pack rollback is not allowed.";

  const prevStake = stakeStats(prevState);
  const stakeIncrease = Math.max(0, nextStake.total - prevStake.total);
  const stakeDecrease = Math.max(0, prevStake.total - nextStake.total);
  const crystalSpend = Math.max(0, prev.crystals - next.crystals);
  const crystalGain = Math.max(0, next.crystals - prev.crystals);

  if (stakeIncrease > 0 && crystalSpend < stakeIncrease) {
    return "Stake increase without crystal spend detected.";
  }

  for (const [id, entry] of prevStake.byId) {
    if (nextStake.byId.has(id)) continue;
    if (nowMs + 60_000 < entry.endsAt) {
      return "Stake claimed too early.";
    }
  }

  const safeElapsed = Math.max(1, elapsedSec);
  const levelDelta = Math.max(0, next.level - prev.level);
  const killsDelta = Math.max(0, next.monsterKills - prev.monsterKills);
  const dungeonDelta = Math.max(0, next.dungeonRuns - prev.dungeonRuns);
  const goldDelta = Math.max(0, next.gold - prev.gold);

  const maxLevelGain = Math.max(2, Math.floor(safeElapsed / 20));
  if (levelDelta > maxLevelGain) return "Suspicious level gain detected.";

  const maxKillGain = Math.max(60, Math.floor(safeElapsed * 8));
  if (killsDelta > maxKillGain) return "Suspicious monster kill gain detected.";

  const maxDungeonGain = Math.max(2, Math.floor(safeElapsed / 5));
  if (dungeonDelta > maxDungeonGain) return "Suspicious dungeon run gain detected.";

  const worldBossAllowance = Math.floor(safeElapsed / (12 * 60 * 60)) * 600 + 600;
  const referralAllowance = Math.floor(safeElapsed / (24 * 60 * 60)) * 5000 + 2000;
  const stakeAllowance = Math.floor(stakeDecrease * (1 + STAKE_BONUS_RATE));
  const maxCrystalGain = dungeonDelta * 35 + worldBossAllowance + referralAllowance + stakeAllowance + 500;
  if (crystalGain > maxCrystalGain) return "Suspicious crystal gain detected.";

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

const ensureWorldBossCycle = async (
  supabase: ReturnType<typeof createClient>,
  now: Date,
): Promise<WorldBossRow | null> => {
  const { data: existing, error } = await supabase
    .from("world_boss")
    .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) return null;

  if (!existing) {
    const cycleStart = now.toISOString();
    const cycleEnd = new Date(now.getTime() + WORLD_BOSS_DURATION_SECONDS * 1000).toISOString();
    const { data: created } = await supabase
      .from("world_boss")
      .upsert(
        {
          id: 1,
          cycle_start: cycleStart,
          cycle_end: cycleEnd,
          prize_pool: WORLD_BOSS_PRIZE_POOL,
          last_cycle_start: null,
          last_cycle_end: null,
          last_prize_pool: null,
          updated_at: now.toISOString(),
        },
        { onConflict: "id" },
      )
      .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
      .maybeSingle();
    if (created) return created as WorldBossRow;

    const { data: latest } = await supabase
      .from("world_boss")
      .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
      .eq("id", 1)
      .maybeSingle();
    return (latest as WorldBossRow | null) ?? null;
  }

  const existingRow = existing as WorldBossRow;
  if (new Date(existingRow.cycle_end).getTime() > now.getTime()) {
    return existingRow;
  }

  const nextStart = now.toISOString();
  const nextEnd = new Date(now.getTime() + WORLD_BOSS_DURATION_SECONDS * 1000).toISOString();
  const { data: rotated } = await supabase
    .from("world_boss")
    .update({
      cycle_start: nextStart,
      cycle_end: nextEnd,
      prize_pool: WORLD_BOSS_PRIZE_POOL,
      last_cycle_start: existingRow.cycle_start,
      last_cycle_end: existingRow.cycle_end,
      last_prize_pool: existingRow.prize_pool,
      updated_at: now.toISOString(),
    })
    .eq("id", 1)
    .eq("cycle_end", existingRow.cycle_end)
    .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
    .maybeSingle();

  if (rotated) return rotated as WorldBossRow;

  const { data: latest } = await supabase
    .from("world_boss")
    .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
    .eq("id", 1)
    .maybeSingle();
  return (latest as WorldBossRow | null) ?? null;
};

const loadWorldBossParticipants = async (
  supabase: ReturnType<typeof createClient>,
  cycleStart: string,
) => {
  const { data, error } = await supabase
    .from("world_boss_participants")
    .select("wallet, cycle_start, name, damage, joined, reward_claimed, updated_at")
    .eq("cycle_start", cycleStart)
    .order("damage", { ascending: false })
    .limit(100);
  if (error) return [];
  return (data as WorldBossParticipantRow[] | null) ?? [];
};

const updateProfileWithRetry = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  mutate: (state: Record<string, unknown>) => void,
) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();

    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return { ok: false as const };
    }

    const normalized = normalizeState(profileRow.state);
    if (!normalized) return { ok: false as const };

    const nextState = structuredClone(normalized) as Record<string, unknown>;
    mutate(nextState);

    const expectedUpdatedAt = String(profileRow.updated_at ?? "");
    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        state: nextState,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet", wallet)
      .eq("updated_at", expectedUpdatedAt)
      .select("wallet")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: nextState };
    }
  }

  const { data: fallbackRow, error: fallbackError } = await supabase
    .from("profiles")
    .select("state")
    .eq("wallet", wallet)
    .maybeSingle();

  if (fallbackError || !fallbackRow || !fallbackRow.state || typeof fallbackRow.state !== "object") {
    return { ok: false as const };
  }

  const fallbackState = normalizeState(fallbackRow.state);
  if (!fallbackState) return { ok: false as const };

  const nextFallbackState = structuredClone(fallbackState) as Record<string, unknown>;
  mutate(nextFallbackState);

  const { data: forceUpdated, error: forceError } = await supabase
    .from("profiles")
    .update({
      state: nextFallbackState,
      updated_at: new Date().toISOString(),
    })
    .eq("wallet", wallet)
    .select("wallet")
    .maybeSingle();

  if (forceError || !forceUpdated) return { ok: false as const };
  return { ok: true as const, state: nextFallbackState };
};

const claimWorldBossReward = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  boss: WorldBossRow,
  now: Date,
) => {
  if (!boss.last_cycle_start || !boss.last_cycle_end || !boss.last_prize_pool) return 0;
  if (new Date(boss.last_cycle_end).getTime() > now.getTime()) return 0;

  const { data: playerRow, error: playerError } = await supabase
    .from("world_boss_participants")
    .select("wallet, cycle_start, name, damage, joined, reward_claimed")
    .eq("cycle_start", boss.last_cycle_start)
    .eq("wallet", wallet)
    .maybeSingle();

  if (playerError || !playerRow) return 0;
  if (Boolean(playerRow.reward_claimed) || !Boolean(playerRow.joined)) return 0;

  const { data: totalRows, error: totalError } = await supabase
    .from("world_boss_participants")
    .select("damage")
    .eq("cycle_start", boss.last_cycle_start)
    .eq("joined", true);
  if (totalError || !totalRows) return 0;

  const totalDamage = totalRows.reduce((sum, row) => sum + Math.max(0, asInt(row.damage, 0)), 0);
  const playerDamage = Math.max(0, asInt(playerRow.damage, 0));
  const share = totalDamage > 0
    ? Math.max(0, Math.floor((Math.max(0, asInt(boss.last_prize_pool, 0)) * playerDamage) / totalDamage))
    : 0;

  const { data: claimRow, error: claimError } = await supabase
    .from("world_boss_participants")
    .update({ reward_claimed: true, updated_at: now.toISOString() })
    .eq("wallet", wallet)
    .eq("cycle_start", boss.last_cycle_start)
    .eq("reward_claimed", false)
    .select("wallet")
    .maybeSingle();

  if (claimError || !claimRow || share <= 0) return 0;

  const creditResult = await updateProfileWithRetry(supabase, wallet, (state) => {
    state.crystals = Math.max(0, asInt(state.crystals, 0)) + share;
    state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + share;
  });

  if (!creditResult.ok) {
    await supabase.from("security_events").insert({
      wallet,
      kind: "worldboss_reward_credit_failed",
      details: { share, cycleStart: boss.last_cycle_start },
    });
    return 0;
  }

  return share;
};

const syncOwnReferralProgress = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  nowIso: string,
) => {
  const { data: row, error } = await supabase
    .from("referrals")
    .select("referrer_wallet, referee_wallet, level_bonus_claimed, last_referee_crystals, pending_keys, pending_crystals, claimed_keys, claimed_crystals, crystals_earned, created_at, updated_at")
    .eq("referee_wallet", wallet)
    .maybeSingle();

  if (error || !row) return;

  const referral = row as ReferralRow;
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("state")
    .eq("wallet", wallet)
    .maybeSingle();

  const profileState = normalizeState(profileRow?.state ?? null);
  const currentLevel = Math.max(1, asInt(profileState?.player && typeof profileState.player === "object"
    ? (profileState.player as Record<string, unknown>).level
    : 1, 1));
  const currentCrystalsEarned = Math.max(0, asInt(profileState?.crystalsEarned ?? profileState?.crystals ?? 0, 0));

  const lastTracked = Math.max(0, asInt(referral.last_referee_crystals, 0));
  const deltaEarned = Math.max(0, currentCrystalsEarned - lastTracked);
  const crystalBonus = Math.max(0, Math.floor(deltaEarned * REFERRAL_CRYSTAL_RATE));
  const reachedLevelTarget = currentLevel >= REFERRAL_LEVEL_TARGET;
  const needsLevelBonus = reachedLevelTarget && !Boolean(referral.level_bonus_claimed);

  if (deltaEarned <= 0 && !needsLevelBonus) return;

  const nextPendingKeys = Math.max(0, asInt(referral.pending_keys, 0)) + (needsLevelBonus ? REFERRAL_KEY_BONUS : 0);
  const nextPendingCrystals = Math.max(0, asInt(referral.pending_crystals, 0)) + crystalBonus;
  const nextCrystalsEarned = Math.max(0, asInt(referral.crystals_earned, 0)) + crystalBonus;

  await supabase
    .from("referrals")
    .update({
      level_bonus_claimed: Boolean(referral.level_bonus_claimed) || needsLevelBonus,
      last_referee_crystals: currentCrystalsEarned,
      pending_keys: nextPendingKeys,
      pending_crystals: nextPendingCrystals,
      crystals_earned: nextCrystalsEarned,
      updated_at: nowIso,
    })
    .eq("referee_wallet", wallet)
    .eq("last_referee_crystals", lastTracked)
    .eq("level_bonus_claimed", Boolean(referral.level_bonus_claimed));
};

const getReferrerSummary = async (supabase: ReturnType<typeof createClient>, wallet: string) => {
  const { data: referralRows, error } = await supabase
    .from("referrals")
    .select("referrer_wallet, referee_wallet, level_bonus_claimed, last_referee_crystals, pending_keys, pending_crystals, claimed_keys, claimed_crystals, crystals_earned, created_at, updated_at")
    .eq("referrer_wallet", wallet)
    .order("created_at", { ascending: false });

  if (error) return { ok: false as const };

  const rows = (referralRows as ReferralRow[] | null) ?? [];
  if (!rows.length) {
    return {
      ok: true as const,
      entries: [] as Array<Record<string, number | string>>,
      pendingKeys: 0,
      pendingCrystals: 0,
    };
  }

  const refereeWallets = rows.map((entry) => entry.referee_wallet);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("wallet, state")
    .in("wallet", refereeWallets);

  const levelByWallet = new Map<string, number>();
  for (const profile of profileRows ?? []) {
    const walletValue = String(profile.wallet ?? "");
    const normalized = normalizeState(profile.state ?? null);
    const level = Math.max(1, asInt(
      normalized?.player && typeof normalized.player === "object"
        ? (normalized.player as Record<string, unknown>).level
        : 1,
      1,
    ));
    levelByWallet.set(walletValue, level);
  }

  const entries = rows.map((row) => ({
    wallet: row.referee_wallet,
    level: levelByWallet.get(row.referee_wallet) ?? 1,
    crystalsFromRef: Math.max(0, asInt(row.claimed_crystals, 0)),
    pendingCrystals: Math.max(0, asInt(row.pending_crystals, 0)),
    pendingKeys: Math.max(0, asInt(row.pending_keys, 0)),
  }));

  const pendingKeys = rows.reduce((sum, row) => sum + Math.max(0, asInt(row.pending_keys, 0)), 0);
  const pendingCrystals = rows.reduce((sum, row) => sum + Math.max(0, asInt(row.pending_crystals, 0)), 0);

  return { ok: true as const, entries, pendingKeys, pendingCrystals };
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

    const prevStateRaw = existing?.state && typeof existing.state === "object"
      ? (existing.state as Record<string, unknown>)
      : null;
    const prevState = prevStateRaw ? normalizeState(prevStateRaw) : null;
    const prevMetrics = prevState ? getMetrics(prevState) : null;
    const nextMetrics = getMetrics(normalizedState);
    const previousUpdatedAtMs = existing?.updated_at ? new Date(String(existing.updated_at)).getTime() : Number.NaN;
    const elapsedSec = Number.isFinite(previousUpdatedAtMs)
      ? Math.max(1, Math.floor((now.getTime() - previousUpdatedAtMs) / 1000))
      : 3600;

    const validationError = validateStateTransition(prevState, normalizedState, prevMetrics, nextMetrics, elapsedSec, now.getTime());
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

  if (action === "referrals_status") {
    const nowIso = now.toISOString();
    const applyReferrer = String(body.applyReferrer ?? "").trim();
    let referralApplied = false;

    if (
      applyReferrer &&
      applyReferrer !== auth.wallet &&
      isWalletLike(applyReferrer)
    ) {
      const { data: existing } = await supabase
        .from("referrals")
        .select("referee_wallet")
        .eq("referee_wallet", auth.wallet)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase
          .from("referrals")
          .insert({
            referrer_wallet: applyReferrer,
            referee_wallet: auth.wallet,
            level_bonus_claimed: false,
            last_referee_crystals: 0,
            pending_keys: 0,
            pending_crystals: 0,
            claimed_keys: 0,
            claimed_crystals: 0,
            crystals_earned: 0,
            created_at: nowIso,
            updated_at: nowIso,
          });
        if (!insertError) referralApplied = true;
      }
    }

    await syncOwnReferralProgress(supabase, auth.wallet, nowIso);

    const summary = await getReferrerSummary(supabase, auth.wallet);
    if (!summary.ok) {
      return json({ ok: false, error: "Failed to load referrals." });
    }

    return json({
      ok: true,
      referralApplied,
      referralEntries: summary.entries,
      referralPendingKeys: summary.pendingKeys,
      referralPendingCrystals: summary.pendingCrystals,
    });
  }

  if (action === "referrals_claim") {
    const nowIso = now.toISOString();
    const { data, error } = await supabase
      .from("referrals")
      .select("referrer_wallet, referee_wallet, level_bonus_claimed, last_referee_crystals, pending_keys, pending_crystals, claimed_keys, claimed_crystals, crystals_earned, created_at, updated_at")
      .eq("referrer_wallet", auth.wallet)
      .or("pending_keys.gt.0,pending_crystals.gt.0");

    if (error) return json({ ok: false, error: "Failed to claim referral rewards." });

    const rows = (data as ReferralRow[] | null) ?? [];
    let claimedKeys = 0;
    let claimedCrystals = 0;

    for (const row of rows) {
      const pendingKeys = Math.max(0, asInt(row.pending_keys, 0));
      const pendingCrystals = Math.max(0, asInt(row.pending_crystals, 0));
      if (pendingKeys <= 0 && pendingCrystals <= 0) continue;

      const nextClaimedKeys = Math.max(0, asInt(row.claimed_keys, 0)) + pendingKeys;
      const nextClaimedCrystals = Math.max(0, asInt(row.claimed_crystals, 0)) + pendingCrystals;

      const { data: updatedRow } = await supabase
        .from("referrals")
        .update({
          pending_keys: 0,
          pending_crystals: 0,
          claimed_keys: nextClaimedKeys,
          claimed_crystals: nextClaimedCrystals,
          updated_at: nowIso,
        })
        .eq("referee_wallet", row.referee_wallet)
        .eq("pending_keys", pendingKeys)
        .eq("pending_crystals", pendingCrystals)
        .select("referee_wallet")
        .maybeSingle();

      if (!updatedRow) continue;
      claimedKeys += pendingKeys;
      claimedCrystals += pendingCrystals;
    }

    if (claimedKeys <= 0 && claimedCrystals <= 0) {
      return json({
        ok: true,
        claimedKeys: 0,
        claimedCrystals: 0,
      });
    }

    const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      state.tickets = Math.min(MAX_TICKETS, Math.max(0, asInt(state.tickets, 0)) + claimedKeys);
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + claimedCrystals;
    });

    if (!creditResult.ok || !creditResult.state) {
      await supabase.from("security_events").insert({
        wallet: auth.wallet,
        kind: "referral_claim_credit_failed",
        details: { claimedKeys, claimedCrystals },
      });
      return json({ ok: false, error: "Failed to credit referral rewards." });
    }

    return json({
      ok: true,
      claimedKeys,
      claimedCrystals,
      tickets: Math.max(0, asInt(creditResult.state.tickets, 0)),
      crystals: Math.max(0, asInt(creditResult.state.crystals, 0)),
    });
  }

  if (action === "worldboss_sync") {
    const boss = await ensureWorldBossCycle(supabase, now);
    if (!boss) return json({ ok: false, error: "Failed to load world boss." });

    const playerName = sanitizeName(body.playerName);
    const joinedInput = Boolean(body.joined);
    const clientCycleStart = String(body.clientCycleStart ?? "");
    const cycleMatches = !clientCycleStart || clientCycleStart === boss.cycle_start;
    const pendingDamageInput = Math.max(0, asInt(body.pendingDamage, 0));
    const safePendingDamage = cycleMatches ? pendingDamageInput : 0;
    const safeJoined = joinedInput;

    const rewardShare = await claimWorldBossReward(supabase, auth.wallet, boss, now);

    const { data: existing, error: existingError } = await supabase
      .from("world_boss_participants")
      .select("wallet, cycle_start, name, damage, joined, reward_claimed, updated_at")
      .eq("wallet", auth.wallet)
      .eq("cycle_start", boss.cycle_start)
      .maybeSingle();

    if (existingError) return json({ ok: false, error: "Failed to sync world boss." });

    const existingRow = (existing as WorldBossParticipantRow | null) ?? null;
    const existingDamage = Math.max(0, asInt(existingRow?.damage ?? 0, 0));
    const updatedAtMs = existingRow?.updated_at ? new Date(existingRow.updated_at).getTime() : Number.NaN;
    const elapsedSec = Number.isFinite(updatedAtMs)
      ? Math.max(1, Math.floor((now.getTime() - updatedAtMs) / 1000))
      : 1;
    const maxDamageGain = Math.max(200, elapsedSec * WORLD_BOSS_DAMAGE_PER_SEC_CAP);
    const appliedDamage = Math.min(safePendingDamage, maxDamageGain);
    const nextDamage = existingDamage + appliedDamage;
    const nextJoined = Boolean(existingRow?.joined) || safeJoined;
    const nextName = playerName || existingRow?.name || "Hero";

    const shouldWrite =
      !existingRow ||
      appliedDamage > 0 ||
      nextJoined !== Boolean(existingRow.joined) ||
      nextName !== String(existingRow.name ?? "");

    if (shouldWrite) {
      const payload = {
        wallet: auth.wallet,
        cycle_start: boss.cycle_start,
        name: nextName,
        damage: nextDamage,
        joined: nextJoined,
        reward_claimed: Boolean(existingRow?.reward_claimed ?? false),
        updated_at: now.toISOString(),
      };

      if (existingRow) {
        const { error: updateError } = await supabase
          .from("world_boss_participants")
          .update(payload)
          .eq("wallet", auth.wallet)
          .eq("cycle_start", boss.cycle_start);
        if (updateError) return json({ ok: false, error: "Failed to update world boss progress." });
      } else {
        const { error: insertError } = await supabase
          .from("world_boss_participants")
          .insert(payload);
        if (insertError) return json({ ok: false, error: "Failed to join world boss." });
      }
    }

    const participants = await loadWorldBossParticipants(supabase, boss.cycle_start);

    return json({
      ok: true,
      worldBoss: boss,
      worldBossParticipants: participants,
      worldBossAppliedDamage: appliedDamage,
      worldBossRewardShare: rewardShare,
    });
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
