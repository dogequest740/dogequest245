import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clusterApiUrl, Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.98.4";

const MAX_LEVEL = 255;
const WITHDRAW_RATE = 15000;
const WITHDRAW_MIN = 2000;
const CRYSTAL_TO_GOLD_SWAP_RATE = 75;
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
const SOL_LAMPORTS = 1_000_000_000;
const SOL_TO_USDT_RATE = 85;
const STARTER_PACK_GOLD = 300000;
const STARTER_PACK_PRICE_LAMPORTS = Math.round(0.35 * SOL_LAMPORTS);
const STARTER_PACK_PRICE_USDT = Number(((STARTER_PACK_PRICE_LAMPORTS / SOL_LAMPORTS) * SOL_TO_USDT_RATE).toFixed(3));
const STARTER_PACK_ITEMS: Array<{ type: ConsumableType; qty: number }> = [
  { type: "energy-small", qty: 20 },
  { type: "energy-full", qty: 5 },
  { type: "speed", qty: 10 },
  { type: "attack", qty: 10 },
  { type: "key", qty: 20 },
];
const PREMIUM_PAYMENT_WALLET = "9a5GXRjX6HKh9Yjc9d7gp9RFmuRvMQAcV1VJ9WV7LU8c";
const PREMIUM_TX_MAX_AGE_SECONDS = 2 * 60 * 60;
const PAYMENT_TX_LOOKUP_ATTEMPTS = 22;
const PAYMENT_TX_LOOKUP_BASE_DELAY_MS = 1200;
const PROFILE_UPDATE_RETRY_ATTEMPTS = 10;
const BLOCKED_ERROR_MESSAGE = "You have been banned for cheating.";
const NOWPAYMENTS_API_BASE = "https://api.nowpayments.io/v1";
const NOWPAYMENTS_CREATE_TIMEOUT_MS = 18_000;
const NOWPAYMENTS_STATUS_TIMEOUT_MS = 15_000;
const NOWPAYMENTS_PENDING_STATUSES = new Set(["waiting", "confirming", "sending", "partially_paid"]);
const NOWPAYMENTS_PAID_STATUSES = new Set(["finished", "confirmed"]);
const NOWPAYMENTS_TERMINAL_STATUSES = new Set(["finished", "confirmed", "failed", "expired", "refunded"]);
const NOWPAYMENTS_ALLOWED_USDT_NETWORKS = [
  "usdttrc20",
  "usdtbsc",
  "usdterc20",
  "usdtmatic",
  "usdtsol",
] as const;
const NOWPAYMENTS_PENDING_REUSE_MS = 30 * 60 * 1000;
const NOWPAYMENTS_MIN_USDT = 10;
const GOLD_PACKS_SOL = [
  { id: "gold-50k", gold: 50000, lamports: Math.round(0.05 * SOL_LAMPORTS) },
  { id: "gold-100k", gold: 100000, lamports: Math.round(0.1 * SOL_LAMPORTS) },
  { id: "gold-500k", gold: 500000, lamports: Math.round(0.4 * SOL_LAMPORTS) },
  { id: "gold-1200k", gold: 1200000, lamports: Math.round(0.63 * SOL_LAMPORTS) },
] as const;
const GOLD_PACKS_USDT = [
  { id: "gold-150k", gold: 150000, usdt: 11 },
  { id: "gold-500k", gold: 500000, usdt: 34 },
  { id: "gold-1200k", gold: 1200000, usdt: 53.55 },
] as const;
const FORTUNE_SPIN_PACKS_SOL = [1, 10] as const;
const FORTUNE_SPIN_PACKS_USDT = [20, 50] as const;
const FORTUNE_SPIN_PACKS_CREDIT = [1, 10, 20, 50] as const;
const FORTUNE_SPIN_PRICES_LAMPORTS: Record<(typeof FORTUNE_SPIN_PACKS_SOL)[number], number> = {
  1: Math.round(0.007 * SOL_LAMPORTS),
  10: Math.round(0.06 * SOL_LAMPORTS),
};
const FORTUNE_SPIN_PRICES_USDT: Record<(typeof FORTUNE_SPIN_PACKS_USDT)[number], number> = {
  20: 11,
  50: 17,
};
const ENERGY_REGEN_SECONDS = 420;
const PREMIUM_PLANS = [
  { id: "premium-30", days: 30, lamports: Math.round(0.5 * SOL_LAMPORTS), usdt: 42.5 },
  { id: "premium-90", days: 90, lamports: Math.round(1 * SOL_LAMPORTS), usdt: 85 },
] as const;
const CRYPTO_PAYMENT_SELECT =
  "id, wallet, provider, kind, product_ref, usdt_amount, pay_currency, provider_payment_id, provider_order_id, payment_status, credit_state, credited, credited_at, credit_error, reward, provider_payload, created_at, updated_at";
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
  1, 2, 3, 4, 5, 6, 7, 8, 9, 11,
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 30,
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

type CryptoPaymentRow = {
  id: string;
  wallet: string;
  provider: string;
  kind: string;
  product_ref: string;
  usdt_amount: number;
  pay_currency: string;
  provider_payment_id: string;
  provider_order_id: string;
  payment_status: string;
  credit_state: string;
  credited: boolean;
  credited_at: string | null;
  credit_error: string;
  reward: Record<string, unknown>;
  provider_payload?: Record<string, unknown>;
  created_at: string;
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
  carryGold: number;
  carryCrystals: number;
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

const getBearerToken = (req: Request) => {
  const header = req.headers.get("authorization") ?? "";
  if (!header) return "";
  const [scheme, ...rest] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer") return "";
  return rest.join(" ").trim();
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
const isValidSolanaAddress = (value: string) => {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
};
const isEmailIdentity = (value: string) => /^email:[0-9a-fA-F-]{8,}$/.test(value);
const isPlayerIdentity = (value: string) => isWalletLike(value) || isEmailIdentity(value);
const isTxSignatureLike = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{70,120}$/.test(value);
const todayKeyUtc = (now: Date) => now.toISOString().slice(0, 10);
const isConsumableType = (value: string): value is ConsumableType =>
  Object.prototype.hasOwnProperty.call(CONSUMABLE_DEFS, value);
const isVillageBuildingId = (value: string): value is VillageBuildingId =>
  value === "castle" || value === "mine" || value === "lab" || value === "storage";
const waitMs = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

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

const getGoldPackSol = (packIdRaw: unknown) => {
  const packId = String(packIdRaw ?? "").trim();
  if (!packId) return null;
  return GOLD_PACKS_SOL.find((entry) => entry.id === packId) ?? null;
};

const getGoldPackUsdt = (packIdRaw: unknown) => {
  const packId = String(packIdRaw ?? "").trim();
  if (!packId) return null;
  return GOLD_PACKS_USDT.find((entry) => entry.id === packId) ?? null;
};

const isNowpayKind = (value: string): value is "buy_gold" | "starter_pack_buy" | "premium_buy" | "fortune_buy" =>
  value === "buy_gold" || value === "starter_pack_buy" || value === "premium_buy" || value === "fortune_buy";

const isNowpaymentsCurrency = (value: string): value is (typeof NOWPAYMENTS_ALLOWED_USDT_NETWORKS)[number] =>
  (NOWPAYMENTS_ALLOWED_USDT_NETWORKS as readonly string[]).includes(value);

const normalizeNowpaymentsStatus = (value: unknown) => String(value ?? "").trim().toLowerCase();

const nowpaymentsFetch = async (
  method: "GET" | "POST",
  path: string,
  body?: Record<string, unknown>,
  timeoutMs = NOWPAYMENTS_STATUS_TIMEOUT_MS,
) => {
  const apiKey = String(Deno.env.get("NOWPAYMENTS_API_KEY") ?? "").trim();
  if (!apiKey) {
    return { ok: false as const, error: "NOWPayments is not configured." };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(2000, timeoutMs));
  try {
    const response = await fetch(`${NOWPAYMENTS_API_BASE}${path}`, {
      method,
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    let data: Record<string, unknown> | null = null;
    try {
      data = await response.json() as Record<string, unknown>;
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message = typeof data?.message === "string"
        ? data.message
        : typeof data?.error === "string"
        ? data.error
        : `HTTP ${response.status}`;
      return { ok: false as const, error: `NOWPayments error: ${message}` };
    }

    return { ok: true as const, data: data ?? {} };
  } catch {
    return { ok: false as const, error: "NOWPayments request failed." };
  } finally {
    clearTimeout(timer);
  }
};

const createNowpaymentsOrderId = (wallet: string, kind: string, productRef: string) => {
  const walletPart = wallet.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16) || "player";
  const randomPart = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const safeKind = kind.replace(/[^a-z0-9_-]/gi, "").slice(0, 18) || "pay";
  const safeRef = productRef.replace(/[^a-z0-9_-]/gi, "").slice(0, 18) || "item";
  return `dq-${safeKind}-${safeRef}-${walletPart}-${Date.now()}-${randomPart}`.slice(0, 64);
};

const parseNowpaymentAmount = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(numeric);
};

const mapNowpaymentForClient = (row: CryptoPaymentRow) => {
  const payload = row.provider_payload && typeof row.provider_payload === "object"
    ? row.provider_payload as Record<string, unknown>
    : {};
  return {
    id: row.id,
    providerPaymentId: String(row.provider_payment_id ?? ""),
    providerOrderId: String(row.provider_order_id ?? ""),
    kind: String(row.kind ?? ""),
    productRef: String(row.product_ref ?? ""),
    usdtAmount: Number(row.usdt_amount ?? 0),
    payCurrency: String(row.pay_currency ?? ""),
    payAmount: parseNowpaymentAmount(payload.pay_amount),
    payAddress: String(payload.pay_address ?? ""),
    status: normalizeNowpaymentsStatus(row.payment_status),
    credited: Boolean(row.credited),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
};

const wasTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  kinds: readonly string[],
  txSignature: string,
) => {
  const signature = String(txSignature ?? "").trim();
  if (!signature) return false;
  const { data: exactMatch } = await supabase
    .from("security_events")
    .select("id")
    .eq("wallet", wallet)
    .in("kind", [...kinds])
    .contains("details", { txSignature: signature })
    .limit(1)
    .maybeSingle();
  if (exactMatch) return true;

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
    if (String(details?.txSignature ?? "") === signature) {
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

const wasStarterPackTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  txSignature: string,
) => wasTxAlreadyProcessed(supabase, wallet, ["starter_pack_buy"], txSignature);

const verifySolTransferTx = async (
  wallet: string,
  txSignature: string,
  lamportsRequired: number,
  destinationWallet: string,
  transferMismatchError: string,
  now: Date,
) => {
  const connection = getSolanaConnection();
  let tx = null as Awaited<ReturnType<typeof connection.getParsedTransaction>>;
  for (let attempt = 0; attempt < PAYMENT_TX_LOOKUP_ATTEMPTS; attempt += 1) {
    for (const commitment of ["confirmed", "finalized"] as const) {
      try {
        tx = await connection.getParsedTransaction(txSignature, {
          commitment,
          maxSupportedTransactionVersion: 0,
        });
      } catch {
        tx = null;
      }
      if (tx) break;
    }
    if (tx) break;
    const delay = PAYMENT_TX_LOOKUP_BASE_DELAY_MS + Math.min(attempt * 180, 1800);
    await waitMs(delay);
  }

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

const verifyStarterPackPaymentTx = async (
  wallet: string,
  txSignature: string,
  now: Date,
) =>
  verifySolTransferTx(
    wallet,
    txSignature,
    STARTER_PACK_PRICE_LAMPORTS,
    PREMIUM_PAYMENT_WALLET,
    "Payment transfer mismatch for Starter Pack.",
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
  carryGold: 0,
  carryCrystals: 0,
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
  const carryGoldRaw = Number(row.carryGold ?? 0);
  const carryCrystalsRaw = Number(row.carryCrystals ?? 0);
  const carryGold = Number.isFinite(carryGoldRaw)
    ? Math.max(0, Math.min(carryGoldRaw, 0.999999))
    : 0;
  const carryCrystals = Number.isFinite(carryCrystalsRaw)
    ? Math.max(0, Math.min(carryCrystalsRaw, 0.999999))
    : 0;
  const buildingsRaw = (row.buildings && typeof row.buildings === "object")
    ? row.buildings as Record<string, unknown>
    : {};
  return {
    settlementName,
    lastClaimAt,
    carryGold,
    carryCrystals,
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
  Math.max(
    0,
    Math.ceil(
      getVillageTableValue(VILLAGE_LAB_CRYSTALS_PER_HOUR_BY_LEVEL, labLevelRaw) *
      getVillageCastleMultiplier(castleLevelRaw),
    ),
  );

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

const getVillagePendingRewardsRaw = (villageRaw: VillageState, nowMs = Date.now()) => {
  const village = normalizeVillageState(villageRaw, nowMs);
  if (!village.settlementName) {
    return { elapsedSec: 0, effectiveSec: 0, capSec: 0, goldExact: 0, crystalsExact: 0 };
  }

  const startMs = village.lastClaimAt;
  const targetMs = Math.max(startMs, nowMs);
  const elapsedSec = Math.max(0, Math.floor((targetMs - startMs) / 1000));
  const working = cloneVillageState(village);
  let cursorMs = startMs;
  let effectiveSec = 0;
  let goldAcc = Math.max(0, Number(village.carryGold ?? 0));
  let crystalsAcc = Math.max(0, Number(village.carryCrystals ?? 0));

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
    goldExact: Math.max(0, goldAcc),
    crystalsExact: Math.max(0, crystalsAcc),
  };
};

const getVillagePendingRewards = (villageRaw: VillageState, nowMs = Date.now()) => {
  const raw = getVillagePendingRewardsRaw(villageRaw, nowMs);
  return {
    elapsedSec: raw.elapsedSec,
    effectiveSec: raw.effectiveSec,
    capSec: raw.capSec,
    gold: Math.max(0, Math.floor(raw.goldExact)),
    crystals: Math.max(0, Math.floor(raw.crystalsExact)),
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
  let sessionError = "";

  if (token) {
    const { data, error } = await supabase
      .from("wallet_sessions")
      .select("token, wallet, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!error && data) {
      const expiresAtMs = new Date(String(data.expires_at)).getTime();
      if (!Number.isNaN(expiresAtMs) && expiresAtMs > now.getTime()) {
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
      }
      await supabase.from("wallet_sessions").delete().eq("token", token);
      sessionError = "Session expired. Sign again.";
    } else {
      sessionError = "Invalid session token.";
    }
  } else {
    sessionError = "Missing session token.";
  }

  const bearerToken = getBearerToken(req);
  if (bearerToken) {
    const { data, error } = await supabase.auth.getUser(bearerToken);
    if (!error && data?.user?.id) {
      const emailWallet = `email:${String(data.user.id)}`;
      const blocked = await supabase
        .from("blocked_wallets")
        .select("wallet, reason")
        .eq("wallet", emailWallet)
        .maybeSingle();
      if (!blocked.error && blocked.data) {
        await auditEvent(supabase, emailWallet, "blocked_session_denied", {
          reason: String(blocked.data.reason ?? "Cheating"),
        });
        return { ok: false as const, error: BLOCKED_ERROR_MESSAGE };
      }
      return { ok: true as const, wallet: emailWallet };
    }
  }

  if (token && sessionError) return { ok: false as const, error: sessionError };
  return { ok: false as const, error: "Sign-in required." };
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
  if (reward.kind === "keys") {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state")
      .eq("wallet", wallet)
      .maybeSingle();

    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return { ok: false as const };
    }

    const normalized = normalizeState(profileRow.state as unknown);
    if (!normalized) return { ok: false as const };

    const ticketGrant = await adjustDungeonTickets(
      supabase,
      wallet,
      reward.amount,
      new Date(),
    );
    if (!ticketGrant.ok || !ticketGrant.state) {
      return { ok: false as const };
    }

    const responseState = structuredClone(normalized) as Record<string, unknown>;
    responseState.tickets = Math.max(0, asInt(ticketGrant.state.tickets, 0));

    return {
      ok: true as const,
      state: responseState,
      updatedAt: String(ticketGrant.state.updated_at ?? new Date().toISOString()),
    };
  }

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
  for (let attempt = 0; attempt < PROFILE_UPDATE_RETRY_ATTEMPTS; attempt += 1) {
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
    if (attempt < PROFILE_UPDATE_RETRY_ATTEMPTS - 1) {
      await waitMs(60 + Math.floor(Math.random() * 120));
    }
  }
  return { ok: false as const };
};

const loadRecentPendingNowpayPayment = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  kind: string,
  productRef: string,
  now: Date,
) => {
  const { data, error } = await supabase
    .from("crypto_payments")
    .select(CRYPTO_PAYMENT_SELECT)
    .eq("wallet", wallet)
    .eq("provider", "nowpayments")
    .eq("kind", kind)
    .eq("product_ref", productRef)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error || !data) return null;
  for (const row of data as CryptoPaymentRow[]) {
    const createdAtMs = new Date(String(row.created_at ?? "")).getTime();
    const ageMs = Number.isFinite(createdAtMs) ? Math.max(0, now.getTime() - createdAtMs) : Number.MAX_SAFE_INTEGER;
    const status = normalizeNowpaymentsStatus(row.payment_status);
    if (
      ageMs <= NOWPAYMENTS_PENDING_REUSE_MS &&
      NOWPAYMENTS_PENDING_STATUSES.has(status) &&
      !Boolean(row.credited)
    ) {
      return row;
    }
  }
  return null;
};

const refreshNowpaymentRowStatus = async (
  supabase: ReturnType<typeof createClient>,
  row: CryptoPaymentRow,
  latestPayload: Record<string, unknown>,
) => {
  const paymentStatus = normalizeNowpaymentsStatus(latestPayload.payment_status ?? row.payment_status);
  const nextPayload = {
    ...(row.provider_payload && typeof row.provider_payload === "object" ? row.provider_payload : {}),
    ...latestPayload,
  };
  const nowIso = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("crypto_payments")
    .update({
      payment_status: paymentStatus || row.payment_status,
      provider_payload: nextPayload,
      updated_at: nowIso,
    })
    .eq("id", row.id)
    .select(CRYPTO_PAYMENT_SELECT)
    .maybeSingle();

  if (error || !updated) return row;
  return updated as CryptoPaymentRow;
};

const creditNowpaymentIfNeeded = async (
  supabase: ReturnType<typeof createClient>,
  row: CryptoPaymentRow,
) => {
  if (Boolean(row.credited) || row.credit_state === "done") {
    return {
      ok: true as const,
      row,
      creditedNow: false as const,
      state: null as Record<string, unknown> | null,
      response: {} as Record<string, unknown>,
    };
  }

  const lockIso = new Date().toISOString();
  const { data: lockedRow } = await supabase
    .from("crypto_payments")
    .update({
      credit_state: "processing",
      credit_error: "",
      updated_at: lockIso,
    })
    .eq("id", row.id)
    .in("credit_state", ["pending", "failed"])
    .select(CRYPTO_PAYMENT_SELECT)
    .maybeSingle();

  if (!lockedRow) {
    const { data: latest } = await supabase
      .from("crypto_payments")
      .select(CRYPTO_PAYMENT_SELECT)
      .eq("id", row.id)
      .maybeSingle();
    const current = (latest as CryptoPaymentRow | null) ?? row;
    if (Boolean(current.credited) || current.credit_state === "done") {
      return {
        ok: true as const,
        row: current,
        creditedNow: false as const,
        state: null as Record<string, unknown> | null,
        response: {} as Record<string, unknown>,
      };
    }
    return { ok: false as const, row: current, error: "Payment credit is processing. Retry shortly." };
  }

  const locked = lockedRow as CryptoPaymentRow;
  const reward = locked.reward && typeof locked.reward === "object" ? locked.reward as Record<string, unknown> : {};
  let stateAfterCredit: Record<string, unknown> | null = null;
  const response: Record<string, unknown> = {};
  let creditError = "";

  if (locked.kind === "buy_gold") {
    const goldAmount = Math.max(0, asInt(reward.gold, 0));
    if (goldAmount <= 0) {
      creditError = "Invalid payment reward payload.";
    } else {
      const creditResult = await updateProfileWithRetry(supabase, locked.wallet, (state) => {
        state.gold = Math.max(0, asInt(state.gold, 0)) + goldAmount;
      });
      if (!creditResult.ok || !creditResult.state) {
        creditError = "Failed to credit gold package.";
      } else {
        stateAfterCredit = creditResult.state;
        response.gold = Math.max(0, asInt(creditResult.state.gold, 0));
      }
    }
  } else if (locked.kind === "starter_pack_buy") {
    const creditResult = await updateProfileWithRetry(supabase, locked.wallet, (state) => {
      if (Boolean(state.starterPackPurchased)) return;
      state.gold = Math.max(0, asInt(state.gold, 0)) + STARTER_PACK_GOLD;
      for (const entry of STARTER_PACK_ITEMS) {
        for (let i = 0; i < entry.qty; i += 1) addConsumableToState(state, entry.type);
      }
      state.starterPackPurchased = true;
    });
    if (!creditResult.ok || !creditResult.state) {
      creditError = "Failed to credit starter pack.";
    } else {
      stateAfterCredit = creditResult.state;
      response.gold = Math.max(0, asInt(creditResult.state.gold, 0));
      response.starterPackPurchased = Boolean(creditResult.state.starterPackPurchased);
      response.consumables = normalizeConsumables(creditResult.state.consumables).rows;
    }
  } else if (locked.kind === "premium_buy") {
    const plan = getPremiumPlan(reward.planId, reward.days);
    if (!plan) {
      creditError = "Invalid premium payment reward.";
    } else {
      const creditResult = await updateProfileWithRetry(supabase, locked.wallet, (state) => {
        const nowMs = Date.now();
        const currentPremiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
        const base = Math.max(nowMs, currentPremiumEndsAt);
        state.premiumEndsAt = base + plan.days * 24 * 60 * 60 * 1000;
      });
      if (!creditResult.ok || !creditResult.state) {
        creditError = "Failed to credit premium purchase.";
      } else {
        stateAfterCredit = creditResult.state;
        response.premiumEndsAt = Math.max(0, asInt(creditResult.state.premiumEndsAt, 0));
        response.premiumDaysAdded = plan.days;
      }
    }
  } else if (locked.kind === "fortune_buy") {
    const spins = Math.max(0, asInt(reward.spins, 0));
    if (!(FORTUNE_SPIN_PACKS_CREDIT as readonly number[]).includes(spins)) {
      creditError = "Invalid fortune payment reward.";
    } else {
      const dayKey = todayKeyUtc(new Date());
      let updatedFortune: FortuneStateRow | null = null;
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const fortuneState = await ensureFortuneState(supabase, locked.wallet, new Date());
        if (!fortuneState.ok) {
          creditError = fortuneState.error;
          break;
        }
        const nextPaidSpins = Math.max(0, asInt(fortuneState.state.paid_spins, 0)) + spins;
        const updated = await updateFortuneState(supabase, fortuneState.state, { paid_spins: nextPaidSpins });
        if (updated.ok) {
          updatedFortune = updated.state;
          break;
        }
      }
      if (!updatedFortune && !creditError) {
        creditError = "Failed to credit fortune spins.";
      } else if (updatedFortune) {
        response.fortunePaidSpins = Math.max(0, asInt(updatedFortune.paid_spins, 0));
        response.fortuneFreeSpinAvailable = String(updatedFortune.free_spin_day ?? "") !== dayKey;
      }
    }
  } else {
    creditError = "Unsupported payment kind.";
  }

  if (creditError) {
    const failIso = new Date().toISOString();
    await supabase
      .from("crypto_payments")
      .update({
        credit_state: "failed",
        credit_error: creditError,
        updated_at: failIso,
      })
      .eq("id", locked.id);
    return {
      ok: false as const,
      row: { ...locked, credit_state: "failed", credit_error: creditError, updated_at: failIso },
      error: creditError,
    };
  }

  const doneIso = new Date().toISOString();
  const { data: doneRow } = await supabase
    .from("crypto_payments")
    .update({
      credited: true,
      credited_at: doneIso,
      credit_state: "done",
      credit_error: "",
      updated_at: doneIso,
    })
    .eq("id", locked.id)
    .select(CRYPTO_PAYMENT_SELECT)
    .maybeSingle();

  const finalRow = (doneRow as CryptoPaymentRow | null) ?? {
    ...locked,
    credited: true,
    credited_at: doneIso,
    credit_state: "done",
    credit_error: "",
    updated_at: doneIso,
  };
  return {
    ok: true as const,
    row: finalRow,
    creditedNow: true as const,
    state: stateAfterCredit,
    response,
  };
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
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const attemptNow = new Date();
      const attemptNowIso = attemptNow.toISOString();
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

      const updatedAtMs = profileRow.updated_at ? new Date(String(profileRow.updated_at)).getTime() : Number.NaN;
      const elapsedSec = Number.isFinite(updatedAtMs)
        ? Math.max(0, Math.floor((attemptNow.getTime() - updatedAtMs) / 1000))
        : 0;
      const changed = applyOfflineEnergyRegen(state, elapsedSec);

      if (!changed) {
        return json({
          ok: true,
          profile: {
            state,
            updated_at: String(profileRow.updated_at ?? attemptNowIso),
          },
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
          source: "profile_load",
        });
        return json({
          ok: true,
          profile: {
            state,
            updated_at: attemptNowIso,
          },
        });
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry load." });
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
      const serverUpdatedAtRaw = String(existing.updated_at ?? "").trim();
      const serverUpdatedAtMs = serverUpdatedAtRaw ? new Date(serverUpdatedAtRaw).getTime() : Number.NaN;
      const clientUpdatedAtMs = new Date(clientUpdatedAt).getTime();
      if (!Number.isFinite(serverUpdatedAtMs) || !Number.isFinite(clientUpdatedAtMs)) {
        await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
          reason: "Invalid profile version timestamp.",
          serverUpdatedAt: existing.updated_at,
          clientUpdatedAt,
        });
        return json({ ok: false, error: "Invalid profile version. Reload game state and retry." });
      }
      if (
        clientUpdatedAtMs < serverUpdatedAtMs
      ) {
        await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
          reason: "Stale client profile version.",
          serverUpdatedAt: existing.updated_at,
          clientUpdatedAt,
        });
        return json({ ok: false, error: "Profile is outdated. Reload game state and retry." });
      }
      if (clientUpdatedAtMs > serverUpdatedAtMs + 5 * 60 * 1000) {
        await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
          reason: "Client profile version is in the future.",
          serverUpdatedAt: existing.updated_at,
          clientUpdatedAt,
        });
        return json({ ok: false, error: "Invalid profile version. Reload game state and retry." });
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
    const payoutWalletRaw = String(body.payoutWallet ?? body.withdrawAddress ?? "").trim();
    const accountIsEmail = isEmailIdentity(auth.wallet);
    let payoutWallet = payoutWalletRaw;
    if (!payoutWallet && !accountIsEmail && isValidSolanaAddress(auth.wallet)) {
      payoutWallet = auth.wallet;
    }
    if (!payoutWallet) {
      return json({ ok: false, error: "Enter your Solana address." });
    }
    if (!isValidSolanaAddress(payoutWallet)) {
      return json({ ok: false, error: "Enter a valid Solana address." });
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
        payout_wallet: payoutWallet,
        name,
        crystals: amount,
        sol_amount: solAmount,
        status: "pending",
        created_at: createdAt,
      })
      .select("id, wallet, payout_wallet, name, crystals, sol_amount, status, created_at")
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
      payoutWallet,
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
      .select("id, wallet, payout_wallet, name, crystals, sol_amount, status, created_at")
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
    if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) {
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
    const pack = getGoldPackSol(body.packId);
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

  if (action === "nowpay_latest" || action === "nowpay_gold_latest") {
    const rawKind = action === "nowpay_gold_latest" ? "buy_gold" : String(body.kind ?? "").trim();
    if (!isNowpayKind(rawKind)) {
      return json({ ok: false, error: "Invalid payment kind." });
    }
    const productRef = String(body.productRef ?? "").trim().slice(0, 64);

    let query = supabase
      .from("crypto_payments")
      .select(CRYPTO_PAYMENT_SELECT)
      .eq("wallet", auth.wallet)
      .eq("provider", "nowpayments")
      .eq("kind", rawKind)
      .order("created_at", { ascending: false })
      .limit(12);
    if (productRef) {
      query = query.eq("product_ref", productRef);
    }
    const { data, error } = await query;
    if (error || !data) {
      return json({ ok: false, error: "Failed to load crypto payments." });
    }

    const pending = (data as CryptoPaymentRow[]).find((row) => {
      const status = normalizeNowpaymentsStatus(row.payment_status);
      return NOWPAYMENTS_PENDING_STATUSES.has(status) && !Boolean(row.credited);
    });

    return json({
      ok: true,
      nowpayPayment: pending ? mapNowpaymentForClient(pending) : null,
    });
  }

  if (action === "nowpay_create" || action === "nowpay_gold_create") {
    const rawKind = action === "nowpay_gold_create" ? "buy_gold" : String(body.kind ?? "").trim();
    if (!isNowpayKind(rawKind)) {
      return json({ ok: false, error: "Invalid payment kind." });
    }
    let payCurrency = normalizeNowpaymentsStatus(body.payCurrency);
    if (!isNowpaymentsCurrency(payCurrency)) {
      return json({ ok: false, error: "Unsupported USDT network." });
    }

    let productRef = "";
    let usdtAmount = 0;
    let orderDescription = "";
    let reward: Record<string, unknown> = {};
    const auditDetails: Record<string, unknown> = { kind: rawKind };

    if (rawKind === "buy_gold") {
      const pack = getGoldPackUsdt(body.packId);
      if (!pack) {
        return json({ ok: false, error: "Invalid gold package." });
      }
      productRef = pack.id;
      usdtAmount = pack.usdt;
      orderDescription = `Doge Quest Gold ${pack.id}`;
      reward = { gold: pack.gold };
      auditDetails.packId = pack.id;
      auditDetails.gold = pack.gold;
    } else if (rawKind === "starter_pack_buy") {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("state")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) return json({ ok: false, error: "Profile not found." });
      if (Boolean(state.starterPackPurchased)) {
        return json({ ok: false, error: "Starter pack already purchased." });
      }
      productRef = "starter-pack";
      usdtAmount = STARTER_PACK_PRICE_USDT;
      orderDescription = "Doge Quest Starter Pack";
      reward = { starterPack: true };
    } else if (rawKind === "premium_buy") {
      const plan = getPremiumPlan(body.planId, body.days);
      if (!plan) {
        return json({ ok: false, error: "Invalid Premium plan." });
      }
      productRef = String(plan.id);
      usdtAmount = Number(plan.usdt);
      orderDescription = `Doge Quest Premium ${plan.id}`;
      reward = { planId: plan.id, days: plan.days };
      auditDetails.planId = plan.id;
      auditDetails.days = plan.days;
    } else if (rawKind === "fortune_buy") {
      const spins = asInt(body.spins, 0);
      if (!(FORTUNE_SPIN_PACKS_USDT as readonly number[]).includes(spins)) {
        return json({ ok: false, error: "Invalid fortune spin pack." });
      }
      productRef = `fortune-${spins}`;
      usdtAmount = (FORTUNE_SPIN_PRICES_USDT as Record<number, number>)[spins];
      orderDescription = `Doge Quest Fortune Spins x${spins}`;
      reward = { spins };
      auditDetails.spins = spins;
    }

    if (!productRef || !Number.isFinite(usdtAmount) || usdtAmount <= 0) {
      return json({ ok: false, error: "Invalid payment configuration." });
    }
    if (usdtAmount < NOWPAYMENTS_MIN_USDT) {
      return json({
        ok: false,
        error: `NOWPayments minimum is ${NOWPAYMENTS_MIN_USDT} USDT for this method. Use SOL or a larger package.`,
      });
    }

    const existingPending = await loadRecentPendingNowpayPayment(supabase, auth.wallet, rawKind, productRef, now);
    if (existingPending) {
      return json({
        ok: true,
        nowpayReused: true,
        nowpayPayment: mapNowpaymentForClient(existingPending),
      });
    }

    const orderId = createNowpaymentsOrderId(auth.wallet, rawKind, productRef);
    const priceAmount = usdtAmount < 1 ? Number(usdtAmount.toFixed(3)) : Number(usdtAmount.toFixed(2));
    const createBodyBase: Record<string, unknown> = {
      price_amount: priceAmount,
      price_currency: "usd",
      order_id: orderId,
      order_description: orderDescription,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
    };
    const callbackUrl = String(Deno.env.get("NOWPAYMENTS_IPN_CALLBACK_URL") ?? "").trim();
    if (callbackUrl) {
      createBodyBase.ipn_callback_url = callbackUrl;
    }

    const createPayment = (currency: string) =>
      nowpaymentsFetch(
        "POST",
        "/payment",
        {
          ...createBodyBase,
          pay_currency: currency,
        },
        NOWPAYMENTS_CREATE_TIMEOUT_MS,
      );

    let createResult = await createPayment(payCurrency);
    if (!createResult.ok) {
      const normalizedError = String(createResult.error ?? "").toLowerCase();
      const isTooSmall = normalizedError.includes("too small") &&
        (normalizedError.includes("amountto") || normalizedError.includes("amount_to") || normalizedError.includes("amount"));
      if (isTooSmall && payCurrency !== "usdttrc20") {
        const retryResult = await createPayment("usdttrc20");
        if (retryResult.ok) {
          auditDetails.payCurrencyFallbackFrom = payCurrency;
          payCurrency = "usdttrc20";
          createResult = retryResult;
        } else {
          return json({
            ok: false,
            error: `${createResult.error}. Try USDT TRC20 network for small payments.`,
          });
        }
      }
    }
    if (!createResult.ok) {
      return json({ ok: false, error: createResult.error });
    }

    const providerPaymentId = String(createResult.data.payment_id ?? "").trim().slice(0, 120);
    if (!providerPaymentId) {
      return json({ ok: false, error: "NOWPayments returned invalid payment id." });
    }
    const providerOrderId = String(createResult.data.order_id ?? orderId).trim().slice(0, 120) || orderId;
    const paymentStatus = normalizeNowpaymentsStatus(createResult.data.payment_status ?? "waiting") || "waiting";
    const nowIso = new Date().toISOString();

    const { data: inserted, error: insertError } = await supabase
      .from("crypto_payments")
      .insert({
        wallet: auth.wallet,
        provider: "nowpayments",
        kind: rawKind,
        product_ref: productRef,
        usdt_amount: usdtAmount < 1 ? Number(usdtAmount.toFixed(3)) : Number(usdtAmount.toFixed(2)),
        pay_currency: payCurrency,
        provider_payment_id: providerPaymentId,
        provider_order_id: providerOrderId,
        payment_status: paymentStatus,
        credit_state: "pending",
        credited: false,
        credit_error: "",
        reward,
        provider_payload: createResult.data,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select(CRYPTO_PAYMENT_SELECT)
      .maybeSingle();

    if (insertError || !inserted) {
      return json({ ok: false, error: "Failed to store crypto payment." });
    }

    await auditEvent(supabase, auth.wallet, "nowpay_create", {
      ...auditDetails,
      productRef,
      usdtAmount,
      payCurrency,
      providerPaymentId,
      providerOrderId,
      paymentStatus,
    });

    return json({
      ok: true,
      nowpayReused: false,
      nowpayPayment: mapNowpaymentForClient(inserted as CryptoPaymentRow),
    });
  }

  if (action === "nowpay_payment_status") {
    const providerPaymentId = String(body.providerPaymentId ?? "").trim().slice(0, 120);
    if (!providerPaymentId) {
      return json({ ok: false, error: "Missing payment id." });
    }

    const { data: rowData, error: rowError } = await supabase
      .from("crypto_payments")
      .select(CRYPTO_PAYMENT_SELECT)
      .eq("wallet", auth.wallet)
      .eq("provider", "nowpayments")
      .eq("provider_payment_id", providerPaymentId)
      .maybeSingle();

    if (rowError || !rowData) {
      return json({ ok: false, error: "Payment not found." });
    }

    let row = rowData as CryptoPaymentRow;
    const statusResult = await nowpaymentsFetch(
      "GET",
      `/payment/${encodeURIComponent(providerPaymentId)}`,
      undefined,
      NOWPAYMENTS_STATUS_TIMEOUT_MS,
    );
    if (statusResult.ok) {
      row = await refreshNowpaymentRowStatus(supabase, row, statusResult.data);
    } else {
      return json({ ok: false, error: statusResult.error });
    }

    const status = normalizeNowpaymentsStatus(row.payment_status);
    let creditedNow = false;
    let finalRow = row;
    let stateAfterCredit: Record<string, unknown> | null = null;
    let creditResponse: Record<string, unknown> = {};

    if (NOWPAYMENTS_PAID_STATUSES.has(status)) {
      const creditResult = await creditNowpaymentIfNeeded(supabase, row);
      if (!creditResult.ok) {
        await auditEvent(supabase, auth.wallet, "nowpay_credit_failed", {
          kind: row.kind,
          providerPaymentId,
          status,
          error: creditResult.error,
        });
        return json({ ok: false, error: creditResult.error || "Failed to credit payment." });
      }
      finalRow = creditResult.row;
      creditedNow = Boolean(creditResult.creditedNow);
      stateAfterCredit = creditResult.state;
      creditResponse = creditResult.response ?? {};
      if (creditedNow) {
        await auditEvent(supabase, auth.wallet, "nowpay_credited", {
          kind: row.kind,
          providerPaymentId,
          providerOrderId: row.provider_order_id,
          status,
          productRef: row.product_ref,
          usdtAmount: row.usdt_amount,
        });
      }
    }

    return json({
      ok: true,
      nowpayPayment: mapNowpaymentForClient(finalRow),
      nowpayPaid: NOWPAYMENTS_PAID_STATUSES.has(status),
      nowpayTerminal: NOWPAYMENTS_TERMINAL_STATUSES.has(status),
      nowpayCredited: Boolean(finalRow.credited || finalRow.credit_state === "done"),
      nowpayCreditedNow: creditedNow,
      ...creditResponse,
      gold: stateAfterCredit ? Math.max(0, asInt(stateAfterCredit.gold, 0)) : undefined,
      savedAt: stateAfterCredit ? new Date().toISOString() : undefined,
    });
  }

  if (action === "starter_pack_buy") {
    const txSignature = String(body.txSignature ?? "").trim().slice(0, 120);
    if (!isTxSignatureLike(txSignature)) {
      return json({ ok: false, error: "Invalid payment transaction signature." });
    }

    const alreadyProcessed = await wasStarterPackTxAlreadyProcessed(supabase, auth.wallet, txSignature);
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
        starterPackAlreadyProcessed: true,
        starterPackPurchased: Boolean(state.starterPackPurchased),
        gold: Math.max(0, asInt(state.gold, 0)),
        consumables: normalizeConsumables(state.consumables).rows,
        savedAt: String(profileRow?.updated_at ?? ""),
      });
    }

    const txCheck = await verifyStarterPackPaymentTx(auth.wallet, txSignature, now);
    if (!txCheck.ok) {
      return json({ ok: false, error: txCheck.error });
    }

    for (let attempt = 0; attempt < PROFILE_UPDATE_RETRY_ATTEMPTS; attempt += 1) {
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
      if (Boolean(state.starterPackPurchased)) {
        return json({
          ok: true,
          starterPackAlreadyProcessed: true,
          starterPackPurchased: true,
          gold: Math.max(0, asInt(state.gold, 0)),
          consumables: normalizeConsumables(state.consumables).rows,
          savedAt: String(profileRow.updated_at ?? ""),
        });
      }

      state.gold = Math.max(0, asInt(state.gold, 0)) + STARTER_PACK_GOLD;
      for (const entry of STARTER_PACK_ITEMS) {
        for (let i = 0; i < entry.qty; i += 1) {
          addConsumableToState(state, entry.type);
        }
      }
      state.starterPackPurchased = true;

      const nowIso = new Date().toISOString();
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

      if (updateError || !updated) {
        if (attempt < PROFILE_UPDATE_RETRY_ATTEMPTS - 1) {
          await waitMs(70 + Math.floor(Math.random() * 140));
        }
        continue;
      }

      await auditEvent(supabase, auth.wallet, "starter_pack_buy", {
        txSignature,
        lamports: STARTER_PACK_PRICE_LAMPORTS,
        txBlockTime: txCheck.blockTime,
        txSlot: txCheck.slot,
        gold: Math.max(0, asInt(state.gold, 0)),
      });

      return json({
        ok: true,
        starterPackAlreadyProcessed: false,
        starterPackPurchased: true,
        gold: Math.max(0, asInt(state.gold, 0)),
        consumables: normalizeConsumables(state.consumables).rows,
        savedAt: nowIso,
      });
    }

    return json({ ok: false, error: "Profile changed concurrently, retry starter pack activation." });
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

    for (let attempt = 0; attempt < PROFILE_UPDATE_RETRY_ATTEMPTS; attempt += 1) {
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
      if (attempt < PROFILE_UPDATE_RETRY_ATTEMPTS - 1) {
        await waitMs(70 + Math.floor(Math.random() * 140));
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
      village.carryGold = 0;
      village.carryCrystals = 0;
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

      const pendingRaw = getVillagePendingRewardsRaw(village, nowMs);
      const pending = {
        gold: Math.max(0, Math.floor(pendingRaw.goldExact)),
        crystals: Math.max(0, Math.floor(pendingRaw.crystalsExact)),
      };
      if (pending.gold <= 0 && pending.crystals <= 0) {
        return json({ ok: false, error: "No rewards to claim yet." });
      }

      state.gold = Math.max(0, asInt(state.gold, 0)) + pending.gold;
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + pending.crystals;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0)) + pending.crystals;
      village.carryGold = Math.max(0, Math.min(0.999999, pendingRaw.goldExact - pending.gold));
      village.carryCrystals = Math.max(0, Math.min(0.999999, pendingRaw.crystalsExact - pending.crystals));
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

  if (action === "swap_crystals_to_gold") {
    const crystalsAmount = asInt(body.crystalsAmount, 0);
    if (!Number.isFinite(crystalsAmount) || crystalsAmount <= 0) {
      return json({ ok: false, error: "Enter a valid amount." });
    }
    if (crystalsAmount > 10_000_000_000) {
      return json({ ok: false, error: "Swap amount is too high." });
    }

    const goldAmount = crystalsAmount * CRYSTAL_TO_GOLD_SWAP_RATE;
    if (!Number.isSafeInteger(goldAmount) || goldAmount <= 0) {
      return json({ ok: false, error: "Invalid swap amount." });
    }

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

      const crystals = Math.max(0, asInt(state.crystals, 0));
      if (crystalsAmount > crystals) {
        return json({ ok: false, error: "Not enough crystals." });
      }

      state.crystals = crystals - crystalsAmount;
      state.gold = Math.max(0, asInt(state.gold, 0)) + goldAmount;

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

      await auditEvent(supabase, auth.wallet, "swap_crystals_to_gold", {
        swappedCrystals: crystalsAmount,
        swappedGold: goldAmount,
        crystalsLeft: Math.max(0, asInt(state.crystals, 0)),
        gold: Math.max(0, asInt(state.gold, 0)),
      });

      return json({
        ok: true,
        savedAt: nowIso,
        swappedCrystals: crystalsAmount,
        swappedGold: goldAmount,
        crystals: Math.max(0, asInt(state.crystals, 0)),
        gold: Math.max(0, asInt(state.gold, 0)),
      });
    }

    return json({ ok: false, error: "Profile changed concurrently, retry swap." });
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
    if (!isPlayerIdentity(wallet)) {
      return json({ ok: false, error: "Invalid player id." });
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
    if (!isPlayerIdentity(wallet)) {
      return json({ ok: false, error: "Invalid player id." });
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
    const walletFilter = isPlayerIdentity(walletFilterRaw) ? walletFilterRaw : "";
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
    const { count: totalProfilesCount } = await supabase
      .from("profiles")
      .select("wallet", { count: "exact", head: true });
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
      profilesTotal: Math.max(0, asInt(totalProfilesCount, profiles.length)),
    });
  }

  if (action === "admin_withdrawals") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const limit = clampInt(body.limit, 20, 1000);
    const { data, error } = await supabase
      .from("withdrawals")
      .select("id, wallet, payout_wallet, name, crystals, sol_amount, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

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
    await auditEvent(supabase, auth.wallet, "admin_mark_paid", { withdrawalId });
    return json({ ok: true });
  }

  return json({ ok: false, error: "Unknown action." });
});
