import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clusterApiUrl, Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.98.4";
import { Address, beginCell, Cell } from "https://esm.sh/@ton/core@0.62.0";

const MAX_LEVEL = 255;
const MAX_TICKETS = 30;
const DUNGEON_DAILY_TICKETS = 5;
const WORLD_BOSS_DURATION_SECONDS = 12 * 60 * 60;
const WORLD_BOSS_PRIZE_POOL = 1000;
const WORLD_BOSS_DAMAGE_PER_SEC_CAP = 5000;
const WORLD_BOSS_TICKET_COST_GOLD = 18000;
const WORLD_BOSS_PREMIUM_DAILY_TICKETS = 2;
const WORLD_BOSS_STARTER_TICKETS = 5;
const SHOP_DUNGEON_KEY_COST_GOLD = 50000;
const SHOP_DUNGEON_KEY_DAILY_LIMIT = 10;
const SHOP_WORLD_BOSS_TICKET_DAILY_LIMIT = 2;
const REFERRAL_LEVEL_TARGET = 15;
const REFERRAL_KEY_BONUS = 7;
const REFERRAL_CRYSTAL_RATE = 0.05;
const REFERRAL_CONTEST_ID = "referral-rush-2026-04-10";
const REFERRAL_CONTEST_NAME = "Referral Rush";
const REFERRAL_CONTEST_START_AT = "2026-04-09T21:00:00.000Z";
const REFERRAL_CONTEST_END_AT = "2026-05-05T20:59:59.999Z";
const REFERRAL_CONTEST_REVIEW_DELAY_SECONDS = 12 * 60 * 60;
const REFERRAL_CONTEST_LEVEL_TARGET = 10;
const REFERRAL_CONTEST_BASE_POINTS = 5;
const REFERRAL_CONTEST_PREMIUM_POINTS = 100;
const REFERRAL_CONTEST_PRIZE_FIRST = 3000;
const REFERRAL_CONTEST_PRIZE_SECOND = 2000;
const REFERRAL_CONTEST_PRIZE_THIRD = 1000;
const REFERRAL_CONTEST_LEADERBOARD_DEFAULT_LIMIT = 20;
const REFERRAL_CONTEST_LEADERBOARD_MAX_LIMIT = 100;
const CRYSTAL_TASK_REFERRAL_LEVEL_MIN = 5;
const CRYSTAL_TASK_AD_COOLDOWN_SECONDS = 15 * 60;
const CRYSTAL_TASK_CHANNEL_REWARD = 20;
const CRYSTAL_TASK_X_REWARD = 15;
const CRYSTAL_TASK_AD_REWARD = 2;
const CRYSTAL_TASK_REFERRALS5_REWARD = 100;
const CRYSTAL_TASK_REFERRALS10_REWARD = 150;
const TELEGRAM_CHANNEL_HANDLE = "doge_mmorpg";
const TELEGRAM_CHANNEL_URL = "https://t.me/" + TELEGRAM_CHANNEL_HANDLE;
const TWITTER_FOLLOW_URL = "https://x.com/Doge_mmorpg";
const ADSGRAM_BLOCK_ID = "27346";
const ADSGRAM_PARTNER_TASK_REWARD = 6;
const PARTNER_TASK_DUPLICATE_SUPPRESS_MS = 5_000;
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
const STARTER_PACK_GOLD = 300000;
const STARTER_PACK_PRICE_LAMPORTS = Math.round(0.13 * SOL_LAMPORTS);
const MINER_LEASE_DURATION_DAYS = 30;
const MINER_LEASE_DURATION_MS = MINER_LEASE_DURATION_DAYS * 24 * 60 * 60 * 1000;
const MINER_DAY_MS = 24 * 60 * 60 * 1000;
const MINERS = [
  { id: "shiba", title: "Shiba Miner", crystalsPerDay: 200, lamports: Math.round(0.4 * SOL_LAMPORTS), starsAmount: 1500, tonAmount: 25, usdtAmount: 32 },
  { id: "pepe", title: "Pepe Miner", crystalsPerDay: 400, lamports: Math.round(0.7 * SOL_LAMPORTS), starsAmount: 2600, tonAmount: 43, usdtAmount: 56 },
  { id: "trump", title: "Trump Miner", crystalsPerDay: 800, lamports: Math.round(1.2 * SOL_LAMPORTS), starsAmount: 4500, tonAmount: 75, usdtAmount: 95 },
] as const;
const STARTER_PACK_ITEMS: Array<{ type: ConsumableType; qty: number }> = [
  { type: "energy-small", qty: 20 },
  { type: "energy-full", qty: 5 },
  { type: "boss-mark", qty: 3 },
  { type: "crystal-flask", qty: 5 },
  { type: "key", qty: 20 },
];
const PREMIUM_PAYMENT_WALLET = "6tsXjdYxaqKBf83wHM5ps5rMGvZ6wq4Fc7N1QtSQGPrg";
const PREMIUM_TX_MAX_AGE_SECONDS = 2 * 60 * 60;
const PAYMENT_TX_LOOKUP_ATTEMPTS = 22;
const PAYMENT_TX_LOOKUP_BASE_DELAY_MS = 1200;
const PROFILE_UPDATE_RETRY_ATTEMPTS = 10;
const PROFILE_STALE_WRITE_TOLERANCE_MS = 1000;
const BLOCKED_ERROR_MESSAGE = "You have been banned for cheating.";
const GOLD_PACKS_SOL = [
  { id: "gold-50k", gold: 50000, lamports: Math.round(0.04 * SOL_LAMPORTS) },
  { id: "gold-100k", gold: 100000, lamports: Math.round(0.07 * SOL_LAMPORTS) },
  { id: "gold-500k", gold: 500000, lamports: Math.round(0.28 * SOL_LAMPORTS) },
  { id: "gold-1200k", gold: 1200000, lamports: Math.round(0.5 * SOL_LAMPORTS) },
] as const;
const FORTUNE_SPIN_PACKS_SOL = [1, 10] as const;
const FORTUNE_SPIN_PRICES_LAMPORTS: Record<(typeof FORTUNE_SPIN_PACKS_SOL)[number], number> = {
  1: Math.round(0.005 * SOL_LAMPORTS),
  10: Math.round(0.04 * SOL_LAMPORTS),
};
const MIN_SEASON_SNAPSHOT_CRYSTALS = 1000;
const ENERGY_REGEN_SECONDS = 420;
const PREMIUM_PLANS = [
  { id: "premium-30", days: 30, lamports: Math.round(0.2 * SOL_LAMPORTS) },
  { id: "premium-90", days: 90, lamports: Math.round(0.48 * SOL_LAMPORTS) },
] as const;
const TELEGRAM_STARS_STARTER_PACK = 500;
const TELEGRAM_STARS_GOLD_PACKS: Record<(typeof GOLD_PACKS_SOL)[number]["id"], number> = {
  "gold-50k": 140,
  "gold-100k": 260,
  "gold-500k": 1050,
  "gold-1200k": 1650,
};
const TELEGRAM_STARS_MINERS: Record<MinerId, number> = {
  shiba: 1500,
  pepe: 2600,
  trump: 4500,
};
const TELEGRAM_STARS_PREMIUM_PLANS: Record<(typeof PREMIUM_PLANS)[number]["id"], number> = {
  "premium-30": 749,
  "premium-90": 1700,
};
const TELEGRAM_STARS_FORTUNE_PACKS: Record<(typeof FORTUNE_SPIN_PACKS_SOL)[number], number> = {
  1: 20,
  10: 150,
};

const TELEGRAM_TON_TREASURY_WALLET = String(Deno.env.get("TON_TREASURY_WALLET") ?? "UQBquMaMtbGIbDKL5W0bwl0nDCVdg5joq5mbp7jLSaM3hp0i").trim();
const TELEGRAM_TON_USDT_MASTER = String(Deno.env.get("TON_USDT_MASTER_ADDRESS") ?? "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe").trim();
const TELEGRAM_TON_API_BASE = String(Deno.env.get("TONCENTER_API_BASE") ?? "https://toncenter.com/api/v3").trim().replace(/\/+$/, "");
const TELEGRAM_TON_API_KEY = String(Deno.env.get("TONCENTER_API_KEY") ?? "").trim();
const TELEGRAM_TON_ORDER_STATUSES = ["pending", "claiming", "claimed", "failed", "expired"] as const;
const TELEGRAM_TON_ORDER_SELECT = "id, wallet, tg_user_id, payer_address, rail, kind, product_ref, asset, amount_units, amount_display, tx_hash_hex, tx_hash_base64, status, claim_error, reward, claimed_at, created_at, updated_at";
const TELEGRAM_TON_USDT_DECIMALS = 6;
const TELEGRAM_TON_USDT_GAS_NANOTON = 60_000_000n;
const TELEGRAM_TON_USDT_FORWARD_NANOTON = 20_000_000n;
const TELEGRAM_TON_TRANSFER_LOOKUP_WINDOW_SECONDS = 3 * 60 * 60;
const TELEGRAM_TON_TX_VALID_SECONDS = 15 * 60;
const TELEGRAM_TON_STARTER_PACK = 8.5;
const TELEGRAM_USDT_STARTER_PACK = 11;
const TELEGRAM_TON_GOLD_PACKS: Record<(typeof GOLD_PACKS_SOL)[number]["id"], number> = {
  "gold-50k": 2.6,
  "gold-100k": 4.5,
  "gold-500k": 18,
  "gold-1200k": 32,
};
const TELEGRAM_USDT_GOLD_PACKS: Record<(typeof GOLD_PACKS_SOL)[number]["id"], number> = {
  "gold-50k": 3.4,
  "gold-100k": 5.8,
  "gold-500k": 23,
  "gold-1200k": 41,
};
const TELEGRAM_TON_MINERS: Record<MinerId, number> = {
  shiba: 25,
  pepe: 43,
  trump: 75,
};
const TELEGRAM_USDT_MINERS: Record<MinerId, number> = {
  shiba: 32,
  pepe: 56,
  trump: 95,
};
const TELEGRAM_TON_PREMIUM_PLANS: Record<(typeof PREMIUM_PLANS)[number]["id"], number> = {
  "premium-30": 13,
  "premium-90": 31,
};
const TELEGRAM_USDT_PREMIUM_PLANS: Record<(typeof PREMIUM_PLANS)[number]["id"], number> = {
  "premium-30": 16,
  "premium-90": 40,
};
const TELEGRAM_TON_FORTUNE_PACKS: Record<(typeof FORTUNE_SPIN_PACKS_SOL)[number], number> = {
  1: 0.32,
  10: 2.6,
};
const TELEGRAM_USDT_FORTUNE_PACKS: Record<(typeof FORTUNE_SPIN_PACKS_SOL)[number], number> = {
  1: 0.4,
  10: 3.4,
};
const TELEGRAM_STARS_PENDING_REUSE_MS = 20 * 60 * 1000;
const TELEGRAM_STARS_ORDER_STATUSES = [
  "pending",
  "paid",
  "claiming",
  "claimed",
  "expired",
  "canceled",
  "failed",
] as const;
const PREMIUM_SALE_START_MS = Date.parse("2026-02-28T00:00:00Z");
const PREMIUM_SALE_END_MS = Date.parse("2026-03-02T00:00:00Z");
const PREMIUM_SALE_DISCOUNT_RATE = 0.5;
const XP_BASE = 200;
const XP_SCALE = 3;
const XP_POWER = 1.2;
const XP_LEVEL_REQUIREMENT_MULTIPLIER = 1.4;
const ENERGY_MAX = 50;
const ITEM_TIER_SCORE_BASE = 18;
const ITEM_TIER_SCORE_PER_LEVEL = 14;
const ITEM_TIER_SCORE_MULTIPLIER = 0.5;
const INVENTORY_ITEM_CAP = 512;
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

type ConsumableType = "energy-small" | "energy-full" | "boss-mark" | "crystal-flask" | "key";
type QuestType = "level" | "kills" | "tier" | "dungeons";
type QuestDefinition = {
  id: string;
  type: QuestType;
  target: number;
  rewardGold: number;
  rewardItem?: ConsumableType;
};
const CRYSTAL_TASK_IDS = ["join-channel", "follow-x", "watch-ad", "referrals-5", "referrals-10"] as const;
type CrystalTaskId = (typeof CRYSTAL_TASK_IDS)[number];
type CrystalTaskProgress = {
  claimCount: number;
  lastClaimAt: number;
};
type CrystalTaskStatusRow = {
  id: CrystalTaskId;
  title: string;
  description: string;
  rewardCrystals: number;
  repeatable: boolean;
  claimed: boolean;
  claimCount: number;
  progress: number;
  target: number;
  canClaim: boolean;
  cooldownSec: number;
  remainingSec: number;
  actionUrl: string;
};
type EquipmentSlot = "weapon" | "armor" | "head" | "legs" | "boots" | "artifact";
type EquipmentStatKey = "power" | "fortune" | "prosperity";
type EquipmentStats = Record<EquipmentStatKey, number>;
type EquipmentEffectKind = "boss-damage" | "village-gold" | "sell-boost";
type EquipmentEffectState = { kind: EquipmentEffectKind; value: number };
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

type ReferralContestStatus = "upcoming" | "active" | "review" | "closed";

type ReferralContestInfoRow = {
  id: string;
  name: string;
  status: ReferralContestStatus;
  startAt: string;
  endAt: string;
  reviewEndsAt: string;
  remainingSec: number;
  levelTarget: number;
  basePoints: number;
  premiumPoints: number;
  prizes: {
    first: number;
    second: number;
    third: number;
  };
};

type ReferralContestReferralRow = {
  referrer_wallet: string;
  referee_wallet: string;
  created_at: string;
};

type ReferralContestLeaderboardRow = {
  rank: number;
  wallet: string;
  name: string;
  points: number;
  qualifiedReferrals: number;
  premiumReferrals: number;
  lastQualifiedAt: string;
};

type SeasonRow = {
  id: string;
  name: string;
  start_at: string;
  end_at: string;
  pool_usdt: number | string;
  status: string;
  closed_at: string | null;
  created_at?: string;
};

type SeasonSnapshotRow = {
  id: string;
  season_id: string;
  wallet: string;
  name: string;
  crystals_snapshot: number | string;
  premium_active: boolean;
  effective_crystals: number | string;
  share: number | string;
  payout_usdt: number | string;
  excluded: boolean;
  exclude_reason: string;
  created_at: string;
};

type SeasonComputedRow = {
  wallet: string;
  name: string;
  crystalsSnapshot: number;
  premiumActive: boolean;
  effectiveCrystals: number;
  share: number;
  payoutUsdt: number;
  updatedAt: string;
};

type TelegramStarsOrderStatus = (typeof TELEGRAM_STARS_ORDER_STATUSES)[number];
type TelegramStarsOrderKind = "buy_gold" | "starter_pack_buy" | "premium_buy" | "fortune_buy" | "miner_buy";

type TelegramStarsOrderRow = {
  id: string;
  wallet: string;
  tg_user_id: string;
  kind: string;
  product_ref: string;
  stars_amount: number;
  status: string;
  invoice_payload: string;
  invoice_link: string;
  telegram_charge_id: string;
  provider_charge_id: string;
  reward: Record<string, unknown>;
  paid_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TelegramStarsPreparedPurchase = {
  kind: TelegramStarsOrderKind;
  productRef: string;
  starsAmount: number;
  title: string;
  description: string;
  reward: Record<string, unknown>;
};

type TelegramStarsOrderPublic = {
  id: string;
  kind: TelegramStarsOrderKind;
  productRef: string;
  starsAmount: number;
  status: TelegramStarsOrderStatus;
  invoiceLink: string;
  createdAt: string;
  paidAt: string | null;
  claimedAt: string | null;
};

type TelegramTonRail = "ton" | "usdt";
type TelegramTonAsset = "TON" | "USDT";
type TelegramTonOrderStatus = (typeof TELEGRAM_TON_ORDER_STATUSES)[number];
type TelegramTonOrderKind = TelegramStarsOrderKind;

type TelegramTonOrderRow = {
  id: string;
  wallet: string;
  tg_user_id: string;
  payer_address: string;
  rail: string;
  kind: string;
  product_ref: string;
  asset: string;
  amount_units: number | string;
  amount_display: string;
  tx_hash_hex: string | null;
  tx_hash_base64: string | null;
  status: string;
  claim_error: string;
  reward: Record<string, unknown>;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TelegramTonPreparedPurchase = {
  kind: TelegramTonOrderKind;
  productRef: string;
  rail: TelegramTonRail;
  asset: TelegramTonAsset;
  amountUnits: bigint;
  amountDisplay: string;
  title: string;
  reward: Record<string, unknown>;
};

type TelegramTonTxMessage = {
  address: string;
  amount: string;
  payload?: string;
};

type TelegramTonOrderPublic = {
  id: string;
  kind: TelegramTonOrderKind;
  productRef: string;
  rail: TelegramTonRail;
  asset: TelegramTonAsset;
  amountUnits: number;
  amountDisplay: string;
  payerAddress: string;
  status: TelegramTonOrderStatus;
  txRequest: {
    validUntil: number;
    messages: TelegramTonTxMessage[];
  };
  createdAt: string;
  claimedAt: string | null;
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
type MinerId = "shiba" | "pepe" | "trump";
type MinerLeaseState = {
  id: number;
  minerId: MinerId;
  startedAt: number;
  endsAt: number;
  claimedAt: number;
};

const CONSUMABLE_DEFS: Record<ConsumableType, { name: string; description: string }> = {
  "energy-small": { name: "Energy Tonic", description: "Restore 10 energy." },
  "energy-full": { name: "Grand Energy Elixir", description: "Restore energy to full." },
  "boss-mark": { name: "Boss Mark", description: "+25% World Boss damage for the current cycle." },
  "crystal-flask": { name: "Crystal Flask", description: "+25% dungeon crystals for the next 3 runs." },
  key: { name: "Dungeon Key", description: "+1 dungeon entry." },
};

const CHARACTER_CLASS_STATS = {
  knight: { attack: 16, attackSpeed: 0.9, speed: 58, range: 16 },
  mage: { attack: 18, attackSpeed: 1.1, speed: 62, range: 22 },
  archer: { attack: 14, attackSpeed: 1.4, speed: 78, range: 20 },
  elon: { attack: 17, attackSpeed: 1.05, speed: 68, range: 24 },
} as const;

const LEGACY_CHARACTER_CLASS_MAP = {
  gake: 'archer',
} as const;

const normalizeCharacterClassId = (classIdRaw: unknown) => {
  const classId = String(classIdRaw ?? '').trim().toLowerCase();
  if (!classId) return '';
  return LEGACY_CHARACTER_CLASS_MAP[classId as keyof typeof LEGACY_CHARACTER_CLASS_MAP] ?? classId;
};

const EQUIPMENT_SLOT_IDS: EquipmentSlot[] = ["weapon", "armor", "head", "legs", "boots", "artifact"];
const EQUIPMENT_RARITIES = [
  { name: "Common", color: "#c7c7c7", tier: 1, power: 1, sellValue: 10 },
  { name: "Uncommon", color: "#7bd88f", tier: 2, power: 1.2, sellValue: 20 },
  { name: "Rare", color: "#5aa7ff", tier: 3, power: 1.45, sellValue: 40 },
  { name: "Epic", color: "#b36bff", tier: 4, power: 1.8, sellValue: 75 },
  { name: "Legendary", color: "#ffb347", tier: 5, power: 2.3, sellValue: 130 },
  { name: "Mythic", color: "#ff6bd6", tier: 6, power: 2.9, sellValue: 210 },
  { name: "Ancient", color: "#ffe36b", tier: 7, power: 3.6, sellValue: 320 },
] as const;
const EQUIPMENT_PREFIXES = ["Warden", "Ashen", "Starbound", "Hallowed", "Ironroot", "Mistveil", "Sunfire", "Voidborn"] as const;
const EQUIPMENT_BASE_NAMES: Record<EquipmentSlot, readonly string[]> = {
  weapon: ["Blade", "Staff", "Bow", "Axe", "Spear"],
  armor: ["Plate", "Tunic", "Carapace", "Mail", "Robe"],
  head: ["Helm", "Hood", "Circlet", "Mask", "Crown"],
  legs: ["Greaves", "Legwraps", "Pants", "Kilt", "Leggings"],
  boots: ["Boots", "Sabatons", "Treads", "Sandals", "Shoes"],
  artifact: ["Charm", "Relic", "Sigil", "Gem", "Talisman"],
};
const EQUIPMENT_STAT_TEMPLATES: Record<EquipmentSlot, EquipmentStats> = {
  weapon: { power: 10, fortune: 0, prosperity: 0 },
  armor: { power: 5, fortune: 0, prosperity: 4 },
  head: { power: 4, fortune: 5, prosperity: 0 },
  legs: { power: 2, fortune: 1, prosperity: 6 },
  boots: { power: 1, fortune: 5, prosperity: 3 },
  artifact: { power: 4, fortune: 4, prosperity: 4 },
};
const EQUIPMENT_EFFECT_CAPS = {
  "boss-damage": 0.1,
  "village-gold": 0.08,
  "sell-boost": 0.12,
} as const;
const SLOT_EFFECT_POOLS: Partial<Record<EquipmentSlot, EquipmentEffectKind[]>> = {
  weapon: ["boss-damage"],
  armor: ["village-gold"],
  artifact: ["boss-damage", "village-gold", "sell-boost"],
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
  { id: "energy_tonic", label: "Energy Tonic", kind: "consumable", consumableType: "energy-small", amount: 1, chance: 22 },
  { id: "grand_energy_elixir", label: "Grand Energy Elixir", kind: "consumable", consumableType: "energy-full", amount: 1, chance: 10 },
  { id: "crystal_flask", label: "Crystal Flask", kind: "consumable", consumableType: "crystal-flask", amount: 1, chance: 5 },
  { id: "boss_mark", label: "Boss Mark", kind: "consumable", consumableType: "boss-mark", amount: 1, chance: 5 },
  { id: "crystals_1", label: "1 Crystal", kind: "crystals", amount: 1, chance: 21.71 },
  { id: "crystals_100", label: "100 Crystals", kind: "crystals", amount: 100, chance: 1 },
  { id: "crystals_50", label: "50 Crystals", kind: "crystals", amount: 50, chance: 2 },
  { id: "crystals_10", label: "10 Crystals", kind: "crystals", amount: 10, chance: 6 },
  { id: "gold_100", label: "100 Gold", kind: "gold", amount: 100, chance: 15 },
  { id: "gold_500", label: "500 Gold", kind: "gold", amount: 500, chance: 7 },
  { id: "gold_5000", label: "5000 Gold", kind: "gold", amount: 5000, chance: 2 },
  { id: "gold_10000", label: "10000 Gold", kind: "gold", amount: 10000, chance: 1 },
  { id: "gold_50000", label: "50000 Gold", kind: "gold", amount: 50000, chance: 0.35 },
  { id: "crystals_300", label: "300 Crystals", kind: "crystals", amount: 300, chance: 0.35 },
  { id: "gold_500000", label: "500000 Gold", kind: "gold", amount: 500000, chance: 0.005 },
  { id: "crystals_1000", label: "1000 Crystals", kind: "crystals", amount: 1000, chance: 0.005 },
  { id: "keys_10", label: "10 Keys", kind: "keys", amount: 10, chance: 0.5 },
  { id: "keys_30", label: "30 Keys", kind: "keys", amount: 30, chance: 0.08 },
  { id: "keys_5", label: "5 Keys", kind: "keys", amount: 5, chance: 1 },
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

const sanitizePayoutWallet = (value: unknown) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f\u007f\s]/g, "")
    .trim()
    .slice(0, 96);

const isTelegramIdentity = (value: string) => /^tg:[0-9]{3,20}$/.test(value);
const isWalletLike = (value: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);
const isValidSolanaAddress = (value: string) => {
  try {
    return new PublicKey(value).toBase58() === value;
  } catch {
    return false;
  }
};
const isPayoutWalletFormat = (value: string) =>
  value.length === 0 ||
  isWalletLike(value) ||
  /^0x[a-fA-F0-9]{40}$/.test(value);
const isPlayerIdentity = (value: string) => isWalletLike(value) || isTelegramIdentity(value);
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

const rangeValues = (start: number, end: number, step: number) => {
  const values: number[] = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
};

const LEVEL_QUEST_TARGETS = [...rangeValues(5, 50, 5), ...rangeValues(60, 150, 10), ...rangeValues(160, 250, 10), 255];
const KILL_QUEST_TARGETS = [
  25, 50, 100, 175, 250, 350, 500, 700, 950, 1250, 1600, 2000, 2600, 3400, 4500, 6000, 8000, 10500,
  13500, 17000, 21000, 26000, 32000, 39000, 47000, 56000,
] as const;
const TIER_QUEST_TARGETS = [
  300, 600, 1000, 1600, 2400, 3400, 4700, 6200, 8000, 10000, 12500, 15500, 19000, 23000, 27500, 32000,
  36500, 41000, 45000,
] as const;
const DUNGEON_QUEST_TARGETS = [1, 2, 3, 5, 7, 10, 14, 18, 23, 28, 35, 43, 52, 62, 74, 88, 104, 122, 142, 165] as const;

const scaleQuestRewardGold = (index: number, total: number, min: number, max: number) => {
  if (total <= 1) return max;
  const ratio = index / (total - 1);
  return Math.round(min + (max - min) * ratio);
};

const buildQuestDefinitions = () => {
  const quests: QuestDefinition[] = [];

  LEVEL_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = Math.round(scaleQuestRewardGold(index, LEVEL_QUEST_TARGETS.length, 200, 2200) / 12);
    const rewardItem: ConsumableType = target >= 255 ? "key" : target >= 200 ? "boss-mark" : target >= 120 ? "crystal-flask" : target >= 60 ? "energy-full" : "energy-small";
    quests.push({ id: `level-${target}`, type: "level", target, rewardGold, rewardItem });
  });

  KILL_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = Math.round(scaleQuestRewardGold(index, KILL_QUEST_TARGETS.length, 250, 2500) / 12);
    const rewardItem: ConsumableType = target >= 56000 ? "key" : target >= 32000 ? "boss-mark" : target >= 14000 ? "crystal-flask" : target >= 6000 ? "energy-full" : "energy-small";
    quests.push({ id: `kills-${target}`, type: "kills", target, rewardGold, rewardItem });
  });

  TIER_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = Math.round(scaleQuestRewardGold(index, TIER_QUEST_TARGETS.length, 300, 3000) / 12);
    const rewardItem: ConsumableType = target >= 45000 ? "key" : target >= 30000 ? "boss-mark" : target >= 14000 ? "crystal-flask" : target >= 6200 ? "energy-full" : "energy-small";
    quests.push({ id: `tier-${target}`, type: "tier", target, rewardGold, rewardItem });
  });

  DUNGEON_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = Math.round(scaleQuestRewardGold(index, DUNGEON_QUEST_TARGETS.length, 350, 3200) / 12);
    const rewardItem: ConsumableType = target >= 165 ? "key" : target >= 104 ? "boss-mark" : target >= 35 ? "crystal-flask" : target >= 14 ? "energy-full" : "energy-small";
    quests.push({ id: `dungeons-${target}`, type: "dungeons", target, rewardGold, rewardItem });
  });

  return quests;
};

const QUEST_DEFINITIONS = buildQuestDefinitions();

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

const isPremiumSaleActiveAt = (nowMs: number) =>
  Number.isFinite(PREMIUM_SALE_START_MS) &&
  Number.isFinite(PREMIUM_SALE_END_MS) &&
  nowMs >= PREMIUM_SALE_START_MS &&
  nowMs < PREMIUM_SALE_END_MS;

const getPremiumPlanPricing = (plan: (typeof PREMIUM_PLANS)[number], now: Date) => {
  const saleActive = isPremiumSaleActiveAt(now.getTime());
  if (!saleActive) {
    return {
      lamports: plan.lamports,
      saleActive: false as const,
      discountRate: 0,
    };
  }
  const factor = 1 - PREMIUM_SALE_DISCOUNT_RATE;
  return {
    lamports: Math.max(1, Math.round(plan.lamports * factor)),
    saleActive: true as const,
    discountRate: PREMIUM_SALE_DISCOUNT_RATE,
  };
};

const getGoldPackSol = (packIdRaw: unknown) => {
  const packId = String(packIdRaw ?? "").trim();
  if (!packId) return null;
  return GOLD_PACKS_SOL.find((entry) => entry.id === packId) ?? null;
};

const getMinerDefinition = (minerIdRaw: unknown) => {
  const minerId = String(minerIdRaw ?? "").trim();
  if (!minerId) return null;
  return MINERS.find((entry) => entry.id === minerId) ?? null;
};

const TELEGRAM_STARS_ORDER_SELECT = "id, wallet, tg_user_id, kind, product_ref, stars_amount, status, invoice_payload, invoice_link, telegram_charge_id, provider_charge_id, reward, paid_at, claimed_at, created_at, updated_at";

const isTelegramStarsOrderKind = (value: string): value is TelegramStarsOrderKind =>
  value === "buy_gold" || value === "starter_pack_buy" || value === "premium_buy" || value === "fortune_buy" || value === "miner_buy";

const isTelegramStarsOrderStatus = (value: string): value is TelegramStarsOrderStatus =>
  (TELEGRAM_STARS_ORDER_STATUSES as readonly string[]).includes(value);

const getTelegramUserIdFromIdentity = (wallet: string) => {
  if (!isTelegramIdentity(wallet)) return "";
  const raw = wallet.slice(3).trim();
  if (!/^[0-9]{3,20}$/.test(raw)) return "";
  return raw;
};

const normalizeTelegramStarsOrder = (rowRaw: unknown): TelegramStarsOrderPublic | null => {
  if (!rowRaw || typeof rowRaw !== "object" || Array.isArray(rowRaw)) return null;
  const row = rowRaw as Record<string, unknown>;
  const kind = String(row.kind ?? "").trim();
  const statusRaw = String(row.status ?? "").trim();
  if (!isTelegramStarsOrderKind(kind)) return null;
  if (!isTelegramStarsOrderStatus(statusRaw)) return null;

  return {
    id: String(row.id ?? ""),
    kind,
    productRef: String(row.product_ref ?? ""),
    starsAmount: Math.max(0, asInt(row.stars_amount, 0)),
    status: statusRaw,
    invoiceLink: String(row.invoice_link ?? ""),
    createdAt: String(row.created_at ?? ""),
    paidAt: row.paid_at ? String(row.paid_at) : null,
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
  };
};

const prepareTelegramStarsPurchase = (
  body: Record<string, unknown>,
): { ok: true; purchase: TelegramStarsPreparedPurchase } | { ok: false; error: string } => {
  const kindRaw = String(body.kind ?? "").trim();
  if (!isTelegramStarsOrderKind(kindRaw)) {
    return { ok: false, error: "Invalid Stars purchase kind." };
  }

  if (kindRaw === "buy_gold") {
    const pack = getGoldPackSol(body.packId);
    if (!pack) return { ok: false, error: "Invalid gold package." };
    const starsAmount = TELEGRAM_STARS_GOLD_PACKS[pack.id];
    if (!Number.isFinite(starsAmount) || starsAmount <= 0) {
      return { ok: false, error: "Stars pricing is not configured for this gold package." };
    }
    return {
      ok: true,
      purchase: {
        kind: "buy_gold",
        productRef: pack.id,
        starsAmount,
        title: `${pack.gold} Gold`,
        description: `Instant credit: ${pack.gold} gold coins.`,
        reward: { packId: pack.id, gold: pack.gold },
      },
    };
  }

  if (kindRaw === "starter_pack_buy") {
    return {
      ok: true,
      purchase: {
        kind: "starter_pack_buy",
        productRef: "starter-pack-v1",
        starsAmount: TELEGRAM_STARS_STARTER_PACK,
        title: "Starter Pack",
        description: "One-time bundle with gold, consumables, and World Boss tickets.",
        reward: {
          gold: STARTER_PACK_GOLD,
          items: STARTER_PACK_ITEMS,
          worldBossTickets: WORLD_BOSS_STARTER_TICKETS,
        },
      },
    };
  }

  if (kindRaw === "premium_buy") {
    const plan = getPremiumPlan(body.planId, body.days);
    if (!plan) return { ok: false, error: "Invalid Premium plan." };
    const starsAmount = TELEGRAM_STARS_PREMIUM_PLANS[plan.id];
    if (!Number.isFinite(starsAmount) || starsAmount <= 0) {
      return { ok: false, error: "Stars pricing is not configured for this Premium plan." };
    }
    return {
      ok: true,
      purchase: {
        kind: "premium_buy",
        productRef: plan.id,
        starsAmount,
        title: `Premium ${plan.days}d`,
        description: `Activate Premium for ${plan.days} days.`,
        reward: { planId: plan.id, days: plan.days },
      },
    };
  }

  if (kindRaw === "miner_buy") {
    const miner = getMinerDefinition(body.minerId);
    if (!miner) return { ok: false, error: "Invalid miner." };
    const starsAmount = TELEGRAM_STARS_MINERS[miner.id as MinerId];
    if (!Number.isFinite(starsAmount) || starsAmount <= 0) {
      return { ok: false, error: "Stars pricing is not configured for this miner." };
    }
    return {
      ok: true,
      purchase: {
        kind: "miner_buy",
        productRef: miner.id,
        starsAmount,
        title: miner.title,
        description: `Lease ${miner.title} for ${MINER_LEASE_DURATION_DAYS} days and earn ${miner.crystalsPerDay} crystals per day.`,
        reward: { minerId: miner.id },
      },
    };
  }

  const spins = asInt(body.spins, 0);
  if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) {
    return { ok: false, error: "Invalid fortune spin pack." };
  }
  const starsAmount = TELEGRAM_STARS_FORTUNE_PACKS[spins as (typeof FORTUNE_SPIN_PACKS_SOL)[number]];
  if (!Number.isFinite(starsAmount) || starsAmount <= 0) {
    return { ok: false, error: "Stars pricing is not configured for this fortune pack." };
  }
  return {
    ok: true,
    purchase: {
      kind: "fortune_buy",
      productRef: String(spins),
      starsAmount,
      title: `${spins} Fortune Spin${spins === 1 ? "" : "s"}`,
      description: `Add ${spins} paid spin${spins === 1 ? "" : "s"} to your Fortune Wheel.`,
      reward: { spins },
    },
  };
};

const isTelegramTonRail = (value: string): value is TelegramTonRail =>
  value === "ton" || value === "usdt";

const isTelegramTonOrderStatus = (value: string): value is TelegramTonOrderStatus =>
  (TELEGRAM_TON_ORDER_STATUSES as readonly string[]).includes(value);

const normalizeTonAddress = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    return Address.parse(raw).toString({ bounceable: false, testOnly: false, urlSafe: true });
  } catch {
    return "";
  }
};

const paymentAmountToDisplay = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0";
  return Number.isInteger(value) ? String(Math.floor(value)) : value.toString();
};

const decimalToUnits = (value: number, decimals: number) => {
  if (!Number.isFinite(value) || value <= 0) return 0n;
  const factor = Math.pow(10, decimals);
  return BigInt(Math.round(value * factor));
};

const normalizeTxHashHex = (value: unknown) => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  const trimmed = raw.startsWith("0x") ? raw.slice(2) : raw;
  return /^[0-9a-f]{64}$/.test(trimmed) ? trimmed : "";
};

const normalizeTxHashBase64 = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = raw.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4);
  return `${normalized}${"=".repeat(padLength)}`;
};

const uint8ToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

const uint8ToHex = (bytes: Uint8Array) => {
  let output = "";
  for (const byte of bytes) {
    output += byte.toString(16).padStart(2, "0");
  }
  return output;
};

const createTonCommentPayload = (comment: string) => {
  const text = String(comment ?? "").trim();
  if (!text) return "";
  const cell = beginCell().storeUint(0, 32).storeStringTail(text).endCell();
  return uint8ToBase64(cell.toBoc());
};

const tonCenterGet = async (path: string, params: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${TELEGRAM_TON_API_BASE}${path}`);
  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) continue;
    url.searchParams.set(key, String(rawValue));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const request = async (useApiKey: boolean) => {
      const headers: Record<string, string> = {};
      if (useApiKey && TELEGRAM_TON_API_KEY) headers["X-API-Key"] = TELEGRAM_TON_API_KEY;
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      const rawText = await response.text();
      return { response, rawText };
    };

    let { response, rawText } = await request(Boolean(TELEGRAM_TON_API_KEY));

    // If an invalid API key is configured, retry anonymously.
    if (!response.ok && response.status === 401 && TELEGRAM_TON_API_KEY) {
      ({ response, rawText } = await request(false));
    }

    if (!response.ok) {
      return { ok: false as const, error: `TON API ${response.status}: ${rawText || response.statusText}` };
    }

    let data: Record<string, unknown> | null = null;
    try {
      data = rawText ? JSON.parse(rawText) as Record<string, unknown> : null;
    } catch {
      data = null;
    }
    return { ok: true as const, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: `TON API request failed: ${message}` };
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseApiTransactions = (data: Record<string, unknown> | null) => {
  if (!data) return [] as Array<Record<string, unknown>>;
  const rows = data.transactions;
  if (!Array.isArray(rows)) return [];
  return rows.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
};

const parseApiJettonTransfers = (data: Record<string, unknown> | null) => {
  if (!data) return [] as Array<Record<string, unknown>>;
  const rows = data.jetton_transfers;
  if (!Array.isArray(rows)) return [];
  return rows.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
};

const parseApiJettonWallets = (data: Record<string, unknown> | null) => {
  if (!data) return [] as Array<Record<string, unknown>>;
  const rows = data.jetton_wallets;
  if (!Array.isArray(rows)) return [];
  return rows.filter((entry) => entry && typeof entry === "object") as Array<Record<string, unknown>>;
};

const getTonMessageTextComment = (messageRaw: unknown) => {
  if (!messageRaw || typeof messageRaw !== "object" || Array.isArray(messageRaw)) return "";
  const message = messageRaw as Record<string, unknown>;
  const messageContent = message.message_content;
  if (!messageContent || typeof messageContent !== "object" || Array.isArray(messageContent)) return "";
  const decoded = (messageContent as Record<string, unknown>).decoded;
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return "";
  return String((decoded as Record<string, unknown>).comment ?? "").trim();
};

const tryDecodeTonTextCommentCell = (payloadRaw: unknown) => {
  const payload = String(payloadRaw ?? "").trim();
  if (!payload) return "";
  try {
    const slice = Cell.fromBase64(payload).beginParse();
    if (slice.remainingBits < 32) return "";
    const opcode = slice.loadUint(32);
    if (opcode !== 0) return "";
    return slice.loadStringTail().trim();
  } catch {
    return "";
  }
};

const findCommentRecursively = (value: unknown): string => {
  if (typeof value === "string") {
    const direct = value.trim();
    return direct.startsWith("dgq-") ? direct : "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = findCommentRecursively(item);
      if (nested) return nested;
    }
    return "";
  }
  if (!value || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const directComment = String(record.comment ?? "").trim();
  if (directComment) return directComment;

  for (const nestedValue of Object.values(record)) {
    const nestedComment = findCommentRecursively(nestedValue);
    if (nestedComment) return nestedComment;
  }

  return "";
};

const getJettonTransferTextComment = (transferRaw: unknown) => {
  if (!transferRaw || typeof transferRaw !== "object" || Array.isArray(transferRaw)) return "";
  const transfer = transferRaw as Record<string, unknown>;
  const decodedComment = findCommentRecursively(transfer.decoded_forward_payload);
  if (decodedComment) return decodedComment;
  return tryDecodeTonTextCommentCell(transfer.forward_payload);
};

const getTelegramTonPrice = (kind: TelegramTonOrderKind, productRef: string, rail: TelegramTonRail) => {
  if (kind === "buy_gold") {
    const pack = getGoldPackSol(productRef);
    if (!pack) return null;
    const value = rail === "ton" ? TELEGRAM_TON_GOLD_PACKS[pack.id] : TELEGRAM_USDT_GOLD_PACKS[pack.id];
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      numeric: value,
      units: rail === "ton" ? decimalToUnits(value, 9) : decimalToUnits(value, TELEGRAM_TON_USDT_DECIMALS),
    };
  }

  if (kind === "starter_pack_buy") {
    const value = rail === "ton" ? TELEGRAM_TON_STARTER_PACK : TELEGRAM_USDT_STARTER_PACK;
    return {
      numeric: value,
      units: rail === "ton" ? decimalToUnits(value, 9) : decimalToUnits(value, TELEGRAM_TON_USDT_DECIMALS),
    };
  }

  if (kind === "premium_buy") {
    const plan = getPremiumPlan(productRef, 0);
    if (!plan) return null;
    const value = rail === "ton" ? TELEGRAM_TON_PREMIUM_PLANS[plan.id] : TELEGRAM_USDT_PREMIUM_PLANS[plan.id];
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      numeric: value,
      units: rail === "ton" ? decimalToUnits(value, 9) : decimalToUnits(value, TELEGRAM_TON_USDT_DECIMALS),
    };
  }

  if (kind === "miner_buy") {
    const miner = getMinerDefinition(productRef);
    if (!miner) return null;
    const value = rail === "ton" ? TELEGRAM_TON_MINERS[miner.id as MinerId] : TELEGRAM_USDT_MINERS[miner.id as MinerId];
    if (!Number.isFinite(value) || value <= 0) return null;
    return {
      numeric: value,
      units: rail === "ton" ? decimalToUnits(value, 9) : decimalToUnits(value, TELEGRAM_TON_USDT_DECIMALS),
    };
  }

  const spins = asInt(productRef, 0);
  if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) return null;
  const value = rail === "ton"
    ? TELEGRAM_TON_FORTUNE_PACKS[spins as (typeof FORTUNE_SPIN_PACKS_SOL)[number]]
    : TELEGRAM_USDT_FORTUNE_PACKS[spins as (typeof FORTUNE_SPIN_PACKS_SOL)[number]];
  if (!Number.isFinite(value) || value <= 0) return null;
  return {
    numeric: value,
    units: rail === "ton" ? decimalToUnits(value, 9) : decimalToUnits(value, TELEGRAM_TON_USDT_DECIMALS),
  };
};

const prepareTelegramTonPurchase = (
  body: Record<string, unknown>,
): { ok: true; purchase: TelegramTonPreparedPurchase } | { ok: false; error: string } => {
  const kindRaw = String(body.kind ?? "").trim();
  if (!isTelegramStarsOrderKind(kindRaw)) {
    return { ok: false, error: "Invalid payment kind." };
  }

  const railRaw = String(body.rail ?? "").trim().toLowerCase();
  if (!isTelegramTonRail(railRaw)) {
    return { ok: false, error: "Invalid payment rail." };
  }

  const kind = kindRaw as TelegramTonOrderKind;
  const rail = railRaw as TelegramTonRail;

  if (kind === "buy_gold") {
    const pack = getGoldPackSol(body.packId);
    if (!pack) return { ok: false, error: "Invalid gold package." };
    const price = getTelegramTonPrice(kind, pack.id, rail);
    if (!price) return { ok: false, error: "Payment pricing is not configured." };
    return {
      ok: true,
      purchase: {
        kind,
        rail,
        asset: rail === "ton" ? "TON" : "USDT",
        productRef: pack.id,
        amountUnits: price.units,
        amountDisplay: paymentAmountToDisplay(price.numeric),
        title: `${pack.gold} Gold`,
        reward: { packId: pack.id, gold: pack.gold },
      },
    };
  }

  if (kind === "starter_pack_buy") {
    const price = getTelegramTonPrice(kind, "starter-pack-v1", rail);
    if (!price) return { ok: false, error: "Payment pricing is not configured." };
    return {
      ok: true,
      purchase: {
        kind,
        rail,
        asset: rail === "ton" ? "TON" : "USDT",
        productRef: "starter-pack-v1",
        amountUnits: price.units,
        amountDisplay: paymentAmountToDisplay(price.numeric),
        title: "Starter Pack",
        reward: {
          gold: STARTER_PACK_GOLD,
          items: STARTER_PACK_ITEMS,
          worldBossTickets: WORLD_BOSS_STARTER_TICKETS,
        },
      },
    };
  }

  if (kind === "premium_buy") {
    const plan = getPremiumPlan(body.planId, body.days);
    if (!plan) return { ok: false, error: "Invalid Premium plan." };
    const price = getTelegramTonPrice(kind, plan.id, rail);
    if (!price) return { ok: false, error: "Payment pricing is not configured." };
    return {
      ok: true,
      purchase: {
        kind,
        rail,
        asset: rail === "ton" ? "TON" : "USDT",
        productRef: plan.id,
        amountUnits: price.units,
        amountDisplay: paymentAmountToDisplay(price.numeric),
        title: `Premium ${plan.days}d`,
        reward: { planId: plan.id, days: plan.days },
      },
    };
  }


  if (kind === "miner_buy") {
    const miner = getMinerDefinition(body.minerId);
    if (!miner) return { ok: false, error: "Invalid miner." };
    const price = getTelegramTonPrice(kind, miner.id, rail);
    if (!price) return { ok: false, error: "Payment pricing is not configured." };
    return {
      ok: true,
      purchase: {
        kind,
        rail,
        asset: rail === "ton" ? "TON" : "USDT",
        productRef: miner.id,
        amountUnits: price.units,
        amountDisplay: paymentAmountToDisplay(price.numeric),
        title: miner.title,
        reward: { minerId: miner.id },
      },
    };
  }

  const spins = asInt(body.spins, 0);
  if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) {
    return { ok: false, error: "Invalid fortune spin pack." };
  }
  const price = getTelegramTonPrice(kind, String(spins), rail);
  if (!price) return { ok: false, error: "Payment pricing is not configured." };
  return {
    ok: true,
    purchase: {
      kind,
      rail,
      asset: rail === "ton" ? "TON" : "USDT",
      productRef: String(spins),
      amountUnits: price.units,
      amountDisplay: paymentAmountToDisplay(price.numeric),
      title: `${spins} Fortune Spin${spins === 1 ? "" : "s"}`,
      reward: { spins },
    },
  };
};

const normalizeTelegramTonOrder = (
  rowRaw: unknown,
  txRequest?: { validUntil: number; messages: TelegramTonTxMessage[] } | null,
): TelegramTonOrderPublic | null => {
  if (!rowRaw || typeof rowRaw !== "object" || Array.isArray(rowRaw)) return null;
  const row = rowRaw as Record<string, unknown>;
  const kind = String(row.kind ?? "").trim();
  const rail = String(row.rail ?? "").trim();
  const asset = String(row.asset ?? "").trim();
  const statusRaw = String(row.status ?? "").trim();
  if (!isTelegramStarsOrderKind(kind)) return null;
  if (!isTelegramTonRail(rail)) return null;
  if (asset !== "TON" && asset !== "USDT") return null;
  if (!isTelegramTonOrderStatus(statusRaw)) return null;

  return {
    id: String(row.id ?? ""),
    kind,
    productRef: String(row.product_ref ?? ""),
    rail,
    asset: asset as TelegramTonAsset,
    amountUnits: Math.max(0, asInt(row.amount_units, 0)),
    amountDisplay: String(row.amount_display ?? ""),
    payerAddress: String(row.payer_address ?? ""),
    status: statusRaw,
    txRequest: txRequest ?? { validUntil: 0, messages: [] },
    createdAt: String(row.created_at ?? ""),
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
  };
};

const isMatchingTxHash = (value: unknown, targetHex: string, targetBase64: string) => {
  const raw = String(value ?? "").trim();
  if (!raw) return false;
  if (targetHex && normalizeTxHashHex(raw) === targetHex) return true;
  if (targetBase64 && normalizeTxHashBase64(raw) === targetBase64) return true;
  return false;
};
const createTelegramStarsInvoiceLink = async (
  botToken: string,
  payload: {
    title: string;
    description: string;
    invoicePayload: string;
    starsAmount: number;
  },
) => {
  const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title.slice(0, 32),
        description: payload.description.slice(0, 255),
        payload: payload.invoicePayload,
        currency: "XTR",
        prices: [{ label: payload.title.slice(0, 32), amount: Math.max(1, Math.floor(payload.starsAmount)) }],
      }),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsed: Record<string, unknown> | null = null;
    try {
      parsed = rawText ? JSON.parse(rawText) as Record<string, unknown> : null;
    } catch {
      parsed = null;
    }

    const ok = Boolean(parsed?.ok);
    const result = String(parsed?.result ?? "").trim();
    if (response.ok && ok && result) {
      return { ok: true as const, invoiceLink: result };
    }

    const desc = String(parsed?.description ?? "").trim();
    const message = desc || rawText || `${response.status} ${response.statusText}`;
    return { ok: false as const, error: `Telegram invoice error: ${message}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: `Telegram invoice request failed: ${message}` };
  } finally {
    clearTimeout(timeoutId);
  }
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

const wasMinerTxAlreadyProcessed = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  txSignature: string,
) => wasTxAlreadyProcessed(supabase, wallet, ["miner_buy"], txSignature);

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

const verifyMinerPaymentTx = async (
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
    "Payment transfer mismatch for selected miner lease.",
    now,
  );

const normalizeConsumables = (raw: unknown) => {
  if (!Array.isArray(raw)) return { rows: [] as ConsumableRow[], maxId: 0 };

  const rows: ConsumableRow[] = [];
  const seenIds = new Set<number>();
  let maxId = 0;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const id = Math.max(1, asInt(row.id, 0));
    const rawType = String(row.type ?? "");
    const typeRaw = rawType === "speed" ? "boss-mark" : rawType === "attack" ? "crystal-flask" : rawType;
    if (!id || seenIds.has(id) || !isConsumableType(typeRaw)) continue;
    const def = CONSUMABLE_DEFS[typeRaw];
    seenIds.add(id);
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

const getXpForLevel = (levelRaw: number) => {
  const level = Math.max(1, Math.floor(levelRaw));
  return Math.round((XP_BASE + XP_SCALE * Math.pow(level, XP_POWER)) * XP_LEVEL_REQUIREMENT_MULTIPLIER);
};

const emptyEquipmentStats = (): EquipmentStats => ({ power: 0, fortune: 0, prosperity: 0 });

const getCharacterClassStats = (classIdRaw: unknown) => {
  const classId = normalizeCharacterClassId(classIdRaw) as keyof typeof CHARACTER_CLASS_STATS;
  return classId && classId in CHARACTER_CLASS_STATS
    ? { classId, stats: CHARACTER_CLASS_STATS[classId] }
    : null;
};

const computeItemTierScore = (level: number, rarity: (typeof EQUIPMENT_RARITIES)[number]) => {
  const rarityMultiplier = 1 + (rarity.tier - 1) * 0.07;
  const levelMultiplier = 1 + (level - 1) * 0.004;
  const levelLinear = ITEM_TIER_SCORE_BASE + ITEM_TIER_SCORE_PER_LEVEL * (level - 1);
  return Math.round(levelLinear * levelMultiplier * rarityMultiplier);
};

const computeSellValue = (level: number, rarity: (typeof EQUIPMENT_RARITIES)[number]) => {
  const levelMultiplier = 1 + (level - 1) * 0.003;
  const levelBonus = (level - 1) * 0.25;
  return Math.round((rarity.sellValue * levelMultiplier + levelBonus) * 0.6);
};

const getEquipmentStatScale = (level: number) => 1 + Math.max(0, level - 1) * 0.035;
const getEquipmentVarianceMultiplier = (roll: number) => 0.92 + Math.min(1, Math.max(0, roll)) * 0.16;

const buildEquipmentStats = (
  slot: EquipmentSlot,
  rarity: (typeof EQUIPMENT_RARITIES)[number],
  level: number,
  rolls: Partial<Record<EquipmentStatKey, number>> = {},
): EquipmentStats => {
  const template = EQUIPMENT_STAT_TEMPLATES[slot];
  const levelScale = getEquipmentStatScale(level);
  return {
    power: Math.round(template.power * rarity.power * levelScale * getEquipmentVarianceMultiplier(rolls.power ?? 0.5)),
    fortune: Math.round(template.fortune * rarity.power * levelScale * getEquipmentVarianceMultiplier(rolls.fortune ?? 0.5)),
    prosperity: Math.round(template.prosperity * rarity.power * levelScale * getEquipmentVarianceMultiplier(rolls.prosperity ?? 0.5)),
  };
};

const getAllowedEffectKinds = (slot: EquipmentSlot, rarityTier: number) => {
  if (rarityTier < 3) return [] as EquipmentEffectKind[];
  return SLOT_EFFECT_POOLS[slot] ?? [];
};

const getEffectBaseValue = (kind: EquipmentEffectKind, rarityTier: number, level: number) => {
  if (kind === "boss-damage") {
    return Math.min(EQUIPMENT_EFFECT_CAPS[kind], 0.018 + Math.max(0, rarityTier - 3) * 0.012 + level * 0.0001);
  }
  if (kind === "village-gold") {
    return Math.min(EQUIPMENT_EFFECT_CAPS[kind], 0.015 + Math.max(0, rarityTier - 3) * 0.01 + level * 0.00008);
  }
  return Math.min(EQUIPMENT_EFFECT_CAPS[kind], 0.025 + Math.max(0, rarityTier - 3) * 0.016 + level * 0.00012);
};

const buildEquipmentEffect = (
  slot: EquipmentSlot,
  rarity: (typeof EQUIPMENT_RARITIES)[number],
  level: number,
  roll = 0.5,
  forcedKind?: EquipmentEffectKind,
): EquipmentEffectState | null => {
  const allowedKinds = getAllowedEffectKinds(slot, rarity.tier);
  if (!allowedKinds.length) return null;
  const kind = forcedKind && allowedKinds.includes(forcedKind)
    ? forcedKind
    : allowedKinds[Math.floor(Math.min(0.999, Math.max(0, roll)) * allowedKinds.length)];
  const base = getEffectBaseValue(kind, rarity.tier, level);
  const varied = Math.max(0, Math.min(EQUIPMENT_EFFECT_CAPS[kind], base * (0.92 + Math.min(1, Math.max(0, roll)) * 0.16)));
  return { kind, value: Number(varied.toFixed(3)) };
};

const normalizeEquipmentEffect = (
  slot: EquipmentSlot,
  rarity: (typeof EQUIPMENT_RARITIES)[number],
  level: number,
  raw: unknown,
) => {
  if (raw == null) return null;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const kind = String(source.kind ?? "") as EquipmentEffectKind;
  const allowedKinds = getAllowedEffectKinds(slot, rarity.tier);
  if (!allowedKinds.includes(kind)) return null;
  const value = Number(source.value ?? 0);
  if (!Number.isFinite(value)) return null;
  const min = Number((getEffectBaseValue(kind, rarity.tier, level) * 0.92).toFixed(3));
  const max = Number((Math.min(EQUIPMENT_EFFECT_CAPS[kind], getEffectBaseValue(kind, rarity.tier, level) * 1.08)).toFixed(3));
  const rounded = Number(value.toFixed(3));
  if (rounded < min || rounded > max) return null;
  return { kind, value: rounded };
};

const normalizeEquipmentBonuses = (
  slot: EquipmentSlot,
  rarity: (typeof EQUIPMENT_RARITIES)[number],
  level: number,
  raw: unknown,
) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const legacyShape = ["attack", "speed", "attackSpeed", "range"].some((key) => key in source);
  if (legacyShape && !(["power", "fortune", "prosperity"].some((key) => key in source))) {
    return buildEquipmentStats(slot, rarity, level);
  }
  const result = emptyEquipmentStats();
  for (const key of ["power", "fortune", "prosperity"] as EquipmentStatKey[]) {
    const provided = asInt(source[key], 0);
    if (!Number.isFinite(provided)) return null;
    const template = buildEquipmentStats(slot, rarity, level, { [key]: 0.5 } as Partial<Record<EquipmentStatKey, number>>)[key];
    const min = Math.max(0, Math.floor(template * 0.92));
    const max = Math.max(0, Math.ceil(template * 1.08));
    if (provided < min || provided > max) return null;
    result[key] = provided;
  }
  return result;
};

const normalizeEquipmentItem = (
  raw: unknown,
  playerLevelRaw: number,
  expectedSlot?: EquipmentSlot,
) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const id = Math.max(1, asInt(item.id, 0));
  const slot = String(item.slot ?? "") as EquipmentSlot;
  if (!id || !EQUIPMENT_SLOT_IDS.includes(slot)) return null;
  if (expectedSlot && slot !== expectedSlot) return null;

  const level = Math.max(1, asInt(item.level, 0));
  const playerLevel = Math.max(1, Math.floor(playerLevelRaw));
  if (level > playerLevel) return null;

  const rarity = EQUIPMENT_RARITIES.find((entry) => entry.name === String(item.rarity ?? ""));
  if (!rarity) return null;
  if (String(item.color ?? "") != rarity.color) return null;

  const name = String(item.name ?? "").trim();
  const validName = EQUIPMENT_PREFIXES.some((prefix) =>
    EQUIPMENT_BASE_NAMES[slot].some((baseName) => name === `${prefix} ${baseName}`)
  );
  if (!validName) return null;

  const bonuses = normalizeEquipmentBonuses(slot, rarity, level, item.bonuses);
  if (!bonuses) return null;

  const legacyShape = item.bonuses && typeof item.bonuses === "object" && !Array.isArray(item.bonuses)
    ? ["attack", "speed", "attackSpeed", "range"].some((key) => key in (item.bonuses as Record<string, unknown>))
    : false;
  const effect = legacyShape ? null : normalizeEquipmentEffect(slot, rarity, level, item.effect ?? null);
  if (!legacyShape && item.effect != null && !effect) return null;

  const tierScore = Math.max(0, asInt(item.tierScore, 0));
  if (tierScore !== computeItemTierScore(level, rarity)) return null;

  const sellValue = Math.max(0, asInt(item.sellValue, 0));
  if (sellValue !== computeSellValue(level, rarity)) return null;

  return {
    id,
    name,
    slot,
    level,
    rarity: rarity.name,
    color: rarity.color,
    bonuses,
    effect,
    tierScore,
    sellValue,
  };
};

const normalizeInventory = (raw: unknown, playerLevel: number) => {
  if (!Array.isArray(raw)) return [];
  const rows: ReturnType<typeof normalizeEquipmentItem>[] = [];
  const seenIds = new Set<number>();
  for (const entry of raw) {
    if (rows.length >= INVENTORY_ITEM_CAP) break;
    const normalized = normalizeEquipmentItem(entry, playerLevel);
    if (!normalized || seenIds.has(normalized.id)) continue;
    seenIds.add(normalized.id);
    rows.push(normalized);
  }
  return rows.filter(Boolean) as NonNullable<ReturnType<typeof normalizeEquipmentItem>>[];
};

const normalizeEquipment = (raw: unknown, playerLevel: number, usedIds: Set<number>) => {
  const normalized = Object.fromEntries(EQUIPMENT_SLOT_IDS.map((slot) => [slot, null])) as Record<EquipmentSlot, ReturnType<typeof normalizeEquipmentItem>>;
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const item = normalizeEquipmentItem(source[slot], playerLevel, slot);
    if (!item || usedIds.has(item.id)) continue;
    usedIds.add(item.id);
    normalized[slot] = item;
  }
  return normalized as Record<EquipmentSlot, NonNullable<ReturnType<typeof normalizeEquipmentItem>> | null>;
};

const createStarterProfileState = (seed: Record<string, unknown>, nowMs: number) => {
  const classInfo = getCharacterClassStats(seed.classId) ?? { classId: "knight" as const, stats: CHARACTER_CLASS_STATS.knight };
  return {
    version: Math.max(1, asInt(seed.version, 1)),
    name: sanitizeName(seed.name),
    classId: classInfo.classId,
    player: {
      level: 1,
      xp: 0,
      xpNext: getXpForLevel(1),
      baseAttack: classInfo.stats.attack,
      baseAttackSpeed: classInfo.stats.attackSpeed,
      baseSpeed: classInfo.stats.speed,
      baseRange: classInfo.stats.range,
    },
    energy: ENERGY_MAX,
    energyMax: ENERGY_MAX,
    energyTimer: ENERGY_REGEN_SECONDS,
    energyUpdatedAt: nowMs,
    gold: 0,
    payoutWallet: "",
    crystals: 0,
    crystalsEarned: 0,
    tickets: DUNGEON_DAILY_TICKETS,
    ticketDay: todayKeyUtc(new Date(nowMs)),
    inventory: [],
    equipment: Object.fromEntries(EQUIPMENT_SLOT_IDS.map((slot) => [slot, null])) as Record<EquipmentSlot, null>,
    consumables: [],
    questStates: {},
    monsterKills: 0,
    dungeonRuns: 0,
    starterPackPurchased: false,
    premiumEndsAt: 0,
    premiumClaimDay: "",
    worldBossTickets: 0,
    bossMarkCycleStart: "",
    crystalFlaskRuns: 0,
    village: createVillageState(nowMs),
    stake: [],
    stakeId: 0,
    consumableId: 0,
  } as Record<string, unknown>;
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

const removeConsumableFromState = (
  state: Record<string, unknown>,
  type: ConsumableType,
  consumableId?: number | null,
) => {
  const normalized = normalizeConsumables(state.consumables);
  let removed = false;
  const nextRows = normalized.rows.filter((entry) => {
    if (removed || entry.type != type) return true;
    if (consumableId && entry.id != consumableId) return true;
    removed = true;
    return false;
  });
  if (!removed) return false;
  state.consumables = nextRows;
  state.consumableId = Math.max(asInt(state.consumableId, 0), normalized.maxId);
  return true;
};
const normalizeMinerCarry = (value: unknown) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric)
    ? Math.max(0, Math.min(numeric, 0.999999))
    : 0;
};

const normalizeMinerLeases = (raw: unknown, nowMs = Date.now()): MinerLeaseState[] => {
  if (!Array.isArray(raw)) return [];
  const usedIds = new Set<number>();
  return raw
    .map((entry) => {
      const row = entry && typeof entry === "object" ? entry as Record<string, unknown> : null;
      if (!row) return null;
      const miner = getMinerDefinition(row.minerId);
      if (!miner) return null;
      const id = Math.max(1, asInt(row.id, 0));
      if (!id || usedIds.has(id)) return null;
      const startedAt = Math.max(0, asInt(row.startedAt, 0));
      const endsAt = Math.max(startedAt, asInt(row.endsAt, startedAt));
      const claimedAt = Math.max(startedAt, Math.min(endsAt, asInt(row.claimedAt, startedAt)));
      usedIds.add(id);
      return { id, minerId: miner.id as MinerId, startedAt, endsAt, claimedAt };
    })
    .filter((entry): entry is MinerLeaseState => Boolean(entry))
    .filter((entry) => entry.endsAt > nowMs || entry.claimedAt < entry.endsAt)
    .sort((a, b) => a.endsAt - b.endsAt || a.id - b.id);
};

const getMinerLeaseState = (state: Record<string, unknown>, nowMs = Date.now()) => {
  const leases = normalizeMinerLeases(state.miners, nowMs);
  const leaseId = Math.max(asInt(state.minerLeaseId, 0), ...leases.map((entry) => entry.id), 0);
  const carryCrystals = normalizeMinerCarry(state.minerCarryCrystals);
  let exactCrystals = carryCrystals;
  let activeCount = 0;
  let totalPerDay = 0;
  for (const lease of leases) {
    const miner = getMinerDefinition(lease.minerId);
    if (!miner) continue;
    if (lease.endsAt > nowMs) {
      activeCount += 1;
      totalPerDay += miner.crystalsPerDay;
    }
    const claimStart = Math.max(lease.startedAt, Math.min(lease.endsAt, lease.claimedAt));
    const claimEnd = Math.max(lease.startedAt, Math.min(lease.endsAt, nowMs));
    if (claimEnd <= claimStart) continue;
    exactCrystals += (miner.crystalsPerDay * (claimEnd - claimStart)) / MINER_DAY_MS;
  }
  const claimableCrystals = Math.max(0, Math.floor(exactCrystals));
  return {
    leases,
    leaseId,
    carryCrystals,
    exactCrystals,
    claimableCrystals,
    activeCount,
    totalPerDay,
  };
};

const addMinerLeaseToState = (state: Record<string, unknown>, minerId: MinerId, nowMs = Date.now()) => {
  const miner = getMinerDefinition(minerId);
  if (!miner) throw new Error("Invalid miner.");
  const current = getMinerLeaseState(state, nowMs);
  const nextId = Math.max(0, current.leaseId) + 1;
  state.miners = [
    ...current.leases,
    {
      id: nextId,
      minerId: miner.id as MinerId,
      startedAt: nowMs,
      endsAt: nowMs + MINER_LEASE_DURATION_MS,
      claimedAt: nowMs,
    },
  ];
  state.minerLeaseId = nextId;
  state.minerCarryCrystals = current.carryCrystals;
};

const claimMinerRewardsOnState = (state: Record<string, unknown>, nowMs = Date.now()) => {
  const current = getMinerLeaseState(state, nowMs);
  const claimed = current.claimableCrystals;
  const nextCarry = Math.max(0, current.exactCrystals - claimed);
  const nextLeases = current.leases
    .map((lease) => ({ ...lease, claimedAt: Math.max(lease.startedAt, Math.min(lease.endsAt, nowMs)) }))
    .filter((lease) => lease.endsAt > nowMs || lease.claimedAt < lease.endsAt);
  state.miners = nextLeases;
  state.minerLeaseId = Math.max(asInt(state.minerLeaseId, 0), ...nextLeases.map((entry) => entry.id), current.leaseId, 0);
  state.minerCarryCrystals = nextCarry;
  if (claimed > 0) {
    state.crystals = Math.max(0, asInt(state.crystals, 0)) + claimed;
    state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0)) + claimed;
  }
  return claimed;
};

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

const getTierScoreFromState = (state: Record<string, unknown>) => {
  const equipment = state.equipment as Record<string, unknown> | undefined;
  if (!equipment || typeof equipment !== "object" || Array.isArray(equipment)) return 0;
  let total = 0;
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const item = equipment[slot];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    total += Math.max(0, Math.round(asInt((item as Record<string, unknown>).tierScore, 0) * ITEM_TIER_SCORE_MULTIPLIER));
  }
  return total;
};

const getQuestProgressFromState = (state: Record<string, unknown>, quest: QuestDefinition) => {
  const player = (state.player as Record<string, unknown> | undefined) ?? {};
  switch (quest.type) {
    case "level":
      return Math.max(0, asInt(player.level, 0));
    case "kills":
      return Math.max(0, asInt(state.monsterKills, 0));
    case "tier":
      return getTierScoreFromState(state);
    case "dungeons":
      return Math.max(0, asInt(state.dungeonRuns, 0));
    default:
      return 0;
  }
};

const normalizeQuestStates = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, { claimed: boolean }>;
  const source = value as Record<string, unknown>;
  const result: Record<string, { claimed: boolean }> = {};
  for (const quest of QUEST_DEFINITIONS) {
    const row = source[quest.id];
    if (row && typeof row === "object" && !Array.isArray(row)) {
      result[quest.id] = { claimed: Boolean((row as Record<string, unknown>).claimed) };
    } else {
      result[quest.id] = { claimed: false };
    }
  }
  return result;
};

const normalizeState = (raw: unknown) => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const state = structuredClone(raw) as Record<string, unknown>;
  const classInfo = getCharacterClassStats(state.classId);
  if (!classInfo) return null;

  const playerRaw = (state.player as Record<string, unknown> | undefined) ?? {};
  const playerLevel = clampInt(playerRaw.level, 1, MAX_LEVEL);
  const player = {
    ...playerRaw,
    level: playerLevel,
    xp: Math.max(0, asInt(playerRaw.xp, 0)),
    xpNext: Math.max(getXpForLevel(playerLevel), asInt(playerRaw.xpNext, getXpForLevel(playerLevel))),
    baseAttack: classInfo.stats.attack,
    baseAttackSpeed: classInfo.stats.attackSpeed,
    baseSpeed: classInfo.stats.speed,
    baseRange: classInfo.stats.range,
  };
  state.classId = classInfo.classId;
  state.player = player;
  state.name = sanitizeName(state.name);
  state.gold = Math.max(0, asInt(state.gold, 0));
  state.payoutWallet = sanitizePayoutWallet(state.payoutWallet);
  state.crystals = Math.max(0, asInt(state.crystals, 0));
  state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned ?? state.crystals, 0));
  state.monsterKills = Math.max(0, asInt(state.monsterKills, 0));
  state.dungeonRuns = Math.max(0, asInt(state.dungeonRuns, 0));
  state.energy = Math.max(0, asInt(state.energy, 0));
  state.energyMax = Math.max(1, asInt(state.energyMax, ENERGY_MAX));
  state.energyTimer = clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS);
  state.energyUpdatedAt = Math.max(0, asInt(state.energyUpdatedAt, 0));
  if (state.energy >= state.energyMax) {
    state.energy = state.energyMax;
    state.energyTimer = ENERGY_REGEN_SECONDS;
  }
  state.tickets = clampInt(state.tickets, 0, 30);
  state.worldBossTickets = Math.max(0, asInt(state.worldBossTickets, 0));
  state.starterPackPurchased = Boolean(state.starterPackPurchased);
  state.premiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
  state.premiumClaimDay = String(state.premiumClaimDay ?? "").slice(0, 10);
  state.bossMarkCycleStart = String(state.bossMarkCycleStart ?? "").slice(0, 40);
  state.crystalFlaskRuns = clampInt(state.crystalFlaskRuns, 0, 12);
  state.village = normalizeVillageState(state.village, Date.now());

  const inventory = normalizeInventory(state.inventory, playerLevel);
  const usedEquipmentIds = new Set<number>(inventory.map((item) => item.id));
  state.inventory = inventory;
  state.equipment = normalizeEquipment(state.equipment, playerLevel, usedEquipmentIds);
  const pendingLoot = normalizeEquipmentItem(state.pendingLoot, playerLevel);
  state.pendingLoot = pendingLoot && !usedEquipmentIds.has(pendingLoot.id) ? pendingLoot : null;

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

const normalizeSeason = (row: Record<string, unknown> | SeasonRow | null) => {
  if (!row || typeof row !== "object") return null;
  const season = row as Record<string, unknown>;
  const id = String(season.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    name: String(season.name ?? "Season").trim() || "Season",
    startAt: String(season.start_at ?? ""),
    endAt: String(season.end_at ?? ""),
    poolUsdt: Math.max(0, Number(season.pool_usdt ?? 0)),
    status: String(season.status ?? "active"),
    closedAt: season.closed_at ? String(season.closed_at) : "",
  };
};

const getActiveSeason = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
    .eq("status", "active")
    .order("start_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false as const, error: "Failed to load active season." };
  return { ok: true as const, season: normalizeSeason((data as Record<string, unknown> | null) ?? null) };
};

const getLatestClosedSeason = async (supabase: ReturnType<typeof createClient>) => {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false as const, error: "Failed to load season history." };
  return { ok: true as const, season: normalizeSeason((data as Record<string, unknown> | null) ?? null) };
};

const SEASON_PROFILE_BATCH_SIZE = 1000;

const loadSeasonProfileRows = async (supabase: ReturnType<typeof createClient>) => {
  const rows: Array<Record<string, unknown>> = [];

  for (let offset = 0; offset < 1_000_000; offset += SEASON_PROFILE_BATCH_SIZE) {
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet, state, updated_at")
      .order("wallet", { ascending: true })
      .range(offset, offset + SEASON_PROFILE_BATCH_SIZE - 1);

    if (error) {
      return { ok: false as const, error: "Failed to load season profiles." };
    }

    const batch = ((data as Array<Record<string, unknown>> | null) ?? []);
    rows.push(...batch);

    if (batch.length < SEASON_PROFILE_BATCH_SIZE) {
      return { ok: true as const, rows };
    }
  }

  return { ok: false as const, error: "Season profile pagination exceeded the safety limit." };
};

const buildSeasonComputedRows = (
  profileRows: Array<Record<string, unknown>>,
  poolUsdt: number,
  nowMs: number,
  minCrystals = 0,
) => {
  const rows: SeasonComputedRow[] = profileRows
    .map((row) => {
      const wallet = String(row.wallet ?? "").trim();
      const state = normalizeState(row.state ?? null);
      if (!wallet || !state) return null;
      const crystalsSnapshot = Math.max(0, asInt(state.crystals, 0));
      if (crystalsSnapshot < minCrystals) return null;
      const premiumActive = Math.max(0, asInt(state.premiumEndsAt, 0)) > nowMs;
      const effectiveCrystals = Number((crystalsSnapshot * (premiumActive ? 1.5 : 1)).toFixed(3));
      return {
        wallet,
        name: sanitizeName(state.name) || "Unknown",
        crystalsSnapshot,
        premiumActive,
        effectiveCrystals,
        share: 0,
        payoutUsdt: 0,
        updatedAt: String(row.updated_at ?? ""),
      };
    })
    .filter((row): row is SeasonComputedRow => Boolean(row));

  rows.sort((a, b) =>
    b.crystalsSnapshot - a.crystalsSnapshot ||
    Number(b.premiumActive) - Number(a.premiumActive) ||
    b.effectiveCrystals - a.effectiveCrystals ||
    a.wallet.localeCompare(b.wallet)
  );

  const totalCrystals = rows.reduce((sum, row) => sum + row.crystalsSnapshot, 0);
  const totalEffectiveCrystals = rows.reduce((sum, row) => sum + row.effectiveCrystals, 0);
  const safePoolUsdt = Math.max(0, Number.isFinite(poolUsdt) ? poolUsdt : 0);

  const computedRows = rows.map((row) => {
    const share = totalEffectiveCrystals > 0 ? row.effectiveCrystals / totalEffectiveCrystals : 0;
    return {
      ...row,
      share,
      payoutUsdt: Number((safePoolUsdt * share).toFixed(9)),
    };
  });

  return {
    rows: computedRows,
    totalPlayers: computedRows.length,
    totalCrystals,
    totalEffectiveCrystals: Number(totalEffectiveCrystals.toFixed(3)),
  };
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
    if (next.level !== 1) return "Initial profile level must start at 1.";
    if (next.xp !== 0) return "Initial XP must start at 0.";
    if (next.crystals !== 0 || next.crystalsEarned !== 0) return "Initial crystals must start at 0.";
    if (next.gold !== 0) return "Initial gold must start at 0.";
    if (next.monsterKills !== 0 || next.dungeonRuns !== 0) return "Initial progress must start at 0.";
    if (nextPremiumEndsAt > 0) return "Initial premium must start inactive.";
    if (String(nextState.bossMarkCycleStart ?? "")) return "Initial Boss Mark must start inactive.";
    if (Math.max(0, asInt(nextState.crystalFlaskRuns, 0)) > 0) return "Initial Crystal Flask must start inactive.";
    if (nextStake.total > 0) return "Initial stake balance must start at 0.";
    if (Array.isArray(nextState.inventory) && nextState.inventory.length > 0) return "Initial inventory must start empty.";
    if (Array.isArray(nextState.consumables) && nextState.consumables.length > 0) return "Initial consumables must start empty.";
    const equipment = nextState.equipment as Record<string, unknown> | undefined;
    if (equipment && Object.values(equipment).some((entry) => entry)) return "Initial equipment must start empty.";
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
  const maxCrystalPerDungeonRun = 180;
  const stakeAllowance = Math.floor(stakeDecrease * (1 + STAKE_BONUS_RATE));
  const maxCrystalGain = dungeonDelta * maxCrystalPerDungeonRun + stakeAllowance;
  if (crystalGain > maxCrystalGain) return "Suspicious crystal gain detected.";

  // Gold in profile_save should mostly come from battle kills and modest item sells between autosaves.
  // Large grants (shop, quests, premium, village, referrals, fortune, world boss) are server-side actions.
  const maxGoldGain = Math.floor(safeElapsed / 60) * 15000 + killsDelta * 150 + dungeonDelta * 20000 + 4000;
  if (goldDelta > maxGoldGain) return "Suspicious gold gain detected.";

  const prevKeyItems = countConsumablesByType(prevState, "key");
  const nextKeyItems = countConsumablesByType(nextState, "key");
  if (nextKeyItems > prevKeyItems) {
    return "Dungeon key items can only be granted by secure server actions.";
  }
  const prevBossMarks = countConsumablesByType(prevState, "boss-mark");
  const nextBossMarks = countConsumablesByType(nextState, "boss-mark");
  if (nextBossMarks > prevBossMarks) {
    return "Boss Marks can only be granted by secure server actions.";
  }
  const prevCrystalFlasks = countConsumablesByType(prevState, "crystal-flask");
  const nextCrystalFlasks = countConsumablesByType(nextState, "crystal-flask");
  if (nextCrystalFlasks > prevCrystalFlasks) {
    return "Crystal Flasks can only be granted by secure server actions.";
  }
  if (String(nextState.bossMarkCycleStart ?? "") !== String(prevState.bossMarkCycleStart ?? "")) {
    return "Boss Mark state can only change through secure server actions.";
  }
  if (Math.max(0, asInt(nextState.crystalFlaskRuns, 0)) > Math.max(0, asInt(prevState.crystalFlaskRuns, 0))) {
    return "Crystal Flask state can only change through secure server actions.";
  }

  if (next.level === MAX_LEVEL && next.monsterKills < 20000 && next.dungeonRuns < 150) {
    return "Max level reached too early.";
  }
  const crossedCrystalBalanceCap = prev.crystals <= 70000 && next.crystals > 70000;
  if (crossedCrystalBalanceCap && next.dungeonRuns < 20) {
    return "Crystal balance is too high for current progress.";
  }
  const crossedGoldBalanceCap = prev.gold <= 1000000 && next.gold > 1000000;
  if (crossedGoldBalanceCap && next.monsterKills < 5000) {
    return "Gold balance is too high for current progress.";
  }

  return null;
};

const applyOfflineEnergyRegen = (
  state: Record<string, unknown>,
  elapsedSecRaw: number,
  nowMsRaw?: number,
) => {
  const energyMax = Math.max(1, asInt(state.energyMax, 50));
  let energy = clampInt(state.energy, 0, energyMax);
  let timer = clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS);
  const elapsedSec = Math.max(0, Math.floor(elapsedSecRaw));
  const nowMs = Number.isFinite(nowMsRaw ?? Number.NaN)
    ? Math.max(0, Math.floor(Number(nowMsRaw)))
    : Date.now();

  const prevEnergy = energy;
  const prevTimer = timer;
  const prevEnergyUpdatedAt = Math.max(0, asInt(state.energyUpdatedAt, 0));

  if (energy >= energyMax) {
    state.energy = energyMax;
    state.energyTimer = ENERGY_REGEN_SECONDS;
    state.energyUpdatedAt = prevEnergyUpdatedAt > 0 ? prevEnergyUpdatedAt : nowMs;
    return prevEnergy !== energyMax || prevTimer !== ENERGY_REGEN_SECONDS || prevEnergyUpdatedAt <= 0;
  }
  if (elapsedSec <= 0) {
    state.energy = energy;
    state.energyTimer = timer;
    state.energyUpdatedAt = prevEnergyUpdatedAt;
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
  state.energyUpdatedAt = nowMs;
  return prevEnergy !== asInt(state.energy, 0) ||
    prevTimer !== asInt(state.energyTimer, ENERGY_REGEN_SECONDS) ||
    prevEnergyUpdatedAt !== nowMs;
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
    if (Math.max(0, asInt(existingRow.prize_pool, 0)) !== WORLD_BOSS_PRIZE_POOL) {
      const { data: patched } = await supabase
        .from("world_boss")
        .update({
          prize_pool: WORLD_BOSS_PRIZE_POOL,
          updated_at: now.toISOString(),
        })
        .eq("id", 1)
        .eq("cycle_start", existingRow.cycle_start)
        .eq("cycle_end", existingRow.cycle_end)
        .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
        .maybeSingle();
      if (patched) return patched as WorldBossRow;
    }
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

const getEquipmentStatBonusFromState = (
  state: Record<string, unknown>,
  key: EquipmentStatKey,
) => {
  const equipment = state.equipment as Record<string, unknown> | undefined;
  if (!equipment || typeof equipment !== "object" || Array.isArray(equipment)) return 0;
  let total = 0;
  for (const item of Object.values(equipment)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const bonuses = (item as Record<string, unknown>).bonuses;
    if (!bonuses || typeof bonuses !== "object" || Array.isArray(bonuses)) continue;
    const value = Number((bonuses as Record<string, unknown>)[key] ?? 0);
    if (Number.isFinite(value) && value > 0) total += value;
  }
  return Math.max(0, Math.round(total));
};

const getEquipmentEffectBonusFromState = (
  state: Record<string, unknown>,
  kind: EquipmentEffectKind,
) => {
  const equipment = state.equipment as Record<string, unknown> | undefined;
  if (!equipment || typeof equipment !== "object" || Array.isArray(equipment)) return 0;
  let total = 0;
  for (const item of Object.values(equipment)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const effect = (item as Record<string, unknown>).effect;
    if (!effect || typeof effect !== "object" || Array.isArray(effect)) continue;
    const effectRow = effect as Record<string, unknown>;
    if (String(effectRow.kind ?? "") !== kind) continue;
    const value = Number(effectRow.value ?? 0);
    if (Number.isFinite(value) && value > 0) {
      total += value;
    }
  }
  return Math.min(EQUIPMENT_EFFECT_CAPS[kind], Number(total.toFixed(3)));
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
      const power = Number((bonuses as Record<string, unknown>).power ?? 0);
      if (Number.isFinite(power) && power > 0) {
        bonusAttack += power;
      }
    }
  }

  return Math.max(1, Math.round(baseAttack + bonusAttack));
};

const loadWorldBossCombatProfile = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("state")
    .eq("wallet", wallet)
    .maybeSingle();

  if (error || !data || !data.state || typeof data.state !== "object") {
    return { attack: 1, multiplier: 1 };
  }

  const state = normalizeState(data.state as unknown);
  if (!state) return { attack: 1, multiplier: 1 };
  const effectBonus = getEquipmentEffectBonusFromState(state, "boss-damage");
  const bossMarkActive = String(state.bossMarkCycleStart ?? "");
  return {
    attack: getWorldBossAttackFromState(state),
    multiplier: 1 + effectBonus,
    bossMarkCycleStart: bossMarkActive,
  };
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

    if (profileError) {
      return { ok: false as const, error: String(profileError.message ?? "Failed to load profile.") };
    }
    if (!profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return { ok: false as const, error: "Profile not found." };
    }

    const normalized = normalizeState(profileRow.state);
    if (!normalized) return { ok: false as const, error: "Invalid profile state." };

    const nextState = structuredClone(normalized) as Record<string, unknown>;
    try {
      mutate(nextState);
    } catch (error) {
      return { ok: false as const, error: error instanceof Error ? error.message : String(error) };
    }

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
      await waitMs(90 + Math.floor(Math.random() * 180));
    }
  }
  return { ok: false as const, error: "Profile update conflict, retry." };
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


const getQualifiedReferralCount = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  levelTarget: number,
) => {
  const summary = await getReferrerSummary(supabase, wallet);
  if (!summary.ok) {
    return { ok: false as const, error: "Failed to load referrals." };
  }
  const count = summary.entries.reduce((sum, entry) => {
    const level = Math.max(1, asInt((entry as Record<string, unknown>).level, 1));
    return level >= levelTarget ? sum + 1 : sum;
  }, 0);
  return { ok: true as const, count };
};

const getReferralContestStatus = (nowMs: number): ReferralContestStatus => {
  const startMs = Date.parse(REFERRAL_CONTEST_START_AT);
  const endMs = Date.parse(REFERRAL_CONTEST_END_AT);
  const reviewEndsMs = endMs + (REFERRAL_CONTEST_REVIEW_DELAY_SECONDS * 1000);
  if (nowMs < startMs) return "upcoming";
  if (nowMs <= endMs) return "active";
  if (nowMs <= reviewEndsMs) return "review";
  return "closed";
};

const getReferralContestRemainingSec = (status: ReferralContestStatus, nowMs: number) => {
  const startMs = Date.parse(REFERRAL_CONTEST_START_AT);
  const endMs = Date.parse(REFERRAL_CONTEST_END_AT);
  const reviewEndsMs = endMs + (REFERRAL_CONTEST_REVIEW_DELAY_SECONDS * 1000);
  if (status === "upcoming") return Math.max(0, Math.ceil((startMs - nowMs) / 1000));
  if (status === "active") return Math.max(0, Math.ceil((endMs - nowMs) / 1000));
  if (status === "review") return Math.max(0, Math.ceil((reviewEndsMs - nowMs) / 1000));
  return 0;
};

const shortContestWallet = (wallet: string) =>
  wallet.length > 12 ? wallet.slice(0, 4) + "..." + wallet.slice(-4) : wallet;

const loadProfileStatesByWallet = async (
  supabase: ReturnType<typeof createClient>,
  wallets: string[],
) => {
  const uniqueWallets = [...new Set(wallets.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
  const states = new Map<string, ReturnType<typeof normalizeState>>();
  if (!uniqueWallets.length) return { ok: true as const, states };

  const chunkSize = 250;
  for (let offset = 0; offset < uniqueWallets.length; offset += chunkSize) {
    const chunk = uniqueWallets.slice(offset, offset + chunkSize);
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet, state")
      .in("wallet", chunk);

    if (error) return { ok: false as const, error: "Failed to load referral contest profiles." };

    for (const row of data ?? []) {
      const wallet = String((row as Record<string, unknown>).wallet ?? "").trim();
      if (!wallet) continue;
      const state = normalizeState((row as Record<string, unknown>).state ?? null);
      states.set(wallet, state);
    }
  }

  return { ok: true as const, states };
};

const loadBlockedWalletSet = async (
  supabase: ReturnType<typeof createClient>,
  wallets: string[],
) => {
  const uniqueWallets = [...new Set(wallets.map((entry) => String(entry ?? "").trim()).filter(Boolean))];
  const blocked = new Set<string>();
  if (!uniqueWallets.length) return { ok: true as const, blocked };

  const chunkSize = 500;
  for (let offset = 0; offset < uniqueWallets.length; offset += chunkSize) {
    const chunk = uniqueWallets.slice(offset, offset + chunkSize);
    const { data, error } = await supabase
      .from("blocked_wallets")
      .select("wallet")
      .in("wallet", chunk);

    if (error) return { ok: false as const, error: "Failed to load blocked wallets for referral contest." };

    for (const row of data ?? []) {
      const wallet = String((row as Record<string, unknown>).wallet ?? "").trim();
      if (wallet) blocked.add(wallet);
    }
  }

  return { ok: true as const, blocked };
};

const loadReferralContestRows = async (
  supabase: ReturnType<typeof createClient>,
) => {
  const rows: ReferralContestReferralRow[] = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 100000; offset += pageSize) {
    const { data, error } = await supabase
      .from("referrals")
      .select("referrer_wallet, referee_wallet, created_at")
      .gte("created_at", REFERRAL_CONTEST_START_AT)
      .lte("created_at", REFERRAL_CONTEST_END_AT)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) return { ok: false as const, error: "Failed to load referral contest data." };

    const batch = (data as ReferralContestReferralRow[] | null) ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }

  return { ok: true as const, rows };
};

const buildReferralContestSnapshot = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  nowMs: number,
  limitRaw: unknown,
) => {
  const status = getReferralContestStatus(nowMs);
  const safeLimit = clampInt(limitRaw, 1, REFERRAL_CONTEST_LEADERBOARD_MAX_LIMIT);
  const startMs = Date.parse(REFERRAL_CONTEST_START_AT);
  const endMs = Date.parse(REFERRAL_CONTEST_END_AT);
  const reviewEndsMs = endMs + (REFERRAL_CONTEST_REVIEW_DELAY_SECONDS * 1000);

  const contest: ReferralContestInfoRow = {
    id: REFERRAL_CONTEST_ID,
    name: REFERRAL_CONTEST_NAME,
    status,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(endMs).toISOString(),
    reviewEndsAt: new Date(reviewEndsMs).toISOString(),
    remainingSec: getReferralContestRemainingSec(status, nowMs),
    levelTarget: REFERRAL_CONTEST_LEVEL_TARGET,
    basePoints: REFERRAL_CONTEST_BASE_POINTS,
    premiumPoints: REFERRAL_CONTEST_PREMIUM_POINTS,
    prizes: {
      first: REFERRAL_CONTEST_PRIZE_FIRST,
      second: REFERRAL_CONTEST_PRIZE_SECOND,
      third: REFERRAL_CONTEST_PRIZE_THIRD,
    },
  };

  const referralRowsResult = await loadReferralContestRows(supabase);
  if (!referralRowsResult.ok) return referralRowsResult;

  const referralRows = referralRowsResult.rows;
  if (!referralRows.length) {
    return { ok: true as const, contest, leaderboard: [] as ReferralContestLeaderboardRow[], player: null, totalParticipants: 0 };
  }

  const allWallets = referralRows.flatMap((row) => [String(row.referrer_wallet ?? ""), String(row.referee_wallet ?? "")]);
  const blockedResult = await loadBlockedWalletSet(supabase, allWallets);
  if (!blockedResult.ok) return blockedResult;

  const profileResult = await loadProfileStatesByWallet(supabase, allWallets);
  if (!profileResult.ok) return profileResult;

  const scoreByReferrer = new Map<string, {
    wallet: string;
    name: string;
    points: number;
    qualifiedReferrals: number;
    premiumReferrals: number;
    lastQualifiedAtMs: number;
  }>();

  const evaluationMs = status === "active" ? nowMs : Math.min(nowMs, endMs);

  for (const row of referralRows) {
    const referrerWallet = String(row.referrer_wallet ?? "").trim();
    const refereeWallet = String(row.referee_wallet ?? "").trim();
    if (!referrerWallet || !refereeWallet) continue;
    if (blockedResult.blocked.has(referrerWallet) || blockedResult.blocked.has(refereeWallet)) continue;

    const refereeState = profileResult.states.get(refereeWallet) ?? null;
    const refereePlayer = refereeState?.player && typeof refereeState.player === "object"
      ? refereeState.player as Record<string, unknown>
      : null;
    const level = Math.max(1, asInt(refereePlayer?.level ?? 1, 1));
    if (level < REFERRAL_CONTEST_LEVEL_TARGET) continue;

    const premiumEndsAt = Math.max(0, asInt(refereeState?.premiumEndsAt ?? 0, 0));
    const isPremium = premiumEndsAt > evaluationMs;
    const points = isPremium ? REFERRAL_CONTEST_PREMIUM_POINTS : REFERRAL_CONTEST_BASE_POINTS;

    const referrerState = profileResult.states.get(referrerWallet) ?? null;
    const referrerPlayer = referrerState?.player && typeof referrerState.player === "object"
      ? referrerState.player as Record<string, unknown>
      : null;
    const rawReferrerName = String(referrerPlayer?.name ?? referrerState?.name ?? "").trim();
    const referrerName = rawReferrerName
      ? sanitizeName(rawReferrerName)
      : shortContestWallet(referrerWallet);

    const current = scoreByReferrer.get(referrerWallet) ?? {
      wallet: referrerWallet,
      name: referrerName,
      points: 0,
      qualifiedReferrals: 0,
      premiumReferrals: 0,
      lastQualifiedAtMs: 0,
    };

    current.points += points;
    current.qualifiedReferrals += 1;
    if (isPremium) current.premiumReferrals += 1;

    const qualifiedAtMs = new Date(String(row.created_at ?? "")).getTime();
    if (Number.isFinite(qualifiedAtMs) && qualifiedAtMs > current.lastQualifiedAtMs) {
      current.lastQualifiedAtMs = qualifiedAtMs;
    }

    scoreByReferrer.set(referrerWallet, current);
  }

  const ranked = [...scoreByReferrer.values()]
    .sort((a, b) =>
      (b.points - a.points) ||
      (b.qualifiedReferrals - a.qualifiedReferrals) ||
      (b.premiumReferrals - a.premiumReferrals) ||
      ((a.lastQualifiedAtMs || Number.MAX_SAFE_INTEGER) - (b.lastQualifiedAtMs || Number.MAX_SAFE_INTEGER)) ||
      a.wallet.localeCompare(b.wallet)
    )
    .map((row, index) => ({
      rank: index + 1,
      wallet: row.wallet,
      name: row.name,
      points: row.points,
      qualifiedReferrals: row.qualifiedReferrals,
      premiumReferrals: row.premiumReferrals,
      lastQualifiedAt: row.lastQualifiedAtMs > 0 ? new Date(row.lastQualifiedAtMs).toISOString() : "",
    }));

  const leaderboard = ranked.slice(0, safeLimit);
  const player = ranked.find((entry) => entry.wallet === wallet) ?? null;

  return {
    ok: true as const,
    contest,
    leaderboard,
    player,
    totalParticipants: ranked.length,
  };
};

const loadCrystalTaskProgress = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("security_events")
    .select("kind, details, created_at")
    .eq("wallet", wallet)
    .eq("kind", "crystal_task_claim")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) return { ok: false as const, error: "Failed to load task progress." };

  const progress = Object.fromEntries(
    CRYSTAL_TASK_IDS.map((taskId) => [taskId, { claimCount: 0, lastClaimAt: 0 }]),
  ) as Record<CrystalTaskId, CrystalTaskProgress>;

  for (const row of data ?? []) {
    const details = row.details && typeof row.details === "object" && !Array.isArray(row.details)
      ? row.details as Record<string, unknown>
      : {};
    const taskId = String(details.taskId ?? "").trim();
    if (!CRYSTAL_TASK_IDS.includes(taskId as CrystalTaskId)) continue;

    const typedTaskId = taskId as CrystalTaskId;
    const createdAtMs = new Date(String(row.created_at ?? "")).getTime();
    const current = progress[typedTaskId];
    current.claimCount += 1;
    if (Number.isFinite(createdAtMs) && createdAtMs > current.lastClaimAt) {
      current.lastClaimAt = createdAtMs;
    }
  }

  return { ok: true as const, progress };
};

const isTelegramChannelMember = async (telegramUserId: number) => {
  const botToken = String(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "").trim();
  if (!botToken) return { ok: false as const, error: "Telegram integration is not configured." };
  if (telegramUserId <= 0) return { ok: false as const, error: "Telegram user is not linked." };

  const url = "https://api.telegram.org/bot" + botToken + "/getChatMember";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: "@" + TELEGRAM_CHANNEL_HANDLE,
        user_id: telegramUserId,
      }),
    });
    const payload = await response.json() as {
      ok?: boolean;
      result?: { status?: string };
      description?: string;
    };
    if (!response.ok || !payload.ok) {
      return { ok: false as const, error: payload.description || "Failed to verify Telegram subscription." };
    }
    const status = String(payload.result?.status ?? "").toLowerCase();
    const isMember = status === "creator" || status === "administrator" || status === "member" || status === "restricted";
    return { ok: true as const, isMember };
  } catch {
    return { ok: false as const, error: "Failed to verify Telegram subscription." };
  }
};

const getCrystalTaskReward = (taskId: CrystalTaskId) => {
  switch (taskId) {
    case "join-channel":
      return CRYSTAL_TASK_CHANNEL_REWARD;
    case "follow-x":
      return CRYSTAL_TASK_X_REWARD;
    case "watch-ad":
      return CRYSTAL_TASK_AD_REWARD;
    case "referrals-5":
      return CRYSTAL_TASK_REFERRALS5_REWARD;
    case "referrals-10":
      return CRYSTAL_TASK_REFERRALS10_REWARD;
    default:
      return 0;
  }
};

const loadCrystalTaskOpenHistory = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("security_events")
    .select("details")
    .eq("wallet", wallet)
    .eq("kind", "crystal_task_open")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) return { ok: false as const, error: "Failed to load task activity." };

  const opened = new Set<CrystalTaskId>();
  for (const row of data ?? []) {
    const details = row.details && typeof row.details === "object" && !Array.isArray(row.details)
      ? row.details as Record<string, unknown>
      : {};
    const taskId = String(details.taskId ?? "").trim() as CrystalTaskId;
    if (CRYSTAL_TASK_IDS.includes(taskId)) opened.add(taskId);
  }

  return { ok: true as const, opened };
};

const loadRecentPartnerTaskClaims = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
) => {
  const { data, error } = await supabase
    .from("security_events")
    .select("created_at, details")
    .eq("wallet", wallet)
    .eq("kind", "partner_task_claim")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { ok: false as const, error: "Failed to load partner task activity." };

  return {
    ok: true as const,
    claims: (data ?? []) as Array<{ created_at: string; details: Record<string, unknown> | null }>,
  };
};

const getPartnerTaskRemainingSec = (
  claims: Array<{ created_at: string; details: Record<string, unknown> | null }>,
  nowMs: number,
) => {
  const latestClaimAtMs = claims.reduce((latest, entry) => {
    const createdAtMs = new Date(String(entry.created_at ?? "")).getTime();
    return Number.isFinite(createdAtMs) ? Math.max(latest, createdAtMs) : latest;
  }, 0);
  if (latestClaimAtMs <= 0) return 0;
  return Math.max(0, Math.ceil(((latestClaimAtMs + (PARTNER_TASK_COOLDOWN_SECONDS * 1000)) - nowMs) / 1000));
};

const buildCrystalTaskStatuses = async (
  supabase: ReturnType<typeof createClient>,
  wallet: string,
  nowMs: number,
) => {
  const progressResult = await loadCrystalTaskProgress(supabase, wallet);
  if (!progressResult.ok) return progressResult;

  const referralsResult = await getQualifiedReferralCount(supabase, wallet, CRYSTAL_TASK_REFERRAL_LEVEL_MIN);
  if (!referralsResult.ok) return referralsResult;

  const openHistoryResult = await loadCrystalTaskOpenHistory(supabase, wallet);
  if (!openHistoryResult.ok) return openHistoryResult;

  const progress = progressResult.progress;
  const referralCount = referralsResult.count;
  const opened = openHistoryResult.opened;
  const openedX = opened.has("follow-x");
  const telegramUserId = Math.max(0, asInt(getTelegramUserIdFromIdentity(wallet), 0));

  let isTelegramSubscribed = false;
  if (telegramUserId > 0) {
    const membership = await isTelegramChannelMember(telegramUserId);
    if (membership.ok) {
      isTelegramSubscribed = membership.isMember;
    }
  }

  const adRemainingSec = progress["watch-ad"].lastClaimAt > 0
    ? Math.max(0, Math.ceil(((progress["watch-ad"].lastClaimAt + (CRYSTAL_TASK_AD_COOLDOWN_SECONDS * 1000)) - nowMs) / 1000))
    : 0;

  const tasks: CrystalTaskStatusRow[] = [
    {
      id: "join-channel",
      title: "Join Telegram channel",
      description: "Subscribe to the official Doge Quest Telegram channel.",
      rewardCrystals: CRYSTAL_TASK_CHANNEL_REWARD,
      repeatable: false,
      claimed: progress["join-channel"].claimCount > 0,
      claimCount: progress["join-channel"].claimCount,
      progress: progress["join-channel"].claimCount > 0 ? 1 : (isTelegramSubscribed ? 1 : 0),
      target: 1,
      canClaim: progress["join-channel"].claimCount <= 0 && isTelegramSubscribed,
      cooldownSec: 0,
      remainingSec: 0,
      actionUrl: TELEGRAM_CHANNEL_URL,
    },
    {
      id: "follow-x",
      title: "Follow on X",
      description: "Open the official Doge Quest X page, then claim your reward.",
      rewardCrystals: CRYSTAL_TASK_X_REWARD,
      repeatable: false,
      claimed: progress["follow-x"].claimCount > 0,
      claimCount: progress["follow-x"].claimCount,
      progress: progress["follow-x"].claimCount > 0 ? 1 : (openedX ? 1 : 0),
      target: 1,
      canClaim: progress["follow-x"].claimCount <= 0 && openedX,
      cooldownSec: 0,
      remainingSec: 0,
      actionUrl: TWITTER_FOLLOW_URL,
    },
    {
      id: "watch-ad",
      title: "Watch ad",
      description: "Watch one rewarded ad and claim crystals.",
      rewardCrystals: CRYSTAL_TASK_AD_REWARD,
      repeatable: true,
      claimed: false,
      claimCount: progress["watch-ad"].claimCount,
      progress: adRemainingSec > 0 ? 0 : 1,
      target: 1,
      canClaim: adRemainingSec <= 0,
      cooldownSec: CRYSTAL_TASK_AD_COOLDOWN_SECONDS,
      remainingSec: adRemainingSec,
      actionUrl: ADSGRAM_BLOCK_ID,
    },
    {
      id: "referrals-5",
      title: "Invite 5 referrals",
      description: "Invite 5 friends who reached level 5 or higher.",
      rewardCrystals: CRYSTAL_TASK_REFERRALS5_REWARD,
      repeatable: false,
      claimed: progress["referrals-5"].claimCount > 0,
      claimCount: progress["referrals-5"].claimCount,
      progress: Math.min(5, referralCount),
      target: 5,
      canClaim: progress["referrals-5"].claimCount <= 0 && referralCount >= 5,
      cooldownSec: 0,
      remainingSec: 0,
      actionUrl: "",
    },
    {
      id: "referrals-10",
      title: "Invite 10 referrals",
      description: "Invite 10 friends who reached level 5 or higher.",
      rewardCrystals: CRYSTAL_TASK_REFERRALS10_REWARD,
      repeatable: false,
      claimed: progress["referrals-10"].claimCount > 0,
      claimCount: progress["referrals-10"].claimCount,
      progress: Math.min(10, referralCount),
      target: 10,
      canClaim: progress["referrals-10"].claimCount <= 0 && referralCount >= 10,
      cooldownSec: 0,
      remainingSec: 0,
      actionUrl: "",
    },
  ];

  return { ok: true as const, tasks };
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

      const energyUpdatedAtMs = Math.max(0, asInt(state.energyUpdatedAt, 0));
      const fallbackUpdatedAtMs = profileRow.updated_at ? new Date(String(profileRow.updated_at)).getTime() : Number.NaN;
      const baseUpdatedAtMs = energyUpdatedAtMs > 0 ? energyUpdatedAtMs : fallbackUpdatedAtMs;
      const elapsedSec = Number.isFinite(baseUpdatedAtMs)
        ? Math.max(0, Math.floor((attemptNow.getTime() - baseUpdatedAtMs) / 1000))
        : 0;

      let changed = applyOfflineEnergyRegen(state, elapsedSec, attemptNow.getTime());
      if (energyUpdatedAtMs <= 0) {
        state.energyUpdatedAt = attemptNow.getTime();
        changed = true;
      }
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

      const energyUpdatedAtMs = Math.max(0, asInt(state.energyUpdatedAt, 0));
      const fallbackUpdatedAtMs = profileRow.updated_at ? new Date(String(profileRow.updated_at)).getTime() : Number.NaN;
      const baseUpdatedAtMs = energyUpdatedAtMs > 0 ? energyUpdatedAtMs : fallbackUpdatedAtMs;
      const elapsedSec = Number.isFinite(baseUpdatedAtMs)
        ? Math.max(0, Math.floor((attemptNow.getTime() - baseUpdatedAtMs) / 1000))
        : 0;
      let changed = applyOfflineEnergyRegen(state, elapsedSec, attemptNow.getTime());
      if (energyUpdatedAtMs <= 0) {
        state.energyUpdatedAt = attemptNow.getTime();
        changed = true;
      }

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
    const normalizedInputState = normalizeState(body.state);
    if (!normalizedInputState) {
      return json({ ok: false, error: "Invalid profile payload." });
    }
    const clientUpdatedAt = String(body.clientUpdatedAt ?? "").trim();

    for (let attempt = 0; attempt < PROFILE_UPDATE_RETRY_ATTEMPTS; attempt += 1) {
      const attemptNow = new Date();
      const attemptNowIso = attemptNow.toISOString();
      let normalizedState = structuredClone(normalizedInputState) as Record<string, unknown>;

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
        if (clientUpdatedAtMs > serverUpdatedAtMs + 5 * 60 * 1000) {
          await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
            reason: "Client profile version is in the future.",
            serverUpdatedAt: existing.updated_at,
            clientUpdatedAt,
          });
          return json({ ok: false, error: "Invalid profile version. Reload game state and retry." });
        }
        if (clientUpdatedAtMs + PROFILE_STALE_WRITE_TOLERANCE_MS < serverUpdatedAtMs) {
          await auditEvent(supabase, auth.wallet, "profile_save_rejected", {
            reason: "Profile is outdated.",
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
      if (prevState) {
        normalizedState.classId = String(prevState.classId ?? normalizedState.classId ?? "");
        const nextPlayer = (normalizedState.player as Record<string, unknown> | undefined) ?? {};
        const prevPlayer = (prevState.player as Record<string, unknown> | undefined) ?? {};
        normalizedState.player = {
          ...nextPlayer,
          ...prevPlayer,
          level: asInt(nextPlayer.level, asInt(prevPlayer.level, 1)),
          xp: asInt(nextPlayer.xp, asInt(prevPlayer.xp, 0)),
          xpNext: asInt(nextPlayer.xpNext, asInt(prevPlayer.xpNext, 1)),
        };
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
        normalizedState.village = normalizeVillageState(prevState.village, attemptNow.getTime());
        normalizedState.payoutWallet = sanitizePayoutWallet(prevState.payoutWallet);

        const prevEnergy = clampInt(prevState.energy, 0, Math.max(1, asInt(prevState.energyMax, ENERGY_MAX)));
        const prevTimer = clampInt(prevState.energyTimer, 1, ENERGY_REGEN_SECONDS);
        const nextEnergy = clampInt(normalizedState.energy, 0, Math.max(1, asInt(normalizedState.energyMax, ENERGY_MAX)));
        const nextTimer = clampInt(normalizedState.energyTimer, 1, ENERGY_REGEN_SECONDS);
        const prevEnergyUpdatedAt = Math.max(0, asInt(prevState.energyUpdatedAt, 0));
        const nextEnergyUpdatedAt = Math.max(0, asInt(normalizedState.energyUpdatedAt, 0));
        if (nextEnergy != prevEnergy || nextTimer != prevTimer) {
          normalizedState.energyUpdatedAt = attemptNow.getTime();
        } else {
          normalizedState.energyUpdatedAt = nextEnergyUpdatedAt > 0 ? nextEnergyUpdatedAt : prevEnergyUpdatedAt;
        }
        if (Math.max(0, asInt(normalizedState.energyUpdatedAt, 0)) <= 0) {
          normalizedState.energyUpdatedAt = attemptNow.getTime();
        }
        const minerState = getMinerLeaseState(prevState, attemptNow.getTime());
        normalizedState.miners = minerState.leases;
        normalizedState.minerLeaseId = minerState.leaseId;
        normalizedState.minerCarryCrystals = minerState.carryCrystals;
      } else if (!existing) {
        normalizedState = createStarterProfileState(normalizedState, attemptNow.getTime());
      } else {
        return json({ ok: false, error: "Invalid previous profile state. Contact support." });
      }

      const prevMetrics = prevState ? getMetrics(prevState) : null;
      const nextMetrics = getMetrics(normalizedState);
      const previousUpdatedAtMs = existing?.updated_at ? new Date(String(existing.updated_at)).getTime() : Number.NaN;
      const elapsedSec = Number.isFinite(previousUpdatedAtMs)
        ? Math.max(1, Math.floor((attemptNow.getTime() - previousUpdatedAtMs) / 1000))
        : 3600;

      const validationError = validateStateTransition(prevState, normalizedState, prevMetrics, nextMetrics, elapsedSec, attemptNow.getTime());
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
            updated_at: attemptNowIso,
          });
        if (!insertError) {
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
          return json({ ok: true, savedAt: attemptNowIso });
        }
        return json({ ok: false, error: "Failed to save profile." });
      }

      const expectedUpdatedAt = String(existing.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({
          state: normalizedState,
          updated_at: attemptNowIso,
        })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();

      if (!updateError && updated) {
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
        return json({ ok: true, savedAt: attemptNowIso });
      }

      if (attempt < PROFILE_UPDATE_RETRY_ATTEMPTS - 1) {
        await waitMs(90 + Math.floor(Math.random() * 180));
      }
    }

    return json({ ok: false, error: "Profile changed concurrently, retry save." });
  }

  if (action === "miners_status") {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state, updated_at")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (profileError || !profileRow?.state || typeof profileRow.state !== "object") {
      return json({ ok: false, error: "Profile not found." });
    }

    const state = normalizeState(profileRow.state as unknown);
    if (!state) return json({ ok: false, error: "Invalid profile state." });
    const minerState = getMinerLeaseState(state, now.getTime());

    return json({
      ok: true,
      miners: minerState.leases,
      minerLeaseId: minerState.leaseId,
      minerCarryCrystals: minerState.carryCrystals,
      savedAt: String(profileRow.updated_at ?? ""),
    });
  }

  if (action === "miners_claim") {
    let claimedCrystals = 0;
    const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      claimedCrystals = claimMinerRewardsOnState(state, now.getTime());
      if (claimedCrystals > 0) {
        state.crystals = Math.max(0, asInt(state.crystals, 0)) + claimedCrystals;
        state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + claimedCrystals;
      }
    });

    if (!creditResult.ok || !creditResult.state) {
      return json({ ok: false, error: creditResult.error || "Failed to claim miner rewards." });
    }

    const minerState = getMinerLeaseState(creditResult.state, now.getTime());
    await auditEvent(supabase, auth.wallet, "miners_claim", {
      claimedCrystals,
      activeLeases: minerState.leases.filter((entry) => entry.endsAt > now.getTime()).length,
    });

    return json({
      ok: true,
      minerClaimedCrystals: claimedCrystals,
      miners: minerState.leases,
      minerLeaseId: minerState.leaseId,
      minerCarryCrystals: minerState.carryCrystals,
      crystals: Math.max(0, asInt(creditResult.state.crystals, 0)),
      crystalsEarned: Math.max(0, asInt(creditResult.state.crystalsEarned, 0)),
      savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
    });
  }

  if (action === "season_status") {
    const activeSeasonResult = await getActiveSeason(supabase);
    if (!activeSeasonResult.ok) return json({ ok: false, error: activeSeasonResult.error });
    if (!activeSeasonResult.season) {
      return json({ ok: true, season: null, seasonLeaderboard: [], seasonPlayer: null });
    }

    const limit = clampInt(body.limit, 1, 20);
    const profileRowsResult = await loadSeasonProfileRows(supabase);
    if (!profileRowsResult.ok) return json({ ok: false, error: profileRowsResult.error });

    const computed = buildSeasonComputedRows(
      profileRowsResult.rows,
      Math.max(0, Number(activeSeasonResult.season.poolUsdt ?? 0)),
      now.getTime(),
    );
    const leaderboard = computed.rows.slice(0, limit).map((row, index) => ({
      rank: index + 1,
      wallet: row.wallet,
      name: row.name,
      crystals: row.crystalsSnapshot,
      premiumActive: row.premiumActive,
      effectiveCrystals: row.effectiveCrystals,
      payoutUsdt: row.payoutUsdt,
    }));
    const playerIndex = computed.rows.findIndex((row) => row.wallet === auth.wallet);
    const playerRow = playerIndex >= 0
      ? {
          rank: playerIndex + 1,
          wallet: computed.rows[playerIndex].wallet,
          name: computed.rows[playerIndex].name,
          crystals: computed.rows[playerIndex].crystalsSnapshot,
          premiumActive: computed.rows[playerIndex].premiumActive,
          effectiveCrystals: computed.rows[playerIndex].effectiveCrystals,
          payoutUsdt: computed.rows[playerIndex].payoutUsdt,
        }
      : null;

    return json({
      ok: true,
      season: activeSeasonResult.season,
      seasonMinCrystals: MIN_SEASON_SNAPSHOT_CRYSTALS,
      seasonLeaderboard: leaderboard,
      seasonPlayer: playerRow,
      seasonTotalPlayers: computed.totalPlayers,
      seasonTotalCrystals: computed.totalCrystals,
      seasonTotalEffectiveCrystals: computed.totalEffectiveCrystals,
    });
  }

  if (action === "payout_wallet_status") {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state")
      .eq("wallet", auth.wallet)
      .maybeSingle();

    if (profileError) return json({ ok: false, error: "Failed to load payout wallet." });

    const state = profileRow?.state && typeof profileRow.state === "object"
      ? normalizeState(profileRow.state as unknown)
      : null;

    return json({
      ok: true,
      payoutWallet: sanitizePayoutWallet(state?.payoutWallet ?? ""),
    });
  }

  if (action === "payout_wallet_save") {
    const payoutWallet = sanitizePayoutWallet(body.payoutWallet ?? "");
    if (!isPayoutWalletFormat(payoutWallet)) {
      return json({ ok: false, error: "Invalid payout wallet format." });
    }

    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      state.payoutWallet = payoutWallet;
    });
    if (!updated.ok) {
      return json({ ok: false, error: updated.error || "Failed to save payout wallet." });
    }

    await auditEvent(supabase, auth.wallet, "payout_wallet_save", {
      hasValue: Boolean(payoutWallet),
      walletType: payoutWallet.startsWith("0x") ? "evm" : payoutWallet ? "base58" : "empty",
    });

    return json({ ok: true, payoutWallet, savedAt: updated.updatedAt });
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

  if (action === "tg_stars_create") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "Telegram Stars are available only in Telegram Mini App." });
    }

    const telegramUserId = getTelegramUserIdFromIdentity(auth.wallet);
    if (!telegramUserId) {
      return json({ ok: false, error: "Invalid Telegram identity." });
    }

    const botToken = String(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "").trim();
    if (!botToken) {
      return json({ ok: false, error: "Telegram payments are not configured." });
    }

    const prepared = prepareTelegramStarsPurchase(body);
    if (!prepared.ok) {
      return json({ ok: false, error: prepared.error });
    }

    if (prepared.purchase.kind === "starter_pack_buy") {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("state")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      if (profileError) {
        return json({ ok: false, error: "Failed to load profile." });
      }
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) {
        return json({ ok: false, error: "Profile not found." });
      }
      if (Boolean(state.starterPackPurchased)) {
        return json({ ok: false, error: "Starter pack already purchased." });
      }
    }

    const reuseSinceIso = new Date(now.getTime() - TELEGRAM_STARS_PENDING_REUSE_MS).toISOString();
    const { data: reusableRow } = await supabase
      .from("telegram_stars_orders")
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .eq("wallet", auth.wallet)
      .eq("kind", prepared.purchase.kind)
      .eq("product_ref", prepared.purchase.productRef)
      .eq("status", "pending")
      .gte("created_at", reuseSinceIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const reusable = normalizeTelegramStarsOrder(reusableRow);
    if (reusable && reusable.invoiceLink) {
      return json({ ok: true, tgStarsOrder: reusable, tgStarsReused: true });
    }

    const orderId = crypto.randomUUID();
    const invoicePayload = `dgq-stars:${orderId}`;
    const createdAtIso = now.toISOString();

    const { data: createdRow, error: createError } = await supabase
      .from("telegram_stars_orders")
      .insert({
        id: orderId,
        wallet: auth.wallet,
        tg_user_id: telegramUserId,
        kind: prepared.purchase.kind,
        product_ref: prepared.purchase.productRef,
        stars_amount: prepared.purchase.starsAmount,
        status: "pending",
        invoice_payload: invoicePayload,
        invoice_link: "",
        telegram_charge_id: "",
        provider_charge_id: "",
        reward: prepared.purchase.reward,
        created_at: createdAtIso,
        updated_at: createdAtIso,
      })
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .maybeSingle();

    if (createError || !createdRow) {
      return json({ ok: false, error: "Failed to create Stars payment order." });
    }

    const invoiceResult = await createTelegramStarsInvoiceLink(botToken, {
      title: prepared.purchase.title,
      description: prepared.purchase.description,
      invoicePayload,
      starsAmount: prepared.purchase.starsAmount,
    });

    if (!invoiceResult.ok) {
      await supabase
        .from("telegram_stars_orders")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "pending");
      return json({ ok: false, error: invoiceResult.error });
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("telegram_stars_orders")
      .update({
        invoice_link: invoiceResult.invoiceLink,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("wallet", auth.wallet)
      .eq("status", "pending")
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .maybeSingle();

    if (updateError || !updatedRow) {
      return json({ ok: false, error: "Failed to save Telegram invoice link." });
    }

    const normalizedOrder = normalizeTelegramStarsOrder(updatedRow);
    if (!normalizedOrder) {
      return json({ ok: false, error: "Failed to encode Stars order." });
    }

    await auditEvent(supabase, auth.wallet, "tg_stars_create", {
      orderId,
      kind: prepared.purchase.kind,
      productRef: prepared.purchase.productRef,
      starsAmount: prepared.purchase.starsAmount,
      reused: false,
    });

    return json({ ok: true, tgStarsOrder: normalizedOrder, tgStarsReused: false });
  }

  if (action === "tg_stars_claim") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "Telegram Stars are available only in Telegram Mini App." });
    }

    let orderId = String(body.orderId ?? "").trim().slice(0, 80);
    if (!orderId) {
      const { data: pendingRow, error: pendingError } = await supabase
        .from("telegram_stars_orders")
        .select("id")
        .eq("wallet", auth.wallet)
        .eq("status", "paid")
        .order("paid_at", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (pendingError) {
        return json({ ok: false, error: "Failed to load pending Stars orders." });
      }
      const pendingId = String((pendingRow as Record<string, unknown> | null)?.id ?? "").trim();
      if (!pendingId) {
        return json({ ok: true, tgStarsNoPending: true });
      }
      orderId = pendingId;
    }

    const lockTs = now.toISOString();
    const { data: lockedRow, error: lockError } = await supabase
      .from("telegram_stars_orders")
      .update({ status: "claiming", updated_at: lockTs })
      .eq("id", orderId)
      .eq("wallet", auth.wallet)
      .eq("status", "paid")
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .maybeSingle();

    if (lockError) {
      return json({ ok: false, error: "Failed to lock Stars order." });
    }

    let orderRow = lockedRow as TelegramStarsOrderRow | null;
    if (!orderRow) {
      const { data: existingRow, error: existingError } = await supabase
        .from("telegram_stars_orders")
        .select(TELEGRAM_STARS_ORDER_SELECT)
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .maybeSingle();
      if (existingError || !existingRow) {
        return json({ ok: false, error: "Stars order not found." });
      }

      orderRow = existingRow as TelegramStarsOrderRow;
      const normalized = normalizeTelegramStarsOrder(orderRow);
      const status = String(orderRow.status ?? "");

      if (status === "claimed") {
        return json({ ok: true, tgStarsAlreadyClaimed: true, tgStarsOrder: normalized });
      }
      if (status === "pending") {
        return json({ ok: false, error: "Payment not completed yet.", tgStarsOrder: normalized });
      }
      if (status === "claiming") {
        return json({ ok: false, error: "Purchase is being finalized. Retry in a few seconds.", tgStarsOrder: normalized });
      }
      return json({ ok: false, error: `Purchase status: ${status || "unknown"}.`, tgStarsOrder: normalized });
    }

    const orderKindRaw = String(orderRow.kind ?? "").trim();
    if (!isTelegramStarsOrderKind(orderKindRaw)) {
      await supabase
        .from("telegram_stars_orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "Unknown Stars order kind." });
    }

    const orderKind = orderKindRaw as TelegramStarsOrderKind;
    let payload: Record<string, unknown> = {};

    if (orderKind === "buy_gold") {
      const pack = getGoldPackSol(orderRow.product_ref);
      if (!pack) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid gold package in Stars order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        state.gold = Math.max(0, asInt(state.gold, 0)) + pack.gold;
      });
      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to credit gold package." });
      }

      payload = {
        gold: Math.max(0, asInt(creditResult.state.gold, 0)),
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "starter_pack_buy") {
      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        if (Boolean(state.starterPackPurchased)) {
          throw new Error("Starter pack is already activated on this account.");
        }
        state.gold = Math.max(0, asInt(state.gold, 0)) + STARTER_PACK_GOLD;
        for (const entry of STARTER_PACK_ITEMS) {
          for (let i = 0; i < entry.qty; i += 1) {
            addConsumableToState(state, entry.type);
          }
        }
        state.starterPackPurchased = true;
      });

      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate starter pack." });
      }

      payload = {
        starterPackPurchased: true,
        gold: Math.max(0, asInt(creditResult.state.gold, 0)),
        consumables: normalizeConsumables(creditResult.state.consumables).rows,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "premium_buy") {
      const plan = getPremiumPlan(orderRow.product_ref, 0);
      if (!plan) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid premium plan in Stars order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        const nowMs = Date.now();
        const currentPremiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
        const base = Math.max(nowMs, currentPremiumEndsAt);
        const nextPremiumEndsAt = base + plan.days * 24 * 60 * 60 * 1000;
        state.premiumEndsAt = nextPremiumEndsAt;
      });

      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate premium." });
      }

      payload = {
        premiumEndsAt: Math.max(0, asInt(creditResult.state.premiumEndsAt, 0)),
        premiumDaysAdded: plan.days,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "miner_buy") {
      const miner = getMinerDefinition(orderRow.product_ref);
      if (!miner) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid miner in Stars order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        addMinerLeaseToState(state, miner.id as MinerId, now.getTime());
      });
      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate miner lease." });
      }

      const minerState = getMinerLeaseState(creditResult.state, now.getTime());
      payload = {
        miners: minerState.leases,
        minerLeaseId: minerState.leaseId,
        minerCarryCrystals: minerState.carryCrystals,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else {
      const spins = asInt(orderRow.product_ref, 0);
      if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid fortune pack in Stars order." });
      }

      const dayKey = todayKeyUtc(now);
      let fortuneUpdated: FortuneStateRow | null = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
        if (!fortuneState.ok) {
          await supabase
            .from("telegram_stars_orders")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("id", orderId)
            .eq("wallet", auth.wallet)
            .eq("status", "claiming");
          return json({ ok: false, error: fortuneState.error });
        }

        const nextPaidSpins = Math.max(0, asInt(fortuneState.state.paid_spins, 0)) + spins;
        const updated = await updateFortuneState(supabase, fortuneState.state, {
          paid_spins: nextPaidSpins,
        });
        if (updated.ok) {
          fortuneUpdated = updated.state;
          break;
        }
      }

      if (!fortuneUpdated) {
        await supabase
          .from("telegram_stars_orders")
          .update({ status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Failed to register fortune spin purchase, retry." });
      }

      payload = {
        fortuneFreeSpinAvailable: fortuneUpdated.free_spin_day !== dayKey,
        fortunePaidSpins: Math.max(0, asInt(fortuneUpdated.paid_spins, 0)),
      };
    }

    const claimedAtIso = new Date().toISOString();
    const { data: claimedRow, error: claimError } = await supabase
      .from("telegram_stars_orders")
      .update({
        status: "claimed",
        claimed_at: claimedAtIso,
        updated_at: claimedAtIso,
      })
      .eq("id", orderId)
      .eq("wallet", auth.wallet)
      .eq("status", "claiming")
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .maybeSingle();

    if (claimError || !claimedRow) {
      await supabase
        .from("telegram_stars_orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "Failed to finalize Stars purchase claim." });
    }

    const normalizedOrder = normalizeTelegramStarsOrder(claimedRow);

    await auditEvent(supabase, auth.wallet, "tg_stars_claim", {
      orderId,
      kind: orderKind,
      productRef: String(orderRow.product_ref ?? ""),
      starsAmount: Math.max(0, asInt(orderRow.stars_amount, 0)),
    });

    return json({
      ok: true,
      tgStarsClaimed: true,
      tgStarsOrder: normalizedOrder,
      ...payload,
    });
  }

  if (action === "tg_ton_create") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "TON payments are available only in Telegram Mini App." });
    }

    const telegramUserId = getTelegramUserIdFromIdentity(auth.wallet);
    if (!telegramUserId) {
      return json({ ok: false, error: "Invalid Telegram identity." });
    }

    const treasuryWallet = normalizeTonAddress(TELEGRAM_TON_TREASURY_WALLET);
    if (!treasuryWallet) {
      return json({ ok: false, error: "TON treasury wallet is not configured." });
    }

    const usdtMaster = normalizeTonAddress(TELEGRAM_TON_USDT_MASTER);
    if (!usdtMaster) {
      return json({ ok: false, error: "TON USDT master address is not configured." });
    }

    const payerAddress = normalizeTonAddress(body.payerAddress ?? "");
    if (!payerAddress) {
      return json({ ok: false, error: "Connect Telegram Wallet first." });
    }

    const prepared = prepareTelegramTonPurchase(body);
    if (!prepared.ok) {
      return json({ ok: false, error: prepared.error });
    }

    if (prepared.purchase.kind === "starter_pack_buy") {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("state")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      if (profileError) {
        return json({ ok: false, error: "Failed to load profile." });
      }
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) {
        return json({ ok: false, error: "Profile not found." });
      }
      if (Boolean(state.starterPackPurchased)) {
        return json({ ok: false, error: "Starter pack already purchased." });
      }
    }

    const orderId = crypto.randomUUID();
    const createdAtIso = now.toISOString();
    let txMessages: TelegramTonTxMessage[] = [];

    if (prepared.purchase.rail === "ton") {
      txMessages = [{
        address: treasuryWallet,
        amount: prepared.purchase.amountUnits.toString(),
        payload: createTonCommentPayload(`dgq-ton:${orderId}`),
      }];
    } else {
      const jettonWalletResult = await tonCenterGet("/jetton/wallets", {
        owner_address: payerAddress,
        jetton_address: usdtMaster,
        limit: 1,
        offset: 0,
      });
      if (!jettonWalletResult.ok) {
        return json({ ok: false, error: jettonWalletResult.error || "Failed to prepare USDT transfer wallet." });
      }
      const jettonWalletRows = parseApiJettonWallets(jettonWalletResult.data);
      const senderJettonWallet = normalizeTonAddress(jettonWalletRows[0]?.address ?? "");
      if (!senderJettonWallet) {
        return json({ ok: false, error: "USDT wallet is not available for the connected TG wallet. Open a wallet that already holds TON USDT and retry." });
      }

      const commentPayload = beginCell().storeUint(0, 32).storeStringTail(`dgq-usdt:${orderId}`).endCell();
      const payloadCell = beginCell()
        .storeUint(0x0f8a7ea5, 32)
        .storeUint(BigInt(Date.now()), 64)
        .storeCoins(prepared.purchase.amountUnits)
        .storeAddress(Address.parse(treasuryWallet))
        .storeAddress(Address.parse(payerAddress))
        .storeBit(false)
        .storeCoins(TELEGRAM_TON_USDT_FORWARD_NANOTON)
        .storeBit(true)
        .storeRef(commentPayload)
        .endCell();

      txMessages = [{
        address: senderJettonWallet,
        amount: TELEGRAM_TON_USDT_GAS_NANOTON.toString(),
        payload: uint8ToBase64(payloadCell.toBoc()),
      }];
    }

    if (!txMessages.length) {
      return json({ ok: false, error: "Failed to build TON payment request." });
    }

    const { data: createdRow, error: createError } = await supabase
      .from("telegram_ton_orders")
      .insert({
        id: orderId,
        wallet: auth.wallet,
        tg_user_id: telegramUserId,
        payer_address: payerAddress,
        rail: prepared.purchase.rail,
        kind: prepared.purchase.kind,
        product_ref: prepared.purchase.productRef,
        asset: prepared.purchase.asset,
        amount_units: prepared.purchase.amountUnits.toString(),
        amount_display: prepared.purchase.amountDisplay,
        status: "pending",
        claim_error: "",
        reward: prepared.purchase.reward,
        created_at: createdAtIso,
        updated_at: createdAtIso,
      })
      .select(TELEGRAM_TON_ORDER_SELECT)
      .maybeSingle();

    if (createError || !createdRow) {
      return json({ ok: false, error: "Failed to create TON payment order." });
    }

    const txRequest = {
      validUntil: Math.floor(Date.now() / 1000) + TELEGRAM_TON_TX_VALID_SECONDS,
      messages: txMessages,
    };
    const normalizedOrder = normalizeTelegramTonOrder(createdRow, txRequest);
    if (!normalizedOrder) {
      return json({ ok: false, error: "Failed to encode TON order." });
    }

    await auditEvent(supabase, auth.wallet, "tg_ton_create", {
      orderId,
      kind: prepared.purchase.kind,
      productRef: prepared.purchase.productRef,
      rail: prepared.purchase.rail,
      asset: prepared.purchase.asset,
      amountUnits: prepared.purchase.amountUnits.toString(),
      payerAddress,
    });

    return json({ ok: true, tgTonOrder: normalizedOrder, tgTonReused: false });
  }

  if (action === "tg_ton_claim") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "TON payments are available only in Telegram Mini App." });
    }

    const orderId = String(body.orderId ?? "").trim().slice(0, 80);
    if (!orderId) {
      return json({ ok: false, error: "Missing TON order id." });
    }

    const txBoc = String(body.txBoc ?? "").trim();
    let txHashHex = normalizeTxHashHex(body.txHashHex ?? "");
    let txHashBase64 = normalizeTxHashBase64(body.txHashBase64 ?? "");

    if ((!txHashHex && !txHashBase64) && txBoc) {
      try {
        const hashBytes = Cell.fromBase64(txBoc).hash();
        txHashHex = normalizeTxHashHex(uint8ToHex(hashBytes));
        txHashBase64 = normalizeTxHashBase64(uint8ToBase64(hashBytes));
      } catch {
        // keep empty and return standard error below
      }
    }

    if (!txHashHex && !txHashBase64) {
      return json({ ok: false, error: "Missing TON transaction hash." });
    }

    const lockTs = now.toISOString();
    const { data: lockedRow, error: lockError } = await supabase
      .from("telegram_ton_orders")
      .update({ status: "claiming", updated_at: lockTs, claim_error: "" })
      .eq("id", orderId)
      .eq("wallet", auth.wallet)
      .eq("status", "pending")
      .select(TELEGRAM_TON_ORDER_SELECT)
      .maybeSingle();

    if (lockError) {
      return json({ ok: false, error: "Failed to lock TON payment order." });
    }

    let orderRow = lockedRow as TelegramTonOrderRow | null;
    if (!orderRow) {
      const { data: existingRow, error: existingError } = await supabase
        .from("telegram_ton_orders")
        .select(TELEGRAM_TON_ORDER_SELECT)
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .maybeSingle();
      if (existingError || !existingRow) {
        return json({ ok: false, error: "TON order not found." });
      }
      orderRow = existingRow as TelegramTonOrderRow;
      const normalized = normalizeTelegramTonOrder(orderRow, null);
      const status = String(orderRow.status ?? "");
      if (status === "claimed") {
        return json({ ok: true, tgTonAlreadyClaimed: true, tgTonOrder: normalized });
      }
      if (status === "pending") {
        return json({ ok: false, error: "Payment transaction not found yet.", tgTonOrder: normalized });
      }
      if (status === "claiming") {
        return json({ ok: false, error: "Purchase is being finalized. Retry in a few seconds.", tgTonOrder: normalized });
      }
      return json({ ok: false, error: `Purchase status: ${status || "unknown"}.`, tgTonOrder: normalized });
    }

    const orderKind = String(orderRow.kind ?? "").trim();
    const orderRail = String(orderRow.rail ?? "").trim();
    const orderPayer = normalizeTonAddress(orderRow.payer_address ?? "");
    const amountUnits = BigInt(Math.max(0, asInt(orderRow.amount_units, 0)));
    if (!isTelegramStarsOrderKind(orderKind) || !isTelegramTonRail(orderRail) || !orderPayer || amountUnits <= 0n) {
      await supabase
        .from("telegram_ton_orders")
        .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Invalid order payload." })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "Invalid TON order payload." });
    }

    const treasuryWallet = normalizeTonAddress(TELEGRAM_TON_TREASURY_WALLET);
    const usdtMaster = normalizeTonAddress(TELEGRAM_TON_USDT_MASTER);
    if (!treasuryWallet || !usdtMaster) {
      await supabase
        .from("telegram_ton_orders")
        .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "TON rails are not configured." })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "TON rails are not configured." });
    }

    const createdAtMs = new Date(String(orderRow.created_at ?? now.toISOString())).getTime();
    const startUtime = Math.max(0, Math.floor((Number.isFinite(createdAtMs) ? createdAtMs : Date.now()) / 1000) - TELEGRAM_TON_TRANSFER_LOOKUP_WINDOW_SECONDS);
    const endUtime = Math.floor(Date.now() / 1000) + 120;

    let paymentVerified = false;
    if (orderRail === "ton") {
      const txResult = await tonCenterGet("/transactions", {
        account: orderPayer,
        start_utime: startUtime,
        end_utime: endUtime,
        limit: 80,
        sort: "desc",
      });
      if (!txResult.ok) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: txResult.error || "TON API error." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: txResult.error || "Failed to verify TON transaction." });
      }
      const expectedComment = `dgq-ton:${orderId}`;
      const txRows = parseApiTransactions(txResult.data);
      for (const tx of txRows) {
        const txHashRaw = tx.hash ?? tx.hash_norm;
        const outMsgs = Array.isArray(tx.out_msgs) ? tx.out_msgs as Array<Record<string, unknown>> : [];
        const matchingTransfer = outMsgs.find((msg) => {
          const destination = normalizeTonAddress(msg.destination ?? "");
          if (destination !== treasuryWallet) return false;
          const value = BigInt(String(msg.value ?? "0").trim() || "0");
          return value >= amountUnits;
        });
        if (!matchingTransfer) continue;
        const matchedByHash = isMatchingTxHash(txHashRaw, txHashHex, txHashBase64);
        const matchedByComment = outMsgs.some((msg) => getTonMessageTextComment(msg) === expectedComment);
        if (!matchedByHash && !matchedByComment) continue;
        if (!txHashHex) {
          const normalizedHexFromTx = normalizeTxHashHex(txHashRaw);
          if (normalizedHexFromTx) txHashHex = normalizedHexFromTx;
        }
        if (!txHashBase64) {
          const normalizedBase64FromTx = normalizeTxHashBase64(txHashRaw);
          if (normalizedBase64FromTx) txHashBase64 = normalizedBase64FromTx;
        }
        paymentVerified = true;
        break;
      }
    } else {
      const transferResult = await tonCenterGet("/jetton/transfers", {
        owner_address: orderPayer,
        jetton_master: usdtMaster,
        direction: "out",
        start_utime: startUtime,
        end_utime: endUtime,
        limit: 120,
        sort: "desc",
      });
      if (!transferResult.ok) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: transferResult.error || "TON API error." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: transferResult.error || "Failed to verify USDT transfer." });
      }

      const expectedComment = `dgq-usdt:${orderId}`;
      const transferRows = parseApiJettonTransfers(transferResult.data);
      for (const transfer of transferRows) {
        const destination = normalizeTonAddress(transfer.destination ?? "");
        const master = normalizeTonAddress(transfer.jetton_master ?? "");
        if (destination !== treasuryWallet || master !== usdtMaster) continue;

        const amount = BigInt(String(transfer.amount ?? "0").trim() || "0");
        if (amount < amountUnits || Boolean(transfer.transaction_aborted)) continue;

        const matchedByHash = isMatchingTxHash(transfer.transaction_hash, txHashHex, txHashBase64);
        const matchedByComment = getJettonTransferTextComment(transfer) === expectedComment;
        if (!matchedByHash && !matchedByComment) continue;

        if (!txHashHex) {
          const normalizedHexFromTx = normalizeTxHashHex(transfer.transaction_hash);
          if (normalizedHexFromTx) txHashHex = normalizedHexFromTx;
        }
        if (!txHashBase64) {
          const normalizedBase64FromTx = normalizeTxHashBase64(transfer.transaction_hash);
          if (normalizedBase64FromTx) txHashBase64 = normalizedBase64FromTx;
        }

        paymentVerified = true;
        break;
      }
    }

    if (!paymentVerified) {
      await supabase
        .from("telegram_ton_orders")
        .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Payment transaction not found yet." })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "Payment transaction not found yet." });
    }

    let payload: Record<string, unknown> = {};

    if (orderKind === "buy_gold") {
      const pack = getGoldPackSol(orderRow.product_ref);
      if (!pack) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Invalid gold package." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid gold package in TON order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        state.gold = Math.max(0, asInt(state.gold, 0)) + pack.gold;
      });
      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: creditResult.error || "Gold credit failed." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to credit gold package." });
      }

      payload = {
        gold: Math.max(0, asInt(creditResult.state.gold, 0)),
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "starter_pack_buy") {
      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        if (Boolean(state.starterPackPurchased)) {
          throw new Error("Starter pack is already activated on this account.");
        }
        state.gold = Math.max(0, asInt(state.gold, 0)) + STARTER_PACK_GOLD;
        for (const entry of STARTER_PACK_ITEMS) {
          for (let i = 0; i < entry.qty; i += 1) addConsumableToState(state, entry.type);
        }
        state.starterPackPurchased = true;
      });

      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: creditResult.error || "Starter pack credit failed." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate starter pack." });
      }

      payload = {
        starterPackPurchased: true,
        gold: Math.max(0, asInt(creditResult.state.gold, 0)),
        consumables: normalizeConsumables(creditResult.state.consumables).rows,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "premium_buy") {
      const plan = getPremiumPlan(orderRow.product_ref, 0);
      if (!plan) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Invalid premium plan." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid premium plan in TON order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        const nowMs = Date.now();
        const currentPremiumEndsAt = Math.max(0, asInt(state.premiumEndsAt, 0));
        const base = Math.max(nowMs, currentPremiumEndsAt);
        state.premiumEndsAt = base + plan.days * 24 * 60 * 60 * 1000;
      });

      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: creditResult.error || "Premium credit failed." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate premium." });
      }

      payload = {
        premiumEndsAt: Math.max(0, asInt(creditResult.state.premiumEndsAt, 0)),
        premiumDaysAdded: plan.days,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else if (orderKind === "miner_buy") {
      const miner = getMinerDefinition(orderRow.product_ref);
      if (!miner) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Invalid miner." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid miner in TON order." });
      }

      const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
        addMinerLeaseToState(state, miner.id as MinerId, now.getTime());
      });
      if (!creditResult.ok || !creditResult.state) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: creditResult.error || "Miner credit failed." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: creditResult.error || "Failed to activate miner lease." });
      }

      const minerState = getMinerLeaseState(creditResult.state, now.getTime());
      payload = {
        miners: minerState.leases,
        minerLeaseId: minerState.leaseId,
        minerCarryCrystals: minerState.carryCrystals,
        savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
      };
    } else {
      const spins = asInt(orderRow.product_ref, 0);
      if (!(FORTUNE_SPIN_PACKS_SOL as readonly number[]).includes(spins)) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Invalid fortune pack." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Invalid fortune pack in TON order." });
      }

      const dayKey = todayKeyUtc(now);
      let fortuneUpdated: FortuneStateRow | null = null;
      for (let attempt = 0; attempt < 6; attempt += 1) {
        const fortuneState = await ensureFortuneState(supabase, auth.wallet, now);
        if (!fortuneState.ok) {
          await supabase
            .from("telegram_ton_orders")
            .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: fortuneState.error || "Fortune status failed." })
            .eq("id", orderId)
            .eq("wallet", auth.wallet)
            .eq("status", "claiming");
          return json({ ok: false, error: fortuneState.error });
        }

        const nextPaidSpins = Math.max(0, asInt(fortuneState.state.paid_spins, 0)) + spins;
        const updated = await updateFortuneState(supabase, fortuneState.state, { paid_spins: nextPaidSpins });
        if (updated.ok) {
          fortuneUpdated = updated.state;
          break;
        }
      }

      if (!fortuneUpdated) {
        await supabase
          .from("telegram_ton_orders")
          .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Failed to register fortune spin purchase, retry." })
          .eq("id", orderId)
          .eq("wallet", auth.wallet)
          .eq("status", "claiming");
        return json({ ok: false, error: "Failed to register fortune spin purchase, retry." });
      }

      payload = {
        fortuneFreeSpinAvailable: fortuneUpdated.free_spin_day !== dayKey,
        fortunePaidSpins: Math.max(0, asInt(fortuneUpdated.paid_spins, 0)),
      };
    }

    const claimedAtIso = new Date().toISOString();
    const { data: claimedRow, error: claimError } = await supabase
      .from("telegram_ton_orders")
      .update({
        status: "claimed",
        tx_hash_hex: txHashHex || null,
        tx_hash_base64: txHashBase64 || null,
        claim_error: "",
        claimed_at: claimedAtIso,
        updated_at: claimedAtIso,
      })
      .eq("id", orderId)
      .eq("wallet", auth.wallet)
      .eq("status", "claiming")
      .select(TELEGRAM_TON_ORDER_SELECT)
      .maybeSingle();

    if (claimError || !claimedRow) {
      await supabase
        .from("telegram_ton_orders")
        .update({ status: "pending", updated_at: new Date().toISOString(), claim_error: "Failed to finalize TON purchase claim." })
        .eq("id", orderId)
        .eq("wallet", auth.wallet)
        .eq("status", "claiming");
      return json({ ok: false, error: "Failed to finalize TON purchase claim." });
    }

    const normalizedOrder = normalizeTelegramTonOrder(claimedRow, null);

    await auditEvent(supabase, auth.wallet, "tg_ton_claim", {
      orderId,
      kind: orderKind,
      rail: orderRail,
      productRef: String(orderRow.product_ref ?? ""),
      amountUnits: amountUnits.toString(),
      txHashHex,
      txHashBase64,
    });

    return json({
      ok: true,
      tgTonClaimed: true,
      tgTonOrder: normalizedOrder,
      ...payload,
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
    let chosenReward: FortuneRewardDef | null = null;
    let lastCreditError = "";

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

      const reward = chosenReward ?? pickFortuneReward();
      chosenReward = reward;
      const creditResult = await applyFortuneReward(supabase, auth.wallet, reward);

      if (!creditResult.ok || !creditResult.state) {
        lastCreditError = String((creditResult as { error?: string }).error ?? "Failed to apply fortune reward.");
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
          error: lastCreditError,
          attempt,
        });

        if (attempt < 5) {
          await waitMs(120 + Math.floor(Math.random() * 220));
          continue;
        }
        return json({ ok: false, error: lastCreditError || "Failed to apply fortune reward." });
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

    return json({ ok: false, error: lastCreditError || "Fortune spin conflict, please retry." });
  }

  if (action === "referrals_status") {
    const nowIso = now.toISOString();
    const applyReferrer = String(body.applyReferrer ?? "").trim();
    const includeContest = Boolean(body.includeContest ?? false);
    const contestLimit = clampInt(body.contestLimit, 1, REFERRAL_CONTEST_LEADERBOARD_MAX_LIMIT);
    let referralApplied = false;

    if (
      applyReferrer &&
      applyReferrer !== auth.wallet &&
      isPlayerIdentity(applyReferrer)
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

    if (!includeContest) {
      return json({
        ok: true,
        referralApplied,
        referralEntries: summary.entries,
        referralPendingKeys: summary.pendingKeys,
        referralPendingCrystals: summary.pendingCrystals,
      });
    }

    const contest = await buildReferralContestSnapshot(
      supabase,
      auth.wallet,
      now.getTime(),
      Number.isFinite(contestLimit) ? contestLimit : REFERRAL_CONTEST_LEADERBOARD_DEFAULT_LIMIT,
    );
    if (!contest.ok) {
      return json({ ok: false, error: contest.error });
    }

    return json({
      ok: true,
      referralApplied,
      referralEntries: summary.entries,
      referralPendingKeys: summary.pendingKeys,
      referralPendingCrystals: summary.pendingCrystals,
      referralContest: contest.contest,
      referralContestLeaderboard: contest.leaderboard,
      referralContestPlayer: contest.player,
      referralContestTotalParticipants: contest.totalParticipants,
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

  if (action === "miner_buy") {
    const miner = getMinerDefinition(body.minerId);
    if (!miner) {
      return json({ ok: false, error: "Invalid miner." });
    }

    const txSignature = String(body.txSignature ?? "").trim().slice(0, 120);
    if (!isTxSignatureLike(txSignature)) {
      return json({ ok: false, error: "Invalid payment transaction signature." });
    }

    const alreadyProcessed = await wasMinerTxAlreadyProcessed(supabase, auth.wallet, txSignature);
    if (alreadyProcessed) {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("state, updated_at")
        .eq("wallet", auth.wallet)
        .maybeSingle();
      const state = normalizeState(profileRow?.state ?? null);
      if (!state) return json({ ok: false, error: "Profile not found." });
      const minerState = getMinerLeaseState(state, now.getTime());
      return json({
        ok: true,
        minerAlreadyProcessed: true,
        miners: minerState.leases,
        minerLeaseId: minerState.leaseId,
        minerCarryCrystals: minerState.carryCrystals,
        savedAt: String(profileRow?.updated_at ?? ""),
      });
    }

    const txCheck = await verifyMinerPaymentTx(auth.wallet, txSignature, miner.lamports, now);
    if (!txCheck.ok) {
      return json({ ok: false, error: txCheck.error });
    }

    const creditResult = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      addMinerLeaseToState(state, miner.id as MinerId, now.getTime());
    });
    if (!creditResult.ok || !creditResult.state) {
      return json({ ok: false, error: creditResult.error || "Failed to activate miner lease, retry." });
    }

    const minerState = getMinerLeaseState(creditResult.state, now.getTime());
    await auditEvent(supabase, auth.wallet, "miner_buy", {
      minerId: miner.id,
      crystalsPerDay: miner.crystalsPerDay,
      leaseDays: MINER_LEASE_DURATION_DAYS,
      txSignature,
      lamports: miner.lamports,
      txBlockTime: txCheck.blockTime,
      txSlot: txCheck.slot,
      leases: minerState.leases.length,
    });

    return json({
      ok: true,
      minerAlreadyProcessed: false,
      miners: minerState.leases,
      minerLeaseId: minerState.leaseId,
      minerCarryCrystals: minerState.carryCrystals,
      savedAt: typeof creditResult.updatedAt === "string" ? creditResult.updatedAt : undefined,
    });
  }

  if (action === "premium_buy") {
    const plan = getPremiumPlan(body.planId, body.days);
    if (!plan) {
      return json({ ok: false, error: "Invalid Premium plan." });
    }
    const pricing = getPremiumPlanPricing(plan, now);

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

    const txCheck = await verifyPremiumPaymentTx(auth.wallet, txSignature, pricing.lamports, now);
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
          lamports: pricing.lamports,
          saleActive: pricing.saleActive,
          discountRate: pricing.discountRate,
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
      const prosperityBonus = Math.min(0.1, getEquipmentStatBonusFromState(state, "prosperity") * 0.0008);
      const villageGoldEffect = getEquipmentEffectBonusFromState(state, "village-gold");
      const villageGoldMultiplier = 1 + prosperityBonus + villageGoldEffect;
      const pending = {
        gold: Math.max(0, Math.floor(pendingRaw.goldExact * villageGoldMultiplier)),
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

  if (action === "quest_claim") {
    const questId = String(body.questId ?? "").trim();
    const quest = QUEST_DEFINITIONS.find((entry) => entry.id === questId);
    if (!quest) {
      return json({ ok: false, error: "Unknown quest." });
    }

    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      const questStates = normalizeQuestStates(state.questStates);
      if (questStates[quest.id]?.claimed) {
        throw new Error("Quest already claimed.");
      }
      const progress = getQuestProgressFromState(state, quest);
      if (progress < quest.target) {
        throw new Error("Quest is not complete yet.");
      }
      questStates[quest.id] = { claimed: true };
      state.questStates = questStates;
      state.gold = Math.max(0, asInt(state.gold, 0)) + quest.rewardGold;
      if (quest.rewardItem) {
        addConsumableToState(state, quest.rewardItem);
      }
    });

    if (!updated.ok || !updated.state) {
      return json({ ok: false, error: updated.error || "Failed to claim quest." });
    }

    await auditEvent(supabase, auth.wallet, "quest_claim", {
      questId: quest.id,
      rewardGold: quest.rewardGold,
      rewardItem: quest.rewardItem ?? "",
    });

    return json({
      ok: true,
      savedAt: updated.updatedAt,
      gold: Math.max(0, asInt(updated.state.gold, 0)),
      consumables: normalizeConsumables(updated.state.consumables).rows,
      questStates: normalizeQuestStates(updated.state.questStates),
      bossMarkCycleStart: String(updated.state.bossMarkCycleStart ?? ""),
      crystalFlaskRuns: Math.max(0, asInt(updated.state.crystalFlaskRuns, 0)),
    });
  }

  if (action === "crystal_tasks_status") {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state")
      .eq("wallet", auth.wallet)
      .maybeSingle();
    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return json({ ok: false, error: "Profile not found." });
    }

    const state = normalizeState(profileRow.state as unknown);
    if (!state) return json({ ok: false, error: "Invalid profile state." });

    const tasksResult = await buildCrystalTaskStatuses(supabase, auth.wallet, now.getTime());
    if (!tasksResult.ok) return json({ ok: false, error: tasksResult.error });

    return json({
      ok: true,
      crystalTasks: tasksResult.tasks,
      adBlockId: ADSGRAM_BLOCK_ID,
      crystals: Math.max(0, asInt(state.crystals, 0)),
      crystalsEarned: Math.max(0, asInt(state.crystalsEarned, 0)),
    });
  }

  if (action === "crystal_task_open") {
    const taskIdRaw = String(body.taskId ?? "").trim();
    const taskId = CRYSTAL_TASK_IDS.find((id) => id === taskIdRaw);
    if (!taskId || (taskId !== "follow-x" && taskId !== "join-channel")) {
      return json({ ok: false, error: "Unsupported task activity." });
    }

    await supabase
      .from("security_events")
      .insert({
        wallet: auth.wallet,
        kind: "crystal_task_open",
        details: {
          taskId,
          openedAt: now.toISOString(),
        },
      });

    return json({ ok: true });
  }

  if (action === "crystal_task_claim") {
    const taskIdRaw = String(body.taskId ?? "").trim();
    const taskId = CRYSTAL_TASK_IDS.find((id) => id === taskIdRaw);
    if (!taskId) return json({ ok: false, error: "Unknown crystal task." });

    const tasksBefore = await buildCrystalTaskStatuses(supabase, auth.wallet, now.getTime());
    if (!tasksBefore.ok) return json({ ok: false, error: tasksBefore.error });

    const taskStatus = tasksBefore.tasks.find((task) => task.id === taskId);
    if (!taskStatus) return json({ ok: false, error: "Task is unavailable." });

    if (!taskStatus.repeatable && taskStatus.claimed) {
      return json({ ok: false, error: "Task already claimed." });
    }
    if (!taskStatus.canClaim || taskStatus.remainingSec > 0) {
      if (taskId === "watch-ad" && taskStatus.remainingSec > 0) {
        return json({ ok: false, error: "Ad task is on cooldown (" + String(taskStatus.remainingSec) + "s)." });
      }
      return json({ ok: false, error: "Task is not complete yet." });
    }

    if (taskId === "join-channel") {
      const telegramUserId = Math.max(0, asInt(getTelegramUserIdFromIdentity(auth.wallet), 0));
      if (telegramUserId <= 0) {
        return json({ ok: false, error: "Telegram login is required for this task." });
      }
      const membership = await isTelegramChannelMember(telegramUserId);
      if (!membership.ok) {
        return json({ ok: false, error: membership.error });
      }
      if (!membership.isMember) {
        return json({ ok: false, error: "Subscribe to the Telegram channel first." });
      }
    }

    const rewardCrystals = getCrystalTaskReward(taskId);
    if (rewardCrystals <= 0) {
      return json({ ok: false, error: "Invalid crystal task reward." });
    }

    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + rewardCrystals;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + rewardCrystals;
    });
    if (!updated.ok || !updated.state) {
      return json({ ok: false, error: updated.error || "Failed to claim crystal task." });
    }

    await supabase
      .from("security_events")
      .insert({
        wallet: auth.wallet,
        kind: "crystal_task_claim",
        details: {
          taskId,
          rewardCrystals,
          repeatable: Boolean(taskStatus.repeatable),
        },
      });

    const tasksAfter = await buildCrystalTaskStatuses(supabase, auth.wallet, now.getTime());
    if (!tasksAfter.ok) return json({ ok: false, error: tasksAfter.error });

    return json({
      ok: true,
      savedAt: typeof updated.updatedAt === "string" ? updated.updatedAt : undefined,
      crystals: Math.max(0, asInt(updated.state.crystals, 0)),
      crystalsEarned: Math.max(0, asInt(updated.state.crystalsEarned, 0)),
      crystalTasks: tasksAfter.tasks,
      adBlockId: ADSGRAM_BLOCK_ID,
    });
  }

  if (action === "partner_task_status") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "Partner tasks are available only in Telegram Mini App." });
    }

    const recentClaimsResult = await loadRecentPartnerTaskClaims(supabase, auth.wallet);
    if (!recentClaimsResult.ok) return json({ ok: false, error: recentClaimsResult.error });

    const remainingSec = getPartnerTaskRemainingSec(recentClaimsResult.claims, now.getTime());
    return json({
      ok: true,
      partnerTaskCooldownSec: PARTNER_TASK_COOLDOWN_SECONDS,
      partnerTaskRemainingSec: remainingSec,
    });
  }

  if (action === "partner_task_claim") {
    if (!isTelegramIdentity(auth.wallet)) {
      return json({ ok: false, error: "Partner tasks are available only in Telegram Mini App." });
    }

    const rewardKey = String(body.rewardKey ?? "").trim().slice(0, 512) || ADSGRAM_BLOCK_ID;
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("state")
      .eq("wallet", auth.wallet)
      .maybeSingle();
    if (profileError || !profileRow || !profileRow.state || typeof profileRow.state !== "object") {
      return json({ ok: false, error: "Profile not found." });
    }

    const currentState = normalizeState(profileRow.state as unknown);
    if (!currentState) return json({ ok: false, error: "Invalid profile state." });

    const recentClaimsResult = await loadRecentPartnerTaskClaims(supabase, auth.wallet);
    if (!recentClaimsResult.ok) return json({ ok: false, error: recentClaimsResult.error });

    const nowMs = now.getTime();
    const remainingSec = getPartnerTaskRemainingSec(recentClaimsResult.claims, nowMs);
    const normalizedRewardKey = rewardKey.toLowerCase();
    const alreadyClaimed = recentClaimsResult.claims.some((entry) => {
      const createdAtMs = new Date(String(entry.created_at ?? "")).getTime();
      if (!Number.isFinite(createdAtMs) || nowMs < createdAtMs || (nowMs - createdAtMs) > PARTNER_TASK_DUPLICATE_SUPPRESS_MS) {
        return false;
      }
      const details = entry.details && typeof entry.details === "object" && !Array.isArray(entry.details)
        ? entry.details as Record<string, unknown>
        : {};
      const entryRewardKey = String(details.rewardKey ?? "").trim().toLowerCase();
      return entryRewardKey ? entryRewardKey === normalizedRewardKey : rewardKey === ADSGRAM_BLOCK_ID;
    });

    if (alreadyClaimed) {
      return json({
        ok: true,
        partnerTaskAlreadyClaimed: true,
        crystals: Math.max(0, asInt(currentState.crystals, 0)),
        crystalsEarned: Math.max(0, asInt(currentState.crystalsEarned, 0)),
        partnerTaskCooldownSec: PARTNER_TASK_COOLDOWN_SECONDS,
        partnerTaskRemainingSec: remainingSec,
      });
    }

    if (remainingSec > 0) {
      return json({
        ok: false,
        error: "Partner task is on cooldown (" + String(remainingSec) + "s).",
        partnerTaskCooldownSec: PARTNER_TASK_COOLDOWN_SECONDS,
        partnerTaskRemainingSec: remainingSec,
      });
    }

    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      state.crystals = Math.max(0, asInt(state.crystals, 0)) + ADSGRAM_PARTNER_TASK_REWARD;
      state.crystalsEarned = Math.max(0, asInt(state.crystalsEarned, 0)) + ADSGRAM_PARTNER_TASK_REWARD;
    });
    if (!updated.ok || !updated.state) {
      return json({ ok: false, error: updated.error || "Failed to credit partner task reward." });
    }

    await auditEvent(supabase, auth.wallet, "partner_task_claim", {
      rewardKey,
      rewardCrystals: ADSGRAM_PARTNER_TASK_REWARD,
      source: "adsgram_task",
    });

    return json({
      ok: true,
      savedAt: typeof updated.updatedAt === "string" ? updated.updatedAt : undefined,
      crystals: Math.max(0, asInt(updated.state.crystals, 0)),
      crystalsEarned: Math.max(0, asInt(updated.state.crystalsEarned, 0)),
      partnerTaskRewardCrystals: ADSGRAM_PARTNER_TASK_REWARD,
      partnerTaskCooldownSec: PARTNER_TASK_COOLDOWN_SECONDS,
      partnerTaskRemainingSec: PARTNER_TASK_COOLDOWN_SECONDS,
    });
  }

  if (action === "shop_buy_consumable") {
    const consumableTypeRaw = String(body.type ?? "").trim();
    const consumableType = consumableTypeRaw === "boss-mark" || consumableTypeRaw === "crystal-flask"
      ? consumableTypeRaw as ConsumableType
      : null;
    if (!consumableType) {
      return json({ ok: false, error: "Invalid consumable type." });
    }

    const cost = consumableType === "boss-mark" ? 20000 : 7500;
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
      const gold = Math.max(0, asInt(state.gold, 0));
      if (gold < cost) {
        return json({ ok: false, error: `Not enough gold. Need ${cost}.` });
      }
      state.gold = gold - cost;
      addConsumableToState(state, consumableType);

      const expectedUpdatedAt = String(profileRow.updated_at ?? "");
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ state, updated_at: now.toISOString() })
        .eq("wallet", auth.wallet)
        .eq("updated_at", expectedUpdatedAt)
        .select("wallet")
        .maybeSingle();
      if (updateError || !updated) continue;

      await auditEvent(supabase, auth.wallet, "shop_buy_consumable", {
        consumableType,
        cost,
        gold: Math.max(0, asInt(state.gold, 0)),
      });
      return json({
        ok: true,
        savedAt: now.toISOString(),
        gold: Math.max(0, asInt(state.gold, 0)),
        consumables: normalizeConsumables(state.consumables).rows,
        bossMarkCycleStart: String(state.bossMarkCycleStart ?? ""),
        crystalFlaskRuns: Math.max(0, asInt(state.crystalFlaskRuns, 0)),
      });
    }
    return json({ ok: false, error: "Profile changed concurrently, retry purchase." });
  }

  if (action === "use_boss_mark") {
    const consumableId = Math.max(0, asInt(body.consumableId, 0));
    const boss = await ensureWorldBossCycle(supabase, now);
    if (!boss) return json({ ok: false, error: "Failed to load world boss." });
    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      if (!removeConsumableFromState(state, "boss-mark", consumableId || null)) {
        throw new Error("Boss Mark not found.");
      }
      if (String(state.bossMarkCycleStart ?? "") === boss.cycle_start) {
        throw new Error("Boss Mark is already active for this cycle.");
      }
      state.bossMarkCycleStart = boss.cycle_start;
    });
    if (!updated.ok || !updated.state) {
      return json({ ok: false, error: updated.error || "Failed to activate Boss Mark." });
    }
    await auditEvent(supabase, auth.wallet, "use_boss_mark", { cycleStart: boss.cycle_start });
    return json({
      ok: true,
      savedAt: updated.updatedAt,
      consumables: normalizeConsumables(updated.state.consumables).rows,
      bossMarkCycleStart: String(updated.state.bossMarkCycleStart ?? ""),
      crystalFlaskRuns: Math.max(0, asInt(updated.state.crystalFlaskRuns, 0)),
    });
  }

  if (action === "use_crystal_flask") {
    const consumableId = Math.max(0, asInt(body.consumableId, 0));
    const updated = await updateProfileWithRetry(supabase, auth.wallet, (state) => {
      if (!removeConsumableFromState(state, "crystal-flask", consumableId || null)) {
        throw new Error("Crystal Flask not found.");
      }
      const currentRuns = Math.max(0, asInt(state.crystalFlaskRuns, 0));
      state.crystalFlaskRuns = Math.min(12, currentRuns + 3);
    });
    if (!updated.ok || !updated.state) {
      return json({ ok: false, error: updated.error || "Failed to activate Crystal Flask." });
    }
    await auditEvent(supabase, auth.wallet, "use_crystal_flask", { crystalFlaskRuns: Math.max(0, asInt(updated.state.crystalFlaskRuns, 0)) });
    return json({
      ok: true,
      savedAt: updated.updatedAt,
      consumables: normalizeConsumables(updated.state.consumables).rows,
      bossMarkCycleStart: String(updated.state.bossMarkCycleStart ?? ""),
      crystalFlaskRuns: Math.max(0, asInt(updated.state.crystalFlaskRuns, 0)),
    });
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
      const combatProfile = await loadWorldBossCombatProfile(supabase, auth.wallet);
      const bossMarkMultiplier = combatProfile.bossMarkCycleStart === boss.cycle_start ? 1.25 : 1;
      const passiveDamageRaw = Math.max(0, Math.floor(elapsedSec * combatProfile.attack * combatProfile.multiplier * bossMarkMultiplier));
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

  if (action === "admin_season_start") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const activeSeasonResult = await getActiveSeason(supabase);
    if (!activeSeasonResult.ok) return json({ ok: false, error: activeSeasonResult.error });
    if (activeSeasonResult.season) {
      return json({ ok: false, error: "Close the current active season first." });
    }

    const name = String(body.name ?? "Crystal Season").trim().slice(0, 80) || "Crystal Season";
    const durationDays = clampInt(body.durationDays, 1, 90);
    const poolUsdtRaw = Number(body.poolUsdt ?? 0);
    if (!Number.isFinite(poolUsdtRaw) || poolUsdtRaw < 0) {
      return json({ ok: false, error: "Enter a valid USDT pool." });
    }

    const startAt = now.toISOString();
    const endAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("seasons")
      .insert({
        name,
        start_at: startAt,
        end_at: endAt,
        pool_usdt: Number(poolUsdtRaw.toFixed(9)),
        status: "active",
      })
      .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
      .maybeSingle();

    if (error || !data) return json({ ok: false, error: "Failed to start season." });
    await auditEvent(supabase, auth.wallet, "admin_season_start", { name, durationDays, poolUsdt: Number(poolUsdtRaw.toFixed(9)) });
    return json({ ok: true, season: normalizeSeason(data as Record<string, unknown>) });
  }

  if (action === "admin_season_update_pool") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const activeSeasonResult = await getActiveSeason(supabase);
    if (!activeSeasonResult.ok) return json({ ok: false, error: activeSeasonResult.error });
    if (!activeSeasonResult.season) {
      return json({ ok: false, error: "No active season to update." });
    }

    const poolUsdtRaw = Number(body.poolUsdt ?? body.poolSol ?? 0);
    if (!Number.isFinite(poolUsdtRaw) || poolUsdtRaw < 0) {
      return json({ ok: false, error: "Enter a valid USDT pool." });
    }

    const { data, error } = await supabase
      .from("seasons")
      .update({ pool_usdt: Number(poolUsdtRaw.toFixed(9)) })
      .eq("id", activeSeasonResult.season.id)
      .eq("status", "active")
      .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
      .maybeSingle();

    if (error || !data) return json({ ok: false, error: "Failed to update season pool." });

    await auditEvent(supabase, auth.wallet, "admin_season_update_pool", {
      seasonId: activeSeasonResult.season.id,
      poolUsdt: Number(poolUsdtRaw.toFixed(9)),
    });

    return json({ ok: true, season: normalizeSeason(data as Record<string, unknown>) });
  }

  if (action === "admin_season_preview") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const activeSeasonResult = await getActiveSeason(supabase);
    if (!activeSeasonResult.ok) return json({ ok: false, error: activeSeasonResult.error });
    if (!activeSeasonResult.season) {
      return json({ ok: false, error: "No active season to preview." });
    }

    const limit = clampInt(body.limit, 1, 10000);
    const profileRowsResult = await loadSeasonProfileRows(supabase);
    if (!profileRowsResult.ok) return json({ ok: false, error: profileRowsResult.error });

    const computed = buildSeasonComputedRows(
      profileRowsResult.rows,
      Number(activeSeasonResult.season.poolUsdt ?? 0),
      now.getTime(),
      MIN_SEASON_SNAPSHOT_CRYSTALS,
    );

    return json({
      ok: true,
      season: activeSeasonResult.season,
      seasonMinCrystals: MIN_SEASON_SNAPSHOT_CRYSTALS,
      seasonPreview: computed.rows.slice(0, limit).map((row, index) => ({
        rank: index + 1,
        wallet: row.wallet,
        name: row.name,
        crystals: row.crystalsSnapshot,
        premiumActive: row.premiumActive,
        effectiveCrystals: row.effectiveCrystals,
        share: row.share,
        payoutUsdt: row.payoutUsdt,
      })),
      seasonTotalPlayers: computed.totalPlayers,
      seasonTotalCrystals: computed.totalCrystals,
      seasonTotalEffectiveCrystals: computed.totalEffectiveCrystals,
    });
  }

  if (action === "admin_season_snapshot") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    let season = null as ReturnType<typeof normalizeSeason>;
    const seasonId = String(body.seasonId ?? "").trim();
    if (seasonId) {
      const { data, error } = await supabase
        .from("seasons")
        .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
        .eq("id", seasonId)
        .maybeSingle();
      if (error) return json({ ok: false, error: "Failed to load season snapshot." });
      season = normalizeSeason((data as Record<string, unknown> | null) ?? null);
    } else {
      const latestClosed = await getLatestClosedSeason(supabase);
      if (!latestClosed.ok) return json({ ok: false, error: latestClosed.error });
      season = latestClosed.season;
    }

    if (!season) return json({ ok: false, error: "No closed season found." });

    const limit = clampInt(body.limit, 20, 1000);
    const { data, error } = await supabase
      .from("season_snapshots")
      .select("id, season_id, wallet, name, crystals_snapshot, premium_active, effective_crystals, share, payout_usdt, excluded, exclude_reason, created_at")
      .eq("season_id", season.id)
      .gte("crystals_snapshot", MIN_SEASON_SNAPSHOT_CRYSTALS)
      .order("payout_usdt", { ascending: false })
      .limit(limit);
    if (error) return json({ ok: false, error: "Failed to load season snapshot rows." });

    const rows = ((data as SeasonSnapshotRow[] | null) ?? []).map((row, index) => ({
      rank: index + 1,
      wallet: String(row.wallet ?? ""),
      name: String(row.name ?? "Unknown"),
      crystals: Math.max(0, Number(row.crystals_snapshot ?? 0)),
      premiumActive: Boolean(row.premium_active),
      effectiveCrystals: Math.max(0, Number(row.effective_crystals ?? 0)),
      share: Math.max(0, Number(row.share ?? 0)),
      payoutUsdt: Math.max(0, Number(row.payout_usdt ?? 0)),
      excluded: Boolean(row.excluded),
      excludeReason: String(row.exclude_reason ?? ""),
    }));

    return json({
      ok: true,
      season,
      seasonMinCrystals: MIN_SEASON_SNAPSHOT_CRYSTALS,
      seasonSnapshot: rows,
      seasonTotalPlayers: rows.length,
      seasonTotalCrystals: rows.reduce((sum, row) => sum + row.crystals, 0),
      seasonTotalEffectiveCrystals: Number(rows.reduce((sum, row) => sum + row.effectiveCrystals, 0).toFixed(3)),
    });
  }

  if (action === "admin_season_close") {
    const adminWallets = toWalletList(Deno.env.get("ADMIN_WALLETS"));
    if (!adminWallets.includes(auth.wallet)) {
      return json({ ok: false, error: "Admin access required." });
    }

    const { data: closedSeasonId, error } = await supabase.rpc("close_active_season");
    if (error) {
      return json({ ok: false, error: String(error.message ?? "Failed to close season.") });
    }
    const seasonId = String(closedSeasonId ?? "").trim();
    if (!seasonId) return json({ ok: false, error: "Season close did not return an id." });

    await auditEvent(supabase, auth.wallet, "admin_season_close", { seasonId });

    const { data: seasonRow } = await supabase
      .from("seasons")
      .select("id, name, start_at, end_at, pool_usdt, status, closed_at, created_at")
      .eq("id", seasonId)
      .maybeSingle();
    const { data: snapshotRows } = await supabase
      .from("season_snapshots")
      .select("id, season_id, wallet, name, crystals_snapshot, premium_active, effective_crystals, share, payout_usdt, excluded, exclude_reason, created_at")
      .eq("season_id", seasonId)
      .gte("crystals_snapshot", MIN_SEASON_SNAPSHOT_CRYSTALS)
      .order("payout_usdt", { ascending: false })
      .limit(clampInt(body.limit, 20, 1000));

    const rows = ((snapshotRows as SeasonSnapshotRow[] | null) ?? []).map((row, index) => ({
      rank: index + 1,
      wallet: String(row.wallet ?? ""),
      name: String(row.name ?? "Unknown"),
      crystals: Math.max(0, Number(row.crystals_snapshot ?? 0)),
      premiumActive: Boolean(row.premium_active),
      effectiveCrystals: Math.max(0, Number(row.effective_crystals ?? 0)),
      share: Math.max(0, Number(row.share ?? 0)),
      payoutUsdt: Math.max(0, Number(row.payout_usdt ?? 0)),
      excluded: Boolean(row.excluded),
      excludeReason: String(row.exclude_reason ?? ""),
    }));

    return json({
      ok: true,
      season: normalizeSeason((seasonRow as Record<string, unknown> | null) ?? null),
      seasonSnapshot: rows,
      seasonTotalPlayers: rows.length,
      seasonTotalCrystals: rows.reduce((sum, row) => sum + row.crystals, 0),
      seasonTotalEffectiveCrystals: Number(rows.reduce((sum, row) => sum + row.effectiveCrystals, 0).toFixed(3)),
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

  return json({ ok: false, error: "Unknown action." });
});
