#!/usr/bin/env node

const DEFAULT_HOURS = 24;
const DEFAULT_TOP = 20;
const DEFAULT_MIN_GOLD_DELTA = 50000;
const PAGE_SIZE = 1000;

function parseArgs(argv) {
  const args = {
    hours: DEFAULT_HOURS,
    top: DEFAULT_TOP,
    minGoldDelta: DEFAULT_MIN_GOLD_DELTA,
    wallet: '',
    json: '',
  };

  for (let i = 0; i < argv.length; i += 1) {
    const part = argv[i];
    if (part === '--hours' && argv[i + 1]) {
      args.hours = Math.max(1, Math.floor(Number(argv[i + 1])));
      i += 1;
      continue;
    }
    if (part === '--top' && argv[i + 1]) {
      args.top = Math.max(1, Math.floor(Number(argv[i + 1])));
      i += 1;
      continue;
    }
    if (part === '--min-gold-delta' && argv[i + 1]) {
      args.minGoldDelta = Math.max(1, Math.floor(Number(argv[i + 1])));
      i += 1;
      continue;
    }
    if (part === '--wallet' && argv[i + 1]) {
      args.wallet = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
    if (part === '--json' && argv[i + 1]) {
      args.json = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
  }

  return args;
}

function readEnv() {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  const serviceRole = String(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '').trim();

  if (!supabaseUrl || !serviceRole) {
    console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
    process.exit(1);
  }

  return {
    supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
    serviceRole,
  };
}

function isoHoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function extractGoldDelta(details) {
  const prevGold = toNumber(details?.prev?.gold);
  const nextGold = toNumber(details?.next?.gold);
  return Math.max(0, nextGold - prevGold);
}

function lower(value) {
  return String(value || '').toLowerCase();
}

async function fetchPagedEvents({ supabaseUrl, serviceRole, sinceIso, wallet }) {
  const headers = {
    apikey: serviceRole,
    authorization: `Bearer ${serviceRole}`,
  };

  const walletFilter = wallet ? `&wallet=eq.${encodeURIComponent(wallet)}` : '';
  const baseQuery = `${supabaseUrl}/rest/v1/security_events?select=wallet,kind,details,created_at&created_at=gte.${encodeURIComponent(sinceIso)}${walletFilter}&order=created_at.asc`;

  const rows = [];
  for (let offset = 0; offset < 200000; offset += PAGE_SIZE) {
    const rangeStart = offset;
    const rangeEnd = offset + PAGE_SIZE - 1;
    const response = await fetch(baseQuery, {
      headers: {
        ...headers,
        range: `${rangeStart}-${rangeEnd}`,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Failed to fetch security_events: ${response.status} ${response.statusText} ${text}`);
    }

    const page = text ? JSON.parse(text) : [];
    rows.push(...page);

    if (!Array.isArray(page) || page.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

function createBucket(wallet) {
  return {
    wallet,
    firstAt: '',
    lastAt: '',
    totalEvents: 0,
    profileSaveCount: 0,
    profileSaveRejectedCount: 0,
    staleVersionCount: 0,
    suspiciousGoldCount: 0,
    suspiciousCrystalCount: 0,
    suspiciousLevelCount: 0,
    rollbackCount: 0,
    acceptedGoldSpikesCount: 0,
    maxAcceptedGoldDelta: 0,
    maxRejectedGoldDelta: 0,
    buyGoldEvents: 0,
    starterPackEvents: 0,
    premiumBuyEvents: 0,
    questClaimEvents: 0,
    villageClaimEvents: 0,
    worldBossTicketBuyEvents: 0,
  };
}

function computeScore(bucket) {
  let score = 0;
  score += bucket.suspiciousGoldCount * 18;
  score += bucket.suspiciousCrystalCount * 12;
  score += bucket.suspiciousLevelCount * 10;
  score += bucket.acceptedGoldSpikesCount * 20;
  score += Math.min(25, Math.floor(bucket.maxAcceptedGoldDelta / 20000));
  if (bucket.profileSaveRejectedCount >= 30) score += 6;
  if (bucket.profileSaveRejectedCount >= 80) score += 8;
  return score;
}

function aggregate(events, minGoldDelta) {
  const byWallet = new Map();

  for (const event of events) {
    const wallet = String(event.wallet || '').trim();
    if (!wallet) continue;

    if (!byWallet.has(wallet)) byWallet.set(wallet, createBucket(wallet));
    const bucket = byWallet.get(wallet);

    bucket.totalEvents += 1;
    const createdAt = String(event.created_at || '').trim();
    if (!bucket.firstAt || createdAt < bucket.firstAt) bucket.firstAt = createdAt;
    if (!bucket.lastAt || createdAt > bucket.lastAt) bucket.lastAt = createdAt;

    const kind = String(event.kind || '').trim();

    if (kind === 'profile_save') {
      bucket.profileSaveCount += 1;
      const delta = extractGoldDelta(event.details);
      if (delta >= minGoldDelta) {
        bucket.acceptedGoldSpikesCount += 1;
        if (delta > bucket.maxAcceptedGoldDelta) bucket.maxAcceptedGoldDelta = delta;
      }
      continue;
    }

    if (kind === 'profile_save_rejected') {
      bucket.profileSaveRejectedCount += 1;
      const reason = lower(event.details?.reason);
      if (reason.includes('stale client profile version')) bucket.staleVersionCount += 1;
      if (reason.includes('suspicious gold gain')) {
        bucket.suspiciousGoldCount += 1;
        const delta = extractGoldDelta(event.details);
        if (delta > bucket.maxRejectedGoldDelta) bucket.maxRejectedGoldDelta = delta;
      }
      if (reason.includes('suspicious crystal gain')) bucket.suspiciousCrystalCount += 1;
      if (reason.includes('suspicious level gain')) bucket.suspiciousLevelCount += 1;
      if (reason.includes('rollback')) bucket.rollbackCount += 1;
      continue;
    }

    if (kind === 'buy_gold') bucket.buyGoldEvents += 1;
    else if (kind === 'starter_pack_buy') bucket.starterPackEvents += 1;
    else if (kind === 'premium_buy') bucket.premiumBuyEvents += 1;
    else if (kind === 'quest_claim') bucket.questClaimEvents += 1;
    else if (kind === 'village_claim') bucket.villageClaimEvents += 1;
    else if (kind === 'worldboss_ticket_buy') bucket.worldBossTicketBuyEvents += 1;
  }

  const rows = [...byWallet.values()].map((bucket) => ({
    ...bucket,
    score: computeScore(bucket),
  }));

  rows.sort((a, b) => (
    b.score - a.score ||
    b.acceptedGoldSpikesCount - a.acceptedGoldSpikesCount ||
    b.suspiciousGoldCount - a.suspiciousGoldCount ||
    b.maxAcceptedGoldDelta - a.maxAcceptedGoldDelta
  ));

  return rows;
}

function pad(value, width) {
  const text = String(value);
  if (text.length >= width) return text.slice(0, width);
  return text + ' '.repeat(width - text.length);
}

function printTop(rows, top) {
  const selected = rows.slice(0, top);
  if (!selected.length) {
    console.log('No suspicious wallets found for this window.');
    return;
  }

  const header = [
    pad('score', 6),
    pad('wallet', 46),
    pad('rejGold', 8),
    pad('rejLvl', 7),
    pad('rejCry', 7),
    pad('accGold', 8),
    pad('maxAcc', 8),
    pad('maxRej', 8),
    pad('rejTot', 7),
  ].join(' ');

  console.log(header);
  console.log('-'.repeat(header.length));

  for (const row of selected) {
    console.log([
      pad(row.score, 6),
      pad(row.wallet, 46),
      pad(row.suspiciousGoldCount, 8),
      pad(row.suspiciousLevelCount, 7),
      pad(row.suspiciousCrystalCount, 7),
      pad(row.acceptedGoldSpikesCount, 8),
      pad(row.maxAcceptedGoldDelta, 8),
      pad(row.maxRejectedGoldDelta, 8),
      pad(row.profileSaveRejectedCount, 7),
    ].join(' '));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = readEnv();
  const sinceIso = isoHoursAgo(args.hours);

  const events = await fetchPagedEvents({
    ...env,
    sinceIso,
    wallet: args.wallet,
  });

  const rows = aggregate(events, args.minGoldDelta);

  console.log(`Window start (UTC): ${sinceIso}`);
  console.log(`Events scanned: ${events.length}`);
  console.log(`Wallets scanned: ${rows.length}`);
  console.log(`Min accepted gold spike: ${args.minGoldDelta}`);
  console.log('');

  printTop(rows, args.top);

  if (args.wallet) {
    const row = rows.find((entry) => entry.wallet === args.wallet);
    console.log('');
    if (!row) {
      console.log(`Wallet ${args.wallet} has no events in this window.`);
    } else {
      console.log('Wallet details:');
      console.log(JSON.stringify(row, null, 2));
    }
  }

  if (args.json) {
    const fs = await import('node:fs/promises');
    await fs.writeFile(args.json, JSON.stringify({ sinceIso, scannedEvents: events.length, rows }, null, 2), 'utf8');
    console.log(`\nSaved JSON report to ${args.json}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
