import { useEffect, useMemo, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction } from '@solana/web3.js'
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token'
import knightSprite from './assets/knight.png'
import mageSprite from './assets/mage.png'
import archerSprite from './assets/archer.png'
import elonSprite from './assets/elon.png'
import gakeSprite from './assets/gake.png'
import goblinSprite from './assets/monsters/goblin.png'
import deathEyeSprite from './assets/monsters/death eye.png'
import mushroomSprite from './assets/monsters/mushroom.png'
import skeletonWarriorSprite from './assets/monsters/skeleton warrior.png'
import blackWizardSprite from './assets/monsters/black wizard.png'
import firewormSprite from './assets/monsters/fireworm.png'
import iceDragonSprite from './assets/monsters/ice dragon.png'
import lavaDemonSprite from './assets/monsters/lava demon.png'
import worldTilesetBase from './assets/world/pipo-map001.png'
import worldTilesetAt from './assets/world/pipo-map001_at.png'
import house1Sprite from './assets/props/house1.png'
import house2Sprite from './assets/props/house2.png'
import house3Sprite from './assets/props/house3.png'
import castleSprite from './assets/props/castle.png'
import darkCastleSprite from './assets/props/dark castle.png'
import iconGold from './assets/icons/gold.png'
import iconCrystals from './assets/icons/crystals.png'
import iconInventory from './assets/icons/inventory.png'
import iconDungeons from './assets/icons/dungeons.png'
import iconShop from './assets/icons/shop.png'
import iconName from './assets/icons/name.png'
import iconKey from './assets/icons/key.png'
import iconEnergyTonic from './assets/icons/energy-tonic.png'
import iconGrandEnergy from './assets/icons/grand-energy-elixir.png'
import iconSwiftDraught from './assets/icons/swift-draught.png'
import iconAttackSpeed from './assets/icons/attack-speed.png'
import iconWorldBoss from './assets/icons/world-boss.png'
import iconBattle from './assets/icons/battle.png'
import iconAutoBattle from './assets/icons/autobattle.png'
import iconWithdraw from './assets/icons/withdraw.png'
import iconSolana from './assets/icons/solana.png'
import iconStacking from './assets/icons/stacking.png'
import iconBuyGold from './assets/icons/buy-gold.png'
import iconStarterPack from './assets/icons/starter-pack.png'
import iconWeapon from './assets/icons/armory-weapon.png'
import iconArmor from './assets/icons/armory-armor.png'
import iconHead from './assets/icons/armory-head.png'
import iconLegs from './assets/icons/armory-legs.png'
import iconBoots from './assets/icons/armory-boots.png'
import iconArtifact from './assets/icons/armory-artifact.png'
import iconQuests from './assets/icons/quests.png'
import goldSmallImage from './assets/shop/gold-small.png'
import goldMiddleImage from './assets/shop/gold-middle.png'
import goldLargeImage from './assets/shop/gold-large.png'
import worldBossImage from './assets/boss/world-boss.jpg'
import bgMusic from './assets/audio/bg-music.mp3'
import { supabase } from './lib/supabase'
import './App.css'

type CharacterClass = {
  id: string
  label: string
  tagline: string
  color: string
  spriteKey: PlayerSpriteKey
  stats: {
    attack: number
    attackSpeed: number
    speed: number
    range: number
  }
}

type LootEntry = {
  id: number
  name: string
  quality: string
  color: string
}

type EquipmentSlot = 'weapon' | 'armor' | 'head' | 'legs' | 'boots' | 'artifact'

type EquipmentStats = {
  attack: number
  speed: number
  attackSpeed: number
  range: number
}

type EquipmentRarity = {
  id: string
  name: string
  color: string
  weight: number
  tier: number
  power: number
  sellValue: number
}

type RarityChance = {
  id: string
  name: string
  color: string
  percent: number
}

type LevelUpNotice = {
  level: number
  chances: RarityChance[]
  prevChances: RarityChance[]
}

type QuestType = 'level' | 'kills' | 'tier' | 'dungeons'

type QuestRewardItem = 'energy-small' | 'energy-full' | 'speed' | 'attack' | 'key'

type ConsumableType = QuestRewardItem

type QuestDefinition = {
  id: string
  title: string
  description: string
  type: QuestType
  target: number
  rewardGold: number
  rewardItem?: QuestRewardItem
}

type QuestState = {
  claimed: boolean
}

type EquipmentItem = {
  id: number
  name: string
  slot: EquipmentSlot
  level: number
  rarity: string
  color: string
  bonuses: EquipmentStats
  tierScore: number
  sellValue: number
}

type ConsumableItem = {
  id: number
  type: ConsumableType
  name: string
  description: string
  icon: string
}

type WorldBossParticipant = {
  id: string
  name: string
  damage: number
  joined: boolean
  isPlayer?: boolean
  attack: number
}

type WorldBossState = {
  cycleStart: string
  cycleEnd: string
  remaining: number
  duration: number
  damageTimer: number
  participants: WorldBossParticipant[]
  pendingDamage: number
}

type WorldBossRow = {
  id: number
  cycle_start: string
  cycle_end: string
  prize_pool: number
  last_cycle_start: string | null
  last_cycle_end: string | null
  last_prize_pool: number | null
}

type WorldBossParticipantRow = {
  wallet: string
  cycle_start: string
  name: string
  damage: number
  joined: boolean
  reward_claimed: boolean
  updated_at?: string
}

type PersistedPlayerState = {
  level: number
  xp: number
  xpNext: number
  baseAttack: number
  baseAttackSpeed: number
  baseSpeed: number
  baseRange: number
}

type PersistedState = {
  version: number
  name: string
  classId: string
  player: PersistedPlayerState
  energy: number
  energyMax: number
  energyTimer: number
  gold: number
  crystals: number
  tickets: number
  ticketDay: string
  inventory: EquipmentItem[]
  equipment: Record<EquipmentSlot, EquipmentItem | null>
  consumables: ConsumableItem[]
  questStates: Record<string, QuestState>
  monsterKills: number
  dungeonRuns: number
  starterPackPurchased: boolean
  stake: StakeEntry[] | { active: boolean; amount: number; endsAt: number }
  stakeId: number
}

type AdminPlayerRow = {
  wallet: string
  name: string
  level: number
  tierScore: number
  gold: number
  crystals: number
  kills: number
  dungeons: number
  updatedAt: string
}

type AdminSummary = {
  totalPlayers: number
  active24h: number
  avgLevel: number
  avgTierScore: number
  totalGold: number
  totalCrystals: number
  totalKills: number
  totalDungeons: number
  maxLevel: number
  pendingWithdrawals: number
  pendingCrystals: number
}

type WithdrawalRow = {
  id: string
  wallet: string
  name: string
  crystals: number
  sol_amount: number
  status: string
  created_at: string
}

type AdminData = {
  summary: AdminSummary
  players: AdminPlayerRow[]
  withdrawals: WithdrawalRow[]
}

type StakeEntry = {
  id: number
  amount: number
  endsAt: number
}
type PlayerSpriteKey = 'knight' | 'mage' | 'archer' | 'elon' | 'gake'
type PlayerSpriteSource = HTMLImageElement | HTMLCanvasElement
type MonsterSpriteKey =
  | 'goblin'
  | 'death-eye'
  | 'mushroom'
  | 'skeleton-warrior'
  | 'black-wizard'
  | 'fireworm'
  | 'ice-dragon'
  | 'lava-demon'

type PropSpriteKey = 'house1' | 'house2' | 'house3' | 'castle' | 'dark-castle'

type PlayerState = {
  x: number
  y: number
  attack: number
  attackSpeed: number
  speed: number
  range: number
  baseAttack: number
  baseAttackSpeed: number
  baseSpeed: number
  baseRange: number
  level: number
  xp: number
  xpNext: number
  cooldown: number
  moving: boolean
  facing: 1 | -1
  hitFlash: number
  spriteKey: PlayerSpriteKey
}

type Monster = {
  id: number
  x: number
  y: number
  hp: number
  maxHp: number
  color: string
  name: string
  cooldown: number
  xp: number
  hitFlash: number
  sprite: number
  spriteKey: MonsterSpriteKey
  scale: number
}

type Prop = {
  id: number
  x: number
  y: number
  size: number
  spriteKey: PropSpriteKey
}

type Decoration = {
  id: number
  x: number
  y: number
  sprite: string[]
  colors: Record<string, string>
}

type PlayerSpriteMap = Record<PlayerSpriteKey, PlayerSpriteSource | null>
type MonsterSpriteMap = Record<MonsterSpriteKey, PlayerSpriteSource | null>
type PropSpriteMap = Record<PropSpriteKey, PlayerSpriteSource | null>

type EffectBase = {
  id: number
  kind: 'text' | 'slash' | 'bolt' | 'arrow' | 'impact'
  t: number
  color: string
}

type TextEffect = EffectBase & {
  kind: 'text'
  x: number
  y: number
  text: string
}

type SlashEffect = EffectBase & {
  kind: 'slash'
  x: number
  y: number
  angle: number
  size: number
}

type ProjectileEffect = EffectBase & {
  kind: 'bolt' | 'arrow'
  fromX: number
  fromY: number
  toX: number
  toY: number
}

type ImpactEffect = EffectBase & {
  kind: 'impact'
  x: number
  y: number
  size: number
}

type Effect = TextEffect | SlashEffect | ProjectileEffect | ImpactEffect

type EffectInput =
  | Omit<TextEffect, 'id'>
  | Omit<SlashEffect, 'id'>
  | Omit<ProjectileEffect, 'id'>
  | Omit<ImpactEffect, 'id'>

type BackgroundCache = {
  canvas: HTMLCanvasElement | null
  ready: boolean
}

type WorldTileset = {
  firstGid: number
  columns: number
  imageSrc: string
  image: HTMLImageElement | null
}

type GameState = {
  player: PlayerState
  monsters: Monster[]
  name: string
  classId: string
  classLabel: string
  lootLog: LootEntry[]
  eventLog: string[]
  lootId: number
  itemId: number
  consumableId: number
  monsterId: number
  effects: Effect[]
  effectId: number
  decorations: Decoration[]
  time: number
  energy: number
  energyMax: number
  energyTimer: number
  gold: number
  crystals: number
  tickets: number
  ticketDay: string
  inventory: EquipmentItem[]
  consumables: ConsumableItem[]
  equipment: Record<EquipmentSlot, EquipmentItem | null>
  pendingLoot: EquipmentItem | null
  levelUpNotice: LevelUpNotice | null
  autoBattle: boolean
  battleQueue: number
  battleTargetId: number | null
  speedBuffTime: number
  speedBuffMultiplier: number
  attackSpeedBuffTime: number
  attackSpeedBuffMultiplier: number
  monsterKills: number
  dungeonRuns: number
  monsterHpScale: number
  worldBoss: WorldBossState
  questStates: Record<string, QuestState>
  starterPackPurchased: boolean
  stake: StakeEntry[]
  stakeId: number
}

type HudState = {
  name: string
  classLabel: string
  level: number
  energy: number
  energyMax: number
  energyTimer: number
  xp: number
  xpNext: number
  attack: number
  speed: number
  attackSpeed: number
  range: number
  gold: number
  crystals: number
  tickets: number
  tierScore: number
  equipment: Record<EquipmentSlot, EquipmentItem | null>
  inventory: EquipmentItem[]
  consumables: ConsumableItem[]
  pendingLoot: EquipmentItem | null
  levelUpNotice: LevelUpNotice | null
  loot: LootEntry[]
  events: string[]
  autoBattle: boolean
  speedBuffTime: number
  speedBuffMultiplier: number
  attackSpeedBuffTime: number
  attackSpeedBuffMultiplier: number
  monsterKills: number
  dungeonRuns: number
  worldBoss: WorldBossState
  questStates: Record<string, QuestState>
  starterPackPurchased: boolean
  stake: StakeEntry[]
}

const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'knight',
    label: 'Knight',
    tagline: 'Shielded frontline',
    color: '#f4c36a',
    spriteKey: 'knight',
    stats: { attack: 16, attackSpeed: 0.9, speed: 58, range: 16 },
  },
  {
    id: 'mage',
    label: 'Mage',
    tagline: 'Arcane bursts',
    color: '#b36bff',
    spriteKey: 'mage',
    stats: { attack: 18, attackSpeed: 1.1, speed: 62, range: 22 },
  },
  {
    id: 'archer',
    label: 'Archer',
    tagline: 'Swift volleys',
    color: '#7bd88f',
    spriteKey: 'archer',
    stats: { attack: 14, attackSpeed: 1.4, speed: 78, range: 20 },
  },
  {
    id: 'elon',
    label: 'Elon',
    tagline: 'Starlit commander',
    color: '#7fd2ff',
    spriteKey: 'elon',
    stats: { attack: 17, attackSpeed: 1.05, speed: 68, range: 24 },
  },
  {
    id: 'gake',
    label: 'Gake',
    tagline: 'Trickster scout',
    color: '#ffb347',
    spriteKey: 'gake',
    stats: { attack: 15, attackSpeed: 1.25, speed: 82, range: 18 },
  },
]

const ENERGY_MAX = 50
const ENERGY_REGEN_SECONDS = 240
const TICKETS_MAX = 10
const SHOP_TICKET_CAP = 30
const MAX_LEVEL = 255
const XP_BASE = 200
const XP_SCALE = 3
const XP_POWER = 1.2

const EQUIPMENT_SLOTS: { id: EquipmentSlot; label: string }[] = [
  { id: 'weapon', label: 'Weapon' },
  { id: 'armor', label: 'Armor' },
  { id: 'head', label: 'Headgear' },
  { id: 'legs', label: 'Pants' },
  { id: 'boots', label: 'Boots' },
  { id: 'artifact', label: 'Artifact' },
]

const EQUIPMENT_ICONS: Record<EquipmentSlot, string> = {
  weapon: iconWeapon,
  armor: iconArmor,
  head: iconHead,
  legs: iconLegs,
  boots: iconBoots,
  artifact: iconArtifact,
}

const EQUIPMENT_RARITIES: EquipmentRarity[] = [
  { id: 'common', name: 'Common', color: '#c7c7c7', weight: 60, tier: 1, power: 1, sellValue: 10 },
  { id: 'uncommon', name: 'Uncommon', color: '#7bd88f', weight: 22, tier: 2, power: 1.2, sellValue: 20 },
  { id: 'rare', name: 'Rare', color: '#5aa7ff', weight: 10, tier: 3, power: 1.45, sellValue: 40 },
  { id: 'epic', name: 'Epic', color: '#b36bff', weight: 5, tier: 4, power: 1.8, sellValue: 75 },
  { id: 'legendary', name: 'Legendary', color: '#ffb347', weight: 2.5, tier: 5, power: 2.3, sellValue: 130 },
  { id: 'mythic', name: 'Mythic', color: '#ff6bd6', weight: 0.9, tier: 6, power: 2.9, sellValue: 210 },
  { id: 'ancient', name: 'Ancient', color: '#ffe36b', weight: 0.3, tier: 7, power: 3.6, sellValue: 320 },
]

const EQUIPMENT_BASE_NAMES: Record<EquipmentSlot, string[]> = {
  weapon: ['Blade', 'Staff', 'Bow', 'Axe', 'Spear'],
  armor: ['Plate', 'Tunic', 'Carapace', 'Mail', 'Robe'],
  head: ['Helm', 'Hood', 'Circlet', 'Mask', 'Crown'],
  legs: ['Greaves', 'Legwraps', 'Pants', 'Kilt', 'Leggings'],
  boots: ['Boots', 'Sabatons', 'Treads', 'Sandals', 'Shoes'],
  artifact: ['Charm', 'Relic', 'Sigil', 'Gem', 'Talisman'],
}

const EQUIPMENT_PREFIXES = ['Warden', 'Ashen', 'Starbound', 'Hallowed', 'Ironroot', 'Mistveil', 'Sunfire', 'Voidborn']

const EQUIPMENT_BONUS_TEMPLATES: Record<EquipmentSlot, Partial<EquipmentStats>> = {
  weapon: { attack: 4, attackSpeed: 0.05 },
  armor: { attack: 1 },
  head: { attack: 2 },
  legs: { speed: 3 },
  boots: { speed: 6 },
  artifact: { attackSpeed: 0.06, range: 2 },
}

const range = (start: number, end: number, step: number) => {
  const values: number[] = []
  for (let value = start; value <= end; value += step) {
    values.push(value)
  }
  return values
}

const LEVEL_QUEST_TARGETS = [...range(5, 50, 5), ...range(60, 150, 10), ...range(160, 250, 10), 255]
const KILL_QUEST_TARGETS = [
  25, 50, 100, 175, 250, 350, 500, 700, 950, 1250, 1600, 2000, 2600, 3400, 4500, 6000, 8000, 10500,
  13500, 17000, 21000, 26000, 32000, 39000, 47000, 56000,
]
const TIER_QUEST_TARGETS = [
  300, 600, 1000, 1600, 2400, 3400, 4700, 6200, 8000, 10000, 12500, 15500, 19000, 23000, 27500, 32000,
  36500, 41000, 45000,
]
const DUNGEON_QUEST_TARGETS = [1, 2, 3, 5, 7, 10, 14, 18, 23, 28, 35, 43, 52, 62, 74, 88, 104, 122, 142, 165]

const questRewardItemName = (item?: QuestRewardItem) => {
  switch (item) {
    case 'energy-small':
      return 'Energy Tonic'
    case 'energy-full':
      return 'Grand Energy Elixir'
    case 'speed':
      return 'Swift Draught'
    case 'attack':
      return 'Battle Tonic'
    case 'key':
      return 'Dungeon Key'
    default:
      return ''
  }
}

const CONSUMABLE_DEFS: Record<ConsumableType, { name: string; description: string; icon: string }> = {
  'energy-small': { name: 'Energy Tonic', description: 'Restore 10 energy.', icon: iconEnergyTonic },
  'energy-full': { name: 'Grand Energy Elixir', description: 'Restore energy to full.', icon: iconGrandEnergy },
  speed: { name: 'Swift Draught', description: '+50% speed for 5 minutes.', icon: iconSwiftDraught },
  attack: { name: 'Battle Tonic', description: '+50% attack speed for 5 minutes.', icon: iconAttackSpeed },
  key: { name: 'Dungeon Key', description: '+1 dungeon entry.', icon: iconKey },
}

const createConsumable = (id: number, type: ConsumableType): ConsumableItem => {
  const def = CONSUMABLE_DEFS[type]
  return {
    id,
    type,
    name: def.name,
    description: def.description,
    icon: def.icon,
  }
}

const scaleRewardGold = (index: number, total: number, min: number, max: number) => {
  if (total <= 1) return max
  const ratio = index / (total - 1)
  return Math.round(min + (max - min) * ratio)
}

const buildQuestList = (): QuestDefinition[] => {
  const quests: QuestDefinition[] = []

  LEVEL_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = scaleRewardGold(index, LEVEL_QUEST_TARGETS.length, 200, 2200)
    const rewardItem: QuestRewardItem =
      target >= 255 ? 'key' : target >= 200 ? 'energy-full' : target >= 140 ? 'attack' : target >= 80 ? 'speed' : 'energy-small'
    quests.push({
      id: `level-${target}`,
      title: `Reach level ${target}`,
      description: `Reach level ${target}.`,
      type: 'level',
      target,
      rewardGold,
      rewardItem,
    })
  })

  KILL_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = scaleRewardGold(index, KILL_QUEST_TARGETS.length, 250, 2500)
    const rewardItem: QuestRewardItem =
      target >= 56000 ? 'key' : target >= 32000 ? 'energy-full' : target >= 16000 ? 'attack' : target >= 4500 ? 'speed' : 'energy-small'
    quests.push({
      id: `kills-${target}`,
      title: `Slay ${target} monsters`,
      description: `Defeat ${target} monsters.`,
      type: 'kills',
      target,
      rewardGold,
      rewardItem,
    })
  })

  TIER_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = scaleRewardGold(index, TIER_QUEST_TARGETS.length, 300, 3000)
    const rewardItem: QuestRewardItem =
      target >= 45000 ? 'key' : target >= 32000 ? 'energy-full' : target >= 19000 ? 'attack' : target >= 8000 ? 'speed' : 'energy-small'
    quests.push({
      id: `tier-${target}`,
      title: `Tier Score ${target}`,
      description: `Reach Tier Score ${target}.`,
      type: 'tier',
      target,
      rewardGold,
      rewardItem,
    })
  })

  DUNGEON_QUEST_TARGETS.forEach((target, index) => {
    const rewardGold = scaleRewardGold(index, DUNGEON_QUEST_TARGETS.length, 350, 3200)
    const rewardItem: QuestRewardItem =
      target >= 165 ? 'key' : target >= 104 ? 'energy-full' : target >= 62 ? 'attack' : target >= 23 ? 'speed' : 'energy-small'
    quests.push({
      id: `dungeons-${target}`,
      title: `Clear dungeons ${target}x`,
      description: `Clear dungeons ${target} times.`,
      type: 'dungeons',
      target,
      rewardGold,
      rewardItem,
    })
  })

  return quests
}

const QUESTS = buildQuestList()

const DUNGEON_REQUIREMENTS = [
  450, 1673, 3002, 4447, 6133, 7818, 9619, 11536, 13569, 15718,
  18162, 20551, 23056, 25677, 28414, 31267, 34468, 37562, 40771, 44096,
]

const DUNGEONS = DUNGEON_REQUIREMENTS.map((tierScore, index) => ({
  id: `crypt-${index + 1}`,
  name: `Crypt ${index + 1}`,
  tierScore,
  reward: Math.round(6 + (index + 1) * 4 + Math.pow(index + 1, 1.1)),
}))

const WORLD_BOSS_DURATION = 5 * 60 * 60
const WORLD_BOSS_REWARD = 1000
const WITHDRAW_RATE = 10000
const WITHDRAW_MIN = 1000
const STAKE_DURATION = 12 * 60 * 60
const STAKE_BONUS = 0.1
const STAKE_MIN = 50
const GOLD_STORE_WALLET = new PublicKey('9a5GXRjX6HKh9Yjc9d7gp9RFmuRvMQAcV1VJ9WV7LU8c')
const GOLD_PACKAGES = [
  { id: 'gold-50k', gold: 50000, sol: 0.05, image: goldSmallImage },
  { id: 'gold-100k', gold: 100000, sol: 0.1, image: goldMiddleImage },
  { id: 'gold-500k', gold: 500000, sol: 0.4, image: goldLargeImage },
]
const STARTER_PACK_PRICE = 0.35
const STARTER_PACK_GOLD = 300000
const STARTER_PACK_ITEMS: { type: ConsumableType; qty: number }[] = [
  { type: 'energy-small', qty: 20 },
  { type: 'energy-full', qty: 5 },
  { type: 'speed', qty: 10 },
  { type: 'attack', qty: 10 },
  { type: 'key', qty: 20 },
]
const CONTRACT_ADDRESS = 'MwrJUawMcT9TUmViZJnReBPzUeeZDtx6DvHY2ukBAGS'
const TOKEN_SYMBOL = (import.meta.env.VITE_TOKEN_SYMBOL as string | undefined) ?? 'DQ'
const TOKEN_MINT = new PublicKey(CONTRACT_ADDRESS)
const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112')

const MONSTER_HP_TIER_TARGET = 30000
const MONSTER_HP_TIER_EXCESS = 0.2
const PERSIST_VERSION = 1

const getMonsterHpMultiplier = (tierScore: number) => {
  if (tierScore <= 0) return 1
  const ratio = tierScore / MONSTER_HP_TIER_TARGET
  const baseRatio = Math.min(1, ratio)
  const base = 1 + baseRatio * 1.6 + baseRatio * baseRatio * 0.6
  const excess = Math.max(0, ratio - 1)
  const extra = 1 + excess * MONSTER_HP_TIER_EXCESS
  return base * extra
}

const createWorldBossState = (playerName: string, cycleStart = '', cycleEnd = ''): WorldBossState => {
  const participants: WorldBossParticipant[] = [
    {
      id: 'player',
      name: playerName || 'Hero',
      damage: 0,
      joined: false,
      isPlayer: true,
      attack: 0,
    },
  ]
  return {
    cycleStart,
    cycleEnd,
    remaining: WORLD_BOSS_DURATION,
    duration: WORLD_BOSS_DURATION,
    damageTimer: 0,
    participants,
    pendingDamage: 0,
  }
}

const ensureWorldBossCycle = async (): Promise<WorldBossRow | null> => {
  if (!supabase) return null
  const now = new Date()
  const { data: existing, error } = await supabase.from('world_boss').select('*').eq('id', 1).maybeSingle()
  if (error) {
    console.warn('World boss load failed', error)
    return null
  }

  if (!existing) {
    const cycleStart = now.toISOString()
    const cycleEnd = new Date(now.getTime() + WORLD_BOSS_DURATION * 1000).toISOString()
    const { data } = await supabase
      .from('world_boss')
      .upsert(
        {
          id: 1,
          cycle_start: cycleStart,
          cycle_end: cycleEnd,
          prize_pool: WORLD_BOSS_REWARD,
          last_cycle_start: null,
          last_cycle_end: null,
          last_prize_pool: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select()
      .single()
    return data as WorldBossRow
  }

  const cycleEnd = new Date(existing.cycle_end)
  if (cycleEnd.getTime() <= now.getTime()) {
    const newStart = now.toISOString()
    const newEnd = new Date(now.getTime() + WORLD_BOSS_DURATION * 1000).toISOString()
    const { data } = await supabase
      .from('world_boss')
      .update({
        cycle_start: newStart,
        cycle_end: newEnd,
        prize_pool: WORLD_BOSS_REWARD,
        last_cycle_start: existing.cycle_start,
        last_cycle_end: existing.cycle_end,
        last_prize_pool: existing.prize_pool,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()
    return data as WorldBossRow
  }

  return existing as WorldBossRow
}

const fetchWorldBossParticipants = async (cycleStart: string): Promise<WorldBossParticipantRow[]> => {
  if (!supabase || !cycleStart) return []
  const { data, error } = await supabase
    .from('world_boss_participants')
    .select('wallet, cycle_start, name, damage, joined, reward_claimed, updated_at')
    .eq('cycle_start', cycleStart)
    .order('damage', { ascending: false })
    .limit(100)
  if (error) {
    console.warn('World boss participants load failed', error)
    return []
  }
  return (data as WorldBossParticipantRow[]) ?? []
}

const upsertWorldBossParticipant = async (
  wallet: string,
  cycleStart: string,
  name: string,
  damage: number,
  joined: boolean,
) => {
  if (!supabase) return
  const { error } = await supabase
    .from('world_boss_participants')
    .upsert(
      {
        wallet,
        cycle_start: cycleStart,
        name,
        damage,
        joined,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'wallet,cycle_start' },
    )
  if (error) {
    console.warn('World boss participant upsert failed', error)
  }
}

const maybeClaimWorldBossReward = async (wallet: string, boss: WorldBossRow, state: GameState) => {
  if (!supabase || !boss.last_cycle_start || !boss.last_cycle_end || !boss.last_prize_pool) return
  const now = new Date()
  if (now.getTime() <= new Date(boss.last_cycle_end).getTime()) return

  const { data: playerRow, error: playerError } = await supabase
    .from('world_boss_participants')
    .select('wallet, cycle_start, name, damage, joined, reward_claimed')
    .eq('cycle_start', boss.last_cycle_start)
    .eq('wallet', wallet)
    .maybeSingle()

  if (playerError || !playerRow || playerRow.reward_claimed || !playerRow.joined) return

  const { data: totals, error: totalError } = await supabase
    .from('world_boss_participants')
    .select('damage')
    .eq('cycle_start', boss.last_cycle_start)
    .eq('joined', true)

  if (totalError || !totals) return
  const totalDamage = totals.reduce((sum, entry) => sum + Number(entry.damage), 0)
  if (totalDamage <= 0) return

  const share = Math.floor((boss.last_prize_pool * Number(playerRow.damage)) / totalDamage)
  if (share <= 0) return

  state.crystals += share
  pushLog(state.eventLog, `World boss rewards: +${share} crystals.`)

  await supabase
    .from('world_boss_participants')
    .update({ reward_claimed: true, updated_at: new Date().toISOString() })
    .eq('wallet', wallet)
    .eq('cycle_start', boss.last_cycle_start)

  await saveProfileState(wallet, state)
}

const buildPersistedState = (state: GameState): PersistedState => ({
  version: PERSIST_VERSION,
  name: sanitizePlayerName(state.name),
  classId: state.classId,
  player: {
    level: state.player.level,
    xp: state.player.xp,
    xpNext: state.player.xpNext,
    baseAttack: state.player.baseAttack,
    baseAttackSpeed: state.player.baseAttackSpeed,
    baseSpeed: state.player.baseSpeed,
    baseRange: state.player.baseRange,
  },
  energy: state.energy,
  energyMax: state.energyMax,
  energyTimer: state.energyTimer,
  gold: state.gold,
  crystals: state.crystals,
  tickets: state.tickets,
  ticketDay: state.ticketDay,
  inventory: state.inventory,
  equipment: state.equipment,
  consumables: state.consumables,
  questStates: state.questStates,
  monsterKills: state.monsterKills,
  dungeonRuns: state.dungeonRuns,
  starterPackPurchased: state.starterPackPurchased,
  stake: state.stake,
  stakeId: state.stakeId,
})

const applyPersistedState = (state: GameState, saved: PersistedState) => {
  if (!saved || saved.version !== PERSIST_VERSION) return

  const classMatch = CHARACTER_CLASSES.find((entry) => entry.id === saved.classId)
  if (classMatch) {
    state.classId = classMatch.id
    state.classLabel = classMatch.label
    state.player.spriteKey = classMatch.spriteKey
  }

  const sanitizedName = sanitizePlayerName(saved.name || state.name)
  state.name = sanitizedName || state.name

  const player = state.player
  const savedPlayer = saved.player
  if (savedPlayer) {
    player.level = clamp(savedPlayer.level ?? player.level, 1, MAX_LEVEL)
    player.xp = Math.max(0, savedPlayer.xp ?? player.xp)
    player.xpNext = Math.max(1, savedPlayer.xpNext ?? getXpForLevel(player.level))
    player.baseAttack = savedPlayer.baseAttack ?? player.baseAttack
    player.baseAttackSpeed = savedPlayer.baseAttackSpeed ?? player.baseAttackSpeed
    player.baseSpeed = savedPlayer.baseSpeed ?? player.baseSpeed
    player.baseRange = savedPlayer.baseRange ?? player.baseRange
  }

  state.energyMax = Math.max(1, saved.energyMax ?? state.energyMax)
  state.energy = clamp(saved.energy ?? state.energy, 0, state.energyMax)
  state.energyTimer = Math.max(0, saved.energyTimer ?? state.energyTimer)
  state.gold = Math.max(0, saved.gold ?? state.gold)
  state.crystals = Math.max(0, saved.crystals ?? state.crystals)
  state.tickets = Math.max(0, saved.tickets ?? state.tickets)
  state.ticketDay = saved.ticketDay || state.ticketDay

  state.inventory = saved.inventory ?? []
  state.equipment = { ...state.equipment, ...(saved.equipment ?? {}) }
  state.consumables = saved.consumables ?? []
  state.questStates = { ...state.questStates, ...(saved.questStates ?? {}) }
  state.monsterKills = Math.max(0, saved.monsterKills ?? state.monsterKills)
  state.dungeonRuns = Math.max(0, saved.dungeonRuns ?? state.dungeonRuns)
  state.starterPackPurchased = Boolean(saved.starterPackPurchased)
  if (saved.stake) {
    if (Array.isArray(saved.stake)) {
      state.stake = saved.stake
        .map((entry) => ({
          id: Math.max(1, Number(entry.id ?? 0)),
          amount: Math.max(0, Number(entry.amount ?? 0)),
          endsAt: Math.max(0, Number(entry.endsAt ?? 0)),
        }))
        .filter((entry) => entry.amount > 0)
    } else if (saved.stake.active && saved.stake.amount > 0) {
      const legacyId = saved.stakeId ?? Date.now()
      state.stake = [
        {
          id: Number(legacyId),
          amount: Math.max(0, saved.stake.amount ?? 0),
          endsAt: Math.max(0, saved.stake.endsAt ?? 0),
        },
      ]
    } else {
      state.stake = []
    }
  }

  state.stakeId = Math.max(
    state.stakeId,
    saved.stakeId ?? 0,
    ...state.stake.map((entry) => entry.id),
    0,
  )

  const itemIds = [
    ...state.inventory.map((item) => item.id),
    ...Object.values(state.equipment)
      .filter((item): item is EquipmentItem => Boolean(item))
      .map((item) => item.id),
  ]
  const consumableIds = state.consumables.map((item) => item.id)
  state.itemId = Math.max(state.itemId, ...itemIds, 0)
  state.consumableId = Math.max(state.consumableId, ...consumableIds, 0)

  recomputePlayerStats(state)
}

const loadProfileState = async (wallet: string) => {
  if (!supabase) return null
  const { data, error } = await supabase.from('profiles').select('state').eq('wallet', wallet).maybeSingle()
  if (error) {
    console.warn('Supabase load failed', error)
    return null
  }
  return (data?.state as PersistedState | null) ?? null
}

const saveProfileState = async (wallet: string, state: GameState) => {
  if (!supabase) return
  const payload = {
    wallet,
    state: buildPersistedState(state),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'wallet' })
  if (error) {
    console.warn('Supabase save failed', error)
  }
}

const MONSTER_TYPES = [
  {
    name: 'Goblin',
    color: '#62b874',
    maxHp: 62,
    xp: 18,
    sprite: 0,
    spriteKey: 'goblin',
    scale: 0.3816,
  },
  {
    name: 'Death Eye',
    color: '#a974ff',
    maxHp: 54,
    xp: 22,
    sprite: 1,
    spriteKey: 'death-eye',
    scale: 0.345,
  },
  {
    name: 'Mushroom Brute',
    color: '#e48b5a',
    maxHp: 68,
    xp: 19,
    sprite: 2,
    spriteKey: 'mushroom',
    scale: 0.32085,
  },
  {
    name: 'Skeleton Warrior',
    color: '#c9d0d8',
    maxHp: 92,
    xp: 26,
    sprite: 3,
    spriteKey: 'skeleton-warrior',
    scale: 0.3816,
  },
  {
    name: 'Black Wizard',
    color: '#b36bff',
    maxHp: 74,
    xp: 24,
    sprite: 0,
    spriteKey: 'black-wizard',
    scale: 0.345,
  },
  {
    name: 'Fireworm',
    color: '#f57c3d',
    maxHp: 78,
    xp: 23,
    sprite: 1,
    spriteKey: 'fireworm',
    scale: 0.52,
  },
  {
    name: 'Ice Dragon',
    color: '#7fd2ff',
    maxHp: 140,
    xp: 40,
    sprite: 2,
    spriteKey: 'ice-dragon',
    scale: 0.45,
  },
  {
    name: 'Lava Demon',
    color: '#ff8a6b',
    maxHp: 155,
    xp: 45,
    sprite: 3,
    spriteKey: 'lava-demon',
    scale: 0.45,
  },
]

const MONSTER_BASE_HP = MONSTER_TYPES.reduce((acc, monster) => {
  acc[monster.spriteKey as MonsterSpriteKey] = monster.maxHp
  return acc
}, {} as Record<MonsterSpriteKey, number>)

const PLAYER_SPRITE_SOURCES: Record<PlayerSpriteKey, string> = {
  knight: knightSprite,
  mage: mageSprite,
  archer: archerSprite,
  elon: elonSprite,
  gake: gakeSprite,
}

const MONSTER_SPRITE_SOURCES: Record<MonsterSpriteKey, string> = {
  goblin: goblinSprite,
  'death-eye': deathEyeSprite,
  mushroom: mushroomSprite,
  'skeleton-warrior': skeletonWarriorSprite,
  'black-wizard': blackWizardSprite,
  fireworm: firewormSprite,
  'ice-dragon': iceDragonSprite,
  'lava-demon': lavaDemonSprite,
}

const PROP_SPRITE_SOURCES: Record<PropSpriteKey, string> = {
  house1: house1Sprite,
  house2: house2Sprite,
  house3: house3Sprite,
  castle: castleSprite,
  'dark-castle': darkCastleSprite,
}

const FALLBACK_PLAYER_SPRITES = [
  [
    '........',
    '..oo....',
    '.oaa....',
    '.oab....',
    '..aa....',
    '.a..a...',
    'o....o..',
    '........',
  ],
  [
    '........',
    '..oo....',
    '.oaa....',
    '.oab....',
    '..aa....',
    '.a..a...',
    '.o..o...',
    '........',
  ],
]

const MONSTER_SPRITES = [
  [
    '........',
    '..bb....',
    '.bbbb...',
    '.b..b...',
    '.bbbb...',
    '..bb....',
    '.b..b...',
    '........',
  ],
  [
    '........',
    '.bbbb...',
    'bb..bb..',
    'bbbbbb..',
    'bb..bb..',
    '.bbbb...',
    '..bb....',
    '........',
  ],
  [
    '........',
    '..bbb...',
    '.bbbbb..',
    '.bbbbb..',
    '..bbb...',
    '.b...b..',
    '.b...b..',
    '........',
  ],
  [
    '........',
    '..bbb...',
    '.b...b..',
    '.bbbbb..',
    '.bbbbb..',
    '.b.b.b..',
    '..b.b...',
    '........',
  ],
]

const WORLD_MAP = { tile: 48, width: 20, height: 20 }
const WORLD_MAP_LAYERS = {
  grass: [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  ],
  terrain: [
    0, 0, 0, 410, 474, 427, 427, 427, 427, 427, 427, 427, 427, 428, 0, 0, 0, 410, 412, 0,
    0, 0, 0, 442, 458, 427, 427, 427, 427, 457, 443, 443, 443, 444, 506, 508, 406, 472, 489, 412,
    306, 307, 308, 0, 442, 458, 427, 427, 457, 444, 0, 506, 507, 507, 570, 569, 507, 508, 442, 454,
    370, 323, 369, 308, 0, 442, 443, 443, 444, 506, 507, 570, 523, 523, 523, 523, 523, 569, 508, 441,
    354, 323, 323, 369, 308, 0, 0, 0, 0, 549, 554, 523, 523, 523, 523, 523, 523, 523, 524, 0,
    370, 323, 323, 323, 369, 307, 308, 0, 506, 581, 570, 523, 523, 523, 523, 523, 523, 523, 569, 508,
    354, 323, 323, 323, 323, 353, 340, 0, 522, 523, 523, 523, 523, 523, 523, 523, 523, 523, 523, 569,
    338, 354, 323, 323, 323, 324, 0, 0, 522, 523, 523, 523, 523, 523, 553, 539, 539, 554, 523, 523,
    0, 322, 323, 323, 353, 385, 308, 0, 538, 554, 523, 523, 553, 539, 540, 402, 404, 538, 554, 523,
    0, 322, 323, 353, 340, 338, 350, 0, 0, 538, 554, 523, 524, 402, 403, 466, 465, 404, 522, 523,
    0, 322, 353, 340, 0, 0, 337, 0, 0, 0, 522, 553, 540, 434, 450, 419, 419, 420, 522, 523,
    306, 386, 340, 0, 306, 308, 0, 0, 0, 0, 522, 524, 401, 689, 445, 450, 449, 436, 522, 523,
    338, 340, 0, 306, 370, 369, 351, 304, 0, 506, 586, 540, 433, 705, 433, 418, 420, 506, 570, 523,
    498, 499, 500, 338, 354, 323, 324, 0, 0, 522, 524, 401, 690, 755, 688, 434, 436, 522, 523, 553,
    514, 515, 561, 500, 338, 382, 340, 0, 0, 522, 524, 433, 722, 724, 397, 506, 507, 570, 523, 524,
    530, 574, 546, 561, 500, 337, 0, 0, 506, 570, 569, 507, 507, 508, 0, 522, 523, 523, 523, 524,
    0, 529, 530, 531, 532, 0, 0, 506, 570, 523, 523, 523, 523, 569, 507, 570, 523, 523, 553, 540,
    0, 0, 506, 507, 507, 507, 507, 570, 523, 523, 553, 539, 539, 539, 539, 554, 523, 553, 540, 0,
    506, 507, 570, 523, 523, 553, 539, 539, 539, 539, 540, 498, 499, 500, 0, 538, 539, 540, 498, 500,
    568, 539, 539, 539, 539, 540, 0, 0, 0, 0, 494, 560, 531, 559, 496, 0, 494, 495, 560, 532,
  ],
  mountain: [
    36, 44, 36, 35, 36, 34, 602, 604, 0, 0, 0, 0, 0, 0, 598, 599, 648, 647, 648, 604,
    44, 36, 44, 43, 35, 42, 618, 665, 604, 0, 0, 0, 0, 0, 0, 0, 634, 636, 618, 620,
    42, 41, 36, 44, 43, 34, 618, 649, 636, 0, 0, 0, 0, 0, 0, 0, 0, 0, 634, 646,
    402, 404, 41, 42, 41, 42, 634, 651, 600, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 633,
    418, 465, 403, 403, 404, 402, 404, 633, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    434, 450, 419, 419, 479, 452, 481, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 434, 435, 435, 481, 462, 434, 446, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 402, 404, 0, 434, 436, 397, 433, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    397, 434, 481, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 445, 463, 400, 0, 0, 0, 397, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 433, 0, 0, 0, 0, 0, 594, 596, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 590, 644, 628, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 609, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 594, 654, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 626, 628, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 33, 34, 33, 34, 0, 0, 0, 33, 44,
    0, 0, 0, 0, 0, 0, 0, 33, 34, 33, 34, 41, 36, 35, 36, 34, 0, 33, 44, 43,
  ],
} as const

const WORLD_TILESETS: WorldTileset[] = [
  { firstGid: 1, columns: 8, imageSrc: worldTilesetBase, image: null },
  { firstGid: 301, columns: 16, imageSrc: worldTilesetAt, image: null },
]

const MAP = WORLD_MAP
const WORLD = { width: MAP.tile * MAP.width, height: MAP.tile * MAP.height }
const MAX_MONSTERS = 7
const SPRITE_SCALE = 2
const DECOR_SCALE = 3
const RENDER_SCALE = 0.85
const MAX_EFFECTS = 24
const FIXED_STEP = 1 / 60
const MAX_STEPS = 6
const MAX_FRAME = 0.25
const PLAYER_DRAW_SIZE = 112
const MONSTER_DRAW_SIZE = 280
const HOUSE_DRAW_SIZE = MAP.tile * 1.35
const CASTLE_DRAW_SIZE = MAP.tile * 3.1
const DARK_CASTLE_DRAW_SIZE = MAP.tile * 3.1

const HOUSE_PROPS: Prop[] = [
  { id: 1, x: MAP.tile * 3.2, y: MAP.tile * 11.6, size: HOUSE_DRAW_SIZE, spriteKey: 'house1' },
  { id: 2, x: MAP.tile * 4.6, y: MAP.tile * 12.1, size: HOUSE_DRAW_SIZE, spriteKey: 'house2' },
  { id: 3, x: MAP.tile * 3.9, y: MAP.tile * 12.9, size: HOUSE_DRAW_SIZE, spriteKey: 'house3' },
  { id: 4, x: MAP.tile * 2.1, y: MAP.tile * 14.4, size: CASTLE_DRAW_SIZE, spriteKey: 'castle' },
  { id: 5, x: MAP.tile * 15.7, y: MAP.tile * 9.1, size: DARK_CASTLE_DRAW_SIZE, spriteKey: 'dark-castle' },
]

const MONSTER_BASE_SIZES = MONSTER_TYPES.reduce((acc, monster) => {
  acc[monster.spriteKey as MonsterSpriteKey] = MONSTER_DRAW_SIZE * (monster.scale ?? 1)
  return acc
}, {} as Record<MonsterSpriteKey, number>)

const PROP_BASE_SIZES: Record<PropSpriteKey, number> = {
  house1: HOUSE_DRAW_SIZE,
  house2: HOUSE_DRAW_SIZE,
  house3: HOUSE_DRAW_SIZE,
  castle: CASTLE_DRAW_SIZE,
  'dark-castle': DARK_CASTLE_DRAW_SIZE,
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
const lerp = (from: number, to: number, t: number) => from + (to - from) * t
const formatTimer = (seconds: number) => {
  const total = Math.max(0, Math.ceil(seconds))
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatLongTimer = (seconds: number) => {
  const total = Math.max(0, Math.ceil(seconds))
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatNumber = (value: number) => value.toLocaleString('en-US')
const formatTokenAmount = (value: number) => {
  if (!Number.isFinite(value)) return '-'
  const decimals = value < 1 ? 4 : 2
  return value.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}
const formatShortWallet = (wallet: string) => `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US')
}

const sanitizePlayerName = (value: string) => value.replace(/[^A-Za-z]/g, '').slice(0, 10)

const normalizeEquipment = (
  equipment?: Partial<Record<EquipmentSlot, EquipmentItem | null>> | null,
): Record<EquipmentSlot, EquipmentItem | null> => {
  const base = EQUIPMENT_SLOTS.reduce((acc, slot) => {
    acc[slot.id] = null
    return acc
  }, {} as Record<EquipmentSlot, EquipmentItem | null>)
  return { ...base, ...(equipment ?? {}) }
}

const shadeColor = (hex: string, amount: number) => {
  const num = Number.parseInt(hex.slice(1), 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  const adjust = (value: number) => clamp(Math.round(value + 255 * amount), 0, 255)
  return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`
}

const getDayKey = () => new Date().toISOString().slice(0, 10)

const getXpForLevel = (level: number) => Math.round(XP_BASE + XP_SCALE * Math.pow(level, XP_POWER))

const getRarityWeights = (level: number) => {
  const t = clamp((level - 1) / (MAX_LEVEL - 1), 0, 1)
  return EQUIPMENT_RARITIES.map((rarity, index) => {
    if (index === 0) {
      return { ...rarity, weight: Math.max(6, rarity.weight * (1 - 0.45 * t)) }
    }
    const tierBias = rarity.tier * 0.18
    const weight = rarity.weight * (1 + t * (0.35 + tierBias))
    return { ...rarity, weight: Math.max(0.2, weight) }
  })
}

const getRarityChances = (level: number): RarityChance[] => {
  const adjusted = getRarityWeights(level)
  const total = adjusted.reduce((sum, item) => sum + item.weight, 0)
  return adjusted.map((rarity) => ({
    id: rarity.id,
    name: rarity.name,
    color: rarity.color,
    percent: Number(((rarity.weight / total) * 100).toFixed(1)),
  }))
}

const emptyStats = (): EquipmentStats => ({
  attack: 0,
  speed: 0,
  attackSpeed: 0,
  range: 0,
})

const addStats = (a: EquipmentStats, b: Partial<EquipmentStats>) => ({
  attack: a.attack + (b.attack ?? 0),
  speed: a.speed + (b.speed ?? 0),
  attackSpeed: a.attackSpeed + (b.attackSpeed ?? 0),
  range: a.range + (b.range ?? 0),
})

const getEquipmentBonuses = (equipment: Record<EquipmentSlot, EquipmentItem | null>) => {
  let totals = emptyStats()
  for (const slot of EQUIPMENT_SLOTS) {
    const item = equipment[slot.id]
    if (!item) continue
    totals = addStats(totals, item.bonuses)
  }
  return totals
}

const getTierScore = (equipment: Record<EquipmentSlot, EquipmentItem | null>) => {
  return EQUIPMENT_SLOTS.reduce((sum, slot) => sum + (equipment[slot.id]?.tierScore ?? 0), 0)
}

const getRarityId = (rarityName: string) => {
  return EQUIPMENT_RARITIES.find((rarity) => rarity.name === rarityName)?.id ?? 'common'
}

const computeItemTierScore = (level: number, rarity: EquipmentRarity) => {
  const baseScore = 18
  const perLevel = 14
  const rarityMultiplier = 1 + (rarity.tier - 1) * 0.07
  const levelMultiplier = 1 + (level - 1) * 0.004
  const levelLinear = baseScore + perLevel * (level - 1)
  return Math.round(levelLinear * levelMultiplier * rarityMultiplier)
}

const computeSellValue = (level: number, rarity: EquipmentRarity) => {
  const levelMultiplier = 1 + (level - 1) * 0.003
  const levelBonus = (level - 1) * 0.25
  return Math.round(rarity.sellValue * levelMultiplier + levelBonus)
}

const rollRarity = (level: number) => {
  const adjusted = getRarityWeights(level)
  const total = adjusted.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const rarity of adjusted) {
    roll -= rarity.weight
    if (roll <= 0) return rarity
  }
  return adjusted[adjusted.length - 1]
}

const createEquipmentItem = (id: number, level: number): EquipmentItem => {
  const slot = EQUIPMENT_SLOTS[randomInt(0, EQUIPMENT_SLOTS.length - 1)].id
  const rarity = rollRarity(level)
  const baseTemplate = EQUIPMENT_BONUS_TEMPLATES[slot]
  let bonuses = emptyStats()
  const levelScale = 1 + level * 0.015
  for (const key of Object.keys(baseTemplate) as (keyof EquipmentStats)[]) {
    const baseValue = baseTemplate[key] ?? 0
    const variance = key === 'attackSpeed' ? 0.02 : key === 'speed' ? 2 : 4
    const value = baseValue + randomBetween(-variance, variance)
    const scaled = Math.max(0, value * rarity.power * levelScale)
    bonuses = addStats(bonuses, { [key]: Number(key === 'attackSpeed' ? scaled.toFixed(2) : Math.round(scaled)) } as Partial<EquipmentStats>)
  }

  const prefix = EQUIPMENT_PREFIXES[randomInt(0, EQUIPMENT_PREFIXES.length - 1)]
  const baseName = EQUIPMENT_BASE_NAMES[slot][randomInt(0, EQUIPMENT_BASE_NAMES[slot].length - 1)]
  const name = `${prefix} ${baseName}`
  const tierScore = computeItemTierScore(level, rarity)

  return {
    id,
    name,
    slot,
    level,
    rarity: rarity.name,
    color: rarity.color,
    bonuses,
    tierScore,
    sellValue: computeSellValue(level, rarity),
  }
}

const recomputePlayerStats = (state: GameState) => {
  const bonuses = getEquipmentBonuses(state.equipment)
  const player = state.player
  player.attack = Math.max(1, Math.round(player.baseAttack + bonuses.attack))
  player.attackSpeed = Math.max(0.2, Number((player.baseAttackSpeed + bonuses.attackSpeed).toFixed(2)))
  player.speed = Math.max(10, Math.round(player.baseSpeed + bonuses.speed))
  player.range = Math.max(10, Math.round(player.baseRange + bonuses.range))
}

const drawSprite = (
  ctx: CanvasRenderingContext2D,
  sprite: string[],
  colors: Record<string, string>,
  x: number,
  y: number,
  scale = SPRITE_SCALE,
  flip = false,
  overrideColor?: string,
) => {
  const height = sprite.length
  const width = sprite[0].length
  const sizeX = width * scale
  const sizeY = height * scale
  const startX = Math.round(x - sizeX / 2)
  const startY = Math.round(y - sizeY / 2)

  for (let row = 0; row < height; row += 1) {
    const line = sprite[row]
    for (let col = 0; col < width; col += 1) {
      const ch = line[col]
      if (ch === '.') continue
      ctx.fillStyle = overrideColor ?? colors[ch] ?? '#ffffff'
      const drawX = flip ? startX + (width - 1 - col) * scale : startX + col * scale
      ctx.fillRect(drawX, startY + row * scale, scale, scale)
    }
  }
}

const applySharpen = (ctx: CanvasRenderingContext2D, amount = 0.35) => {
  const { width, height } = ctx.canvas
  if (width < 2 || height < 2) return
  const imageData = ctx.getImageData(0, 0, width, height)
  const src = imageData.data
  const out = new Uint8ClampedArray(src.length)
  const rowStride = width * 4

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * rowStride + x * 4
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        out[idx] = src[idx]
        out[idx + 1] = src[idx + 1]
        out[idx + 2] = src[idx + 2]
        out[idx + 3] = src[idx + 3]
        continue
      }
      const up = idx - rowStride
      const down = idx + rowStride
      const left = idx - 4
      const right = idx + 4
      for (let c = 0; c < 3; c += 1) {
        const value =
          src[idx + c] * (1 + amount * 4) -
          amount * (src[left + c] + src[right + c] + src[up + c] + src[down + c])
        out[idx + c] = Math.min(255, Math.max(0, Math.round(value)))
      }
      out[idx + 3] = src[idx + 3]
    }
  }

  imageData.data.set(out)
  ctx.putImageData(imageData, 0, 0)
}

const createSpriteForDraw = (
  image: HTMLImageElement,
  targetSize: number,
  smooth = false,
  sharpenOverride?: number,
) => {
  const canvas = document.createElement('canvas')
  const size = Math.max(1, Math.round(targetSize))
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return image
  ctx.imageSmoothingEnabled = smooth
  if (smooth) ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, size, size)
  const sharpenAmount = typeof sharpenOverride === 'number' ? sharpenOverride : smooth ? 0.18 : 0.35
  if (sharpenAmount > 0) {
    applySharpen(ctx, sharpenAmount)
  }
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let hasAlpha = false
  for (let i = 0; i < data.data.length; i += 4) {
    if (data.data[i + 3] < 250) {
      hasAlpha = true
      break
    }
  }
  if (hasAlpha) {
    const alphaThreshold = smooth ? 1 : 16
    for (let i = 0; i < data.data.length; i += 4) {
      if (data.data[i + 3] < alphaThreshold) {
        data.data[i + 3] = 0
      }
    }
    ctx.putImageData(data, 0, 0)
    return canvas
  }
  const threshold = 18
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i]
    const g = data.data[i + 1]
    const b = data.data[i + 2]
    if (r < threshold && g < threshold && b < threshold) {
      data.data[i + 3] = 0
    }
  }
  ctx.putImageData(data, 0, 0)
  return canvas
}

const isSpriteReady = (sprite: PlayerSpriteSource | null): sprite is PlayerSpriteSource => {
  if (!sprite) return false
  if (sprite instanceof HTMLImageElement) {
    return sprite.complete && sprite.naturalWidth > 0
  }
  return true
}

const getEffectDuration = (effect: Effect) => {
  switch (effect.kind) {
    case 'text':
      return 1.2
    case 'slash':
      return 0.35
    case 'bolt':
      return 0.25
    case 'arrow':
      return 0.35
    case 'impact':
      return 0.4
    default:
      return 0.4
  }
}

const drawImageSprite = (
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  size: number,
  flip = false,
  flash = 0,
  rotation = 0,
  smooth = false,
) => {
  const half = size / 2
  const prevSmoothing = ctx.imageSmoothingEnabled
  const prevQuality = ctx.imageSmoothingQuality
  ctx.imageSmoothingEnabled = smooth
  if (smooth) ctx.imageSmoothingQuality = 'high'
  ctx.save()
  ctx.translate(x, y)
  if (rotation !== 0) ctx.rotate(rotation)
  if (flip) ctx.scale(-1, 1)
  ctx.drawImage(image, -half, -half, size, size)
  if (flash > 0) {
    ctx.globalAlpha = flash * 0.8
    ctx.globalCompositeOperation = 'lighter'
    ctx.drawImage(image, -half, -half, size, size)
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.restore()
  ctx.imageSmoothingEnabled = prevSmoothing
  ctx.imageSmoothingQuality = prevQuality
}

const drawPropShadow = (ctx: CanvasRenderingContext2D, prop: Prop) => {
  const { x, y, size } = prop
  const isCastle = prop.spriteKey === 'castle' || prop.spriteKey === 'dark-castle'
  const shadowY = y + size * (isCastle ? 0.3 : 0.22)
  const rx = size * (isCastle ? 0.75 : 0.55)
  const ry = size * (isCastle ? 0.18 : 0.25)
  const shadow = ctx.createRadialGradient(x, shadowY, size * 0.1, x, shadowY, size * 0.8)
  shadow.addColorStop(0, isCastle ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.12)')
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(x, shadowY, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  if (isCastle) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
    ctx.beginPath()
    ctx.ellipse(x + size * 0.08, shadowY + size * 0.03, rx * 0.75, ry * 0.7, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

const drawDecorationShadow = (ctx: CanvasRenderingContext2D, deco: Decoration) => {
  const size = deco.sprite[0].length * DECOR_SCALE
  const shadowX = deco.x + size * 0.12
  const shadowY = deco.y + size * 0.32
  const shadow = ctx.createRadialGradient(shadowX, shadowY, size * 0.05, shadowX, shadowY, size * 0.55)
  shadow.addColorStop(0, 'rgba(0, 0, 0, 0.32)')
  shadow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = shadow
  ctx.beginPath()
  ctx.ellipse(shadowX, shadowY, size * 0.55, size * 0.22, 0, 0, Math.PI * 2)
  ctx.fill()
}

const drawWorldBase = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  propSprites: PropSpriteMap,
  worldTilesets: WorldTileset[],
) => {
  const tilesReady = worldTilesets.every((tileset) => tileset.image && tileset.image.complete && tileset.image.naturalWidth > 0)

  if (tilesReady) {
    const drawLayer = (layer: readonly number[]) => {
      for (let y = 0; y < MAP.height; y += 1) {
        for (let x = 0; x < MAP.width; x += 1) {
          const gid = layer[y * MAP.width + x]
          if (!gid) continue
          let selected = worldTilesets[0]
          for (const tileset of worldTilesets) {
            if (gid >= tileset.firstGid) selected = tileset
          }
          const image = selected.image
          if (!image) continue
          const localId = gid - selected.firstGid
          const sx = (localId % selected.columns) * MAP.tile
          const sy = Math.floor(localId / selected.columns) * MAP.tile
          ctx.drawImage(image, sx, sy, MAP.tile, MAP.tile, x * MAP.tile, y * MAP.tile, MAP.tile, MAP.tile)
        }
      }
    }

    drawLayer(WORLD_MAP_LAYERS.grass)
    drawLayer(WORLD_MAP_LAYERS.terrain)
    drawLayer(WORLD_MAP_LAYERS.mountain)
  } else {
    ctx.fillStyle = '#0b1218'
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  }

  for (const prop of HOUSE_PROPS) {
    drawPropShadow(ctx, prop)
  }
  for (const prop of HOUSE_PROPS) {
    const sprite = propSprites[prop.spriteKey]
    if (isSpriteReady(sprite)) {
      drawImageSprite(ctx, sprite, prop.x, prop.y, prop.size, false, 0, 0, true)
    }
  }

  ctx.save()
  const skyGradient = ctx.createLinearGradient(0, 0, 0, WORLD.height)
  skyGradient.addColorStop(0, 'rgba(60, 110, 120, 0.12)')
  skyGradient.addColorStop(1, 'rgba(12, 18, 22, 0.25)')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  const sunGlow = ctx.createRadialGradient(WORLD.width * 0.2, WORLD.height * 0.2, 30, WORLD.width * 0.2, WORLD.height * 0.2, WORLD.height * 0.6)
  sunGlow.addColorStop(0, 'rgba(255, 220, 150, 0.12)')
  sunGlow.addColorStop(1, 'rgba(255, 220, 150, 0)')
  ctx.fillStyle = sunGlow
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)

  const vignette = ctx.createRadialGradient(
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.height * 0.2,
    WORLD.width / 2,
    WORLD.height / 2,
    WORLD.height * 0.8,
  )
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.18)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, WORLD.width, WORLD.height)
  ctx.restore()

  for (const deco of state.decorations) {
    drawDecorationShadow(ctx, deco)
  }

  for (const deco of state.decorations) {
    drawSprite(ctx, deco.sprite, deco.colors, deco.x, deco.y, DECOR_SCALE)
  }
}

const createMonster = (id: number, tierScore = 0): Monster => {
  const template = MONSTER_TYPES[randomInt(0, MONSTER_TYPES.length - 1)]
  const hpMultiplier = getMonsterHpMultiplier(tierScore)
  const maxHp = Math.max(1, Math.round(template.maxHp * hpMultiplier))
  const x = randomBetween(MAP.tile, WORLD.width - MAP.tile)
  const y = randomBetween(MAP.tile, WORLD.height - MAP.tile)
  return {
    id,
    x,
    y,
    hp: maxHp,
    maxHp: maxHp,
    color: template.color,
    name: template.name,
    cooldown: randomBetween(0, 0.6),
    xp: template.xp,
    hitFlash: 0,
    sprite: template.sprite,
    spriteKey: template.spriteKey as MonsterSpriteKey,
    scale: template.scale ?? 1,
  }
}

const buildHud = (state: GameState): HudState => ({
  name: state.name,
  classLabel: state.classLabel,
  level: state.player.level,
  energy: Math.round(state.energy),
  energyMax: state.energyMax,
  energyTimer: state.energyTimer,
  xp: Math.round(state.player.xp),
  xpNext: Math.round(state.player.xpNext),
  attack: Math.round(state.player.attack),
  speed: Math.round(state.player.speed),
  attackSpeed: state.player.attackSpeed,
  range: Math.round(state.player.range),
  gold: Math.round(state.gold),
  crystals: Math.round(state.crystals),
  tickets: Math.round(state.tickets),
  tierScore: getTierScore(state.equipment),
  equipment: state.equipment,
  inventory: state.inventory,
  consumables: state.consumables,
  pendingLoot: state.pendingLoot,
  levelUpNotice: state.levelUpNotice,
  loot: state.lootLog,
  events: state.eventLog,
  autoBattle: state.autoBattle,
  speedBuffTime: state.speedBuffTime,
  speedBuffMultiplier: state.speedBuffMultiplier,
  attackSpeedBuffTime: state.attackSpeedBuffTime,
  attackSpeedBuffMultiplier: state.attackSpeedBuffMultiplier,
  monsterKills: state.monsterKills,
  dungeonRuns: state.dungeonRuns,
  worldBoss: state.worldBoss,
  questStates: state.questStates,
  starterPackPurchased: state.starterPackPurchased,
  stake: state.stake,
})

const initGameState = (chosenClass: CharacterClass, name: string): GameState => {
  const player: PlayerState = {
    x: WORLD.width / 2,
    y: WORLD.height / 2,
    attack: chosenClass.stats.attack,
    attackSpeed: chosenClass.stats.attackSpeed,
    speed: chosenClass.stats.speed,
    range: chosenClass.stats.range,
    baseAttack: chosenClass.stats.attack,
    baseAttackSpeed: chosenClass.stats.attackSpeed,
    baseSpeed: chosenClass.stats.speed,
    baseRange: chosenClass.stats.range,
    level: 1,
    xp: 0,
    xpNext: getXpForLevel(1),
    cooldown: 0,
    moving: false,
    facing: 1,
    hitFlash: 0,
    spriteKey: chosenClass.spriteKey,
  }

  const monsters = Array.from({ length: MAX_MONSTERS }, (_, index) => createMonster(index + 1))

  return {
    player,
    monsters,
    name,
    classId: chosenClass.id,
    classLabel: chosenClass.label,
    lootLog: [],
    eventLog: ['Adventure begins. Scanning for enemies...'],
    lootId: 0,
    itemId: 0,
    consumableId: 0,
    monsterId: MAX_MONSTERS,
    effects: [],
    effectId: 0,
    decorations: [],
    time: 0,
    energy: ENERGY_MAX,
    energyMax: ENERGY_MAX,
    energyTimer: ENERGY_REGEN_SECONDS,
    gold: 0,
    crystals: 0,
    tickets: TICKETS_MAX,
    ticketDay: getDayKey(),
    inventory: [],
    consumables: [],
    equipment: {
      weapon: null,
      armor: null,
      head: null,
      legs: null,
      boots: null,
      artifact: null,
    },
    pendingLoot: null,
    levelUpNotice: null,
    autoBattle: false,
    battleQueue: 0,
    battleTargetId: null,
    speedBuffTime: 0,
    speedBuffMultiplier: 1.5,
    attackSpeedBuffTime: 0,
    attackSpeedBuffMultiplier: 1.5,
    monsterKills: 0,
    dungeonRuns: 0,
    monsterHpScale: getMonsterHpMultiplier(0),
    worldBoss: createWorldBossState(name),
    starterPackPurchased: false,
    stake: [],
    stakeId: 0,
    questStates: QUESTS.reduce((acc, quest) => {
      acc[quest.id] = { claimed: false }
      return acc
    }, {} as Record<string, QuestState>),
  }
}

const pushLog = (list: string[], entry: string, limit = 6) => {
  list.unshift(entry)
  if (list.length > limit) list.pop()
}

const pushLoot = (list: LootEntry[], entry: LootEntry, limit = 6) => {
  list.unshift(entry)
  if (list.length > limit) list.pop()
}

const addEffect = (state: GameState, effect: EffectInput) => {
  const effectWithId = { id: ++state.effectId, ...effect } as Effect
  state.effects.push(effectWithId)
  if (state.effects.length > MAX_EFFECTS) {
    state.effects.splice(0, state.effects.length - MAX_EFFECTS)
  }
}

const getQuestProgress = (state: GameState, quest: QuestDefinition) => {
  switch (quest.type) {
    case 'level':
      return state.player.level
    case 'kills':
      return state.monsterKills
    case 'tier':
      return getTierScore(state.equipment)
    case 'dungeons':
      return state.dungeonRuns
    default:
      return 0
  }
}

const updateGame = (state: GameState, dt: number) => {
  const player = state.player
  state.time += dt

  const tierScore = getTierScore(state.equipment)
  const newHpScale = getMonsterHpMultiplier(tierScore)
  if (Math.abs(newHpScale - state.monsterHpScale) > 0.01) {
    for (const monster of state.monsters) {
      const baseHp = MONSTER_BASE_HP[monster.spriteKey] ?? monster.maxHp / Math.max(0.1, state.monsterHpScale)
      const nextMaxHp = Math.max(1, Math.round(baseHp * newHpScale))
      const hpRatio = monster.maxHp > 0 ? monster.hp / monster.maxHp : 1
      monster.maxHp = nextMaxHp
      monster.hp = Math.max(1, Math.min(nextMaxHp, Math.round(nextMaxHp * hpRatio)))
    }
    state.monsterHpScale = newHpScale
  }

  const boss = state.worldBoss
  if (boss.cycleEnd) {
    const remaining = (new Date(boss.cycleEnd).getTime() - Date.now()) / 1000
    boss.remaining = Math.max(0, remaining)
  }

  const playerParticipant = boss.participants.find((entry) => entry.isPlayer)
  if (playerParticipant?.joined && boss.remaining > 0) {
    boss.damageTimer += dt
    while (boss.damageTimer >= 1) {
      boss.damageTimer -= 1
      const variance = randomBetween(0.9, 1.1)
      const damage = Math.max(1, Math.round(state.player.attack * variance))
      playerParticipant.damage += damage
      boss.pendingDamage += damage
    }
  }

  const todayKey = getDayKey()
  if (state.ticketDay !== todayKey) {
    state.tickets = TICKETS_MAX
    state.ticketDay = todayKey
    pushLog(state.eventLog, 'Daily dungeon tickets replenished.')
  }

  if (state.energy < state.energyMax) {
    state.energyTimer -= dt
    while (state.energyTimer <= 0 && state.energy < state.energyMax) {
      state.energy += 1
      state.energyTimer += ENERGY_REGEN_SECONDS
    }
  } else {
    state.energyTimer = ENERGY_REGEN_SECONDS
  }

  recomputePlayerStats(state)
  if (state.speedBuffTime > 0) {
    player.speed = Math.max(10, Math.round(player.speed * state.speedBuffMultiplier))
  }
  if (state.attackSpeedBuffTime > 0) {
    player.attackSpeed = Math.max(0.2, Number((player.attackSpeed * state.attackSpeedBuffMultiplier).toFixed(2)))
  }

  player.cooldown = Math.max(0, player.cooldown - dt)
  player.hitFlash = Math.max(0, player.hitFlash - dt)
  state.speedBuffTime = Math.max(0, state.speedBuffTime - dt)
  state.attackSpeedBuffTime = Math.max(0, state.attackSpeedBuffTime - dt)

  for (const effect of state.effects) {
    effect.t += dt
  }
  state.effects = state.effects.filter((effect) => effect.t < getEffectDuration(effect))

  if (state.pendingLoot) {
    player.moving = false
    return
  }

  if (state.levelUpNotice) {
    player.moving = false
    return
  }

  player.moving = false

  if (!state.battleTargetId && (state.autoBattle || state.battleQueue > 0) && state.energy > 0) {
    let target: Monster | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const monster of state.monsters) {
      const dist = distance(player, monster)
      if (dist < bestDistance) {
        bestDistance = dist
        target = monster
      }
    }
    if (target) {
      state.battleTargetId = target.id
      state.energy = Math.max(0, state.energy - 1)
      if (!state.autoBattle && state.battleQueue > 0) {
        state.battleQueue -= 1
      }
    }
  }

  const target = state.battleTargetId
    ? state.monsters.find((monster) => monster.id === state.battleTargetId) ?? null
    : null

  if (state.battleTargetId && !target) {
    state.battleTargetId = null
  }

  if (target) {
    const dx = target.x - player.x
    const dy = target.y - player.y
    const dist = Math.max(1, Math.hypot(dx, dy))
    player.facing = dx >= 0 ? 1 : -1
    const targetSize = MONSTER_BASE_SIZES[target.spriteKey] ?? MONSTER_DRAW_SIZE * target.scale
    const combatRange = Math.max(player.range, (PLAYER_DRAW_SIZE + targetSize) * 0.38)

    if (dist > combatRange + 2) {
      const step = player.speed * dt
      player.x += (dx / dist) * step
      player.y += (dy / dist) * step
      player.x = clamp(player.x, MAP.tile, WORLD.width - MAP.tile)
      player.y = clamp(player.y, MAP.tile, WORLD.height - MAP.tile)
      player.moving = true
    } else if (player.cooldown <= 0) {
      const damage = Math.max(1, Math.round(player.attack * randomBetween(0.85, 1.15)))
      target.hp -= damage
      target.hitFlash = 0.2
      player.cooldown = 1 / player.attackSpeed
      const angle = Math.atan2(dy, dx)
      addEffect(state, { kind: 'text', x: target.x, y: target.y - 12, t: 0, text: `-${damage}`, color: '#ffd36f' })
      addEffect(state, { kind: 'impact', x: target.x, y: target.y + 2, t: 0, size: 10, color: '#ffd36f' })

      if (player.spriteKey === 'knight' || player.spriteKey === 'gake') {
        addEffect(state, { kind: 'slash', x: target.x, y: target.y, t: 0, angle, size: 26, color: '#ffe2a3' })
      } else if (player.spriteKey === 'mage' || player.spriteKey === 'elon') {
        addEffect(state, {
          kind: 'bolt',
          fromX: player.x,
          fromY: player.y - 16,
          toX: target.x,
          toY: target.y - 8,
          t: 0,
          color: '#a47bff',
        })
      } else {
        addEffect(state, {
          kind: 'arrow',
          fromX: player.x,
          fromY: player.y - 10,
          toX: target.x,
          toY: target.y - 8,
          t: 0,
          color: '#d6b25f',
        })
      }

      if (target.hp <= 0) {
        state.monsterKills += 1
        if (player.level < MAX_LEVEL) {
          const xpGain = target.xp + randomInt(2, 8)
          player.xp += xpGain
          pushLog(state.eventLog, `Victory over ${target.name} (+${xpGain} XP)`)
        } else {
          pushLog(state.eventLog, `Victory over ${target.name}.`)
        }

        if (state.energy === 0) {
          pushLog(state.eventLog, 'Energy depleted. Rest to recharge.')
        }
        const newItem = createEquipmentItem(++state.itemId, player.level)
        state.pendingLoot = newItem
        const loot: LootEntry = {
          id: ++state.lootId,
          name: `${newItem.name} (${EQUIPMENT_SLOTS.find((slot) => slot.id === newItem.slot)?.label ?? newItem.slot})`,
          quality: newItem.rarity,
          color: newItem.color,
        }
        pushLoot(state.lootLog, loot)
        addEffect(state, { kind: 'text', x: target.x, y: target.y - 18, t: 0, text: `${newItem.rarity}!`, color: newItem.color })

        const levelUps: number[] = []
        while (player.level < MAX_LEVEL && player.xp >= player.xpNext) {
          player.xp -= player.xpNext
          player.level += 1
          player.xpNext = getXpForLevel(player.level)
          player.baseAttack += 2
          player.baseSpeed += 2
          player.baseAttackSpeed += 0.03
          recomputePlayerStats(state)
          levelUps.push(player.level)
        }
        for (const level of levelUps) {
          pushLog(state.eventLog, `Level ${level}! Your stats increased.`)
        }
        if (levelUps.length > 0) {
          const level = player.level
          const prevLevel = Math.max(1, level - 1)
          state.levelUpNotice = {
            level,
            chances: getRarityChances(level),
            prevChances: getRarityChances(prevLevel),
          }
        }
        if (player.level >= MAX_LEVEL) {
          player.level = MAX_LEVEL
          player.xp = player.xpNext
          pushLog(state.eventLog, 'Max level reached.')
        }

        const tierScore = getTierScore(state.equipment)
        state.monsters = state.monsters.filter((monster) => monster.id !== target.id)
        state.monsters.push(createMonster(++state.monsterId, tierScore))
        state.battleTargetId = null
      }
    }
  }

  for (const monster of state.monsters) {
    monster.cooldown = Math.max(0, monster.cooldown - dt)
    monster.hitFlash = Math.max(0, monster.hitFlash - dt)
    if (monster.id !== state.battleTargetId) continue
  }

  // Player HP is not used in this game mode.
}

const drawGame = (
  ctx: CanvasRenderingContext2D,
  state: GameState,
  playerSprites: PlayerSpriteMap,
  monsterSprites: MonsterSpriteMap,
  propSprites: PropSpriteMap,
  worldTilesets: WorldTileset[],
  backgroundCache: BackgroundCache,
) => {
  ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0)
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, WORLD.width, WORLD.height)

  const tilesReady = worldTilesets.every((tileset) => tileset.image && tileset.image.complete && tileset.image.naturalWidth > 0)
  const propsReady = HOUSE_PROPS.every((prop) => isSpriteReady(propSprites[prop.spriteKey]))
  const canCacheBackground = tilesReady && propsReady

  if (canCacheBackground && !backgroundCache.ready) {
    const canvas = document.createElement('canvas')
    canvas.width = WORLD.width
    canvas.height = WORLD.height
    const bgCtx = canvas.getContext('2d')
    if (bgCtx) {
      bgCtx.imageSmoothingEnabled = false
      drawWorldBase(bgCtx, state, propSprites, worldTilesets)
      backgroundCache.canvas = canvas
      backgroundCache.ready = true
    }
  }

  if (backgroundCache.ready && backgroundCache.canvas) {
    ctx.drawImage(backgroundCache.canvas, 0, 0)
  } else {
    drawWorldBase(ctx, state, propSprites, worldTilesets)
  }

  for (const monster of state.monsters) {
    const bob = Math.sin(state.time * 4 + monster.id) * 1.2
    ctx.fillStyle = 'rgba(5, 8, 12, 0.4)'
    ctx.fillRect(monster.x - 7, monster.y + 6, 14, 3)

    const monsterSize = MONSTER_BASE_SIZES[monster.spriteKey] ?? MONSTER_DRAW_SIZE * monster.scale

    const monsterSprite = monsterSprites[monster.spriteKey]
    const smoothMonster =
      monster.spriteKey === 'ice-dragon' ||
      monster.spriteKey === 'lava-demon' ||
      monster.spriteKey === 'goblin' ||
      monster.spriteKey === 'skeleton-warrior' ||
      monster.spriteKey === 'death-eye' ||
      monster.spriteKey === 'mushroom' ||
      monster.spriteKey === 'black-wizard'
    if (isSpriteReady(monsterSprite)) {
      ctx.save()
      ctx.shadowColor = monster.color
      ctx.shadowBlur = 6
      drawImageSprite(
        ctx,
        monsterSprite,
        monster.x,
        monster.y - bob,
        monsterSize,
        false,
        monster.hitFlash,
        Math.sin(state.time * 3 + monster.id) * 0.03,
        smoothMonster,
      )
      ctx.restore()
    } else {
      const palette = {
        b: shadeColor(monster.color, 0),
        a: shadeColor(monster.color, 0.2),
        c: shadeColor(monster.color, -0.2),
      }
      drawSprite(ctx, MONSTER_SPRITES[monster.sprite], palette, monster.x, monster.y - bob, SPRITE_SCALE * monster.scale)

      if (monster.hitFlash > 0) {
        ctx.save()
        ctx.globalAlpha = monster.hitFlash * 2
        drawSprite(
          ctx,
          MONSTER_SPRITES[monster.sprite],
          palette,
          monster.x,
          monster.y - bob,
          SPRITE_SCALE * monster.scale,
          false,
          '#ffffff',
        )
        ctx.restore()
      }
    }

    const barWidth = Math.min(56, Math.max(26, monsterSize * 0.2))
    const barHeight = 4
    const barOffset = monster.scale <= 0.6 ? 16 : monster.spriteKey === 'fireworm' ? 64 : 88
    const barY = monster.y - bob - monsterSize / 2 + barOffset
    const barYFinal =
      monster.spriteKey === 'mushroom'
        ? monster.y - monsterSize * 0.44
        : barY
    const barX = monster.x - barWidth / 2
    ctx.fillStyle = '#0d1014'
    ctx.fillRect(barX, barYFinal, barWidth, barHeight)
    const hpWidth = Math.max(0, Math.round((monster.hp / monster.maxHp) * barWidth))
    ctx.fillStyle = '#ff6f6f'
    ctx.fillRect(barX, barYFinal, hpWidth, barHeight)
  }

  const player = state.player
  const playerBob = Math.sin(state.time * (player.moving ? 8 : 4)) * (player.moving ? 1.8 : 0.6)
  const pulse = 1 + Math.sin(state.time * (player.moving ? 9 : 4)) * (player.moving ? 0.03 : 0.015)
  const rotation = player.moving ? Math.sin(state.time * 10) * 0.04 : Math.sin(state.time * 4) * 0.015
  const playerSprite = playerSprites[player.spriteKey]

  const playerShadowY = player.y + 14
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  ctx.beginPath()
  ctx.ellipse(player.x, playerShadowY, PLAYER_DRAW_SIZE * 0.35, PLAYER_DRAW_SIZE * 0.12, 0, 0, Math.PI * 2)
  ctx.fill()

  if (isSpriteReady(playerSprite)) {
    ctx.save()
    drawImageSprite(
      ctx,
      playerSprite,
      player.x,
      player.y - playerBob,
      PLAYER_DRAW_SIZE * pulse,
      player.facing < 0,
      player.hitFlash,
      rotation,
      true,
    )
    ctx.restore()
  } else {
    const frame = player.moving
      ? Math.floor(state.time * 10) % FALLBACK_PLAYER_SPRITES.length
      : Math.floor(state.time * 4) % FALLBACK_PLAYER_SPRITES.length
    const playerColors = {
      o: '#0b1116',
      a: '#89e3ff',
      b: '#5bb5d6',
    }
    drawSprite(ctx, FALLBACK_PLAYER_SPRITES[frame], playerColors, player.x, player.y - playerBob, SPRITE_SCALE, player.facing < 0)

    if (player.hitFlash > 0) {
      ctx.save()
      ctx.globalAlpha = player.hitFlash * 2
      drawSprite(ctx, FALLBACK_PLAYER_SPRITES[frame], playerColors, player.x, player.y - playerBob, SPRITE_SCALE, player.facing < 0, '#ffffff')
      ctx.restore()
    }
  }

  ctx.save()
  ctx.textAlign = 'center'
  ctx.lineCap = 'round'
  ctx.font = '10px "Press Start 2P", monospace'

  for (const effect of state.effects) {
    const life = getEffectDuration(effect)
    const progress = clamp(effect.t / life, 0, 1)

    if (effect.kind === 'text') {
      ctx.globalAlpha = 1 - progress
      ctx.fillStyle = effect.color
      ctx.fillText(effect.text, effect.x, effect.y - effect.t * 20)
      continue
    }

    if (effect.kind === 'slash') {
      ctx.globalAlpha = 1 - progress
      ctx.strokeStyle = effect.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, effect.size * (0.7 + progress * 0.4), effect.angle - 0.7, effect.angle + 0.7)
      ctx.stroke()
      continue
    }

    if (effect.kind === 'bolt') {
      ctx.globalAlpha = 1 - progress
      ctx.strokeStyle = effect.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(effect.fromX, effect.fromY)
      const dx = effect.toX - effect.fromX
      const dy = effect.toY - effect.fromY
      const segments = 4
      for (let i = 1; i < segments; i += 1) {
        const t = i / segments
        const wobble = (i % 2 === 0 ? -1 : 1) * 5
        const px = effect.fromX + dx * t + (-dy / 30) * wobble
        const py = effect.fromY + dy * t + (dx / 30) * wobble
        ctx.lineTo(px, py)
      }
      ctx.lineTo(effect.toX, effect.toY)
      ctx.stroke()
      ctx.fillStyle = effect.color
      ctx.beginPath()
      ctx.arc(effect.toX, effect.toY, 3, 0, Math.PI * 2)
      ctx.fill()
      continue
    }

    if (effect.kind === 'arrow') {
      const travel = clamp(progress * 1.1, 0, 1)
      const px = lerp(effect.fromX, effect.toX, travel)
      const py = lerp(effect.fromY, effect.toY, travel)
      const angle = Math.atan2(effect.toY - effect.fromY, effect.toX - effect.fromX)
      ctx.save()
      ctx.globalAlpha = 1 - progress
      ctx.translate(px, py)
      ctx.rotate(angle)
      ctx.strokeStyle = effect.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-10, 0)
      ctx.lineTo(8, 0)
      ctx.stroke()
      ctx.fillStyle = effect.color
      ctx.beginPath()
      ctx.moveTo(8, 0)
      ctx.lineTo(3, -4)
      ctx.lineTo(3, 4)
      ctx.fill()
      ctx.restore()
      continue
    }

    if (effect.kind === 'impact') {
      ctx.globalAlpha = 1 - progress
      ctx.strokeStyle = effect.color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, effect.size * (0.4 + progress), 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  ctx.restore()

}

function App() {
  const { connected, publicKey, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const [stage, setStage] = useState<'auth' | 'select' | 'game'>('auth')
  const [selectedId, setSelectedId] = useState(CHARACTER_CLASSES[0].id)
  const [playerName, setPlayerName] = useState('')
  const [hud, setHud] = useState<HudState | null>(null)
  const [activePanel, setActivePanel] = useState<
    | 'inventory'
    | 'dungeons'
    | 'shop'
    | 'quests'
    | 'worldboss'
    | 'admin'
    | 'withdraw'
    | 'stake'
    | 'buygold'
    | 'starterpack'
    | null
  >(null)
  const [inventoryTab, setInventoryTab] = useState<'equipment' | 'consumables'>('equipment')
  const [inventoryView, setInventoryView] = useState<'equipped' | 'bag'>('equipped')
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawError, setWithdrawError] = useState('')
  const [playerWithdrawals, setPlayerWithdrawals] = useState<WithdrawalRow[]>([])
  const [playerWithdrawalsLoading, setPlayerWithdrawalsLoading] = useState(false)
  const [playerWithdrawalsError, setPlayerWithdrawalsError] = useState('')
  const [buyGoldError, setBuyGoldError] = useState('')
  const [buyGoldLoading, setBuyGoldLoading] = useState<string | null>(null)
  const [starterPackError, setStarterPackError] = useState('')
  const [starterPackLoading, setStarterPackLoading] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [tokenBalanceLoading, setTokenBalanceLoading] = useState(false)
  const [tokenPriceSol, setTokenPriceSol] = useState<number | null>(null)
  const [tokenPriceLoading, setTokenPriceLoading] = useState(false)
  const [tokenPriceError, setTokenPriceError] = useState('')
  const [stakeAmount, setStakeAmount] = useState('')
  const [stakeError, setStakeError] = useState('')
  const [stakeTab, setStakeTab] = useState<'stake' | 'my'>('stake')
  const [musicEnabled, setMusicEnabled] = useState(true)
  const [contractCopied, setContractCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const musicUnlockRef = useRef(false)
  const tokenDecimalsRef = useRef<number | null>(null)
  const tokenPriceRef = useRef<number | null>(null)
  const tokenPriceTsRef = useRef(0)
  const serverLoadedRef = useRef(false)
  const pendingProfileRef = useRef<PersistedState | null>(null)
  const spriteCacheRef = useRef<PlayerSpriteMap>({
    knight: null,
    mage: null,
    archer: null,
    elon: null,
    gake: null,
  })
  const monsterSpriteCacheRef = useRef<MonsterSpriteMap>({
    goblin: null,
    'death-eye': null,
    mushroom: null,
    'skeleton-warrior': null,
    'black-wizard': null,
    fireworm: null,
    'ice-dragon': null,
    'lava-demon': null,
  })
  const backgroundCacheRef = useRef<BackgroundCache>({ canvas: null, ready: false })
  const propSpriteCacheRef = useRef<PropSpriteMap>({
    house1: null,
    house2: null,
    house3: null,
    castle: null,
    'dark-castle': null,
  })
  const worldTilesetsRef = useRef<WorldTileset[]>(
    WORLD_TILESETS.map((tileset) => ({ ...tileset })),
  )

  const selectedClass = useMemo(
    () => CHARACTER_CLASSES.find((character) => character.id === selectedId) || CHARACTER_CLASSES[0],
    [selectedId],
  )
  const selectedIndex = useMemo(
    () => Math.max(0, CHARACTER_CLASSES.findIndex((character) => character.id === selectedId)),
    [selectedId],
  )
  const selectPrevClass = () => {
    const nextIndex = (selectedIndex - 1 + CHARACTER_CLASSES.length) % CHARACTER_CLASSES.length
    setSelectedId(CHARACTER_CLASSES[nextIndex].id)
  }
  const selectNextClass = () => {
    const nextIndex = (selectedIndex + 1) % CHARACTER_CLASSES.length
    setSelectedId(CHARACTER_CLASSES[nextIndex].id)
  }

  const adminWallets = useMemo(() => {
    const raw = (import.meta.env.VITE_ADMIN_WALLETS as string | undefined) ?? ''
    return raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }, [])

  const isAdmin = useMemo(() => {
    const wallet = publicKey?.toBase58()
    if (!wallet) return false
    return adminWallets.includes(wallet)
  }, [publicKey, adminWallets])

  useEffect(() => {
    const detectMobile = () => {
      const ua = navigator.userAgent || ''
      const mobileUa = /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)
      const smallScreen = window.matchMedia('(max-width: 900px)').matches
      setIsMobile(mobileUa || smallScreen)
    }
    detectMobile()
    window.addEventListener('resize', detectMobile)
    return () => window.removeEventListener('resize', detectMobile)
  }, [])

  const copyContractAddress = async () => {
    const contractValue = CONTRACT_ADDRESS
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contractValue)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = contractValue
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setContractCopied(true)
      window.setTimeout(() => setContractCopied(false), 1600)
    } catch (error) {
      console.warn('Copy failed', error)
    }
  }

  const ensureTokenDecimals = async () => {
    if (tokenDecimalsRef.current !== null) return tokenDecimalsRef.current
    const mintInfo = await getMint(connection, TOKEN_MINT)
    tokenDecimalsRef.current = mintInfo.decimals
    return mintInfo.decimals
  }

  const fetchTokenPriceSol = async (force = false) => {
    const now = Date.now()
    if (!force && tokenPriceRef.current && now - tokenPriceTsRef.current < 60_000) {
      return tokenPriceRef.current
    }
    setTokenPriceLoading(true)
    setTokenPriceError('')
    try {
      const url = `https://lite-api.jup.ag/price/v2?ids=${TOKEN_MINT.toBase58()},${SOL_MINT.toBase58()}`
      const response = await fetch(url)
      const payload = await response.json()
      const tokenUsd = Number(payload?.data?.[TOKEN_MINT.toBase58()]?.price)
      const solUsd = Number(payload?.data?.[SOL_MINT.toBase58()]?.price)
      if (!Number.isFinite(tokenUsd) || !Number.isFinite(solUsd) || tokenUsd <= 0 || solUsd <= 0) {
        throw new Error('Invalid price response')
      }
      const priceSol = tokenUsd / solUsd
      tokenPriceRef.current = priceSol
      tokenPriceTsRef.current = now
      setTokenPriceSol(priceSol)
      return priceSol
    } catch (error) {
      console.warn('Token price fetch failed', error)
      setTokenPriceError('Token price unavailable.')
      setTokenPriceSol(null)
      return null
    } finally {
      setTokenPriceLoading(false)
    }
  }

  const loadTokenBalance = async () => {
    if (!publicKey) return
    setTokenBalanceLoading(true)
    try {
      const decimals = await ensureTokenDecimals()
      const ata = await getAssociatedTokenAddress(TOKEN_MINT, publicKey)
      const account = await getAccount(connection, ata)
      const balance = Number(account.amount) / 10 ** decimals
      setTokenBalance(balance)
    } catch (error) {
      console.warn('Token balance load failed', error)
      setTokenBalance(0)
    } finally {
      setTokenBalanceLoading(false)
    }
  }

  const copyToClipboard = async (value: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = value
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
    } catch (error) {
      console.warn('Copy failed', error)
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.loop = true
    audio.volume = 0.15
    if (musicEnabled) {
      const tryPlay = async () => {
        try {
          await audio.play()
          musicUnlockRef.current = true
        } catch {
          // Autoplay blocked. We'll unlock on first user interaction.
        }
      }
      void tryPlay()
    } else {
      audio.pause()
    }
  }, [musicEnabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const unlock = () => {
      if (!musicEnabled || musicUnlockRef.current) return
      audio
        .play()
        .then(() => {
          musicUnlockRef.current = true
        })
        .catch(() => {})
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('touchstart', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [musicEnabled])

  useEffect(() => {
    ;(Object.keys(PLAYER_SPRITE_SOURCES) as PlayerSpriteKey[]).forEach((key) => {
      const existing = spriteCacheRef.current[key]
      if (existing) return
      const image = new Image()
      image.src = PLAYER_SPRITE_SOURCES[key]
      image.decoding = 'async'
      image.onload = () => {
        spriteCacheRef.current[key] = createSpriteForDraw(image, PLAYER_DRAW_SIZE, true, 0.26)
      }
      spriteCacheRef.current[key] = image
    })

    ;(Object.keys(MONSTER_SPRITE_SOURCES) as MonsterSpriteKey[]).forEach((key) => {
      const existing = monsterSpriteCacheRef.current[key]
      if (existing) return
      const smooth =
        key === 'ice-dragon' ||
        key === 'lava-demon' ||
        key === 'goblin' ||
        key === 'skeleton-warrior' ||
        key === 'death-eye' ||
        key === 'mushroom' ||
        key === 'black-wizard'
      const image = new Image()
      image.src = MONSTER_SPRITE_SOURCES[key]
      image.decoding = 'async'
      image.onload = () => {
        const sharpenOverride = key === 'fireworm' ? undefined : smooth ? 0.26 : 0.4
        monsterSpriteCacheRef.current[key] = createSpriteForDraw(
          image,
          MONSTER_BASE_SIZES[key] ?? MONSTER_DRAW_SIZE,
          smooth,
          sharpenOverride,
        )
      }
      monsterSpriteCacheRef.current[key] = image
    })

    ;(Object.keys(PROP_SPRITE_SOURCES) as PropSpriteKey[]).forEach((key) => {
      const existing = propSpriteCacheRef.current[key]
      if (existing) return
      const image = new Image()
      image.src = PROP_SPRITE_SOURCES[key]
      image.decoding = 'async'
      image.onload = () => {
        propSpriteCacheRef.current[key] = createSpriteForDraw(image, PROP_BASE_SIZES[key] ?? HOUSE_DRAW_SIZE, true, 0.26)
      }
      propSpriteCacheRef.current[key] = image
    })

    WORLD_TILESETS.forEach((tileset, index) => {
      const existing = worldTilesetsRef.current[index]
      if (existing?.image) return
      const image = new Image()
      image.src = tileset.imageSrc
      image.decoding = 'async'
      image.onload = () => {
        worldTilesetsRef.current[index] = { ...worldTilesetsRef.current[index], image }
      }
      worldTilesetsRef.current[index] = { ...tileset, image }
    })
  }, [])

  useEffect(() => {
    let active = true
    if (!connected) {
      pendingProfileRef.current = null
      setStage('auth')
      return () => {
        active = false
      }
    }

    const wallet = publicKey?.toBase58()
    if (!wallet || !supabase) {
      setStage('select')
      return () => {
        active = false
      }
    }

    loadProfileState(wallet).then((saved) => {
      if (!active) return
      if (saved) {
        pendingProfileRef.current = saved
        setSelectedId(saved.classId || CHARACTER_CLASSES[0].id)
        setPlayerName(sanitizePlayerName(saved.name || ''))
        setStage('game')
      } else {
        pendingProfileRef.current = null
        setStage('select')
      }
    })

    return () => {
      active = false
    }
  }, [connected, publicKey])

  useEffect(() => {
    if (stage !== 'game') return
    const interval = window.setInterval(() => {
      void saveGameState()
    }, 15000)
    const handleUnload = () => {
      void saveGameState()
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [stage, publicKey])

  useEffect(() => {
    if (stage !== 'game') return
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = Math.round(WORLD.width * RENDER_SCALE)
    canvas.height = Math.round(WORLD.height * RENDER_SCALE)
    context.imageSmoothingEnabled = false

    const pendingProfile = pendingProfileRef.current
    const classForInit = pendingProfile
      ? CHARACTER_CLASSES.find((entry) => entry.id === pendingProfile.classId) || selectedClass
      : selectedClass
    const nameForInit = sanitizePlayerName(pendingProfile?.name || playerName.trim()) || 'Nameless'
    const state = initGameState(classForInit, nameForInit)
    gameStateRef.current = state
    setHud(buildHud(state))
    backgroundCacheRef.current = { canvas: null, ready: false }
    serverLoadedRef.current = false

    const wallet = publicKey?.toBase58()
    if (pendingProfile) {
      applyPersistedState(state, pendingProfile)
      pendingProfileRef.current = null
      serverLoadedRef.current = true
      syncHud()
    } else if (wallet && supabase) {
      loadProfileState(wallet).then((saved) => {
        if (!gameStateRef.current) return
        if (saved) {
          applyPersistedState(gameStateRef.current, saved)
        }
        serverLoadedRef.current = true
        syncHud()
      })
    } else {
      serverLoadedRef.current = true
    }

    let running = true
    let lastTime = performance.now()
    let lastHudUpdate = 0
    let accumulator = 0

    const tick = (time: number) => {
      if (!running) return
      const frameTime = Math.min((time - lastTime) / 1000, MAX_FRAME)
      lastTime = time
      accumulator += frameTime
      let steps = 0
      while (accumulator >= FIXED_STEP && steps < MAX_STEPS) {
        updateGame(state, FIXED_STEP)
        accumulator -= FIXED_STEP
        steps += 1
      }
      if (steps === MAX_STEPS) {
        accumulator = 0
      }
      drawGame(
        context,
        state,
        spriteCacheRef.current,
        monsterSpriteCacheRef.current,
        propSpriteCacheRef.current,
        worldTilesetsRef.current,
        backgroundCacheRef.current,
      )
      if (time - lastHudUpdate > 200) {
        setHud(buildHud(state))
        lastHudUpdate = time
      }
      requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)

    return () => {
      running = false
    }
  }, [stage, selectedClass, playerName, publicKey])

  useEffect(() => {
    if (stage !== 'game') return
    void syncWorldBossFromServer()
  }, [stage, publicKey])

  const syncHud = () => {
    const state = gameStateRef.current
    if (!state) return
    setHud(buildHud(state))
  }

  useEffect(() => {
    if (activePanel === 'inventory') {
      setInventoryTab('equipment')
    }
    if (activePanel !== 'withdraw') {
      setWithdrawError('')
      setPlayerWithdrawalsError('')
    }
    if (activePanel !== 'buygold') {
      setBuyGoldError('')
      setBuyGoldLoading(null)
    }
    if (activePanel !== 'starterpack') {
      setStarterPackError('')
      setStarterPackLoading(false)
    }
    if (activePanel !== 'buygold' && activePanel !== 'starterpack') {
      setTokenPriceError('')
    }
    if (activePanel !== 'stake') {
      setStakeError('')
      setStakeTab('stake')
    }
  }, [activePanel])

  useEffect(() => {
    if (activePanel !== 'withdraw') return
    const wallet = publicKey?.toBase58()
    const client = supabase
    if (!wallet || !client) {
      setPlayerWithdrawals([])
      return
    }
    let active = true
    const loadWithdrawals = async () => {
      setPlayerWithdrawalsLoading(true)
      setPlayerWithdrawalsError('')
      const { data, error } = await client
        .from('withdrawals')
        .select('id, wallet, name, crystals, sol_amount, status, created_at')
        .eq('wallet', wallet)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!active) return
      if (error) {
        setPlayerWithdrawalsError('Failed to load withdrawal requests.')
        setPlayerWithdrawals([])
      } else {
        setPlayerWithdrawals((data as WithdrawalRow[]) ?? [])
      }
      setPlayerWithdrawalsLoading(false)
    }
    void loadWithdrawals()
    return () => {
      active = false
    }
  }, [activePanel, publicKey])

  useEffect(() => {
    if (activePanel !== 'worldboss') return
    void syncWorldBossFromServer()
  }, [activePanel, publicKey])

  useEffect(() => {
    if (activePanel !== 'admin') return
    if (!isAdmin) return
    void loadAdminData()
  }, [activePanel, isAdmin])

  useEffect(() => {
    if (activePanel !== 'buygold' && activePanel !== 'starterpack') return
    if (!publicKey) {
      setTokenBalance(0)
      return
    }
    void loadTokenBalance()
    void fetchTokenPriceSol()
  }, [activePanel, publicKey, connection])

  const startBattleOnce = () => {
    const state = gameStateRef.current
    if (!state) return
    if (state.energy <= 0) {
      pushLog(state.eventLog, 'Not enough energy for battle.')
      syncHud()
      return
    }
    state.battleQueue += 1
    syncHud()
  }

  const toggleAutoBattle = () => {
    const state = gameStateRef.current
    if (!state) return
    state.autoBattle = !state.autoBattle
    pushLog(state.eventLog, state.autoBattle ? 'Auto battle enabled.' : 'Auto battle disabled.')
    syncHud()
  }

  const saveGameState = async () => {
    const state = gameStateRef.current
    if (!state) return
    const wallet = publicKey?.toBase58()
    if (!wallet || !supabase || !serverLoadedRef.current) return
    await saveProfileState(wallet, state)
  }

  const syncWorldBossFromServer = async () => {
    const state = gameStateRef.current
    const wallet = publicKey?.toBase58()
    if (!state || !wallet || !supabase) return

    const bossRow = await ensureWorldBossCycle()
    if (!bossRow) return

    const cycleStart = bossRow.cycle_start
    const cycleEnd = bossRow.cycle_end

    if (state.worldBoss.cycleStart !== cycleStart) {
      state.worldBoss = createWorldBossState(state.name, cycleStart, cycleEnd)
    } else {
      state.worldBoss.cycleEnd = cycleEnd
    }

    state.worldBoss.duration = WORLD_BOSS_DURATION
    state.worldBoss.remaining = Math.max(0, (new Date(cycleEnd).getTime() - Date.now()) / 1000)

    let playerEntry = state.worldBoss.participants.find((entry) => entry.isPlayer)
    if (!playerEntry) {
      playerEntry = {
        id: 'player',
        name: state.name,
        damage: 0,
        joined: false,
        isPlayer: true,
        attack: 0,
      }
      state.worldBoss.participants = [playerEntry, ...state.worldBoss.participants]
    } else {
      playerEntry.name = state.name
      playerEntry.isPlayer = true
    }

    const rows = await fetchWorldBossParticipants(cycleStart)
    const playerRow = rows.find((row) => row.wallet === wallet)
    const serverDamage = Number(playerRow?.damage ?? 0)

    if (serverDamage > playerEntry.damage) {
      playerEntry.damage = serverDamage
    }

    const shouldUpsert =
      playerEntry.joined && (!playerRow || playerEntry.damage > serverDamage || state.worldBoss.pendingDamage > 0)

    if (shouldUpsert) {
      await upsertWorldBossParticipant(wallet, cycleStart, playerEntry.name, playerEntry.damage, playerEntry.joined)
      state.worldBoss.pendingDamage = 0
    }

    const participants: WorldBossParticipant[] = rows.map((row) => ({
      id: row.wallet,
      name: row.name,
      damage: Number(row.damage),
      joined: row.joined,
      isPlayer: row.wallet === wallet,
      attack: 0,
    }))

    const serverPlayer = participants.find((entry) => entry.isPlayer)
    if (serverPlayer) {
      serverPlayer.damage = Math.max(serverPlayer.damage, playerEntry.damage)
      serverPlayer.joined = serverPlayer.joined || playerEntry.joined
      serverPlayer.name = playerEntry.name
    } else {
      participants.unshift({ ...playerEntry, isPlayer: true })
    }

    state.worldBoss.participants = participants

    await maybeClaimWorldBossReward(wallet, bossRow, state)
    syncHud()
  }

  const loadAdminData = async () => {
    if (!isAdmin) {
      setAdminError('Admin access required.')
      return
    }
    if (!supabase) {
      setAdminError('Supabase not configured.')
      return
    }
    setAdminLoading(true)
    setAdminError('')
    const { data, error } = await supabase
      .from('profiles')
      .select('wallet, state, updated_at')
      .order('updated_at', { ascending: false })
      .limit(250)
    if (error) {
      setAdminError('Failed to load players.')
      setAdminLoading(false)
      return
    }

    const { data: withdrawalsData, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('id, wallet, name, crystals, sol_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (withdrawalsError) {
      setAdminError('Failed to load withdrawals.')
      setAdminLoading(false)
      return
    }
    const now = Date.now()
    const players: AdminPlayerRow[] = (data ?? []).map((row) => {
      const saved = (row.state as PersistedState | null) ?? null
      const equipment = normalizeEquipment(saved?.equipment)
      const tierScore = getTierScore(equipment)
      const level = saved?.player?.level ?? 1
      const gold = saved?.gold ?? 0
      const crystals = saved?.crystals ?? 0
      const kills = saved?.monsterKills ?? 0
      const dungeons = saved?.dungeonRuns ?? 0
      const name = saved?.name || 'Unknown'
      return {
        wallet: row.wallet as string,
        name,
        level,
        tierScore,
        gold,
        crystals,
        kills,
        dungeons,
        updatedAt: (row.updated_at as string) || new Date(0).toISOString(),
      }
    })

    const totalPlayers = players.length
    const totals = players.reduce(
      (acc, player) => {
        acc.level += player.level
        acc.tier += player.tierScore
        acc.gold += player.gold
        acc.crystals += player.crystals
        acc.kills += player.kills
        acc.dungeons += player.dungeons
        acc.maxLevel = Math.max(acc.maxLevel, player.level)
        const lastSeen = new Date(player.updatedAt).getTime()
        if (!Number.isNaN(lastSeen) && now - lastSeen <= 24 * 60 * 60 * 1000) {
          acc.active += 1
        }
        return acc
      },
      { level: 0, tier: 0, gold: 0, crystals: 0, kills: 0, dungeons: 0, active: 0, maxLevel: 0 },
    )

    const withdrawals: WithdrawalRow[] = (withdrawalsData ?? []).map((row) => ({
      id: String(row.id),
      wallet: row.wallet as string,
      name: (row.name as string) || 'Unknown',
      crystals: Number(row.crystals ?? 0),
      sol_amount: Number(row.sol_amount ?? 0),
      status: (row.status as string) || 'pending',
      created_at: (row.created_at as string) || new Date(0).toISOString(),
    }))

    const pending = withdrawals.filter((entry) => entry.status === 'pending')
    const pendingCrystals = pending.reduce((sum, entry) => sum + entry.crystals, 0)

    const summary: AdminSummary = {
      totalPlayers,
      active24h: totals.active,
      avgLevel: totalPlayers ? Math.round(totals.level / totalPlayers) : 0,
      avgTierScore: totalPlayers ? Math.round(totals.tier / totalPlayers) : 0,
      totalGold: totals.gold,
      totalCrystals: totals.crystals,
      totalKills: totals.kills,
      totalDungeons: totals.dungeons,
      maxLevel: totals.maxLevel,
      pendingWithdrawals: pending.length,
      pendingCrystals,
    }

    setAdminData({ summary, players, withdrawals })
    setAdminLoading(false)
  }

  const markWithdrawalPaid = async (withdrawalId: string) => {
    if (!isAdmin || !supabase) return
    setAdminLoading(true)
    setAdminError('')
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'paid' })
      .eq('id', withdrawalId)
    if (error) {
      setAdminError('Failed to update withdrawal.')
      setAdminLoading(false)
      return
    }
    await loadAdminData()
  }

  const submitWithdrawal = async () => {
    const state = gameStateRef.current
    const wallet = publicKey?.toBase58()
    if (!state || !wallet || !supabase) return

    const amount = Math.floor(Number(withdrawAmount))
    if (!Number.isFinite(amount) || amount <= 0) {
      setWithdrawError('Enter a valid amount.')
      return
    }
    if (amount < WITHDRAW_MIN) {
      setWithdrawError(`Minimum withdrawal is ${WITHDRAW_MIN} crystals.`)
      return
    }
    if (amount > state.crystals) {
      setWithdrawError('Not enough crystals.')
      return
    }

    const solAmount = Number((amount / WITHDRAW_RATE).toFixed(4))
    const createdAt = new Date().toISOString()
    const { error } = await supabase.from('withdrawals').insert({
      wallet,
      name: state.name,
      crystals: amount,
      sol_amount: solAmount,
      status: 'pending',
      created_at: createdAt,
    })
    if (error) {
      setWithdrawError('Failed to submit request.')
      return
    }

    state.crystals = Math.max(0, state.crystals - amount)
    pushLog(state.eventLog, `Withdrawal requested: ${amount} crystals.`)
    setWithdrawAmount('')
    setWithdrawError('')
    setPlayerWithdrawals((prev) => [
      {
        id: `local-${createdAt}`,
        wallet,
        name: state.name,
        crystals: amount,
        sol_amount: solAmount,
        status: 'pending',
        created_at: createdAt,
      },
      ...prev,
    ])
    syncHud()
    void saveGameState()
    setActivePanel(null)
  }

  const buyGoldPackage = async (packId: string) => {
    const state = gameStateRef.current
    if (!state || !publicKey) {
      setBuyGoldError('Connect your wallet to buy gold.')
      return
    }
    const pack = GOLD_PACKAGES.find((entry) => entry.id === packId)
    if (!pack) return
    setBuyGoldLoading(packId)
    setBuyGoldError('')
    try {
      const priceSol = (await fetchTokenPriceSol(true)) ?? tokenPriceSol
      if (!priceSol) {
        setBuyGoldError('Token price unavailable. Try again in a moment.')
        setBuyGoldLoading(null)
        return
      }
      const tokenAmount = pack.sol / priceSol
      const decimals = await ensureTokenDecimals()
      const rawAmount = BigInt(Math.ceil(tokenAmount * 10 ** decimals))
      const fromAta = await getAssociatedTokenAddress(TOKEN_MINT, publicKey)
      let fromAccount
      try {
        fromAccount = await getAccount(connection, fromAta)
      } catch {
        setBuyGoldError(`No ${TOKEN_SYMBOL} balance found for this wallet.`)
        setBuyGoldLoading(null)
        return
      }
      if (fromAccount.amount < rawAmount) {
        setBuyGoldError(`Not enough ${TOKEN_SYMBOL}. Need ${formatTokenAmount(tokenAmount)} ${TOKEN_SYMBOL}.`)
        setBuyGoldLoading(null)
        return
      }
      const toAta = await getAssociatedTokenAddress(TOKEN_MINT, GOLD_STORE_WALLET)
      const instructions = []
      try {
        await getAccount(connection, toAta)
      } catch {
        instructions.push(createAssociatedTokenAccountInstruction(publicKey, toAta, GOLD_STORE_WALLET, TOKEN_MINT))
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      }).add(...instructions, createTransferInstruction(fromAta, toAta, publicKey, rawAmount))
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
      state.gold += pack.gold
      pushLog(state.eventLog, `Purchased ${formatNumber(pack.gold)} gold.`)
      syncHud()
      void saveGameState()
      void loadTokenBalance()
      setActivePanel(null)
    } catch (error) {
      console.warn('Gold purchase failed', error)
      const message = error instanceof Error ? error.message : String(error)
      setBuyGoldError(`Transaction failed: ${message}`)
    } finally {
      setBuyGoldLoading(null)
    }
  }

  const buyStarterPack = async () => {
    const state = gameStateRef.current
    if (!state || !publicKey) {
      setStarterPackError('Connect your wallet to buy the starter pack.')
      return
    }
    if (state.starterPackPurchased) {
      setStarterPackError('Starter pack already purchased.')
      return
    }
    setStarterPackLoading(true)
    setStarterPackError('')
    try {
      const priceSol = (await fetchTokenPriceSol(true)) ?? tokenPriceSol
      if (!priceSol) {
        setStarterPackError('Token price unavailable. Try again in a moment.')
        setStarterPackLoading(false)
        return
      }
      const tokenAmount = STARTER_PACK_PRICE / priceSol
      const decimals = await ensureTokenDecimals()
      const rawAmount = BigInt(Math.ceil(tokenAmount * 10 ** decimals))
      const fromAta = await getAssociatedTokenAddress(TOKEN_MINT, publicKey)
      let fromAccount
      try {
        fromAccount = await getAccount(connection, fromAta)
      } catch {
        setStarterPackError(`No ${TOKEN_SYMBOL} balance found for this wallet.`)
        setStarterPackLoading(false)
        return
      }
      if (fromAccount.amount < rawAmount) {
        setStarterPackError(`Not enough ${TOKEN_SYMBOL}. Need ${formatTokenAmount(tokenAmount)} ${TOKEN_SYMBOL}.`)
        setStarterPackLoading(false)
        return
      }
      const toAta = await getAssociatedTokenAddress(TOKEN_MINT, GOLD_STORE_WALLET)
      const instructions = []
      try {
        await getAccount(connection, toAta)
      } catch {
        instructions.push(createAssociatedTokenAccountInstruction(publicKey, toAta, GOLD_STORE_WALLET, TOKEN_MINT))
      }
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()
      const tx = new Transaction({
        feePayer: publicKey,
        recentBlockhash: blockhash,
      }).add(...instructions, createTransferInstruction(fromAta, toAta, publicKey, rawAmount))
      const signature = await sendTransaction(tx, connection)
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')

      state.gold += STARTER_PACK_GOLD
      STARTER_PACK_ITEMS.forEach((entry) => {
        for (let i = 0; i < entry.qty; i += 1) {
          addConsumable(state, entry.type)
        }
      })
      state.starterPackPurchased = true
      pushLog(state.eventLog, 'Starter Pack purchased.')
      syncHud()
      void saveGameState()
      void loadTokenBalance()
      setActivePanel(null)
    } catch (error) {
      console.warn('Starter pack purchase failed', error)
      const message = error instanceof Error ? error.message : String(error)
      setStarterPackError(`Transaction failed: ${message}`)
    } finally {
      setStarterPackLoading(false)
    }
  }

  const startStake = () => {
    const state = gameStateRef.current
    if (!state) return
    const amount = Math.floor(Number(stakeAmount))
    if (!Number.isFinite(amount) || amount <= 0) {
      setStakeError('Enter a valid amount.')
      return
    }
    if (amount < STAKE_MIN) {
      setStakeError(`Minimum stake is ${STAKE_MIN} crystals.`)
      return
    }
    if (amount > state.crystals) {
      setStakeError('Not enough crystals.')
      return
    }
    state.crystals -= amount
    const nextId = state.stakeId + 1
    state.stakeId = nextId
    state.stake = [
      {
        id: nextId,
        amount,
        endsAt: Date.now() + STAKE_DURATION * 1000,
      },
      ...state.stake,
    ]
    setStakeAmount('')
    setStakeError('')
    pushLog(state.eventLog, `Staked ${amount} crystals.`)
    syncHud()
    void saveGameState()
  }

  const claimStake = (stakeId: number) => {
    const state = gameStateRef.current
    if (!state) return
    const entry = state.stake.find((item) => item.id === stakeId)
    if (!entry) return
    if (Date.now() < entry.endsAt) {
      setStakeError('Stake is still locked.')
      return
    }
    const bonus = Math.floor(entry.amount * STAKE_BONUS)
    const total = entry.amount + bonus
    state.crystals += total
    state.stake = state.stake.filter((item) => item.id !== stakeId)
    pushLog(state.eventLog, `Stake completed: +${total} crystals.`)
    setStakeError('')
    syncHud()
    void saveGameState()
  }

  const addConsumable = (state: GameState, type: ConsumableType) => {
    const consumable = createConsumable(++state.consumableId, type)
    state.consumables = [consumable, ...state.consumables]
    return consumable
  }

  const buyEnergyPotion = (cost: number) => {
    const state = gameStateRef.current
    if (!state) return
    if (state.gold < cost) {
      pushLog(state.eventLog, 'Not enough gold.')
      syncHud()
      return
    }
    state.gold -= cost
    addConsumable(state, 'energy-small')
    pushLog(state.eventLog, 'Energy tonic added to consumables.')
    syncHud()
    void saveGameState()
  }

  const buyFullEnergy = (cost: number) => {
    const state = gameStateRef.current
    if (!state) return
    if (state.gold < cost) {
      pushLog(state.eventLog, 'Not enough gold.')
      syncHud()
      return
    }
    state.gold -= cost
    addConsumable(state, 'energy-full')
    pushLog(state.eventLog, 'Grand Energy Elixir added to consumables.')
    syncHud()
    void saveGameState()
  }

  const buySpeedPotion = (cost: number) => {
    const state = gameStateRef.current
    if (!state) return
    if (state.gold < cost) {
      pushLog(state.eventLog, 'Not enough gold.')
      syncHud()
      return
    }
    state.gold -= cost
    addConsumable(state, 'speed')
    pushLog(state.eventLog, 'Swift Draught added to consumables.')
    syncHud()
    void saveGameState()
  }

  const buyAttackSpeedPotion = (cost: number) => {
    const state = gameStateRef.current
    if (!state) return
    if (state.gold < cost) {
      pushLog(state.eventLog, 'Not enough gold.')
      syncHud()
      return
    }
    state.gold -= cost
    addConsumable(state, 'attack')
    pushLog(state.eventLog, 'Battle Tonic added to consumables.')
    syncHud()
    void saveGameState()
  }

  const buyDungeonTicket = (cost: number) => {
    const state = gameStateRef.current
    if (!state) return
    if (state.gold < cost) {
      pushLog(state.eventLog, 'Not enough gold.')
      syncHud()
      return
    }
    state.gold -= cost
    addConsumable(state, 'key')
    pushLog(state.eventLog, 'Dungeon key added to consumables.')
    syncHud()
    void saveGameState()
  }

  const grantQuestRewardItem = (state: GameState, item: QuestRewardItem) => {
    addConsumable(state, item)
    return { label: questRewardItemName(item), applied: true }
  }

  const useConsumable = (item: ConsumableItem) => {
    const state = gameStateRef.current
    if (!state) return
    let applied = true
    let message = ''

    switch (item.type) {
      case 'energy-small':
        state.energy = clamp(state.energy + 10, 0, state.energyMax)
        message = 'Energy restored by 10.'
        break
      case 'energy-full':
        state.energy = state.energyMax
        message = 'Energy fully restored.'
        break
      case 'speed':
        state.speedBuffTime = Math.max(state.speedBuffTime, 300)
        message = 'Speed increased for 300s.'
        break
      case 'attack':
        state.attackSpeedBuffTime = Math.max(state.attackSpeedBuffTime, 300)
        message = 'Attack speed increased for 300s.'
        break
      case 'key':
        if (state.tickets >= SHOP_TICKET_CAP) {
          applied = false
          message = 'Key storage is full.'
          break
        }
        state.tickets += 1
        message = 'Dungeon key used.'
        break
      default:
        applied = false
        message = 'Cannot use item.'
        break
    }

    if (applied) {
      state.consumables = state.consumables.filter((entry) => entry.id !== item.id)
    }
    pushLog(state.eventLog, message)
    syncHud()
    void saveGameState()
  }

  const joinWorldBoss = () => {
    const state = gameStateRef.current
    if (!state) return
    const participant = state.worldBoss.participants.find((entry) => entry.isPlayer)
    if (!participant) return
    participant.joined = true
    participant.name = state.name
    syncHud()
    void syncWorldBossFromServer()
    void saveGameState()
  }

  const claimQuest = (quest: QuestDefinition) => {
    const state = gameStateRef.current
    if (!state) return
    const questState = state.questStates[quest.id]
    if (!questState || questState.claimed) return
    const progress = getQuestProgress(state, quest)
    if (progress < quest.target) return
    state.questStates = {
      ...state.questStates,
      [quest.id]: { ...questState, claimed: true },
    }
    state.gold += quest.rewardGold
    const rewardParts = [`+${quest.rewardGold} gold`]
    if (quest.rewardItem) {
      const reward = grantQuestRewardItem(state, quest.rewardItem)
      if (reward.label) {
        rewardParts.push(reward.applied ? `+${reward.label}` : `${reward.label} (storage full)`)
      }
    }
    pushLog(state.eventLog, `Quest completed: ${rewardParts.join(', ')}.`)
    syncHud()
    void saveGameState()
  }

  const equipItem = (item: EquipmentItem, source: 'loot' | 'inventory') => {
    const state = gameStateRef.current
    if (!state) return
    const current = state.equipment[item.slot]
    if (current) {
      state.inventory.push(current)
    }
    state.equipment[item.slot] = item
    if (source === 'loot') {
      state.pendingLoot = null
    } else {
      state.inventory = state.inventory.filter((entry) => entry.id !== item.id)
    }
    recomputePlayerStats(state)
    pushLog(state.eventLog, `Equipped ${item.rarity} ${item.name}.`)
    syncHud()
    void saveGameState()
  }

  const sellItem = (item: EquipmentItem, source: 'loot' | 'inventory') => {
    const state = gameStateRef.current
    if (!state) return
    state.gold += item.sellValue
    if (source === 'loot') {
      state.pendingLoot = null
    } else {
      state.inventory = state.inventory.filter((entry) => entry.id !== item.id)
    }
    pushLog(state.eventLog, `Sold ${item.rarity} ${item.name} for ${item.sellValue} gold.`)
    syncHud()
    void saveGameState()
  }

  const runDungeon = (dungeon: (typeof DUNGEONS)[number]) => {
    const state = gameStateRef.current
    if (!state) return
    const score = getTierScore(state.equipment)
    if (state.tickets <= 0 || score < dungeon.tierScore) return
    state.tickets -= 1
    state.crystals += dungeon.reward
    state.dungeonRuns += 1
    pushLog(state.eventLog, `${dungeon.name} cleared. +${dungeon.reward} crystals.`)
    syncHud()
    void saveGameState()
  }

  const acknowledgeLevelUp = () => {
    const state = gameStateRef.current
    if (!state) return
    state.levelUpNotice = null
    syncHud()
  }

  const shortKey = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : ''

  const levelUpNotice = hud?.levelUpNotice ?? null

  const getQuestProgressValue = (quest: QuestDefinition) => {
    if (!hud) return 0
    switch (quest.type) {
      case 'level':
        return hud.level
      case 'kills':
        return hud.monsterKills
      case 'tier':
        return hud.tierScore
      case 'dungeons':
        return hud.dungeonRuns
      default:
        return 0
    }
  }

  const questEntries = useMemo(() => {
    if (!hud) return []
    return QUESTS.map((quest, index) => {
      const progress = getQuestProgressValue(quest)
      const claimed = hud.questStates[quest.id]?.claimed ?? false
      const completed = progress >= quest.target
      const pct = Math.min(100, Math.round((progress / quest.target) * 100))
      const statusRank = completed && !claimed ? 0 : completed && claimed ? 2 : 1
      return { quest, index, progress, claimed, completed, pct, statusRank }
    }).sort((a, b) => (a.statusRank - b.statusRank) || (a.index - b.index))
  }, [hud?.level, hud?.monsterKills, hud?.tierScore, hud?.dungeonRuns, hud?.questStates])

  const topbarClass = stage === 'select' ? 'topbar centered' : 'topbar'
  const resourceChips = hud ? (
    <>
      <div className="resource-chip gold with-action">
        <img className="icon-img" src={iconGold} alt="" />
        <div className="resource-text">
          <div className="resource-main">
            <span>Gold</span>
            <strong>{hud.gold}</strong>
          </div>
          <div className="resource-actions">
            <button type="button" className="resource-action buy-gold" onClick={() => setActivePanel('buygold')}>
              <img className="icon-img tiny" src={iconBuyGold} alt="" />
              Buy Gold
            </button>
          </div>
        </div>
      </div>
      <div className="resource-chip crystals with-action">
        <img className="icon-img" src={iconCrystals} alt="" />
        <div className="resource-text">
          <div className="resource-main">
            <span>Crystals</span>
            <strong>{hud.crystals}</strong>
          </div>
          <div className="resource-actions">
            <button type="button" className="resource-action" onClick={() => setActivePanel('withdraw')}>
              <img className="icon-img tiny" src={iconWithdraw} alt="" />
              Withdraw
            </button>
            <button type="button" className="resource-action secondary" onClick={() => setActivePanel('stake')}>
              <img className="icon-img tiny" src={iconStacking} alt="" />
              Staking
            </button>
          </div>
        </div>
      </div>
      <div className="resource-chip energy">
        <span className="icon icon-energy" aria-hidden />
        <div className="resource-text">
          <span>Energy</span>
          <strong>
            {hud.energy}/{hud.energyMax}
          </strong>
          <small className="resource-timer">Next in {formatTimer(hud.energyTimer)}</small>
        </div>
      </div>
      <div className="resource-chip tier">
        <span className="icon icon-tier" aria-hidden />
        <span>Tier</span>
        <strong>{hud.tierScore}</strong>
      </div>
    </>
  ) : null
  const resourceActionRow = (
    <div className="resources-actions-row">
      <button type="button" className="resource-action buy-gold" onClick={() => setActivePanel('buygold')}>
        <img className="icon-img tiny" src={iconBuyGold} alt="" />
        Buy Gold
      </button>
      <button type="button" className="resource-action" onClick={() => setActivePanel('withdraw')}>
        <img className="icon-img tiny" src={iconWithdraw} alt="" />
        Withdraw
      </button>
      <button type="button" className="resource-action secondary" onClick={() => setActivePanel('stake')}>
        <img className="icon-img tiny" src={iconStacking} alt="" />
        Staking
      </button>
    </div>
  )

  return (
    <div className={`app ${stage === 'auth' ? 'auth-mode' : ''} ${isMobile ? 'mobile' : ''}`}>
      <audio ref={audioRef} src={bgMusic} preload="auto" playsInline />
      {stage !== 'auth' && (
        <header className={topbarClass}>
          <div>
            <div className="brand">DOGE QUEST</div>
            <div className="subtitle">Auto-battle, loot and XP in a pixel world</div>
          </div>
          <div className="top-actions">
            {stage === 'game' && hud && (
              <div className={`resources ${isMobile ? 'mobile-resources' : ''}`}>
                {isMobile ? (
                  <>
                    <div className="resources-strip">{resourceChips}</div>
                    {resourceActionRow}
                  </>
                ) : (
                  resourceChips
                )}
              </div>
            )}
          </div>
            <div className="wallet">
            <div className="wallet-row">
              <button
                type="button"
                className={`music-toggle ${musicEnabled ? 'on' : 'off'}`}
                onClick={() => setMusicEnabled((prev) => !prev)}
              >
                {musicEnabled ? 'Music On' : 'Music Off'}
              </button>
              <WalletMultiButton className="wallet-button" />
            </div>
            {(connected || isAdmin) && (
              <div className="wallet-hint-row">
                {isAdmin && (
                  <button type="button" className="admin-inline" onClick={() => setActivePanel('admin')}>
                    <span className="icon icon-admin" aria-hidden />
                    Admin
                  </button>
                )}
                {connected && <div className="wallet-hint">Wallet: {shortKey}</div>}
              </div>
            )}
          </div>
        </header>
      )}

      {stage === 'auth' && (
        <section className="auth-page">
          <a className="auth-x-button" href="https://x.com/Doge_mmorpg" target="_blank" rel="noreferrer">
            X
          </a>
          <div className="auth-hero">
            <div className="auth-hero-copy reveal">
              <div className="auth-eyebrow">Solana Pixel RPG</div>
              <h1 className="auth-title">DOGE QUEST</h1>
              <p className="auth-lead">
                A living pixel realm where your gear, Tier Score, and timing decide the outcome. Battle on demand,
                conquer dungeons, and share World Boss rewards.
              </p>
              <p className="auth-sublead highlight">
                Earn real SOL by playing: farm crystals in dungeons and World Boss raids, then convert rewards to SOL.
                The deeper you push, the larger the payouts.
              </p>
              <div className="auth-cta">
                <div className="auth-cta-row">
                  <WalletMultiButton className="wallet-button auth-wallet" />
                  <button type="button" className="contract-button" onClick={copyContractAddress}>
                    Contract Address: <strong>{CONTRACT_ADDRESS}</strong>
                    <span className="copy-icon" aria-hidden>⧉</span>
                    {contractCopied && <span className="copy-tag">Copied</span>}
                  </button>
                </div>
                <span className="auth-note">Connect wallet to continue. We only read your address.</span>
              </div>
              <div className="auth-stats">
                <div className="stat-card">
                  <span className="stat-value">255</span>
                  <span className="stat-label">Levels</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">7</span>
                  <span className="stat-label">Rarities</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">20</span>
                  <span className="stat-label">Dungeons</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">Mainnet</span>
                  <span className="stat-label">Solana</span>
                </div>
              </div>
            </div>
            <div className="auth-hero-art reveal delay-1">
              <div className="hero-boss-frame">
                <img className="hero-boss" src={worldBossImage} alt="World boss" />
              </div>
            </div>
          </div>

          <div className="auth-section reveal delay-2">
            <h2>Core gameplay</h2>
            <div className="feature-grid">
              <div className="feature-card">
                <img src={iconBattle} alt="" />
                <div>
                  <h3>Battle on demand</h3>
                  <p>Spend energy for a single fight or toggle Auto Battle to keep momentum.</p>
                </div>
              </div>
              <div className="feature-card">
                <img src={iconQuests} alt="" />
                <div>
                  <h3>Quest progression</h3>
                  <p>Long-term quests guide leveling, dungeons, and Tier Score milestones.</p>
                </div>
              </div>
              <div className="feature-card">
                <img src={iconDungeons} alt="" />
                <div>
                  <h3>Dungeon tiers</h3>
                  <p>Keys unlock tougher crypts with higher crystal rewards.</p>
                </div>
              </div>
              <div className="feature-card">
                <img src={iconWorldBoss} alt="" />
                <div>
                  <h3>World Boss raids</h3>
                  <p>Join each cycle, stack damage, and claim your share of the crystal pool.</p>
                </div>
              </div>
              <div className="feature-card">
                <img src={iconShop} alt="" />
                <div>
                  <h3>Merchant shop</h3>
                  <p>Stock energy, speed, and attack tonics to push further.</p>
                </div>
              </div>
              <div className="feature-card">
                <img src={iconCrystals} alt="" />
                <div>
                  <h3>Crystals to SOL</h3>
                  <p>Turn crystal rewards into SOL at a fixed exchange rate.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-section alt reveal delay-3">
            <h2>Choose your legend</h2>
            <div className="roster-grid">
              <div className="roster-card">
                <img src={knightSprite} alt="Knight Vanguard" />
                <span>Knight Vanguard</span>
              </div>
              <div className="roster-card">
                <img src={mageSprite} alt="Arcane Mage" />
                <span>Arcane Mage</span>
              </div>
              <div className="roster-card">
                <img src={archerSprite} alt="Swift Archer" />
                <span>Swift Archer</span>
              </div>
              <div className="roster-card">
                <img src={elonSprite} alt="Elon" />
                <span>Elon Commander</span>
              </div>
              <div className="roster-card">
                <img src={gakeSprite} alt="Gake" />
                <span>Gake Trickster</span>
              </div>
            </div>
          </div>

          <div className="auth-section reveal delay-4">
            <h2>Monsters of the realm</h2>
            <div className="roster-grid monsters">
              <div className="roster-card">
                <img src={goblinSprite} alt="Goblin" />
                <span>Goblin Raider</span>
              </div>
              <div className="roster-card">
                <img src={deathEyeSprite} alt="Death Eye" />
                <span>Death Eye</span>
              </div>
              <div className="roster-card">
                <img src={skeletonWarriorSprite} alt="Skeleton Warrior" />
                <span>Skeleton Warrior</span>
              </div>
              <div className="roster-card">
                <img src={iceDragonSprite} alt="Ice Dragon" />
                <span>Ice Dragon</span>
              </div>
              <div className="roster-card">
                <img src={lavaDemonSprite} alt="Lava Demon" />
                <span>Lava Demon</span>
              </div>
              <div className="roster-card">
                <img src={blackWizardSprite} alt="Black Wizard" />
                <span>Black Wizard</span>
              </div>
              <div className="roster-card">
                <img src={mushroomSprite} alt="Mushroom Brute" />
                <span>Mushroom Brute</span>
              </div>
              <div className="roster-card">
                <img src={firewormSprite} alt="Fireworm" />
                <span>Fireworm</span>
              </div>
            </div>
          </div>

          <div className="auth-section reveal delay-5">
            <h2>Progression and Web3</h2>
            <div className="progress-grid">
              <div className="progress-card">
                <img src={iconCrystals} alt="" />
                <div>
                  <h3>Crystals economy</h3>
                  <p>Earn crystals in raids and dungeons, then convert them into SOL.</p>
                </div>
              </div>
              <div className="progress-card">
                <img src={iconGold} alt="" />
                <div>
                  <h3>Gear upgrades</h3>
                  <p>Loot rarity and item level push Tier Score higher.</p>
                </div>
              </div>
              <div className="progress-card">
                <img src={iconKey} alt="" />
                <div>
                  <h3>Dungeon readiness</h3>
                  <p>Build your loadout to meet strict Tier Score thresholds.</p>
                </div>
              </div>
              <div className="progress-card">
                <img src={iconSolana} alt="" />
                <div>
                  <h3>Solana integration</h3>
                  <p>Wallet login and on-chain purchases keep your rewards tied to your Solana address.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-section highlight reveal delay-6">
            <h2>How to earn SOL</h2>
            <div className="earn-grid">
              <div className="earn-card">
                <div className="earn-number">01</div>
                <h3>Farm dungeons</h3>
                <p>Clear higher tiers for larger crystal payouts.</p>
              </div>
              <div className="earn-card">
                <div className="earn-number">02</div>
                <h3>Join World Boss</h3>
                <p>Deal damage every cycle and share the crystal pool.</p>
              </div>
              <div className="earn-card">
                <div className="earn-number">03</div>
                <h3>Boost Tier Score</h3>
                <p>Better gear unlocks tougher content with higher rewards.</p>
              </div>
              <div className="earn-card">
                <div className="earn-number">04</div>
                <h3>Convert crystals</h3>
                <p>Exchange your crystal balance into SOL at a fixed rate.</p>
              </div>
            </div>
          </div>

          <div className="auth-section tokenomics reveal delay-7">
            <h2>Tokenomics</h2>
            <div className="tokenomics-split">
              <div className="tokenomics-slice buyback">
                <div className="tokenomics-slice-label">
                  <strong>50%</strong>
                  <span>Buyback & burn</span>
                </div>
              </div>
              <div className="tokenomics-slice treasury">
                <div className="tokenomics-slice-label">
                  <strong>50%</strong>
                  <span>Treasury for players</span>
                </div>
              </div>
            </div>
            <div className="tokenomics-grid">
              <div className="tokenomics-card">
                <div className="tokenomics-title">Creator rewards allocation</div>
                <p>
                  50% of creator rewards go to token buyback & burn. The remaining 50% flows into the treasury to fund
                  player payouts.
                </p>
              </div>
              <div className="tokenomics-card">
                <div className="tokenomics-title">In‑game purchase revenue</div>
                <p>
                  Revenue from in‑game purchases follows the same split: 50% buyback & burn, 50% treasury for player
                  rewards.
                </p>
              </div>
            </div>
          </div>

          <div className="auth-section roadmap reveal delay-8">
            <h2>Roadmap</h2>
            <ul className="roadmap-list">
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconBattle} alt="" />
                <div>Game launch</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconSolana} alt="" />
                <div>Project token launch</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconCrystals} alt="" />
                <div>Token integration in-game</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconName} alt="" />
                <div>In‑game chat</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconGold} alt="" />
                <div>Daily rewards</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconDungeons} alt="" />
                <div>Guild system</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconWorldBoss} alt="" />
                <div>Guild wars</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconBattle} alt="" />
                <div>PvP arena with crystal wagers</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconQuests} alt="" />
                <div>Daily quests</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconShop} alt="" />
                <div>Player market for equipment trading</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconWorldBoss} alt="" />
                <div>Limited-time bosses & maps with unique rewards</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconInventory} alt="" />
                <div>Customization: skins & profile avatars</div>
              </li>
              <li className="roadmap-item">
                <img className="roadmap-icon" src={iconSolana} alt="" />
                <div>NFT collection</div>
              </li>
            </ul>
          </div>

          <div className="auth-footer reveal delay-9">
            <div>
              <div className="auth-footer-title">Ready to enter the realm?</div>
              <div className="auth-footer-copy">Connect your wallet and choose a class to begin.</div>
            </div>
            <WalletMultiButton className="wallet-button auth-wallet" />
          </div>
        </section>
      )}

      {stage === 'select' && (
        <section className="panel select-panel">
          <h2>Choose a character</h2>
          {isMobile ? (
            <>
              <div className="character-carousel">
                <button type="button" className="carousel-btn" onClick={selectPrevClass}>
                  ‹
                </button>
                <div
                  className="character-card active"
                  style={{ borderColor: selectedClass.color }}
                  onClick={() => setSelectedId(selectedClass.id)}
                >
                  <div className="character-name" style={{ color: selectedClass.color }}>
                    {selectedClass.label}
                  </div>
                  <img
                    className="character-portrait"
                    src={PLAYER_SPRITE_SOURCES[selectedClass.spriteKey]}
                    alt={`${selectedClass.label} portrait`}
                  />
                  <div className="character-tag">{selectedClass.tagline}</div>
                  <div className="character-stats">
                    <span>ATK {selectedClass.stats.attack}</span>
                    <span>SPD {selectedClass.stats.speed}</span>
                  </div>
                </div>
                <button type="button" className="carousel-btn" onClick={selectNextClass}>
                  ›
                </button>
              </div>
              <div className="character-dots">
                {CHARACTER_CLASSES.map((character) => (
                  <button
                    key={character.id}
                    type="button"
                    className={`character-dot ${character.id === selectedId ? 'active' : ''}`}
                    onClick={() => setSelectedId(character.id)}
                    aria-label={`Select ${character.label}`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="character-grid">
              {CHARACTER_CLASSES.map((character) => (
                <button
                  key={character.id}
                  className={`character-card ${selectedId === character.id ? 'active' : ''}`}
                  style={{ borderColor: character.color }}
                  onClick={() => setSelectedId(character.id)}
                >
                  <div className="character-name" style={{ color: character.color }}>
                    {character.label}
                  </div>
                  <img
                    className="character-portrait"
                    src={PLAYER_SPRITE_SOURCES[character.spriteKey]}
                    alt={`${character.label} portrait`}
                  />
                  <div className="character-tag">{character.tagline}</div>
                  <div className="character-stats">
                    <span>ATK {character.stats.attack}</span>
                    <span>SPD {character.stats.speed}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="name-row">
            <label>
              Character name
              <input
                value={playerName}
                maxLength={10}
                onChange={(event) => setPlayerName(sanitizePlayerName(event.target.value))}
                placeholder="Latin letters, max 10"
              />
            </label>
            <button
              className="start-button"
              disabled={playerName.trim().length < 2}
              onClick={() => setStage('game')}
            >
              Start adventure
            </button>
          </div>
        </section>
      )}

      {stage === 'game' && (
        <section className="game-section">
          <div className="game-layout">
            <aside className="left-panel">
              {hud ? (
                <>
                  <div className="player-card">
                    <div className="player-name">
                      <img className="icon-img" src={iconName} alt="" />
                      {hud.name}
                    </div>
                    <div className="player-class">{hud.classLabel}</div>
                    <div className="player-level">
                      <span className="icon icon-level" aria-hidden />
                      Level {hud.level}
                    </div>
                    <div className="player-xp">
                      <span className="icon icon-xp" aria-hidden />
                      XP {hud.xp}/{hud.xpNext}
                    </div>
                  </div>
                  <div className="player-stats">
                    <div>ATK {hud.attack}</div>
                    <div>SPD {hud.speed}</div>
                    <div>ATK SPD {hud.attackSpeed}</div>
                    <div>RNG {hud.range}</div>
                    {hud.speedBuffTime > 0 && <div>Speed Buff {Math.ceil(hud.speedBuffTime)}s</div>}
                    {hud.attackSpeedBuffTime > 0 && <div>ATK SPD Buff {Math.ceil(hud.attackSpeedBuffTime)}s</div>}
                  </div>
                  <div className="menu-stack">
                    <button type="button" className="menu-big" onClick={() => setActivePanel('inventory')}>
                      <img className="icon-img" src={iconInventory} alt="" />
                      Inventory
                    </button>
                    <button type="button" className="menu-big" onClick={() => setActivePanel('dungeons')}>
                      <img className="icon-img" src={iconDungeons} alt="" />
                      Dungeons
                    </button>
                    <button type="button" className="menu-big" onClick={() => setActivePanel('shop')}>
                      <img className="icon-img" src={iconShop} alt="" />
                      Shop
                    </button>
                    <button type="button" className="menu-big" onClick={() => setActivePanel('quests')}>
                      <img className="icon-img" src={iconQuests} alt="" />
                      Quests
                    </button>
                    <button type="button" className="menu-big" onClick={() => setActivePanel('worldboss')}>
                      <img className="icon-img" src={iconWorldBoss} alt="" />
                      World Boss
                    </button>
                  </div>
                </>
              ) : (
                <div className="player-card">
                  <div className="player-name">Preparing battle...</div>
                  <div className="player-class">Summoning monsters</div>
                </div>
              )}
            </aside>
            <div className="game-main">
              <div className="canvas-wrap">
                {!hud?.starterPackPurchased && (
                  <button
                    type="button"
                    className="starter-pack-btn starter-pack-float"
                    onClick={() => setActivePanel('starterpack')}
                  >
                    <img className="starter-pack-icon" src={iconStarterPack} alt="" />
                    <div className="starter-pack-text">
                      <span>Starter Pack</span>
                      <strong>One-time offer</strong>
                    </div>
                  </button>
                )}
                <canvas ref={canvasRef} className="game-canvas" />
                <div className="buff-stack">
                  <div className={`buff-chip ${hud?.speedBuffTime ? 'active' : ''}`}>
                    <img className="icon-img" src={iconSwiftDraught} alt="Speed buff" />
                    <span>{hud?.speedBuffTime ? `${Math.ceil(hud.speedBuffTime)}s` : '--'}</span>
                  </div>
                  <div className={`buff-chip ${hud?.attackSpeedBuffTime ? 'active' : ''}`}>
                    <img className="icon-img" src={iconAttackSpeed} alt="Attack speed buff" />
                    <span>{hud?.attackSpeedBuffTime ? `${Math.ceil(hud.attackSpeedBuffTime)}s` : '--'}</span>
                  </div>
                </div>
              </div>
              <div className="battle-controls">
                <button type="button" className="battle-btn" onClick={startBattleOnce}>
                  <img className="icon-img battle-icon" src={iconBattle} alt="" />
                  <span className="battle-label">
                    Battle (-1 Energy <span className="icon icon-energy" aria-hidden />)
                  </span>
                </button>
                <button
                  type="button"
                  className={`battle-btn auto ${hud?.autoBattle ? 'active' : ''}`}
                  onClick={toggleAutoBattle}
                >
                  <img className="icon-img battle-icon" src={iconAutoBattle} alt="" />
                  Auto Battle: {hud?.autoBattle ? 'ON' : 'OFF'}
                </button>
              </div>
              {isMobile && (
                <div className="mobile-nav">
                  <button type="button" onClick={() => setActivePanel('inventory')}>
                    <img className="icon-img" src={iconInventory} alt="" />
                    <span>Inventory</span>
                  </button>
                  <button type="button" onClick={() => setActivePanel('dungeons')}>
                    <img className="icon-img" src={iconDungeons} alt="" />
                    <span>Dungeons</span>
                  </button>
                  <button type="button" onClick={() => setActivePanel('shop')}>
                    <img className="icon-img" src={iconShop} alt="" />
                    <span>Shop</span>
                  </button>
                  <button type="button" onClick={() => setActivePanel('quests')}>
                    <img className="icon-img" src={iconQuests} alt="" />
                    <span>Quests</span>
                  </button>
                  <button type="button" onClick={() => setActivePanel('worldboss')}>
                    <img className="icon-img" src={iconWorldBoss} alt="" />
                    <span>Boss</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {levelUpNotice && (
        <div className="modal-backdrop modal-backdrop-top" onClick={acknowledgeLevelUp}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h3>Level {levelUpNotice.level} Reached</h3>
            <div className="loot-card">
              <div className="loot-slot">Updated drop chances</div>
              <div className="chance-list">
                {levelUpNotice.chances.map((chance) => {
                  const prev =
                    levelUpNotice.prevChances.find((entry) => entry.id === chance.id)?.percent ??
                    chance.percent
                  const delta = Number((chance.percent - prev).toFixed(1))
                  const deltaText = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
                  return (
                    <div key={chance.id} className="chance-row">
                      <span style={{ color: chance.color }}>{chance.name}</span>
                      <div className="chance-values">
                        <strong>{chance.percent}%</strong>
                        <span className={delta >= 0 ? 'chance-delta up' : 'chance-delta down'}>
                          {deltaText}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={acknowledgeLevelUp}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {!levelUpNotice && hud?.pendingLoot && (
        <div className="modal-backdrop modal-backdrop-top">
          <div className="modal">
            <h3>Loot Acquired</h3>
            <div
              className={`loot-card rarity-${getRarityId(hud.pendingLoot.rarity)}`}
              style={{ borderColor: hud.pendingLoot.color, ['--rarity-color' as never]: hud.pendingLoot.color }}
            >
              <div className="loot-name" style={{ color: hud.pendingLoot.color }}>
                {hud.pendingLoot.rarity} {hud.pendingLoot.name}
              </div>
              <div className="loot-slot">
                Slot:{' '}
                <img
                  className="icon-img equip-icon"
                  src={EQUIPMENT_ICONS[hud.pendingLoot.slot]}
                  alt=""
                />
                {EQUIPMENT_SLOTS.find((slot) => slot.id === hud.pendingLoot?.slot)?.label ??
                  hud.pendingLoot.slot}
              </div>
              <div className="loot-slot">Level {hud.pendingLoot.level}</div>
              <div className="loot-stats">
                {hud.pendingLoot.bonuses.attack !== 0 && <div>+{hud.pendingLoot.bonuses.attack} ATK</div>}
                {hud.pendingLoot.bonuses.speed !== 0 && <div>+{hud.pendingLoot.bonuses.speed} SPD</div>}
                {hud.pendingLoot.bonuses.attackSpeed !== 0 && (
                  <div>+{hud.pendingLoot.bonuses.attackSpeed} ATK SPD</div>
                )}
                {hud.pendingLoot.bonuses.range !== 0 && <div>+{hud.pendingLoot.bonuses.range} RNG</div>}
              </div>
              {(() => {
                const current = hud.equipment[hud.pendingLoot!.slot]
                if (!current) return <div className="loot-compare">No item equipped in this slot.</div>
                const deltaScore = hud.pendingLoot!.tierScore - current.tierScore
                const compareRows = [
                  ['ATK', hud.pendingLoot!.bonuses.attack - current.bonuses.attack],
                  ['SPD', hud.pendingLoot!.bonuses.speed - current.bonuses.speed],
                  ['ATK SPD', Number((hud.pendingLoot!.bonuses.attackSpeed - current.bonuses.attackSpeed).toFixed(2))],
                  ['RNG', hud.pendingLoot!.bonuses.range - current.bonuses.range],
                ]
                return (
                  <div className="loot-compare">
                    <div className="loot-compare-title">Compared to equipped</div>
                    <div className="loot-compare-row">
                      <span>Tier Score</span>
                      <span className={deltaScore >= 0 ? 'delta up' : 'delta down'}>
                        {deltaScore >= 0 ? '+' : ''}
                        {deltaScore}
                      </span>
                    </div>
                    {compareRows.map(([label, value]) => (
                      <div key={label} className="loot-compare-row">
                        <span>{label}</span>
                        <span className={Number(value) >= 0 ? 'delta up' : 'delta down'}>
                          {Number(value) >= 0 ? '+' : ''}
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => equipItem(hud.pendingLoot!, 'loot')}>
                Equip
              </button>
              <button type="button" className="ghost" onClick={() => sellItem(hud.pendingLoot!, 'loot')}>
                <img className="icon-img small" src={iconGold} alt="" />
                Sell for {hud.pendingLoot.sellValue}
              </button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'inventory' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide inventory-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="inventory-tabs">
              <button
                type="button"
                className={`tab-btn ${inventoryTab === 'equipment' ? 'active' : ''}`}
                onClick={() => setInventoryTab('equipment')}
              >
                Equipment
              </button>
              <button
                type="button"
                className={`tab-btn ${inventoryTab === 'consumables' ? 'active' : ''}`}
                onClick={() => setInventoryTab('consumables')}
              >
                Consumables
              </button>
            </div>
            {isMobile && inventoryTab === 'equipment' && (
              <div className="inventory-subtabs">
                <button
                  type="button"
                  className={`tab-btn ${inventoryView === 'equipped' ? 'active' : ''}`}
                  onClick={() => setInventoryView('equipped')}
                >
                  Equipped
                </button>
                <button
                  type="button"
                  className={`tab-btn ${inventoryView === 'bag' ? 'active' : ''}`}
                  onClick={() => setInventoryView('bag')}
                >
                  Bag
                </button>
              </div>
            )}
            {inventoryTab === 'equipment' && (
              <>
                {(!isMobile || inventoryView === 'equipped') && (
                  <div className="slot-grid">
                    {EQUIPMENT_SLOTS.map((slot) => {
                      const item = hud.equipment[slot.id]
                      const rarityId = item ? getRarityId(item.rarity) : ''
                      return (
                        <div key={slot.id} className={`slot-card slot-${slot.id} ${rarityId ? `rarity-${rarityId}` : ''}`}>
                          <div className="slot-header">
                            <img className="icon-img equip-icon" src={EQUIPMENT_ICONS[slot.id]} alt="" />
                            <div className="slot-label">{slot.label}</div>
                          </div>
                          {item ? (
                            <>
                              <div className="slot-item" style={{ color: item.color }}>
                                {item.rarity} {item.name}
                              </div>
                              <div className="slot-score">Lv. {item.level}</div>
                              <div className="slot-score">Score {item.tierScore}</div>
                            </>
                          ) : (
                            <div className="slot-empty">Empty</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {(!isMobile || inventoryView === 'bag') && (
                  <div className="inventory-section">
                    {!isMobile && <h4>Equipment</h4>}
                    <div className="inventory-list">
                      {hud.inventory.length === 0 && <div className="muted">No items yet.</div>}
                      {hud.inventory.map((item) => {
                        const rarityId = getRarityId(item.rarity)
                        return (
                          <div
                            key={item.id}
                            className={`inventory-item rarity-${rarityId}`}
                            style={{ borderColor: item.color, ['--item-color' as never]: item.color }}
                          >
                            <div>
                              <div className="inventory-name" style={{ color: item.color }}>
                                <img className="icon-img equip-icon small" src={EQUIPMENT_ICONS[item.slot]} alt="" />
                                {item.rarity} {item.name}
                              </div>
                              <div className="inventory-slot">
                                Lv. {item.level} - {EQUIPMENT_SLOTS.find((slot) => slot.id === item.slot)?.label ?? item.slot} - Score {item.tierScore}
                              </div>
                            </div>
                            <div className="inventory-actions">
                              <button type="button" onClick={() => equipItem(item, 'inventory')}>
                                Equip
                              </button>
                              <button type="button" className="ghost" onClick={() => sellItem(item, 'inventory')}>
                                <img className="icon-img small" src={iconGold} alt="" />
                                Sell {item.sellValue}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            {inventoryTab === 'consumables' && (
              <div className="inventory-section">
                <h4>Consumables</h4>
                <div className="inventory-list">
                  {hud.consumables.length === 0 && <div className="muted">No consumables yet.</div>}
                  {hud.consumables.map((item) => (
                    <div key={item.id} className="inventory-item consumable-item">
                      <div>
                        <div className="inventory-name">
                          <img className="icon-img equip-icon small" src={item.icon} alt="" />
                          {item.name}
                        </div>
                        <div className="inventory-slot">{item.description}</div>
                      </div>
                      <div className="inventory-actions">
                        <button type="button" onClick={() => useConsumable(item)}>
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activePanel === 'dungeons' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Dungeons</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="dungeon-meta">
              <div>
                <span className="icon icon-tier" aria-hidden />
                Tier Score: <span className="meta-value">{hud.tierScore}</span>
              </div>
              <div>
                <img className="icon-img" src={iconKey} alt="" />
                Keys: <span className="meta-value">{hud.tickets}</span>
                <span className="meta-muted">/{SHOP_TICKET_CAP}</span>
              </div>
            </div>
            <div className="dungeon-list">
              {DUNGEONS.map((dungeon) => {
                const canEnter = hud.tierScore >= dungeon.tierScore && hud.tickets > 0
                const progress = Math.min(100, Math.round((hud.tierScore / dungeon.tierScore) * 100))
                return (
                  <div key={dungeon.id} className={`dungeon-row ${canEnter ? 'ready' : 'locked'}`}>
                    <div className="dungeon-name">{dungeon.name}</div>
                    <div className="dungeon-reward">
                      <span className="icon icon-crystal" aria-hidden />
                      +{dungeon.reward} crystals
                    </div>
                    <div className="dungeon-req">Requires Tier Score {dungeon.tierScore}</div>
                    <div className="dungeon-bar">
                      <div className="dungeon-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <button type="button" disabled={!canEnter} onClick={() => runDungeon(dungeon)}>
                      Enter
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activePanel === 'shop' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Merchant Shop</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="shop-grid">
              <div className="shop-card">
                <div className="shop-title">Energy Tonic</div>
                <div className="shop-desc">Restore 10 energy.</div>
                <div className="shop-meta">
                  <img className="icon-img small" src={iconGold} alt="" />
                  Cost: 1500
                </div>
                <img className="shop-icon" src={iconEnergyTonic} alt="Energy tonic" />
                <button type="button" onClick={() => buyEnergyPotion(1500)}>
                  Buy
                </button>
              </div>
              <div className="shop-card">
                <div className="shop-title">Grand Energy Elixir</div>
                <div className="shop-desc">Restore energy to full.</div>
                <div className="shop-meta">
                  <img className="icon-img small" src={iconGold} alt="" />
                  Cost: 5000
                </div>
                <img className="shop-icon" src={iconGrandEnergy} alt="Grand energy elixir" />
                <button type="button" onClick={() => buyFullEnergy(5000)}>
                  Buy
                </button>
              </div>
              <div className="shop-card">
                <div className="shop-title">Swift Draught</div>
                <div className="shop-desc">+50% speed for 5 minutes.</div>
                <div className="shop-meta">
                  <img className="icon-img small" src={iconGold} alt="" />
                  Cost: 500
                </div>
                <img className="shop-icon" src={iconSwiftDraught} alt="Swift draught" />
                <button type="button" onClick={() => buySpeedPotion(500)}>
                  Buy
                </button>
              </div>
              <div className="shop-card">
                <div className="shop-title">Battle Tonic</div>
                <div className="shop-desc">+50% attack speed for 5 minutes.</div>
                <div className="shop-meta">
                  <img className="icon-img small" src={iconGold} alt="" />
                  Cost: 500
                </div>
                <img className="shop-icon" src={iconAttackSpeed} alt="Attack speed tonic" />
                <button type="button" onClick={() => buyAttackSpeedPotion(500)}>
                  Buy
                </button>
              </div>
              <div className="shop-card">
                <div className="shop-title">Dungeon Key</div>
                <div className="shop-desc">+1 dungeon entry.</div>
                <div className="shop-meta">
                  <img className="icon-img small" src={iconGold} alt="" />
                  Cost: 25000
                </div>
                <img className="shop-icon" src={iconKey} alt="Dungeon key" />
                <button type="button" onClick={() => buyDungeonTicket(25000)}>
                  Buy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'buygold' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Buy Gold</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="withdraw-body buygold-body">
              <div className="withdraw-info">
                <span className="withdraw-info-label">
                  <img className="icon-img small" src={iconSolana} alt="" />
                  Token balance
                </span>
                <strong>
                  {tokenBalanceLoading ? 'Loading...' : `${formatTokenAmount(tokenBalance)} ${TOKEN_SYMBOL}`}
                </strong>
              </div>
              <div className="buygold-grid">
                {GOLD_PACKAGES.map((pack) => (
                  <div key={pack.id} className="shop-card buygold-card">
                    <img className="shop-icon" src={pack.image} alt="Gold pack" />
                    <div className="shop-title">{formatNumber(pack.gold)} Gold</div>
                    <div className="shop-desc">Instant delivery</div>
                    <div className="shop-meta">
                      <img className="icon-img small" src={iconSolana} alt="" />
                      {(() => {
                        if (tokenPriceLoading) return 'Price: loading...'
                        const tokenCost = tokenPriceSol ? pack.sol / tokenPriceSol : null
                        return tokenCost ? `Price: ${formatTokenAmount(tokenCost)} ${TOKEN_SYMBOL}` : 'Price unavailable'
                      })()}
                    </div>
                    <button
                      type="button"
                      disabled={buyGoldLoading === pack.id || !tokenPriceSol || tokenPriceLoading}
                      onClick={() => buyGoldPackage(pack.id)}
                    >
                      {buyGoldLoading === pack.id ? 'Processing...' : 'Buy'}
                    </button>
                  </div>
                ))}
              </div>
              {buyGoldError && <div className="withdraw-error">{buyGoldError}</div>}
              {tokenPriceError && !buyGoldError && <div className="withdraw-error">{tokenPriceError}</div>}
              <div className="withdraw-note">Gold is added instantly after the transaction confirms.</div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'starterpack' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Starter Pack</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="withdraw-body starterpack-body">
              <div className="starterpack-hero">
                <img className="starterpack-image" src={iconStarterPack} alt="" />
                <div className="starterpack-meta">
                  <div className="starterpack-title">Starter Pack</div>
                  <div className="starterpack-price">
                    <img className="icon-img small" src={iconSolana} alt="" />
                    {tokenPriceLoading
                      ? 'Price: loading...'
                      : tokenPriceSol
                        ? `Price: ${formatTokenAmount(STARTER_PACK_PRICE / tokenPriceSol)} ${TOKEN_SYMBOL}`
                        : 'Price unavailable'}
                  </div>
                </div>
              </div>
              <div className="starterpack-list">
                <div className="starterpack-item">
                  <img className="icon-img" src={iconGold} alt="" />
                  <span>{formatNumber(STARTER_PACK_GOLD)} Gold</span>
                </div>
                <div className="starterpack-item">
                  <img className="icon-img" src={iconEnergyTonic} alt="" />
                  <span>20 Energy Tonic</span>
                </div>
                <div className="starterpack-item">
                  <img className="icon-img" src={iconGrandEnergy} alt="" />
                  <span>5 Grand Energy Elixir</span>
                </div>
                <div className="starterpack-item">
                  <img className="icon-img" src={iconSwiftDraught} alt="" />
                  <span>10 Swift Draught</span>
                </div>
                <div className="starterpack-item">
                  <img className="icon-img" src={iconAttackSpeed} alt="" />
                  <span>10 Battle Tonic</span>
                </div>
                <div className="starterpack-item">
                  <img className="icon-img" src={iconKey} alt="" />
                  <span>20 Dungeon Keys</span>
                </div>
              </div>
              {starterPackError && <div className="withdraw-error">{starterPackError}</div>}
              {tokenPriceError && !starterPackError && <div className="withdraw-error">{tokenPriceError}</div>}
              <button
                type="button"
                className="withdraw-submit"
                disabled={starterPackLoading || !tokenPriceSol || tokenPriceLoading}
                onClick={buyStarterPack}
              >
                {starterPackLoading ? 'Processing...' : 'Buy Starter Pack'}
              </button>
              <div className="withdraw-note">This pack can be purchased only once.</div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'withdraw' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw Crystals</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="withdraw-body">
              <div className="withdraw-info">
                <span className="withdraw-info-label">
                  <img className="icon-img small" src={iconCrystals} alt="" />
                  Exchange rate
                </span>
                <strong>
                  {formatNumber(WITHDRAW_RATE)} <img className="icon-img small" src={iconCrystals} alt="" /> = 1{' '}
                  <img className="icon-img small" src={iconSolana} alt="" />
                </strong>
              </div>
              <div className="withdraw-info">
                <span className="withdraw-info-label">
                  <img className="icon-img small" src={iconCrystals} alt="" />
                  Minimum withdrawal
                </span>
                <strong>
                  {formatNumber(WITHDRAW_MIN)} <img className="icon-img small" src={iconCrystals} alt="" />
                </strong>
              </div>
              <div className="withdraw-info">
                <span className="withdraw-info-label">
                  <img className="icon-img small" src={iconCrystals} alt="" />
                  Available
                </span>
                <strong>
                  {formatNumber(hud.crystals)} <img className="icon-img small" src={iconCrystals} alt="" />
                </strong>
              </div>
              <label className="withdraw-label">
                Amount (crystals)
                <input
                  type="number"
                  min={WITHDRAW_MIN}
                  step={1}
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1000"
                />
              </label>
              {(() => {
                const amount = Math.floor(Number(withdrawAmount))
                if (!Number.isFinite(amount) || amount <= 0) return null
                const solValue = (amount / WITHDRAW_RATE).toFixed(4)
                return (
                  <div className="withdraw-convert">
                    <img className="icon-img small" src={iconCrystals} alt="" />
                    {formatNumber(amount)} =
                    <img className="icon-img small" src={iconSolana} alt="" />
                    {solValue} SOL
                  </div>
                )
              })()}
              {withdrawError && <div className="withdraw-error">{withdrawError}</div>}
              <button type="button" className="withdraw-submit" onClick={submitWithdrawal}>
                Submit request
              </button>
              <div className="withdraw-note">
                Requests are reviewed manually. You will receive SOL in 15min - 2hr.
              </div>
              <div className="withdraw-requests">
                <div className="withdraw-requests-title">Your requests</div>
                {playerWithdrawalsLoading && <div className="muted">Loading requests...</div>}
                {playerWithdrawalsError && <div className="withdraw-error">{playerWithdrawalsError}</div>}
                {!playerWithdrawalsLoading && !playerWithdrawalsError && playerWithdrawals.length === 0 && (
                  <div className="muted">No withdrawal requests yet.</div>
                )}
                {playerWithdrawals.length > 0 && (
                  <div className="withdraw-requests-list">
                    {playerWithdrawals.map((row) => (
                      <div key={row.id} className="withdraw-row">
                        <span className="withdraw-cell id">#{row.id.slice(0, 6)}</span>
                        <span className={`withdraw-cell status ${row.status}`}>{row.status}</span>
                        <span className="withdraw-cell amount">
                          <img className="icon-img small" src={iconCrystals} alt="" />
                          {formatNumber(row.crystals)}
                        </span>
                        <span className="withdraw-cell sol">
                          <img className="icon-img small" src={iconSolana} alt="" />
                          {row.sol_amount}
                        </span>
                        <span className="withdraw-cell date">{formatDateTime(row.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'stake' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Crystal Staking</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="withdraw-body stake-body">
              <div className="stake-tabs">
                <button
                  type="button"
                  className={`tab-btn ${stakeTab === 'stake' ? 'active' : ''}`}
                  onClick={() => setStakeTab('stake')}
                >
                  Stake
                </button>
                <button
                  type="button"
                  className={`tab-btn ${stakeTab === 'my' ? 'active' : ''}`}
                  onClick={() => setStakeTab('my')}
                >
                  My Staking
                </button>
              </div>

              {stakeTab === 'stake' && (
                <>
                  <div className="withdraw-info">
                    <span className="withdraw-info-label">
                      <img className="icon-img small" src={iconCrystals} alt="" />
                      Reward
                    </span>
                    <strong>+{Math.round(STAKE_BONUS * 100)}% in 12 hours</strong>
                  </div>
                  <div className="withdraw-info">
                    <span className="withdraw-info-label">
                      <img className="icon-img small" src={iconCrystals} alt="" />
                      Minimum stake
                    </span>
                    <strong>
                      {formatNumber(STAKE_MIN)} <img className="icon-img small" src={iconCrystals} alt="" />
                    </strong>
                  </div>
                  <div className="withdraw-info">
                    <span className="withdraw-info-label">
                      <img className="icon-img small" src={iconCrystals} alt="" />
                      Available
                    </span>
                    <strong>
                      {formatNumber(hud.crystals)} <img className="icon-img small" src={iconCrystals} alt="" />
                    </strong>
                  </div>
                  <label className="withdraw-label">
                    Amount (crystals)
                    <input
                      type="number"
                      min={STAKE_MIN}
                      step={1}
                      value={stakeAmount}
                      onChange={(event) => setStakeAmount(event.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="1000"
                    />
                  </label>
                  {(() => {
                    const amount = Math.floor(Number(stakeAmount))
                    if (!Number.isFinite(amount) || amount <= 0) return null
                    const bonus = Math.floor(amount * STAKE_BONUS)
                    const total = amount + bonus
                    return (
                      <div className="withdraw-convert">
                        <img className="icon-img small" src={iconCrystals} alt="" />
                        Reward: {formatNumber(amount)} + {formatNumber(bonus)} = {formatNumber(total)}
                      </div>
                    )
                  })()}
                  {stakeError && <div className="withdraw-error">{stakeError}</div>}
                  <button type="button" className="withdraw-submit" onClick={startStake}>
                    Start staking
                  </button>
                  <div className="withdraw-note">Staked crystals are locked for 12 hours.</div>
                </>
              )}

              {stakeTab === 'my' && (
                <>
                  {hud.stake.length > 0 ? (
                    <>
                      {stakeError && <div className="withdraw-error">{stakeError}</div>}
                      <div className="stake-list">
                        {[...hud.stake]
                          .sort((a, b) => a.endsAt - b.endsAt)
                          .map((entry) => {
                            const bonus = Math.floor(entry.amount * STAKE_BONUS)
                            const total = entry.amount + bonus
                            const remaining = Math.max(0, (entry.endsAt - Date.now()) / 1000)
                            const ready = remaining <= 0
                            return (
                              <div key={entry.id} className={`stake-card ${ready ? 'ready' : ''}`}>
                                <div className="stake-row">
                                  <span>Staked</span>
                                  <strong>
                                    {formatNumber(entry.amount)} <img className="icon-img small" src={iconCrystals} alt="" />
                                  </strong>
                                </div>
                                <div className="stake-row">
                                  <span>Reward</span>
                                  <strong>
                                    +{formatNumber(bonus)} ({formatNumber(total)} total)
                                  </strong>
                                </div>
                                <div className="withdraw-convert">Unlocks in {formatLongTimer(remaining)}</div>
                                <button
                                  type="button"
                                  className="withdraw-submit"
                                  onClick={() => claimStake(entry.id)}
                                  disabled={!ready}
                                >
                                  Claim stake
                                </button>
                              </div>
                            )
                          })}
                      </div>
                    </>
                  ) : (
                    <div className="withdraw-note">No active stakes yet.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {activePanel === 'quests' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Quests</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            <div className="quest-list">
              {questEntries.map(({ quest, progress, claimed, completed, pct }) => {
                return (
                  <div key={quest.id} className={`quest-card ${completed ? 'ready' : ''} ${claimed ? 'claimed' : ''}`}>
                    <div className="quest-title">{quest.title}</div>
                    <div className="quest-desc">{quest.description}</div>
                    <div className="quest-progress">
                      {progress}/{quest.target}
                    </div>
                    <div className="quest-bar">
                      <div className="quest-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="quest-reward">
                      <span className="reward-label">Reward</span>
                      <span className="reward-chip gold">
                        <img className="icon-img small" src={iconGold} alt="" />
                        {quest.rewardGold}
                      </span>
                      {quest.rewardItem && (
                        <span className="reward-chip item">
                          <img className="icon-img small" src={CONSUMABLE_DEFS[quest.rewardItem].icon} alt="" />
                          {questRewardItemName(quest.rewardItem)}
                        </span>
                      )}
                    </div>
                    <button type="button" disabled={!completed || claimed} onClick={() => claimQuest(quest)}>
                      {claimed ? 'Claimed' : completed ? 'Claim' : 'Incomplete'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activePanel === 'worldboss' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide worldboss-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>World Boss</h3>
              <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>
            {(() => {
              const boss = hud.worldBoss
              const joinedParticipants = boss.participants.filter((entry) => entry.joined)
              const totalDamage = joinedParticipants.reduce((sum, entry) => sum + entry.damage, 0)
              const rows = [...joinedParticipants].sort((a, b) => b.damage - a.damage)
              const playerEntry = boss.participants.find((entry) => entry.isPlayer)
              const playerJoined = !!playerEntry?.joined

              return (
                <>
                  <div className="worldboss-hero">
                    <img className="worldboss-image" src={worldBossImage} alt="World boss" />
                  <div className="worldboss-meta">
                    <div className="worldboss-timer">Resets in {formatLongTimer(boss.remaining)}</div>
                    <div className="worldboss-reward">
                      <img className="icon-img" src={iconCrystals} alt="" />
                      Prize Pool: <strong>{WORLD_BOSS_REWARD}</strong> crystals
                    </div>
                    <button type="button" disabled={playerJoined} onClick={joinWorldBoss}>
                      {playerJoined ? 'Joined' : 'Join Battle'}
                    </button>
                  </div>
                  </div>
                  <div className="worldboss-list">
                    <div className="worldboss-row header">
                      <span className="worldboss-col">
                        <img className="icon-img small" src={iconName} alt="" />
                        Player
                      </span>
                      <span className="worldboss-col">
                        <img className="icon-img small" src={iconBattle} alt="" />
                        Damage
                      </span>
                      <span className="worldboss-col">
                        <img className="icon-img small" src={iconCrystals} alt="" />
                        Crystals
                      </span>
                    </div>
                    {rows.map((entry) => {
                      const share = totalDamage > 0 ? Math.floor((WORLD_BOSS_REWARD * entry.damage) / totalDamage) : 0
                      return (
                        <div key={entry.id} className={`worldboss-row ${entry.isPlayer ? 'player' : ''}`}>
                          <span className="worldboss-col player-name">
                            <img className="icon-img small" src={iconName} alt="" />
                            {entry.name}
                          </span>
                          <span className="worldboss-col damage">
                            <img className="icon-img small" src={iconBattle} alt="" />
                            {entry.damage}
                          </span>
                          <span className="worldboss-col crystals">
                            <img className="icon-img small" src={iconCrystals} alt="" />
                            {share}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="worldboss-note">
                    Leaderboard updates only while you are online or when you return to the game.
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {activePanel === 'admin' && hud && (
        <div className="modal-backdrop" onClick={() => setActivePanel(null)}>
          <div className="modal wide admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Admin Dashboard</h3>
              <div className="modal-actions-inline">
                <button type="button" onClick={loadAdminData} disabled={adminLoading || !isAdmin}>
                  {adminLoading ? 'Loading...' : 'Refresh'}
                </button>
                <button type="button" className="ghost" onClick={() => setActivePanel(null)}>
                  Close
                </button>
              </div>
            </div>
            {!isAdmin && <div className="muted">Admin access required.</div>}
            {isAdmin && (
              <>
                {adminError && <div className="admin-error">{adminError}</div>}
                {adminData && (
                  <div className="admin-content">
                    <div className="admin-summary">
                      <div className="admin-card">
                        <div className="admin-label">Players</div>
                        <div className="admin-value">{formatNumber(adminData.summary.totalPlayers)}</div>
                        <div className="admin-sub">Active 24h: {formatNumber(adminData.summary.active24h)}</div>
                      </div>
                      <div className="admin-card">
                        <div className="admin-label">Average Level</div>
                        <div className="admin-value">{formatNumber(adminData.summary.avgLevel)}</div>
                        <div className="admin-sub">Max: {formatNumber(adminData.summary.maxLevel)}</div>
                      </div>
                      <div className="admin-card">
                        <div className="admin-label">Average Tier</div>
                        <div className="admin-value">{formatNumber(adminData.summary.avgTierScore)}</div>
                        <div className="admin-sub">Total Kills: {formatNumber(adminData.summary.totalKills)}</div>
                      </div>
                      <div className="admin-card">
                        <div className="admin-label">Economy</div>
                        <div className="admin-value">{formatNumber(adminData.summary.totalGold)} gold</div>
                        <div className="admin-sub">{formatNumber(adminData.summary.totalCrystals)} crystals</div>
                      </div>
                      <div className="admin-card">
                        <div className="admin-label">Withdrawals</div>
                        <div className="admin-value">{formatNumber(adminData.summary.pendingWithdrawals)} pending</div>
                        <div className="admin-sub">{formatNumber(adminData.summary.pendingCrystals)} crystals</div>
                      </div>
                      <div className="admin-card">
                        <div className="admin-label">Dungeons</div>
                        <div className="admin-value">{formatNumber(adminData.summary.totalDungeons)}</div>
                        <div className="admin-sub">Runs total</div>
                      </div>
                    </div>
                    <div className="admin-table">
                      <div className="admin-row header">
                        <span>Player</span>
                        <span>Level</span>
                        <span>Tier</span>
                        <span>Gold</span>
                        <span>Crystals</span>
                        <span>Kills</span>
                        <span>Dungeons</span>
                        <span>Last Seen</span>
                        <span>Wallet</span>
                      </div>
                      {adminData.players.map((player) => (
                        <div key={player.wallet} className="admin-row">
                          <span>{player.name}</span>
                          <span>{formatNumber(player.level)}</span>
                          <span>{formatNumber(player.tierScore)}</span>
                          <span>{formatNumber(player.gold)}</span>
                          <span>{formatNumber(player.crystals)}</span>
                          <span>{formatNumber(player.kills)}</span>
                          <span>{formatNumber(player.dungeons)}</span>
                          <span>{formatDateTime(player.updatedAt)}</span>
                          <span className="wallet-chip">{formatShortWallet(player.wallet)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="admin-table withdrawals">
                      <div className="admin-row header withdrawals">
                        <span>Request</span>
                        <span>Player</span>
                        <span>Crystals</span>
                        <span>SOL</span>
                        <span>Status</span>
                        <span>Created</span>
                        <span>Wallet</span>
                        <span>Action</span>
                      </div>
                      {adminData.withdrawals.length === 0 && (
                        <div className="admin-row empty">
                          <span>No withdrawal requests yet.</span>
                        </div>
                      )}
                      {adminData.withdrawals.map((row) => (
                        <div key={row.id} className="admin-row withdrawals">
                          <span>#{row.id.slice(0, 6)}</span>
                          <span>{row.name}</span>
                          <span>{formatNumber(row.crystals)}</span>
                          <span>{row.sol_amount}</span>
                          <span className={`status ${row.status}`}>{row.status}</span>
                          <span>{formatDateTime(row.created_at)}</span>
                          <button
                            type="button"
                            className="wallet-chip copy-chip"
                            onClick={() => copyToClipboard(row.wallet)}
                            title="Copy wallet"
                          >
                            {formatShortWallet(row.wallet)}
                          </button>
                          <span>
                            {row.status === 'pending' ? (
                              <button
                                type="button"
                                className="admin-action"
                                onClick={() => markWithdrawalPaid(row.id)}
                              >
                                Mark as paid
                              </button>
                            ) : (
                              <span className="status paid">paid</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!adminData && !adminLoading && !adminError && (
                  <div className="muted">No data yet. Click Refresh.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
