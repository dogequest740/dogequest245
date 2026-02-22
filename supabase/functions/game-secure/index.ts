import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clusterApiUrl, Connection } from "https://esm.sh/@solana/web3.js@1.98.4";

const MAX_LEVEL = 255;
const WITHDRAW_RATE = 15000;
const WITHDRAW_MIN = 2000;
const MAX_TICKETS = 30;
const DUNGEON_DAILY_TICKETS = 5;
const WORLD_BOSS_DURATION_SECONDS = 12 * 60 * 60;
const WORLD_BOSS_PRIZE_POOL = 500;
const WORLD_BOSS_DAMAGE_PER_SEC_CAP = 5000;
const WORLD_BOSS_TICKET_COST_GOLD = 7000;
const WORLD_BOSS_PREMIUM_DAILY_TICKETS = 2;
const WORLD_BOSS_STARTER_TICKETS = 5;
const SHOP_DUNGEON_KEY_COST_GOLD = 50000;
const SHOP_DUNGEON_KEY_DAILY_LIMIT = 10;
const SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT = 2;
const REFERRAL_LEVEL_TARGET = 15;
const REFERRAL_KEY_BONUS = 3;
const REFERRAL_CRYSTAL_RATE = 0.05;
const PREMIUM_MAX_FUTURE_DAYS = 180;
const PREMIUM_MAX_EXTENSION_DAYS = 90;
const STAKE_MIN_AMOUNT = 50;
const STAKE_MAX_AMOUNT = 1_000_000;
const STAKE_BONUS_RATE = 0.05;
const STAKE_MAX_COUNT = 128;
const STAKE_DURATION_SECONDS = 24 * 60 * 60;
const PREMIUM_DAILY_KEYS = 5;
const PREMIUM_DAILY_GOLD = 50000;
const PREMIUM_DAILY_SMALL_POTIONS = 5;
const PREMIUM_DAILY_BIG_POTIONS = 3;
const PREMIUM_PAYMENT_WALLET = "9a5GXRjX6HKh9Yjc9d7gp9RFmuRvMQAcV1VJ9WV7LU8c";
const SOL_LAMPORTS = 1_000_000_000;
const PREMIUM_TX_MAX_AGE_SECONDS = 2 * 60 * 60;
const BLOCKED_ERROR_MESSAGE = "You have been banned for cheating.";
const GOLD_PACKS = [
  { id: "gold-50k", gold: 50000, lamports: Math.round(0.05 * SOL_LAMPORTS) },
  { id: "gold-100k", gold: 100000, lamports: Math.round(0.1 * SOL_LAMPORTS) },
  { id: "gold-500k", gold: 500000, lamports: Math.round(0.4 * SOL_LAMPORTS) },
  { id: "gold-1200k", gold: 1200000, lamports: Math.round(0.63 * SOL_LAMPORTS) },
] as const;
const FORTUNE_SPIN_PACKS = [1, 10] as const;
const FORTUNE_SPIN_PRICES_LAMPORTS: Record<(typeof FORTUNE_SPIN_PACKS)[number], number> = {
  1: Math.round(0.007 * SOL_LAMPORTS),
  10: Math.round(0.06 * SOL_LAMPORTS),
};
const ENERGY_REGEN_SECONDS = 420;
const PREMIUM_PLANS = [
  { id: "premium-30", days: 30, lamports: Math.round(0.5 * SOL_LAMPORTS) },
  { id: "premium-90", days: 90, lamports: Math.round(1 * SOL_LAMPORTS) },
] as const;
const VILLAGE_CASTLE_MAX_LEVEL = 3;
const VILLAGE_OTHER_MAX_LEVEL = 25;
const VILLAGE_PREMIUM_UPGRADE_TIME_MULTIPLIER = 0.5;
const VILLAGE_UPGRADE_COST_MULTIPLIER = 0.7;
const VILLAGE_CASTLE_LEVEL2_REQUIREMENT = 10;
const VILLAGE_CASTLE_LEVEL3_REQUIREMENT = 25;
const VILLAGE_CASTLE_LEVEL2_PLAYER_LEVEL = 50;
const VILLAGE_CASTLE_LEVEL3_PLAYER_LEVEL = 75;
const VILLAGE_MINE_GOLD_PER_HOUR_BY_LEVEL = [
  0,
  800, 1600, 2400, 3200, 4000, 4800, 5600, 6400, 7200, 8000,
  8800, 9600, 10400, 11200, 12000, 12800, 13600, 14400, 15200, 16000,
  16800, 17600, 18400, 19200, 20000,
];
const VILLAGE_LAB_CRYSTALS_PER_HOUR_BY_LEVEL = [
  0,
  11, 22, 33, 44, 55, 66, 77, 88, 99, 110,
  121, 132, 143, 154, 165, 176, 187, 198, 209, 220,
  231, 242, 253, 264, 275,
];
const VILLAGE_STORAGE_CAP_HOURS_BY_LEVEL = [
  0,
  1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5,
  6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5,
  11, 11.5, 12, 12, 12,
];
const VILLAGE_CASTLE_BONUS_BY_LEVEL = [
  0,
  0, 0.1, 0.25,
];
const VILLAGE_UPGRADE_COST_BY_TARGET_LEVEL: Record<VillageBuildingId, number[]> = {
  mine: [
    0,
    4000, 5120, 6554, 8392, 10739, 13747, 17590, 22486, 28732, 36704,
    46900, 59925, 76513, 97464, 124101, 158849, 203166, 259221, 330982, 422898,
    540031, 689238, 878318, 1120000, 1426000,
  ],
  lab: [
    0,
    6000, 7680, 9835, 12597, 16081, 20539, 26226, 33456, 42704, 54540,
    69632, 88939, 113628, 145061, 185015, 235821, 300949, 383232, 487614, 620459,
    790636, 1006020, 1278188, 1624290, 2065000,
  ],
  storage: [
    0,
    3000, 3840, 4915, 6298, 8041, 10270, 13113, 16728, 21382, 27309,
    34910, 44588, 56996, 72872, 93136, 118966, 151881, 194000, 247973, 317144,
    405350, 518571, 664093, 850000, 1150000,
  ],
  castle: [
    0,
    0, 2500000, 3200000,
  ],
};
const VILLAGE_UPGRADE_HOURS_BY_TARGET_LEVEL: Record<VillageBuildingId, number[]> = {
  mine: [
    0,
    1, 1.28, 1.64, 2.1, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5,
    12.2, 15.7, 20.2, 26, 33.3, 42.6, 54.5, 69.8, 89.4, 114.7,
    147, 188, 241, 309, 307,
  ],
  lab: [
    0,
    1, 1.28, 1.64, 2.1, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5,
    12.2, 15.7, 20.2, 26, 33.3, 42.6, 54.5, 69.8, 89.4, 114.7,
    147, 188, 241, 309, 307,
  ],
  storage: [
    0,
    1, 1.28, 1.64, 2.1, 2.7, 3.5, 4.5, 5.8, 7.4, 9.5,
    12.2, 15.7, 20.2, 26, 33.3, 42.6, 54.5, 69.8, 89.4, 114.7,
    147, 188, 241, 309, 307,
  ],
  castle: [
    0,
    0, 48, 96,
  ],
};

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

type ConsumableType = "energy-small" | "energy-full" | "speed" | "attack" | "key";
type ConsumableRow = {
  id: number;
  type: ConsumableType;
  name: string;
  description: string;
  icon: string;
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

type WorldBossTicketRow = {
  wallet: string;
  tickets: number;
  premium_ticket_day: string;
  starter_ticket_granted: boolean;
  shop_ticket_day: string;
  shop_ticket_buys: number;
  updated_at?: string;
};

type DungeonStateRow = {
  wallet: string;
  tickets: number;
  ticket_day: string;
  dungeon_runs: number;
  shop_key_day: string;
  shop_key_buys: number;
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

type VillageBuildingId = "castle" | "mine" | "lab" | "storage";
type VillageBuildingState = {
  level: number;
  upgradingTo: number;
  upgradeEndsAt: number;
};
type VillageState = {
  settlementName: string;
  lastClaimAt: number;
  buildings: Record<VillageBuildingId, VillageBuildingState>;
};

const CONSUMABLE_DEFS: Record<ConsumableType, { name: string; description: string }> = {
  "energy-small": { name: "Energy Tonic", description: "Restore 10 energy." },
  "energy-full": { name: "Grand Energy Elixir", description: "Restore energy to full." },
  speed: { name: "Swift Draught", description: "+50% speed for 5 minutes." },
  attack: { name: "Battle Tonic", description: "+50% attack speed for 5 minutes." },
  key: { name: "Dungeon Key", description: "+1 dungeon entry." },
};

type SecurityEventRow = {
  id: string;
  wallet: string;
  kind: string;
  details: Record<string, unknown>;
  created_at: string;
};

type BlockedWalletRow = {
  wallet: string;
  reason: string;
  blocked_by: string;
  created_at: string;
  updated_at?: string;
};

type FortuneStateRow = {
  wallet: string;
  free_spin_day: string;
  paid_spins: number;
  updated_at?: string;
};

type FortuneRewardKind = "consumable" | "gold" | "crystals" | "keys";
type FortuneRewardDef = {
  id: string;
  label: string;
  kind: FortuneRewardKind;
  consumableType?: ConsumableType;
  amount: number;
  chance: number;
};

const FORTUNE_REWARDS: FortuneRewardDef[] = [
  { id: "speed_draught", label: "Swift Draught", kind: "consumable", consumableType: "speed", amount: 1, chance: 24.915 },
  { id: "battle_tonic", label: "Battle Tonic", kind: "consumable", consumableType: "attack", amount: 1, chance: 24.915 },
  { id: "energy_tonic", label: "Energy Tonic", kind: "consumable", consumableType: "energy-small", amount: 1, chance: 25 },
  { id: "grand_energy_elixir", label: "Grand Energy Elixir", kind: "consumable", consumableType: "energy-full", amount: 1, chance: 10 },
  { id: "crystals_100", label: "100 Crystals", kind: "crystals", amount: 100, chance: 2 },
  { id: "crystals_50", label: "50 Crystals", kind: "crystals", amount: 50, chance: 3 },
  { id: "crystals_10", label: "10 Crystals", kind: "crystals", amount: 10, chance: 5 },
  { id: "gold_5000", label: "5000 Gold", kind: "gold", amount: 5000, chance: 3 },
  { id: "gold_10000", label: "10000 Gold", kind: "gold", amount: 10000, chance: 1 },
  { id: "gold_50000", label: "50000 Gold", kind: "gold", amount: 50000, chance: 0.3 },
  { id: "crystals_300", label: "300 Crystals", kind: "crystals", amount: 300, chance: 0.3 },
  { id: "gold_500000", label: "500000 Gold", kind: "gold", amount: 500000, chance: 0.01 },
  { id: "crystals_1000", label: "1000 Crystals", kind: "crystals", amount: 1000, chance: 0.01 },
  { id: "keys_10", label: "10 Keys", kind: "keys", amount: 10, chance: 0.15 },
  { id: "keys_30", label: "30 Keys", kind: "keys", amount: 30, chance: 0.02 },
  { id: "keys_5", label: "5 Keys", kind: "keys", amount: 5, chance: 0.38 },
];

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

const sanitizeSettlementName = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 24);

const isWalletLike = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
const isTxSignatureLike = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{70,120}$/.test(value);
const todayKeyUtc = (now: Date) => now.toISOString().slice(0, 10);
const isConsumableType = (value: string): value is ConsumableType =>
  Object.prototype.hasOwnProperty.call(CONSUMABLE_DEFS, value);
const isVillageBuildingId = (value: string): value is VillageBuildingId =>
  value === "castle" || value === "mine" || value === "lab" || value === "storage";

let solanaConnection: Connection | null = null;
const getSolanaConnection = () => {
  if (solanaConnection) return solanaConnection;
  const rpcUrl = Deno.env.get("SOLANA_RPC_URL") ||
    Deno.env.get("VITE_SOLANA_RPC") ||
    clusterApiUrl("mainnet-beta");
  solanaConnection = new Connection(rpcUrl, "confirmed");
  return solanaConnection;
};

const getPremiumPlan = (planIdRaw: unknown, daysRaw: unknown) => {
  const planId = String(planIdRaw ?? "").trim();
  if (planId) {
    const byId = PREMIUM_PLANS.find((entry) => entry.id === planId);
    if (byId) return byId;
  }
  const days = asInt(daysRaw, 0);
  if (days > 0) {
    const byDays = PREMIUM_PLANS.find((entry) => entry.days === days);
    if (byDays) return byDays;
  }
  return null;
};

const getGoldPack = (packIdRaw: unknown) => {
  const packId = String(packIdRaw ?? "").trim();
  if (!packId) return null;
  return GOLD_PACKS.find((entry) => entry.id === packId) ?? null;
};

const wasTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  kinds: readonly string[],
  txSignature: string,
) => {
  const { data, error } = await supabase
    .from("security_events")
    .select("details")
    .eq("wallet", wallet)
    .in("kind", [...kinds])
    .order("created_at", { ascending: false })
    .limit(600);

  if (error || !data) return false;
  for (const row of data as Array<{ details?: Record<string, unknown> }>) {
    const details = row.details && typeof row.details === "object" ? row.details : {};
    if (String(details?.txSignature ?? "") === txSignature) {
      return true;
    }
  }
  return false;
};

const wasPremiumTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  txSignature: string,
) => wasTxAlreadyProcessed(supabase, wallet, ["premium_buy"], txSignature);

const wasFortuneTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  txSignature: string,
) => wasTxAlreadyProcessed(supabase, wallet, ["fortune_buy"], txSignature);

const wasGoldTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  txSignature: string,
) => wasTxAlreadyProcessed(supabase, wallet, ["buy_gold"], txSignature);

const verifySolTransferTx = async (
  wallet: string,
  txSignature: string,
  lamportsRequired: number,
  destinationWallet: string,
  transferMismatchError: string,
  now: Date,
) => {
  const connection = getSolanaConnection();
  const tx = await connection.getParsedTransaction(txSignature, {
    commitment: "confirmed",
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    return { ok: false as const, error: "Payment transaction not found yet. Wait a few seconds and retry." };
  }
  if (tx.meta?.err) {
    return { ok: false as const, error: "Payment transaction failed on-chain." };
  }

  if (tx.blockTime) {
    const ageSec = Math.max(0, Math.floor(now.getTime() / 1000 - tx.blockTime));
    if (ageSec > PREMIUM_TX_MAX_AGE_SECONDS) {
      return { ok: false as const, error: "Payment transaction is too old. Contact support." };
    }
  }

  let matchedTransfer = false;
  for (const instruction of tx.transaction.message.instructions) {
    const ix = instruction as {
      program?: string;
      parsed?: { type?: string; info?: Record<string, unknown> };
    };
    if (!ix || ix.program !== "system") continue;
    if (!ix.parsed || ix.parsed.type !== "transfer" || !ix.parsed.info) continue;
    const info = ix.parsed.info;
    const source = String(info.source ?? "");
    const destination = String(info.destination ?? "");
    const lamports = Math.max(0, asInt(info.lamports, 0));
    if (source === wallet && destination === destinationWallet && lamports >= lamportsRequired) {
      matchedTransfer = true;
      break;
    }
  }

  if (!matchedTransfer) {
    return { ok: false as const, error: transferMismatchError };
  }

  return {
    ok: true as const,
    blockTime: tx.blockTime ?? null,
    slot: tx.slot,
  };
};

const verifyPremiumPaymentTx = async (
  wallet: string,
  txSignature: string,
  lamportsRequired: number,
  now: Date,
) =>
  verifySolTransferTx(
    wallet,
    txSignature,
    lamportsRequired,
    PREMIUM_PAYMENT_WALLET,
    "Payment transfer mismatch for the selected Premium plan.",
    now,
  );

const verifyFortunePaymentTx = async (
  wallet: string,
  txSignature: string,
  lamportsRequired: number,
  now: Date,
) =>
  verifySolTransferTx(
    wallet,
    txSignature,
    lamportsRequired,
    PREMIUM_PAYMENT_WALLET,
    "Payment transfer mismatch for the selected fortune pack.",
    now,
  );

const verifyGoldPaymentTx = async (
  wallet: string,
  txSignature: string,
  lamportsRequired: number,
  now: Date,
) =>
  verifySolTransferTx(
    wallet,
    txSignature,
    lamportsRequired,
    PREMIUM_PAYMENT_WALLET,
    "Payment transfer mismatch for selected gold package.",
    now,
  );

const normalizeConsumables = (raw: unknown) => {
  if (!Array.isArray(raw)) return { rows: [] as ConsumableRow[], maxId: 0 };

  const rows: ConsumableRow[] = [];
  let maxId = 0;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const id = Math.max(1, asInt(row.id, 0));
    const typeRaw = String(row.type ?? "");
    if (!id || !isConsumableType(typeRaw)) continue;
    const def = CONSUMABLE_DEFS[typeRaw];
    maxId = Math.max(maxId, id);
    rows.push({
      id,
      type: typeRaw,
      name: def.name,
      description: def.description,
      icon: "",
    });
  }

  return { rows, maxId };
};

const addConsumableToState = (state: Record<string, unknown>, type: ConsumableType) => {
  const normalized = normalizeConsumables(state.consumables);
  const currentId = Math.max(asInt(state.consumableId, 0), normalized.maxId);
  const nextId = currentId + 1;
  const def = CONSUMABLE_DEFS[type];
  const nextRows = [
    {
      id: nextId,
      type,
      name: def.name,
      description: def.description,
      icon: "",
    },
    ...normalized.rows,
  ];
  state.consumableId = nextId;
  state.consumables = nextRows;
};

const countConsumablesByType = (state: Record<string, unknown>, type: ConsumableType) =>
  normalizeConsumables(state.consumables).rows.filter((entry) => entry.type === type).length;

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

const serializeStakeEntries = (state: Record<string, unknown>) =>
  normalizeStakes(state.stake, Math.max(1, asInt(state.stakeId, 1)));

const createVillageState = (nowMs = Date.now()): VillageState => ({
  settlementName: "",
  lastClaimAt: nowMs,
  buildings: {
    castle: { level: 1, upgradingTo: 0, upgradeEndsAt: 0 },
    mine: { level: 1, upgradingTo: 0, upgradeEndsAt: 0 },
    lab: { level: 1, upgradingTo: 0, upgradeEndsAt: 0 },
    storage: { level: 1, upgradingTo: 0, upgradeEndsAt: 0 },
  },
});

const getVillageBuildingMaxLevel = (buildingId: VillageBuildingId) =>
  buildingId === "castle" ? VILLAGE_CASTLE_MAX_LEVEL : VILLAGE_OTHER_MAX_LEVEL;

const getVillageTableValue = (values: number[], levelRaw: number) => {
  if (values.length <= 1) return 0;
  const maxLevel = values.length - 1;
  const level = Math.max(1, Math.min(maxLevel, Math.floor(levelRaw)));
  return Number(values[level] ?? values[maxLevel] ?? 0);
};

const normalizeVillageBuilding = (buildingId: VillageBuildingId, raw: unknown): VillageBuildingState => {
  const base = createVillageState(0).buildings[buildingId];
  if (!raw || typeof raw !== "object") return { ...base };
  const row = raw as Record<string, unknown>;
  const maxLevel = getVillageBuildingMaxLevel(buildingId);
  const level = clampInt(row.level ?? base.level, 1, maxLevel);
  const upgradingToRaw = asInt(row.upgradingTo, 0);
  const upgradingTo = upgradingToRaw === level + 1 ? level + 1 : 0;
  const upgradeEndsAt = upgradingTo > level ? Math.max(0, asInt(row.upgradeEndsAt, 0)) : 0;
  return { level, upgradingTo, upgradeEndsAt };
};

const normalizeVillageState = (raw: unknown, nowMs = Date.now()): VillageState => {
  const base = createVillageState(nowMs);
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const settlementName = sanitizeSettlementName(row.settlementName ?? "");
  const lastClaimAtRaw = asInt(row.lastClaimAt, nowMs);
  const lastClaimAt = Math.max(0, Math.min(nowMs, lastClaimAtRaw));
  const buildingsRaw = (row.buildings && typeof row.buildings === "object")
    ? row.buildings as Record<string, unknown>
    : {};
  return {
    settlementName,
    lastClaimAt,
    buildings: {
      castle: normalizeVillageBuilding("castle", buildingsRaw.castle),
      mine: normalizeVillageBuilding("mine", buildingsRaw.mine),
      lab: normalizeVillageBuilding("lab", buildingsRaw.lab),
      storage: normalizeVillageBuilding("storage", buildingsRaw.storage),
    },
  };
};

const cloneVillageState = (village: VillageState): VillageState =>
  structuredClone(village) as VillageState;

const getVillageUpgradeCost = (buildingId: VillageBuildingId, currentLevelRaw: number) => {
  const maxLevel = getVillageBuildingMaxLevel(buildingId);
  const targetLevel = Math.min(maxLevel, Math.max(1, Math.floor(currentLevelRaw) + 1));
  const byLevel = VILLAGE_UPGRADE_COST_BY_TARGET_LEVEL[buildingId];
  const baseCost = getVillageTableValue(byLevel, targetLevel);
  return Math.max(0, Math.round(baseCost * VILLAGE_UPGRADE_COST_MULTIPLIER));
};

const getVillageUpgradeDurationSec = (
  buildingId: VillageBuildingId,
  currentLevelRaw: number,
  premiumActive = false,
) => {
  const maxLevel = getVillageBuildingMaxLevel(buildingId);
  const targetLevel = Math.min(maxLevel, Math.max(1, Math.floor(currentLevelRaw) + 1));
  const byLevel = VILLAGE_UPGRADE_HOURS_BY_TARGET_LEVEL[buildingId];
  const hours = getVillageTableValue(byLevel, targetLevel);
  const baseDurationSec = Math.max(5, Math.round(hours * 3600));
  if (!premiumActive) return baseDurationSec;
  return Math.max(5, Math.round(baseDurationSec * VILLAGE_PREMIUM_UPGRADE_TIME_MULTIPLIER));
};

const getVillageStorageCapHours = (storageLevelRaw: number) =>
  getVillageTableValue(VILLAGE_STORAGE_CAP_HOURS_BY_LEVEL, storageLevelRaw);

const getVillageCastleMultiplier = (castleLevelRaw: number) =>
  1 + getVillageTableValue(VILLAGE_CASTLE_BONUS_BY_LEVEL, castleLevelRaw);

const getVillageMineGoldPerHour = (mineLevelRaw: number, castleLevelRaw: number) =>
  (getVillageTableValue(VILLAGE_MINE_GOLD_PER_HOUR_BY_LEVEL, mineLevelRaw) / 24) *
  getVillageCastleMultiplier(castleLevelRaw);

const getVillageLabCrystalsPerHour = (labLevelRaw: number, castleLevelRaw: number) =>
  (getVillageTableValue(VILLAGE_LAB_CRYSTALS_PER_HOUR_BY_LEVEL, labLevelRaw) / 24) *
  getVillageCastleMultiplier(castleLevelRaw);

const getVillageProductionRates = (village: VillageState) => {
  const castleLevel = village.buildings.castle.level;
  const mineLevel = village.buildings.mine.level;
  const labLevel = village.buildings.lab.level;
  const storageLevel = village.buildings.storage.level;
  const castleMultiplier = getVillageCastleMultiplier(castleLevel);
  const goldPerHour = getVillageMineGoldPerHour(mineLevel, castleLevel);
  const crystalsPerHour = getVillageLabCrystalsPerHour(labLevel, castleLevel);
  const capHours = getVillageStorageCapHours(storageLevel);
  return { goldPerHour, crystalsPerHour, capHours, castleMultiplier };
};

const applyVillageUpgradeCompletions = (village: VillageState, nowMs = Date.now()) => {
  const completed: VillageBuildingId[] = [];
  const order: VillageBuildingId[] = ["castle", "mine", "lab", "storage"];
  for (const buildingId of order) {
    const building = village.buildings[buildingId];
    if (building.upgradingTo !== building.level + 1) continue;
    if (building.upgradeEndsAt <= 0 || nowMs < building.upgradeEndsAt) continue;
    building.level = building.upgradingTo;
    building.upgradingTo = 0;
    building.upgradeEndsAt = 0;
    completed.push(buildingId);
  }
  return completed;
};

const getVillageActiveUpgrade = (village: VillageState, nowMs = Date.now()) => {
  const order: VillageBuildingId[] = ["castle", "mine", "lab", "storage"];
  for (const buildingId of order) {
    const building = village.buildings[buildingId];
    if (building.upgradingTo !== building.level + 1) continue;
    if (building.upgradeEndsAt <= nowMs) continue;
    return {
      buildingId,
      remainingSec: Math.max(0, Math.ceil((building.upgradeEndsAt - nowMs) / 1000)),
    };
  }
  return null;
};

const getCastleUpgradeRequirement = (village: VillageState, playerLevelRaw: number, nextLevel: number) => {
  if (nextLevel !== 2 && nextLevel !== 3) return null;
  const requiredBuildingLevel = nextLevel === 2 ? VILLAGE_CASTLE_LEVEL2_REQUIREMENT : VILLAGE_CASTLE_LEVEL3_REQUIREMENT;
  const requiredPlayerLevel = nextLevel === 2 ? VILLAGE_CASTLE_LEVEL2_PLAYER_LEVEL : VILLAGE_CASTLE_LEVEL3_PLAYER_LEVEL;
  const playerLevel = Math.max(1, Math.floor(playerLevelRaw));
  const mineLevel = village.buildings.mine.level;
  const labLevel = village.buildings.lab.level;
  const storageLevel = village.buildings.storage.level;
  const allBuildingsReady = mineLevel >= requiredBuildingLevel && labLevel >= requiredBuildingLevel && storageLevel >= requiredBuildingLevel;
  const playerReady = playerLevel >= requiredPlayerLevel;
  return {
    failed: !allBuildingsReady || !playerReady,
    text: `Requirements for Castle Lv.${nextLevel}: Mine ${mineLevel}/${requiredBuildingLevel}, Lab ${labLevel}/${requiredBuildingLevel}, Storage ${storageLevel}/${requiredBuildingLevel}, Player ${playerLevel}/${requiredPlayerLevel}.`,
  };
};

const getVillagePendingRewards = (villageRaw: VillageState, nowMs = Date.now()) => {
  const village = normalizeVillageState(villageRaw, nowMs);
  if (!village.settlementName) {
    return { elapsedSec: 0, effectiveSec: 0, capSec: 0, gold: 0, crystals: 0 };
  }

  const startMs = village.lastClaimAt;
  const targetMs = Math.max(startMs, nowMs);
  const elapsedSec = Math.max(0, Math.floor((targetMs - startMs) / 1000));
  const working = cloneVillageState(village);
  let cursorMs = startMs;
  let effectiveSec = 0;
  let goldAcc = 0;
  let crystalsAcc = 0;

  const consumeSegment = (endMs: number) => {
    if (endMs <= cursorMs) return;
    const segmentSec = Math.max(0, Math.floor((endMs - cursorMs) / 1000));
    if (segmentSec <= 0) {
      cursorMs = endMs;
      return;
    }

    const rates = getVillageProductionRates(working);
    const capSec = Math.max(0, Math.floor(rates.capHours * 3600));
    const capRemaining = Math.max(0, capSec - effectiveSec);
    const countedSec = Math.min(segmentSec, capRemaining);
    if (countedSec > 0) {
      goldAcc += (rates.goldPerHour * countedSec) / 3600;
      crystalsAcc += (rates.crystalsPerHour * countedSec) / 3600;
      effectiveSec += countedSec;
    }
    cursorMs = endMs;
  };

  let safety = 0;
  while (cursorMs < targetMs && safety < 20) {
    safety += 1;
    let nextCompletionMs = Number.POSITIVE_INFINITY;
    const order: VillageBuildingId[] = ["castle", "mine", "lab", "storage"];
    for (const buildingId of order) {
      const building = working.buildings[buildingId];
      if (building.upgradingTo !== building.level + 1) continue;
      const completionMs = Math.max(0, building.upgradeEndsAt);
      if (completionMs <= cursorMs || completionMs > targetMs) continue;
      if (completionMs < nextCompletionMs) nextCompletionMs = completionMs;
    }

    if (Number.isFinite(nextCompletionMs)) {
      consumeSegment(nextCompletionMs);
      applyVillageUpgradeCompletions(working, nextCompletionMs);
      continue;
    }

    consumeSegment(targetMs);
    break;
  }

  if (cursorMs < targetMs) {
    consumeSegment(targetMs);
  }

  const finalRates = getVillageProductionRates(working);
  const capSec = Math.max(0, Math.floor(finalRates.capHours * 3600));
  return {
    elapsedSec,
    effectiveSec: Math.max(0, effectiveSec),
    capSec,
    gold: Math.max(0, Math.floor(goldAcc)),
    crystals: Math.max(0, Math.floor(crystalsAcc)),
  };
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
  state.energyTimer = clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS);
  if (state.energy >= state.energyMax) {
    state.energy = state.energyMax;
    state.energyTimer = ENERGY_REGEN_SECONDS;
  }
  state.tickets = clampInt(state.tickets, 0, 30);
  state.worldBossTickets = Math.max(0, asInt(state.worldBossTickets, 0));
  state.starterPackPurchased = Boolean(state.starterPackPurchased);
  state.premiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
  state.premiumClaimDay = String(state.premiumClaimDay ?? "").slice(0, 10);
  state.village = normalizeVillageState(state.village, Date.now());
  const normalizedConsumables = normalizeConsumables(state.consumables);
  state.consumables = normalizedConsumables.rows;
  state.consumableId = Math.max(asInt(state.consumableId, 0), normalizedConsumables.maxId);
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

  // Crystals must primarily come from dungeon runs and matured staking claims.
  // World boss/referral/fortune/premium writes are server-side and should not be minted via profile_save.
  const maxCrystalPerDungeonRun = 50;
  const stakeAllowance = Math.floor(stakeDecrease * (1 + STAKE_BONUS_RATE));
  const maxCrystalGain = dungeonDelta * maxCrystalPerDungeonRun + stakeAllowance;
  if (crystalGain > maxCrystalGain) return "Suspicious crystal gain detected.";

  const maxGoldGain = Math.floor(safeElapsed / 60) * 15000 + killsDelta * 150 + dungeonDelta * 20000 + 100000;
  if (goldDelta > maxGoldGain) return "Suspicious gold gain detected.";

  const prevKeyItems = countConsumablesByType(prevState, "key");
  const nextKeyItems = countConsumablesByType(nextState, "key");
  if (nextKeyItems > prevKeyItems) {
    return "Dungeon key items can only be granted by secure server actions.";
  }

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

const applyOfflineEnergyRegen = (
  state: Record<string, unknown>,
  elapsedSecRaw: number,
) => {
  const energyMax = Math.max(1, asInt(state.energyMax, 50));
  let energy = clampInt(state.energy, 0, energyMax);
  let timer = clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS);
  const elapsedSec = Math.max(0, Math.floor(elapsedSecRaw));

  const prevEnergy = energy;
  const prevTimer = timer;

  if (energy >= energyMax) {
    state.energy = energyMax;
    state.energyTimer = ENERGY_REGEN_SECONDS;
    return prevEnergy !== energyMax || prevTimer !== ENERGY_REGEN_SECONDS;
  }
  if (elapsedSec <= 0) {
    state.energy = energy;
    state.energyTimer = timer;
    return false;
  }

  let remaining = elapsedSec;
  if (remaining < timer) {
    timer -= remaining;
    remaining = 0;
  } else {
    remaining -= timer;
    energy += 1;
    timer = ENERGY_REGEN_SECONDS;
  }

  if (energy >= energyMax) {
    energy = energyMax;
    timer = ENERGY_REGEN_SECONDS;
    remaining = 0;
  }

  if (remaining > 0 && energy < energyMax) {
    const passiveTicks = Math.floor(remaining / ENERGY_REGEN_SECONDS);
    if (passiveTicks > 0) {
      energy = Math.min(energyMax, energy + passiveTicks);
      remaining -= passiveTicks * ENERGY_REGEN_SECONDS;
    }
    timer = energy >= energyMax ? ENERGY_REGEN_SECONDS : Math.max(1, ENERGY_REGEN_SECONDS - remaining);
  }

  state.energy = clampInt(energy, 0, energyMax);
  state.energyTimer = clampInt(timer, 1, ENERGY_REGEN_SECONDS);
  return prevEnergy !== asInt(state.energy, 0) || prevTimer !== asInt(state.energyTimer, ENERGY_REGEN_SECONDS);
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
  const wallet = String(data.wallet);
  const blocked = await supabase
    .from("blocked_wallets")
    .select("wallet, reason")
    .eq("wallet", wallet)
    .maybeSingle();
  if (!blocked.error && blocked.data) {
    await supabase.from("wallet_sessions").delete().eq("token", token);
    await auditEvent(supabase, wallet, "blocked_session_denied", {
      reason: String(blocked.data.reason ?? "Cheating"),
    });
    return { ok: false as const, error: BLOCKED_ERROR_MESSAGE };
  }
  return { ok: true as const, wallet };
};

const toWalletList = (raw: string | undefined) =>
  (raw ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

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

const toLimitedDetails = (value: Record<string, unknown>) => {
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= 2000) return value;
    const cut = raw.slice(0, 2000);
    return { truncated: true, raw: cut };
  } catch {
    return { truncated: true, raw: "unserializable_details" };
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
    details: toLimitedDetails(details),
  });
};

const randomUnit = () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / 4294967296;
};

const pickFortuneReward = () => {
  const totalWeight = FORTUNE_REWARDS.reduce((sum, reward) => sum + reward.chance, 0);
  let roll = randomUnit() * totalWeight;
  for (const reward of FORTUNE_REWARDS) {
    roll -= reward.chance;
    if (roll <= 0) return reward;
  }
  return FORTUNE_REWARDS[FORTUNE_REWARDS.length - 1];
};

const ensureFortuneState = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const { data, error } = await supabase
    .from("fortune_state")
    .select("wallet, free_spin_day, paid_spins, updated_at")
    .eq("wallet", wallet)
    .maybeSingle();
  if (error) return { ok: false as const, error: "Failed to load fortune state." };

  if (data) {
    return {
      ok: true as const,
      state: {
        wallet,
        free_spin_day: String(data.free_spin_day ?? ""),
        paid_spins: Math.max(0, asInt(data.paid_spins, 0)),
        updated_at: String(data.updated_at ?? now.toISOString()),
      } as FortuneStateRow,
    };
  }

  const initial: FortuneStateRow = {
    wallet,
    free_spin_day: "",
    paid_spins: 0,
    updated_at: now.toISOString(),
  };
  const { error: insertError } = await supabase
    .from("fortune_state")
    .insert(initial);
  if (insertError) return { ok: false as const, error: "Failed to create fortune state." };
  return { ok: true as const, state: initial };
};

const updateFortuneState = async (
  supabase: ReturnType<typeof createClient>,
  state: FortuneStateRow,
  next: Partial<FortuneStateRow>,
) => {
  const payload = {
    free_spin_day: "free_spin_day" in next ? String(next.free_spin_day ?? "") : state.free_spin_day,
    paid_spins: "paid_spins" in next ? Math.max(0, asInt(next.paid_spins, state.paid_spins)) : state.paid_spins,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("fortune_state")
    .update(payload)
    .eq("wallet", state.wallet)
    .eq("free_spin_day", state.free_spin_day)
    .eq("paid_spins", state.paid_spins)
    .select("wallet, free_spin_day, paid_spins, updated_at")
    .maybeSingle();
  if (error || !data) return { ok: false as const };
  return {
    ok: true as const,
    state: {
      wallet: String(data.wallet),
      free_spin_day: String(data.free_spin_day ?? ""),
      paid_spins: Math.max(0, asInt(data.paid_spins, 0)),
      updated_at: String(data.updated_at ?? payload.updated_at),
    } as FortuneStateRow,
  };
};

const toWorldBossTicketState = (
  wallet: string,
  row: Record<string, unknown>,
  fallbackIso: string,
): WorldBossTicketRow => ({
  wallet,
  tickets: Math.max(0, asInt(row.tickets, 0)),
  premium_ticket_day: String(row.premium_ticket_day ?? ""),
  starter_ticket_granted: Boolean(row.starter_ticket_granted),
  shop_ticket_day: String(row.shop_ticket_day ?? ""),
  shop_ticket_buys: Math.max(0, asInt(row.shop_ticket_buys, 0)),
  updated_at: String(row.updated_at ?? fallbackIso),
});

const toDungeonState = (
  wallet: string,
  row: Record<string, unknown>,
  fallbackIso: string,
): DungeonStateRow => ({
  wallet,
  tickets: Math.max(0, asInt(row.tickets, 0)),
  ticket_day: String(row.ticket_day ?? ""),
  dungeon_runs: Math.max(0, asInt(row.dungeon_runs, 0)),
  shop_key_day: String(row.shop_key_day ?? ""),
  shop_key_buys: Math.max(0, asInt(row.shop_key_buys, 0)),
  updated_at: String(row.updated_at ?? fallbackIso),
});

const ensureDungeonTicketState = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const dayKey = todayKeyUtc(now);
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from("dungeon_state")
      .select("wallet, tickets, ticket_day, dungeon_runs, shop_key_day, shop_key_buys, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();
    if (error) return { ok: false as const, error: "Failed to load dungeon state." };

    let current: DungeonStateRow;
    if (data) {
      current = toDungeonState(wallet, data as Record<string, unknown>, nowIso);
    } else {
      const initial: DungeonStateRow = {
        wallet,
        tickets: DUNGEON_DAILY_TICKETS,
        ticket_day: dayKey,
        dungeon_runs: 0,
        shop_key_day: dayKey,
        shop_key_buys: 0,
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
        tickets: DUNGEON_DAILY_TICKETS,
        ticket_day: dayKey,
        shop_key_day: dayKey,
        shop_key_buys: 0,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("ticket_day", current.ticket_day)
      .eq("tickets", current.tickets)
      .eq("dungeon_runs", current.dungeon_runs)
      .eq("shop_key_day", current.shop_key_day)
      .eq("shop_key_buys", current.shop_key_buys)
      .select("wallet, tickets, ticket_day, dungeon_runs, shop_key_day, shop_key_buys, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Failed to sync dungeon state." };
};

const adjustDungeonTickets = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  delta: number,
  now: Date,
) => {
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureDungeonTicketState(supabase, wallet, now);
    if (!ensured.ok) return ensured;

    const current = ensured.state;
    if (delta === 0) return { ok: true as const, state: current };

    const nextTickets = Math.max(0, Math.min(MAX_TICKETS, current.tickets + delta));
    if (delta < 0 && nextTickets >= current.tickets) {
      return { ok: false as const, error: "No dungeon keys left.", state: current };
    }
    if (nextTickets === current.tickets) {
      return { ok: true as const, state: current };
    }

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
      .eq("shop_key_day", current.shop_key_day)
      .eq("shop_key_buys", current.shop_key_buys)
      .select("wallet, tickets, ticket_day, dungeon_runs, shop_key_day, shop_key_buys, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Dungeon key conflict, retry." };
};

const incrementDungeonShopKeyBuys = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const dayKey = todayKeyUtc(now);
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureDungeonTicketState(supabase, wallet, now);
    if (!ensured.ok || !ensured.state) {
      return { ok: false as const, error: ensured.error || "Failed to load dungeon state." };
    }
    const current = ensured.state;
    const currentBuys = current.shop_key_day === dayKey ? current.shop_key_buys : 0;
    if (currentBuys >= SHOP_DUNGEON_KEY_DAILY_LIMIT) {
      return {
        ok: false as const,
        error: `Daily limit reached: max ${SHOP_DUNGEON_KEY_DAILY_LIMIT} dungeon keys.`,
        state: current,
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from("dungeon_state")
      .update({
        shop_key_day: dayKey,
        shop_key_buys: currentBuys + 1,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("ticket_day", current.ticket_day)
      .eq("tickets", current.tickets)
      .eq("dungeon_runs", current.dungeon_runs)
      .eq("shop_key_day", current.shop_key_day)
      .eq("shop_key_buys", current.shop_key_buys)
      .select("wallet, tickets, ticket_day, dungeon_runs, shop_key_day, shop_key_buys, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return { ok: true as const, state: toDungeonState(wallet, updated as Record<string, unknown>, nowIso) };
    }
  }

  return { ok: false as const, error: "Dungeon key purchase limit conflict, retry." };
};

const getWorldBossTicketProfileFlags = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("state")
    .eq("wallet", wallet)
    .maybeSingle();

  if (error || !data || !data.state || typeof data.state !== "object") {
    return {
      ok: true as const,
      starterPackPurchased: false,
      premiumActive: false,
    };
  }

  const profile = normalizeState(data.state as unknown);
  if (!profile) {
    return {
      ok: true as const,
      starterPackPurchased: false,
      premiumActive: false,
    };
  }

  return {
    ok: true as const,
    starterPackPurchased: Boolean(profile.starterPackPurchased),
    premiumActive: Math.max(0, asInt(profile.premiumEndsAt, 0)) > now.getTime(),
  };
};

const ensureWorldBossTicketState = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const dayKey = todayKeyUtc(now);
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await supabase
      .from("world_boss_tickets")
      .select("wallet, tickets, premium_ticket_day, starter_ticket_granted, shop_ticket_day, shop_ticket_buys, updated_at")
      .eq("wallet", wallet)
      .maybeSingle();
    if (error) return { ok: false as const, error: "Failed to load world boss tickets." };

    let current: WorldBossTicketRow;
    if (data) {
      current = toWorldBossTicketState(wallet, data as Record<string, unknown>, nowIso);
    } else {
      const initial: WorldBossTicketRow = {
        wallet,
        tickets: 0,
        premium_ticket_day: "",
        starter_ticket_granted: false,
        shop_ticket_day: dayKey,
        shop_ticket_buys: 0,
        updated_at: nowIso,
      };
      const { error: insertError } = await supabase
        .from("world_boss_tickets")
        .insert(initial);
      if (insertError) continue;
      current = initial;
    }

    const flags = await getWorldBossTicketProfileFlags(supabase, wallet, now);
    if (!flags.ok) return { ok: false as const, error: flags.error };

    let nextTickets = current.tickets;
    let nextStarterGranted = current.starter_ticket_granted;
    let changed = false;

    if (flags.starterPackPurchased && !nextStarterGranted) {
      nextTickets += WORLD_BOSS_STARTER_TICKETS;
      nextStarterGranted = true;
      changed = true;
    }

    if (!changed) return { ok: true as const, state: current };

    const { data: updated, error: updateError } = await supabase
      .from("world_boss_tickets")
      .update({
        tickets: nextTickets,
        premium_ticket_day: current.premium_ticket_day,
        starter_ticket_granted: nextStarterGranted,
        shop_ticket_day: current.shop_ticket_day,
        shop_ticket_buys: current.shop_ticket_buys,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("tickets", current.tickets)
      .eq("premium_ticket_day", current.premium_ticket_day)
      .eq("starter_ticket_granted", current.starter_ticket_granted)
      .eq("shop_ticket_day", current.shop_ticket_day)
      .eq("shop_ticket_buys", current.shop_ticket_buys)
      .select("wallet, tickets, premium_ticket_day, starter_ticket_granted, shop_ticket_day, shop_ticket_buys, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      return {
        ok: true as const,
        state: toWorldBossTicketState(wallet, updated as Record<string, unknown>, nowIso),
      };
    }
  }

  return { ok: false as const, error: "Failed to sync world boss tickets." };
};

const adjustWorldBossTickets = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  delta: number,
  now: Date,
) => {
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureWorldBossTicketState(supabase, wallet, now);
    if (!ensured.ok) return ensured;

    const current = ensured.state;
    const nextTickets = current.tickets + delta;
    if (nextTickets < 0) {
      return { ok: false as const, error: "No World Boss tickets left.", state: current };
    }
    if (delta === 0) {
      return { ok: true as const, state: current };
    }

    const { data: updated, error } = await supabase
      .from("world_boss_tickets")
      .update({
        tickets: nextTickets,
        shop_ticket_day: current.shop_ticket_day,
        shop_ticket_buys: current.shop_ticket_buys,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("tickets", current.tickets)
      .eq("premium_ticket_day", current.premium_ticket_day)
      .eq("starter_ticket_granted", current.starter_ticket_granted)
      .eq("shop_ticket_day", current.shop_ticket_day)
      .eq("shop_ticket_buys", current.shop_ticket_buys)
      .select("wallet, tickets, premium_ticket_day, starter_ticket_granted, shop_ticket_day, shop_ticket_buys, updated_at")
      .maybeSingle();

    if (!error && updated) {
      return {
        ok: true as const,
        state: toWorldBossTicketState(wallet, updated as Record<string, unknown>, nowIso),
      };
    }
  }

  return { ok: false as const, error: "World Boss ticket conflict, retry." };
};

const buyWorldBossTicketWithShopLimit = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  now: Date,
) => {
  const dayKey = todayKeyUtc(now);
  const nowIso = now.toISOString();

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const ensured = await ensureWorldBossTicketState(supabase, wallet, now);
    if (!ensured.ok || !ensured.state) {
      return { ok: false as const, error: ensured.error || "Failed to load world boss tickets." };
    }

    const current = ensured.state;
    const currentBuys = current.shop_ticket_day === dayKey ? current.shop_ticket_buys : 0;
    if (currentBuys >= SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT) {
      return {
        ok: false as const,
        error: `Daily limit reached: max ${SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT} World Boss tickets.`,
        state: current,
      };
    }

    const { data: updated, error } = await supabase
      .from("world_boss_tickets")
      .update({
        tickets: current.tickets + 1,
        shop_ticket_day: dayKey,
        shop_ticket_buys: currentBuys + 1,
        updated_at: nowIso,
      })
      .eq("wallet", wallet)
      .eq("tickets", current.tickets)
      .eq("premium_ticket_day", current.premium_ticket_day)
      .eq("starter_ticket_granted", current.starter_ticket_granted)
      .eq("shop_ticket_day", current.shop_ticket_day)
      .eq("shop_ticket_buys", current.shop_ticket_buys)
      .select("wallet, tickets, premium_ticket_day, starter_ticket_granted, shop_ticket_day, shop_ticket_buys, updated_at")
      .maybeSingle();

    if (!error && updated) {
      return {
        ok: true as const,
        state: toWorldBossTicketState(wallet, updated as Record<string, unknown>, nowIso),
      };
    }
  }

  return { ok: false as const, error: "World Boss ticket purchase conflict, retry." };
};

const applyFortuneReward = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  reward: FortuneRewardDef,
) => {
  return updateProfileWithRetry(supabase, wallet, (state) => {
    if (reward.kind === "gold") {
      state.gold = Math.max(0, asInt(state.gold, 0)) + reward.amount;
      return;
    }
    if (reward.kind === "crystals") {
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + reward.amount;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0)) + reward.amount;
      return;
    }
    if (reward.kind === "keys") {
      state.tickets = Math.min(MAX_TICKETS, Math.max(0, asInt(state.tickets, 0)) + reward.amount);
      return;
    }
    if (reward.kind === "consumable" && reward.consumableType) {
      addConsumableToState(state, reward.consumableType);
    }
  });
};

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

const getWorldBossAttackFromState = (state: Record<string, unknown>) => {
  const player = (state.player as Record<string, unknown> | undefined) ?? {};
  const baseAttack = Math.max(1, asInt(player.baseAttack, 1));

  const equipment = state.equipment as Record<string, unknown> | undefined;
  let bonusAttack = 0;
  if (equipment && typeof equipment === "object" && !Array.isArray(equipment)) {
    for (const item of Object.values(equipment)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const bonuses = (item as Record<string, unknown>).bonuses;
      if (!bonuses || typeof bonuses !== "object" || Array.isArray(bonuses)) continue;
      const attack = Number((bonuses as Record<string, unknown>).attack ?? 0);
      if (Number.isFinite(attack) && attack > 0) {
        bonusAttack += attack;
      }
    }
  }

  return Math.max(1, Math.round(baseAttack + bonusAttack));
};

const loadWorldBossAttack = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("state")
    .eq("wallet", wallet)
    .maybeSingle();

  if (error || !data || !data.state || typeof data.state !== "object") {
    return 1;
  }

  const state = normalizeState(data.state as unknown);
  if (!state) return 1;
  return getWorldBossAttackFromState(state);
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
    const updatedAt = new Date().toISOString();
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
  return { ok: false as const };
};

const claimWorldBossReward = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  boss: WorldBossRow,
  now: Date,
) => {
  if (!boss.last_cycle_start || !boss.last_cycle_end || !boss.last_prize_pool) return { share: 0 as const };
  if (new Date(boss.last_cycle_end).getTime() > now.getTime()) return { share: 0 as const };

  const { data: playerRow, error: playerError } = await supabase
    .from("world_boss_participants")
    .select("wallet, cycle_start, name, damage, joined, reward_claimed")
    .eq("cycle_start", boss.last_cycle_start)
    .eq("wallet", wallet)
    .maybeSingle();

  if (playerError || !playerRow) return { share: 0 as const };
  if (Boolean(playerRow.reward_claimed) || !Boolean(playerRow.joined)) return { share: 0 as const };

  const { data: totalRows, error: totalError } = await supabase
    .from("world_boss_participants")
    .select("damage")
    .eq("cycle_start", boss.last_cycle_start)
    .eq("joined", true);
  if (totalError || !totalRows) return { share: 0 as const };

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

  if (claimError || !claimRow || share <= 0) return { share: 0 as const };

  const creditResult = await updateProfileWithRetry(supabase, wallet, (state) => {
    state.crystals = Math.max(0, asInt(state.crystals, 0)) + share;
    state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + share;
  });

  if (!creditResult.ok) {
    await auditEvent(supabase, wallet, "worldboss_reward_credit_failed", {
      share,
      cycleStart: boss.last_cycle_start,
    });
    return { share: 0 as const };
  }

  return {
    share,
    updatedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
  };
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

  if (action === "profile_refresh_energy") {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const attemptNow = new Date();
      const attemptNowIso = attemptNow.toISOString();
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

      const updatedAtMs = profileRow.updated_at ? new Date(String(profileRow.updated_at)).getTime() : Number.NaN;
      const elapsedSec = Number.isFinite(updatedAtMs)
        ? Math.max(0, Math.floor((attemptNow.getTime() - updatedAtMs) / 1000))
        : 0;

      const changed = applyOfflineEnergyRegen(state, elapsedSec);
      if (!changed) {
        const savedAt = String(profileRow.updated_at ?? attemptNowIso);
        return json({
          ok: true,
          savedAt,
          energy: Math.max(0, asInt(state.energy, 0)),
          energyTimer: clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS),
        });
      }

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: attemptNowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
        await auditEvent(supabase, auth.wallet, "energy_offline_regen", {
          elapsedSec,
          energy: Math.max(0, asInt(state.energy, 0)),
          energyTimer: clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS),
        });
        return json({
          ok: true,
          savedAt: attemptNowIso,
          energy: Math.max(0, asInt(state.energy, 0)),
          energyTimer: clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS),
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry energy sync." });
  }

  if (action === "profile_load") {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (profileError) {
      return json({ ok: false, error: "Failed to load profile." });
    }
    if (!profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return json({ ok: true, profile: null });
    }

    const state = normalizeState(profileRow.state as unknown);
    if (!state) {
      return json({ ok: false, error: "Invalid profile state." });
    }
    return json({
      ok: true,
      profile: {
        state,
        updated_at: String(profileRow.updated_at ?? ""),
      },
    });
  }

  if (action === "profile_save") {
    const normalizedState = normalizeState(body.state);
    if (!normalizedState) {
      return json({ ok: false, error: "Invalid profile payload." });
    }
    const clientUpdatedAt = String(body.clientUpdatedAt ?? "").trim();

    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (existingError) {
      return json({ ok: false, error: "Failed to load profile." });
    }
    if (existing) {
      if (!clientUpdatedAt) {
        await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
          reason: "Missing clientUpdatedAt.",
        });
        return json({ ok: false, error: "Profile version is missing. Refresh the game." });
      }
      const serverUpdatedAtMs = existing.updated_at ? new Date(String(existing.updated_at)).getTime() : Number.NaN;
      const clientUpdatedAtMs = new Date(clientUpdatedAt).getTime();
      if (
        Number.isFinite(serverUpdatedAtMs) &&
        Number.isFinite(clientUpdatedAtMs) &&
        serverUpdatedAtMs - clientUpdatedAtMs > 2000
      ) {
        await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
          reason: "Stale client profile version.",
          serverUpdatedAt: existing.updated_at,
          clientUpdatedAt,
        });
        return json({ ok: false, error: "Profile is outdated. Reload game state and retry." });
      }
    }

    const prevStateRaw = existing?.state && typeof existing.state === "object"
      ? (existing.state as Record<string, unknown>)
      : null;
    const prevState = prevStateRaw ? normalizeState(prevStateRaw) : null;
    // Never allow client saves to roll premium back (stale client state can otherwise erase active premium).
    if (prevState) {
      const prevPremiumEndsAt = Math.max(0, asInt(prevState.premiumEndsAt, 0));
      const nextPremiumEndsAt = Math.max(0, asInt(normalizedState.premiumEndsAt, 0));
      if (nextPremiumEndsAt < prevPremiumEndsAt) {
        normalizedState.premiumEndsAt = prevPremiumEndsAt;
      }
      const prevPremiumClaimDay = String(prevState.premiumClaimDay ?? "");
      const nextPremiumClaimDay = String(normalizedState.premiumClaimDay ?? "");
      if (nextPremiumClaimDay < prevPremiumClaimDay) {
        normalizedState.premiumClaimDay = prevPremiumClaimDay;
      }
      // Village writes are server-authoritative and must never be accepted from client profile_save.
      normalizedState.village = normalizeVillageState(prevState.village, now.getTime());
    } else if (!existing) {
      // Initial village state is server-owned; never accept custom client seed values.
      normalizedState.village = createVillageState(now.getTime());
    } else {
      return json({ ok: false, error: "Invalid previous profile state. Contact support." });
    }
    const prevMetrics = prevState ? getMetrics(prevState) : null;
    const nextMetrics = getMetrics(normalizedState);
    const previousUpdatedAtMs = existing?.updated_at ? new Date(String(existing.updated_at)).getTime() : Number.NaN;
    const elapsedSec = Number.isFinite(previousUpdatedAtMs)
      ? Math.max(1, Math.floor((now.getTime() - previousUpdatedAtMs) / 1000))
      : 3600;

    const validationError = validateStateTransition(prevState, normalizedState, prevMetrics, nextMetrics, elapsedSec, now.getTime());
    if (validationError) {
      await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
        reason: validationError,
        elapsedSec,
        prev: prevMetrics,
        next: nextMetrics,
      });
      return json({ ok: false, error: validationError });
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          wallet: auth.wallet,
          state: normalizedState,
          updated_at: now.toISOString(),
        });
      if (insertError) return json({ ok: false, error: "Failed to save profile." });
    } else {
      const expectedUpdatedAt = String(existing.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state: normalizedState,
          updated_at: now.toISOString(),
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (updateError || !updated) {
        return json({ ok: false, error: "Profile changed concurrently, retry save." });
      }
    }
    const hasMeaningfulDelta = !prevMetrics ||
      nextMetrics.level !== prevMetrics.level ||
      nextMetrics.monsterKills !== prevMetrics.monsterKills ||
      nextMetrics.dungeonRuns !== prevMetrics.dungeonRuns ||
      nextMetrics.gold !== prevMetrics.gold ||
      nextMetrics.crystals !== prevMetrics.crystals;
    if (hasMeaningfulDelta) {
      await auditEvent(supabase, auth.wallet, "profile_save", {
        elapsedSec,
        prev: prevMetrics,
        next: nextMetrics,
      });
    }
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

    await auditEvent(supabase, auth.wallet, "withdraw_submit", {
      amount,
      solAmount,
      remainingCrystals: nextCrystals,
      withdrawalId: String(withdrawalRow.id ?? ""),
    });

    return json({
      ok: true,
      savedAt: now.toISOString(),
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

  if (action === "fortune_status") {
    const dayKey = todayKeyUtc(now);
    const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
    if (!fortuneState.ok) {
      return json({ ok: false, error: fortuneState.error });
    }

    return json({
      ok: true,
      fortuneFreeSpinAvailable: fortuneState.state.free_spin_day !== dayKey,
      fortunePaidSpins: Math.max(0, asInt(fortuneState.state.paid_spins, 0)),
    });
  }

  if (action === "fortune_buy") {
    const spins = asInt(body.spins, 0);
    if (!(FORTUNE_SPIN_PACKS as readonly number[]).includes(spins)) {
      return json({ ok: false, error: "Invalid fortune spin pack." });
    }

    const txSignature = String(body.txSignature ?? "").trim().slice(0, 120);
    if (!isTxSignatureLike(txSignature)) {
      return json({ ok: false, error: "Invalid payment transaction signature." });
    }
    const lamportsRequired = (FORTUNE_SPIN_PRICES_LAMPORTS as Record<number, number>)[spins];
    if (!Number.isFinite(lamportsRequired) || lamportsRequired <= 0) {
      return json({ ok: false, error: "Invalid fortune spin pack price." });
    }

    const alreadyProcessed = await wasFortuneTxAlreadyProcessed(supabase, auth.wallet, txSignature);
    if (alreadyProcessed) {
      const dayKey = todayKeyUtc(now);
      const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
      if (!fortuneState.ok) {
        return json({ ok: false, error: fortuneState.error });
      }
      return json({
        ok: true,
        fortuneAlreadyProcessed: true,
        fortuneFreeSpinAvailable: fortuneState.state.free_spin_day !== dayKey,
        fortunePaidSpins: Math.max(0, asInt(fortuneState.state.paid_spins, 0)),
      });
    }

    const txCheck = await verifyFortunePaymentTx(auth.wallet, txSignature, lamportsRequired, now);
    if (!txCheck.ok) {
      return json({ ok: false, error: txCheck.error });
    }

    const dayKey = todayKeyUtc(now);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
      if (!fortuneState.ok) {
        return json({ ok: false, error: fortuneState.error });
      }

      const nextPaidSpins = Math.max(0, asInt(fortuneState.state.paid_spins, 0)) + spins;
      const updated = await updateFortuneState(supabase, fortuneState.state, {
        paid_spins: nextPaidSpins,
      });
      if (!updated.ok) continue;

      await auditEvent(supabase, auth.wallet, "fortune_buy", {
        spins,
        txSignature,
        lamports: lamportsRequired,
        txBlockTime: txCheck.blockTime,
        txSlot: txCheck.slot,
        paidSpins: updated.state.paid_spins,
      });

      return json({
        ok: true,
        fortuneAlreadyProcessed: false,
        fortuneFreeSpinAvailable: updated.state.free_spin_day !== dayKey,
        fortunePaidSpins: Math.max(0, asInt(updated.state.paid_spins, 0)),
      });
    }

    return json({ ok: false, error: "Failed to register fortune spin purchase, retry." });
  }

  if (action === "fortune_spin") {
    const dayKey = todayKeyUtc(now);

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
      if (!fortuneState.ok) {
        return json({ ok: false, error: fortuneState.error });
      }

      const hasFreeSpin = fortuneState.state.free_spin_day !== dayKey;
      const hasPaidSpin = Math.max(0, asInt(fortuneState.state.paid_spins, 0)) > 0;
      if (!hasFreeSpin && !hasPaidSpin) {
        return json({ ok: false, error: "No fortune spins available." });
      }

      const useFreeSpin = hasFreeSpin;
      const nextPatch = useFreeSpin
        ? { free_spin_day: dayKey }
        : { paid_spins: Math.max(0, asInt(fortuneState.state.paid_spins, 0) - 1) };

      const updatedState = await updateFortuneState(supabase, fortuneState.state, nextPatch);
      if (!updatedState.ok) continue;

      const reward = pickFortuneReward();
      const creditResult = await applyFortuneReward(supabase, auth.wallet, reward);

      if (!creditResult.ok || !creditResult.state) {
        if (useFreeSpin) {
          await supabase
            .from("fortune_state")
            .update({
              free_spin_day: fortuneState.state.free_spin_day,
              updated_at: new Date().toISOString(),
            })
            .eq("wallet", auth.wallet)
            .eq("free_spin_day", updatedState.state.free_spin_day)
            .eq("paid_spins", updatedState.state.paid_spins);
        } else {
          await supabase
            .from("fortune_state")
            .update({
              paid_spins: updatedState.state.paid_spins + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("wallet", auth.wallet)
            .eq("free_spin_day", updatedState.state.free_spin_day)
            .eq("paid_spins", updatedState.state.paid_spins);
        }

        await auditEvent(supabase, auth.wallet, "fortune_spin_credit_failed", {
          rewardId: reward.id,
          used: useFreeSpin ? "free" : "paid",
        });
        return json({ ok: false, error: "Failed to apply fortune reward." });
      }

      await auditEvent(supabase, auth.wallet, "fortune_spin", {
        rewardId: reward.id,
        rewardLabel: reward.label,
        rewardKind: reward.kind,
        rewardAmount: reward.amount,
        used: useFreeSpin ? "free" : "paid",
        paidSpinsLeft: updatedState.state.paid_spins,
      });

      return json({
        ok: true,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
        fortuneUsed: useFreeSpin ? "free" : "paid",
        fortuneReward: {
          id: reward.id,
          label: reward.label,
          kind: reward.kind,
          amount: reward.amount,
          chance: reward.chance,
          consumableType: reward.consumableType ?? null,
        },
        fortuneFreeSpinAvailable: updatedState.state.free_spin_day !== dayKey,
        fortunePaidSpins: Math.max(0, asInt(updatedState.state.paid_spins, 0)),
        tickets: Math.max(0, asInt(creditResult.state.tickets, 0)),
        gold: Math.max(0, asInt(creditResult.state.gold, 0)),
        crystals: Math.max(0, asInt(creditResult.state.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(creditResult.state.crystalsEarned, 0)),
        consumables: normalizeConsumables(creditResult.state.consumables).rows,
      });
    }

    return json({ ok: false, error: "Fortune spin conflict, please retry." });
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
        if (!insertError) {
          referralApplied = true;
          await auditEvent(supabase, auth.wallet, "referral_applied", { referrerWallet: applyReferrer });
        }
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
      await auditEvent(supabase, auth.wallet, "referral_claim_empty");
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
      await auditEvent(supabase, auth.wallet, "referral_claim_credit_failed", {
        claimedKeys,
        claimedCrystals,
      });
      return json({ ok: false, error: "Failed to credit referral rewards." });
    }

    await auditEvent(supabase, auth.wallet, "referral_claim", {
      claimedKeys,
      claimedCrystals,
    });

    return json({
      ok: true,
      savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      claimedKeys,
      claimedCrystals,
      tickets: Math.max(0, asInt(creditResult.state.tickets, 0)),
      crystals: Math.max(0, asInt(creditResult.state.crystals, 0)),
    });
  }

  if (action === "buy_gold") {
    const pack = getGoldPack(body.packId);
    if (!pack) {
      return json({ ok: false, error: "Invalid gold package." });
    }

    const txSignature = String(body.txSignature ?? "").trim().slice(0, 120);
    if (!isTxSignatureLike(txSignature)) {
      return json({ ok: false, error: "Invalid payment transaction signature." });
    }

    const alreadyProcessed = await wasGoldTxAlreadyProcessed(supabase, auth.wallet, txSignature);
    if (alreadyProcessed) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("state, updated_at")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) return json({ ok: false, error: "Profile not found." });
      return json({
        ok: true,
        buyGoldAlreadyProcessed: true,
        gold: Math.max(0, asInt(state.gold, 0)),
        savedAt: String(profileRow?.updated_at ?? ""),
      });
    }

    const txCheck = await verifyGoldPaymentTx(auth.wallet, txSignature, pack.lamports, now);
    if (!txCheck.ok) {
      return json({ ok: false, error: txCheck.error });
    }

    const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      state.gold = Math.max(0, asInt(state.gold, 0)) + pack.gold;
    });
    if (!creditResult.ok || !creditResult.state) {
      return json({ ok: false, error: "Failed to credit gold package, retry." });
    }

    await auditEvent(supabase, auth.wallet, "buy_gold", {
      packId: pack.id,
      packGold: pack.gold,
      lamports: pack.lamports,
      txSignature,
      txBlockTime: txCheck.blockTime,
      txSlot: txCheck.slot,
      gold: Math.max(0, asInt(creditResult.state.gold, 0)),
    });

    return json({
      ok: true,
      buyGoldAlreadyProcessed: false,
      gold: Math.max(0, asInt(creditResult.state.gold, 0)),
      savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
    });
  }

  if (action === "premium_buy") {
    const plan = getPremiumPlan(body.planId, body.days);
    if (!plan) {
      return json({ ok: false, error: "Invalid Premium plan." });
    }

    const txSignature = String(body.txSignature ?? "").trim().slice(0, 120);
    if (!isTxSignatureLike(txSignature)) {
      return json({ ok: false, error: "Invalid payment transaction signature." });
    }

    const alreadyProcessed = await wasPremiumTxAlreadyProcessed(supabase, auth.wallet, txSignature);
    if (alreadyProcessed) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("state")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) {
        return json({ ok: false, error: "Profile not found." });
      }
      return json({
        ok: true,
        premiumEndsAt: Math.max(0, asInt(state.premiumEndsAt, 0)),
        premiumAlreadyProcessed: true,
      });
    }

    const txCheck = await verifyPremiumPaymentTx(auth.wallet, txSignature, plan.lamports, now);
    if (!txCheck.ok) {
      return json({ ok: false, error: txCheck.error });
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
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

      const nowMs = now.getTime();
      const currentPremiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
      const base = Math.max(nowMs, currentPremiumEndsAt);
      const nextPremiumEndsAt = base + plan.days * 24 * 60 * 60 * 1000;
      state.premiumEndsAt = nextPremiumEndsAt;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: now.toISOString(),
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
        await auditEvent(supabase, auth.wallet, "premium_buy", {
          planId: plan.id,
          days: plan.days,
          txSignature,
          lamports: plan.lamports,
          premiumEndsAt: nextPremiumEndsAt,
          txBlockTime: txCheck.blockTime,
          txSlot: txCheck.slot,
        });
        return json({
          ok: true,
          savedAt: now.toISOString(),
          premiumEndsAt: nextPremiumEndsAt,
          premiumDaysAdded: plan.days,
          premiumAlreadyProcessed: false,
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry premium activation." });
  }

  if (action === "premium_claim_daily") {
    const dayKey = todayKeyUtc(now);

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

      const premiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
      if (premiumEndsAt <= now.getTime()) {
        return json({ ok: false, error: "Premium subscription is inactive." });
      }
      if (String(state.premiumClaimDay ?? "") === dayKey) {
        return json({ ok: false, error: "Daily Premium rewards already claimed today." });
      }

      state.tickets = Math.min(MAX_TICKETS, Math.max(0, asInt(state.tickets, 0)) + PREMIUM_DAILY_KEYS);
      state.worldBossTickets = Math.max(0, asInt(state.worldBossTickets, 0)) + WORLD_BOSS_PREMIUM_DAILY_TICKETS;
      state.gold = Math.max(0, asInt(state.gold, 0)) + PREMIUM_DAILY_GOLD;
      for (let i = 0; i < PREMIUM_DAILY_SMALL_POTIONS; i += 1) {
        addConsumableToState(state, "energy-small");
      }
      for (let i = 0; i < PREMIUM_DAILY_BIG_POTIONS; i += 1) {
        addConsumableToState(state, "energy-full");
      }
      state.premiumClaimDay = dayKey;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: now.toISOString(),
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
        const dungeonGrant = await adjustDungeonTickets(supabase, auth.wallet, PREMIUM_DAILY_KEYS, now);
        const worldBossGrant = await adjustWorldBossTickets(
          supabase,
          auth.wallet,
          WORLD_BOSS_PREMIUM_DAILY_TICKETS,
          now,
        );
        const syncedTickets = dungeonGrant.ok && dungeonGrant.state
          ? Math.max(0, asInt(dungeonGrant.state.tickets, 0))
          : Math.max(0, asInt(state.tickets, 0));
        const syncedTicketDay = dungeonGrant.ok && dungeonGrant.state
          ? String(dungeonGrant.state.ticket_day ?? dayKey)
          : String(state.ticketDay ?? dayKey);
        const syncedWorldBossTickets = worldBossGrant.ok && worldBossGrant.state
          ? Math.max(0, asInt(worldBossGrant.state.tickets, 0))
          : Math.max(0, asInt(state.worldBossTickets, 0));
        const hasTicketGrantFailure = !dungeonGrant.ok || !worldBossGrant.ok;
        if (hasTicketGrantFailure) {
          await auditEvent(supabase, auth.wallet, "premium_claim_daily_ticket_grant_partial", {
            dayKey,
            dungeonGrantError: dungeonGrant.ok ? "" : dungeonGrant.error,
            worldBossGrantError: worldBossGrant.ok ? "" : worldBossGrant.error,
          });
        }
        await auditEvent(supabase, auth.wallet, "premium_claim_daily", {
          dayKey,
          tickets: syncedTickets,
          worldBossTickets: syncedWorldBossTickets,
          gold: Math.max(0, asInt(state.gold, 0)),
        });
        return json({
          ok: true,
          savedAt: now.toISOString(),
          tickets: syncedTickets,
          ticketDay: syncedTicketDay,
          worldBossTickets: syncedWorldBossTickets,
          gold: Math.max(0, asInt(state.gold, 0)),
          premiumClaimDay: dayKey,
          consumables: state.consumables,
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry premium claim." });
  }

  if (action === "village_status") {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
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

      const village = normalizeVillageState(state.village, nowMs);
      const completed = applyVillageUpgradeCompletions(village, nowMs);
      state.village = village;

      if (completed.length > 0) {
        const expectedUpdatedAt = String(profileRow.updated_at ?? "");
        const { data: updated, error: updateError } = await supabase
          .from("profiles")
          .update({
            state,
            updated_at: nowIso,
          })
          .eq("wallet", auth.wallet)
          .eq("updated_at", expectedUpdatedAt)
          .select("wallet")
          .maybeSingle();
        if (updateError || !updated) continue;
        await auditEvent(supabase, auth.wallet, "village_upgrade_complete", { completed });
      }

      const pending = getVillagePendingRewards(village, nowMs);
      const rates = getVillageProductionRates(village);
      const savedAt = completed.length > 0 ? nowIso : String(profileRow.updated_at ?? nowIso);
      return json({
        ok: true,
        savedAt,
        gold: Math.max(0, asInt(state.gold, 0)),
        crystals: Math.max(0, asInt(state.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
        village,
        villagePending: pending,
        villageRates: rates,
      });
    }

    return json({ ok: false, error: "Village status changed concurrently, retry." });
  }

  if (action === "village_init") {
    const name = sanitizeSettlementName(body.name ?? "");
    if (name.length < 3) {
      return json({ ok: false, error: "Village name must be at least 3 characters." });
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
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
      const village = normalizeVillageState(state.village, nowMs);
      if (village.settlementName) {
        return json({ ok: false, error: "Village name is already locked." });
      }

      village.settlementName = name;
      village.lastClaimAt = nowMs;
      state.village = village;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: nowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();
      if (updateError || !updated) continue;

      await auditEvent(supabase, auth.wallet, "village_init", { settlementName: name });
      const pending = getVillagePendingRewards(village, nowMs);
      const rates = getVillageProductionRates(village);
      return json({
        ok: true,
        savedAt: nowIso,
        gold: Math.max(0, asInt(state.gold, 0)),
        crystals: Math.max(0, asInt(state.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
        village,
        villagePending: pending,
        villageRates: rates,
      });
    }

    return json({ ok: false, error: "Village changed concurrently, retry setup." });
  }

  if (action === "village_upgrade_start") {
    const buildingIdRaw = String(body.buildingId ?? "").trim();
    if (!isVillageBuildingId(buildingIdRaw)) {
      return json({ ok: false, error: "Invalid building." });
    }
    const buildingId = buildingIdRaw;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
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

      const village = normalizeVillageState(state.village, nowMs);
      const completed = applyVillageUpgradeCompletions(village, nowMs);
      const activeUpgrade = getVillageActiveUpgrade(village, nowMs);
      if (!village.settlementName) {
        return json({ ok: false, error: "Set village name first." });
      }
      if (activeUpgrade && activeUpgrade.buildingId !== buildingId) {
        return json({ ok: false, error: "Only one building can be upgraded at a time." });
      }

      const building = village.buildings[buildingId];
      if (building.upgradingTo === building.level + 1 && building.upgradeEndsAt > nowMs) {
        return json({ ok: false, error: "Building is already upgrading." });
      }

      const maxLevel = getVillageBuildingMaxLevel(buildingId);
      if (building.level >= maxLevel) {
        return json({ ok: false, error: "Building is at max level." });
      }

      const nextLevel = building.level + 1;
      if (buildingId === "castle") {
        const player = (state.player as Record<string, unknown> | undefined) ?? {};
        const requirement = getCastleUpgradeRequirement(village, asInt(player.level, 1), nextLevel);
        if (requirement?.failed) {
          return json({ ok: false, error: requirement.text });
        }
      }

      const cost = getVillageUpgradeCost(buildingId, building.level);
      const gold = Math.max(0, asInt(state.gold, 0));
      if (gold < cost) {
        return json({ ok: false, error: `Not enough gold. Need ${cost}.` });
      }

      const premiumActive = Math.max(0, asInt(state.premiumEndsAt, 0)) > nowMs;
      const durationSec = getVillageUpgradeDurationSec(buildingId, building.level, premiumActive);
      building.upgradingTo = nextLevel;
      building.upgradeEndsAt = nowMs + durationSec * 1000;
      state.gold = gold - cost;
      state.village = village;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: nowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();
      if (updateError || !updated) continue;

      await auditEvent(supabase, auth.wallet, "village_upgrade_start", {
        buildingId,
        fromLevel: building.level,
        toLevel: nextLevel,
        cost,
        durationSec,
        completed,
      });
      const pending = getVillagePendingRewards(village, nowMs);
      const rates = getVillageProductionRates(village);
      return json({
        ok: true,
        savedAt: nowIso,
        gold: Math.max(0, asInt(state.gold, 0)),
        crystals: Math.max(0, asInt(state.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
        village,
        villagePending: pending,
        villageRates: rates,
      });
    }

    return json({ ok: false, error: "Village changed concurrently, retry upgrade." });
  }

  if (action === "village_claim") {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
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

      const village = normalizeVillageState(state.village, nowMs);
      const completed = applyVillageUpgradeCompletions(village, nowMs);
      if (!village.settlementName) {
        return json({ ok: false, error: "Set village name first." });
      }

      const pending = getVillagePendingRewards(village, nowMs);
      if (pending.gold <= 0 && pending.crystals <= 0) {
        return json({ ok: false, error: "No rewards to claim yet." });
      }

      state.gold = Math.max(0, asInt(state.gold, 0)) + pending.gold;
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + pending.crystals;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0)) + pending.crystals;
      village.lastClaimAt = nowMs;
      state.village = village;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: nowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();
      if (updateError || !updated) continue;

      await auditEvent(supabase, auth.wallet, "village_claim", {
        claimedGold: pending.gold,
        claimedCrystals: pending.crystals,
        completed,
      });
      const nextPending = getVillagePendingRewards(village, nowMs);
      const rates = getVillageProductionRates(village);
      return json({
        ok: true,
        savedAt: nowIso,
        gold: Math.max(0, asInt(state.gold, 0)),
        crystals: Math.max(0, asInt(state.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
        village,
        villageClaimedGold: pending.gold,
        villageClaimedCrystals: pending.crystals,
        villagePending: nextPending,
        villageRates: rates,
      });
    }

    return json({ ok: false, error: "Village changed concurrently, retry claim." });
  }

  if (action === "stake_start") {
    const amount = asInt(body.amount, 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ ok: false, error: "Enter a valid amount." });
    }
    if (amount < STAKE_MIN_AMOUNT) {
      return json({ ok: false, error: `Minimum stake is ${STAKE_MIN_AMOUNT} crystals.` });
    }
    if (amount > STAKE_MAX_AMOUNT) {
      return json({ ok: false, error: "Stake amount is too high." });
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

      const crystals = Math.max(0, asInt(state.crystals, 0));
      if (amount > crystals) {
        return json({ ok: false, error: "Not enough crystals." });
      }

      const stakeEntries = serializeStakeEntries(state);
      if (stakeEntries.length >= STAKE_MAX_COUNT) {
        return json({ ok: false, error: "Too many active stakes." });
      }

      const currentStakeId = Math.max(
        asInt(state.stakeId, 0),
        ...stakeEntries.map((entry) => entry.id),
        0,
      );
      const nextStakeId = currentStakeId + 1;
      const endsAt = now.getTime() + STAKE_DURATION_SECONDS * 1000;
      const nextEntries = [
        { id: nextStakeId, amount, endsAt },
        ...stakeEntries,
      ];

      state.crystals = crystals - amount;
      state.stakeId = nextStakeId;
      state.stake = nextEntries;

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: now.toISOString(),
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
        await auditEvent(supabase, auth.wallet, "stake_start", {
          amount,
          stakeId: nextStakeId,
          endsAt,
          crystals: Math.max(0, asInt(state.crystals, 0)),
        });
        return json({
          ok: true,
          savedAt: now.toISOString(),
          crystals: Math.max(0, asInt(state.crystals, 0)),
          stakeId: nextStakeId,
          stakeEntries: nextEntries,
          startedStake: { id: nextStakeId, amount, endsAt },
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry stake." });
  }

  if (action === "stake_claim") {
    const stakeId = asInt(body.stakeId, 0);
    if (!Number.isFinite(stakeId) || stakeId <= 0) {
      return json({ ok: false, error: "Invalid stake id." });
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
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

      const stakeEntries = serializeStakeEntries(state);
      const stakeEntry = stakeEntries.find((entry) => entry.id === stakeId);
      if (!stakeEntry) {
        return json({ ok: false, error: "Stake not found." });
      }
      if (now.getTime() < stakeEntry.endsAt) {
        return json({ ok: false, error: "Stake is still locked." });
      }

      const payout = stakeEntry.amount + Math.floor(stakeEntry.amount * STAKE_BONUS_RATE);
      const nextEntries = stakeEntries.filter((entry) => entry.id !== stakeId);
      state.stake = nextEntries;
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + payout;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + payout;
      state.stakeId = Math.max(asInt(state.stakeId, 0), ...nextEntries.map((entry) => entry.id), 0);

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: now.toISOString(),
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
        await auditEvent(supabase, auth.wallet, "stake_claim", {
          stakeId,
          payout,
          crystals: Math.max(0, asInt(state.crystals, 0)),
        });
        return json({
          ok: true,
          savedAt: now.toISOString(),
          crystals: Math.max(0, asInt(state.crystals, 0)),
          crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
          stakeId: Math.max(0, asInt(state.stakeId, 0)),
          stakeEntries: nextEntries,
          stakePayout: payout,
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry claim." });
  }

  if (action === "shop_buy_dungeon_key") {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const nowIso = new Date().toISOString();
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

      const gold = Math.max(0, asInt(state.gold, 0));
      if (gold < SHOP_DUNGEON_KEY_COST_GOLD) {
        return json({ ok: false, error: `Not enough gold. Need ${SHOP_DUNGEON_KEY_COST_GOLD}.` });
      }

      state.gold = gold - SHOP_DUNGEON_KEY_COST_GOLD;
      addConsumableToState(state, "key");
      const addedConsumableId = Math.max(0, asInt(state.consumableId, 0));

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          state,
          updated_at: nowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (updateError || !updatedProfile) continue;

      const limitUpdate = await incrementDungeonShopKeyBuys(supabase, auth.wallet, now);
      if (!limitUpdate.ok || !limitUpdate.state) {
        await updateProfileWithRetry(supabase, auth.wallet, (rollbackState) => {
          const normalized = normalizeConsumables(rollbackState.consumables);
          const hadAdded = normalized.rows.some((entry) => entry.id === addedConsumableId);
          rollbackState.consumables = hadAdded
            ? normalized.rows.filter((entry) => entry.id !== addedConsumableId)
            : normalized.rows;
          const maxId = normalized.rows.reduce((max, entry) => Math.max(max, entry.id), 0);
          rollbackState.consumableId = Math.max(asInt(rollbackState.consumableId, 0), maxId);
          if (hadAdded) {
            rollbackState.gold = Math.max(0, asInt(rollbackState.gold, 0)) + SHOP_DUNGEON_KEY_COST_GOLD;
          }
        });
        await auditEvent(supabase, auth.wallet, "shop_dungeon_key_buy_rejected", {
          reason: limitUpdate.error || "counter_update_failed",
          cost: SHOP_DUNGEON_KEY_COST_GOLD,
        });
        return json({ ok: false, error: limitUpdate.error || "Failed to buy dungeon key." });
      }

      await auditEvent(supabase, auth.wallet, "shop_dungeon_key_buy", {
        cost: SHOP_DUNGEON_KEY_COST_GOLD,
        gold: Math.max(0, asInt(state.gold, 0)),
        shopBuysToday: Math.max(0, asInt(limitUpdate.state.shop_key_buys, 0)),
      });

      return json({
        ok: true,
        savedAt: nowIso,
        gold: Math.max(0, asInt(state.gold, 0)),
        consumables: normalizeConsumables(state.consumables).rows,
        shopDungeonKeyDailyLimit: SHOP_DUNGEON_KEY_DAILY_LIMIT,
        shopDungeonKeyBuysToday: Math.max(0, asInt(limitUpdate.state.shop_key_buys, 0)),
        shopDungeonKeysLeftToday: Math.max(0, SHOP_DUNGEON_KEY_DAILY_LIMIT - Math.max(0, asInt(limitUpdate.state.shop_key_buys, 0))),
      });
    }

    return json({ ok: false, error: "Profile changed concurrently, retry key purchase." });
  }

  if (action === "shop_limits_status") {
    const dayKey = todayKeyUtc(now);
    const dungeon = await ensureDungeonTicketState(supabase, auth.wallet, now);
    if (!dungeon.ok || !dungeon.state) {
      return json({ ok: false, error: dungeon.error || "Failed to load dungeon shop limits." });
    }
    const worldBoss = await ensureWorldBossTicketState(supabase, auth.wallet, now);
    if (!worldBoss.ok || !worldBoss.state) {
      return json({ ok: false, error: worldBoss.error || "Failed to load world boss shop limits." });
    }
    const dungeonBuysToday = dungeon.state.shop_key_day === dayKey ? Math.max(0, asInt(dungeon.state.shop_key_buys, 0)) : 0;
    const worldBossBuysToday = worldBoss.state.shop_ticket_day === dayKey
      ? Math.max(0, asInt(worldBoss.state.shop_ticket_buys, 0))
      : 0;
    return json({
      ok: true,
      shopDayKey: dayKey,
      shopDungeonKeyDailyLimit: SHOP_DUNGEON_KEY_DAILY_LIMIT,
      shopDungeonKeyBuysToday: dungeonBuysToday,
      shopDungeonKeysLeftToday: Math.max(0, SHOP_DUNGEON_KEY_DAILY_LIMIT - dungeonBuysToday),
      shopWorldBossTicketDailyLimit: SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT,
      shopWorldBossTicketBuysToday: worldBossBuysToday,
      shopWorldBossTicketsLeftToday: Math.max(0, SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT - worldBossBuysToday),
    });
  }

  if (action === "worldboss_ticket_status") {
    const ticketState = await ensureWorldBossTicketState(supabase, auth.wallet, now);
    if (!ticketState.ok) {
      return json({ ok: false, error: ticketState.error });
    }
    const dayKey = todayKeyUtc(now);
    const worldBossBuysToday = ticketState.state.shop_ticket_day === dayKey
      ? Math.max(0, asInt(ticketState.state.shop_ticket_buys, 0))
      : 0;
    return json({
      ok: true,
      worldBossTickets: Math.max(0, asInt(ticketState.state.tickets, 0)),
      shopWorldBossTicketDailyLimit: SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT,
      shopWorldBossTicketBuysToday: worldBossBuysToday,
      shopWorldBossTicketsLeftToday: Math.max(0, SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT - worldBossBuysToday),
    });
  }

  if (action === "worldboss_ticket_buy") {
    const { data: lastBuyRow } = await supabase
      .from("security_events")
      .select("created_at")
      .eq("wallet", auth.wallet)
      .eq("kind", "worldboss_ticket_buy")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastBuyRow?.created_at) {
      const lastBuyMs = new Date(String(lastBuyRow.created_at)).getTime();
      if (Number.isFinite(lastBuyMs) && now.getTime() - lastBuyMs < 1000) {
        return json({ ok: false, error: "Please wait 1 second before buying another ticket." });
      }
    }

    for (let attempt = 0; attempt < 6; attempt += 1) {
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

      const gold = Math.max(0, asInt(state.gold, 0));
      if (gold < WORLD_BOSS_TICKET_COST_GOLD) {
        return json({ ok: false, error: `Not enough gold. Need ${WORLD_BOSS_TICKET_COST_GOLD}.` });
      }

      state.gold = gold - WORLD_BOSS_TICKET_COST_GOLD;
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

      if (updateError || !updatedProfile) continue;

      const ticketUpdate = await buyWorldBossTicketWithShopLimit(supabase, auth.wallet, now);
      if (!ticketUpdate.ok || !ticketUpdate.state) {
        await updateProfileWithRetry(supabase, auth.wallet, (rollbackState) => {
          rollbackState.gold = Math.max(0, asInt(rollbackState.gold, 0)) + WORLD_BOSS_TICKET_COST_GOLD;
        });
        await auditEvent(supabase, auth.wallet, "worldboss_ticket_buy_credit_failed", {
          cost: WORLD_BOSS_TICKET_COST_GOLD,
        });
        return json({ ok: false, error: "Failed to issue World Boss ticket." });
      }

      await auditEvent(supabase, auth.wallet, "worldboss_ticket_buy", {
        cost: WORLD_BOSS_TICKET_COST_GOLD,
        worldBossTickets: Math.max(0, asInt(ticketUpdate.state.tickets, 0)),
        shopBuysToday: Math.max(0, asInt(ticketUpdate.state.shop_ticket_buys, 0)),
        gold: Math.max(0, asInt(state.gold, 0)),
      });

      return json({
        ok: true,
        savedAt: now.toISOString(),
        gold: Math.max(0, asInt(state.gold, 0)),
        worldBossTickets: Math.max(0, asInt(ticketUpdate.state.tickets, 0)),
        shopWorldBossTicketDailyLimit: SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT,
        shopWorldBossTicketBuysToday: Math.max(0, asInt(ticketUpdate.state.shop_ticket_buys, 0)),
        shopWorldBossTicketsLeftToday: Math.max(0, SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT - Math.max(0, asInt(ticketUpdate.state.shop_ticket_buys, 0))),
      });
    }

    return json({ ok: false, error: "Profile changed concurrently, retry ticket purchase." });
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

    const reward = await claimWorldBossReward(supabase, auth.wallet, boss, now);
    const rewardShare = reward.share;

    const { data: existing, error: existingError } = await supabase
      .from("world_boss_participants")
      .select("wallet, cycle_start, name, damage, joined, reward_claimed, updated_at")
      .eq("wallet", auth.wallet)
      .eq("cycle_start", boss.cycle_start)
      .maybeSingle();

    if (existingError) return json({ ok: false, error: "Failed to sync world boss." });

    const existingRow = (existing as WorldBossParticipantRow | null) ?? null;
    const wantJoinNow = safeJoined && !Boolean(existingRow?.joined);
    const ticketState = await ensureWorldBossTicketState(supabase, auth.wallet, now);
    if (!ticketState.ok) return json({ ok: false, error: ticketState.error });
    let worldBossTickets = Math.max(0, asInt(ticketState.state.tickets, 0));
    if (wantJoinNow) {
      const ticketSpend = await adjustWorldBossTickets(supabase, auth.wallet, -1, now);
      if (!ticketSpend.ok || !ticketSpend.state) {
        return json({
          ok: false,
          error: ticketSpend.error || "No World Boss tickets left.",
          worldBossTickets,
        });
      }
      worldBossTickets = Math.max(0, asInt(ticketSpend.state.tickets, 0));
    }

    const existingDamage = Math.max(0, asInt(existingRow?.damage ?? 0, 0));
    const nextJoined = Boolean(existingRow?.joined) || safeJoined;
    const joinedNow = !Boolean(existingRow?.joined) && nextJoined;
    const nextName = playerName || existingRow?.name || "Hero";
    const updatedAtMs = existingRow?.updated_at ? new Date(existingRow.updated_at).getTime() : Number.NaN;
    const elapsedSec = Number.isFinite(updatedAtMs)
      ? Math.max(1, Math.floor((now.getTime() - updatedAtMs) / 1000))
      : 1;
    const maxDamageGain = Math.max(200, elapsedSec * WORLD_BOSS_DAMAGE_PER_SEC_CAP);
    let passiveDamage = 0;
    if (Boolean(existingRow?.joined) && nextJoined) {
      const worldBossAttack = await loadWorldBossAttack(supabase, auth.wallet);
      const passiveDamageRaw = Math.max(0, Math.floor(elapsedSec * worldBossAttack));
      passiveDamage = Math.min(passiveDamageRaw, maxDamageGain);
    }
    // Keep client pending damage only for diagnostics; server-authoritative damage prevents offline loss and tampering.
    const clientDamageIgnored = Math.min(safePendingDamage, maxDamageGain);
    const appliedDamage = passiveDamage;
    const nextDamage = existingDamage + appliedDamage;

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

    if (joinedNow || rewardShare > 0 || appliedDamage >= 100) {
      await auditEvent(supabase, auth.wallet, "worldboss_sync", {
        cycleStart: boss.cycle_start,
        joinedNow,
        appliedDamage,
        passiveDamage,
        clientDamageIgnored,
        totalDamage: nextDamage,
        rewardShare,
      });
    }

    return json({
      ok: true,
      savedAt: reward.updatedAt,
      worldBossTickets,
      worldBoss: boss,
      worldBossParticipants: participants,
      worldBossAppliedDamage: appliedDamage,
      worldBossRewardShare: rewardShare,
    });
  }

  if (action === "admin_blocked_list") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const { data, error } = await supabase
      .from("blocked_wallets")
      .select("wallet, reason, blocked_by, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(3000);
    if (error) return json({ ok: false, error: "Failed to load blocked wallets." });

    return json({
      ok: true,
      blockedWallets: (data as BlockedWalletRow[] | null) ?? [],
    });
  }

  if (action === "admin_block_wallet") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const wallet = String(body.wallet ?? "").trim();
    if (!isWalletLike(wallet)) {
      return json({ ok: false, error: "Invalid wallet." });
    }
    if (wallet === auth.wallet) {
      return json({ ok: false, error: "You cannot block your own wallet." });
    }

    const reason = String(body.reason ?? "Cheating").trim().slice(0, 180) || "Cheating";
    const nowIso = now.toISOString();
    const { error } = await supabase
      .from("blocked_wallets")
      .upsert(
        {
          wallet,
          reason,
          blocked_by: auth.wallet,
          updated_at: nowIso,
        },
        { onConflict: "wallet" },
      );
    if (error) return json({ ok: false, error: "Failed to block wallet." });

    await supabase.from("wallet_sessions").delete().eq("wallet", wallet);
    await supabase.from("wallet_auth_nonces").delete().eq("wallet", wallet);
    await auditEvent(supabase, auth.wallet, "admin_block_wallet", { wallet, reason });
    await auditEvent(supabase, wallet, "wallet_blocked", { reason, blockedBy: auth.wallet });
    return json({ ok: true });
  }

  if (action === "admin_unblock_wallet") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const wallet = String(body.wallet ?? "").trim();
    if (!isWalletLike(wallet)) {
      return json({ ok: false, error: "Invalid wallet." });
    }

    const blocked = await getBlockedWallet(supabase, wallet);
    const { error } = await supabase
      .from("blocked_wallets")
      .delete()
      .eq("wallet", wallet);
    if (error) return json({ ok: false, error: "Failed to unblock wallet." });

    await auditEvent(supabase, auth.wallet, "admin_unblock_wallet", {
      wallet,
      reason: blocked?.reason ?? "",
    });
    await auditEvent(supabase, wallet, "wallet_unblocked", { unblockedBy: auth.wallet });
    return json({ ok: true });
  }

  if (action === "admin_events") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const walletFilterRaw = String(body.walletFilter ?? "").trim();
    const walletFilter = isWalletLike(walletFilterRaw) ? walletFilterRaw : "";
    const kindFilter = String(body.kindFilter ?? "").trim().slice(0, 120);
    const limit = clampInt(body.limit, 20, 1000);

    let query = supabase
      .from("security_events")
      .select("id, wallet, kind, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (walletFilter) {
      query = query.eq("wallet", walletFilter);
    }
    if (kindFilter) {
      query = query.eq("kind", kindFilter);
    }

    const { data, error } = await query;
    if (error) return json({ ok: false, error: "Failed to load security events." });

    return json({
      ok: true,
      events: (data as SecurityEventRow[] | null) ?? [],
    });
  }

  if (action === "admin_profiles") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const limit = clampInt(body.limit, 20, 1000);
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet, state, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) return json({ ok: false, error: "Failed to load profiles." });

    const profiles = ((data as Array<Record<string, unknown>> | null) ?? [])
      .map((row) => {
        const wallet = String(row.wallet ?? "");
        const normalized = normalizeState(row.state ?? null);
        if (!wallet || !normalized) return null;
        return {
          wallet,
          state: normalized,
          updated_at: String(row.updated_at ?? ""),
        };
      })
      .filter((row): row is { wallet: string; state: Record<string, unknown>; updated_at: string } => Boolean(row));

    return json({
      ok: true,
      profiles,
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
    await auditEvent(supabase, auth.wallet, "admin_mark_paid", { withdrawalId });
    return json({ ok: true });
  }

  return json({ ok: false, error: "Unknown action." });
});
