import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WORLD_BOSS_DURATION_SECONDS = 12 * 60 * 60;
const WORLD_BOSS_PRIZE_POOL = 500;
const ENERGY_REGEN_SECONDS = 420;
const ENERGY_MAX_DEFAULT = 50;
const MAX_MESSAGES_PER_RUN = 120;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type WorldBossRow = {
  id: number;
  cycle_start: string;
  cycle_end: string;
  prize_pool: number;
  last_cycle_start: string | null;
  last_cycle_end: string | null;
  last_prize_pool: number | null;
  updated_at: string;
};

type NotificationStateRow = {
  wallet: string;
  tg_user_id: string;
  energy_enabled: boolean;
  world_boss_enabled: boolean;
  last_energy_full_event_ms: number;
  last_world_boss_cycle_start: string | null;
  delivery_blocked: boolean;
  last_error: string;
};

type TelegramProfileRow = {
  wallet: string;
  state: Record<string, unknown> | null;
  updated_at: string | null;
};

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const asInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.floor(parsed);
};

const clampInt = (value: unknown, min: number, max: number) => {
  const parsed = asInt(value, min);
  return Math.min(max, Math.max(min, parsed));
};

const parseTelegramUserId = (wallet: string) => {
  if (!wallet.startsWith("tg:")) return "";
  const id = wallet.slice(3).trim();
  if (!/^[0-9]{3,20}$/.test(id)) return "";
  return id;
};

const normalizeWorldBoss = (rowRaw: unknown): WorldBossRow | null => {
  if (!rowRaw || typeof rowRaw !== "object" || Array.isArray(rowRaw)) return null;
  const row = rowRaw as Record<string, unknown>;
  const cycleStart = String(row.cycle_start ?? "").trim();
  const cycleEnd = String(row.cycle_end ?? "").trim();
  if (!cycleStart || !cycleEnd) return null;
  return {
    id: asInt(row.id, 1),
    cycle_start: cycleStart,
    cycle_end: cycleEnd,
    prize_pool: Math.max(0, asInt(row.prize_pool, WORLD_BOSS_PRIZE_POOL)),
    last_cycle_start: row.last_cycle_start ? String(row.last_cycle_start) : null,
    last_cycle_end: row.last_cycle_end ? String(row.last_cycle_end) : null,
    last_prize_pool: row.last_prize_pool == null ? null : Math.max(0, asInt(row.last_prize_pool, 0)),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
};

const normalizeNotificationRow = (rowRaw: unknown): NotificationStateRow | null => {
  if (!rowRaw || typeof rowRaw !== "object" || Array.isArray(rowRaw)) return null;
  const row = rowRaw as Record<string, unknown>;
  const wallet = String(row.wallet ?? "").trim();
  const tgUserId = String(row.tg_user_id ?? "").trim();
  if (!wallet || !tgUserId) return null;
  return {
    wallet,
    tg_user_id: tgUserId,
    energy_enabled: Boolean(row.energy_enabled ?? true),
    world_boss_enabled: Boolean(row.world_boss_enabled ?? true),
    last_energy_full_event_ms: Math.max(0, asInt(row.last_energy_full_event_ms, 0)),
    last_world_boss_cycle_start: row.last_world_boss_cycle_start ? String(row.last_world_boss_cycle_start) : null,
    delivery_blocked: Boolean(row.delivery_blocked ?? false),
    last_error: String(row.last_error ?? ""),
  };
};

const toLimitedDetails = (value: Record<string, unknown>) => {
  try {
    const raw = JSON.stringify(value);
    if (raw.length <= 2000) return value;
    return { truncated: true, raw: raw.slice(0, 2000) };
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

const callTelegramBotApi = async (
  botToken: string,
  method: string,
  payload: Record<string, unknown>,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = rawText ? JSON.parse(rawText) as Record<string, unknown> : null;
    } catch {
      data = null;
    }

    if (response.ok && data?.ok === true) {
      return { ok: true as const, result: data?.result };
    }

    const errorText = String(data?.description ?? rawText ?? `${response.status} ${response.statusText}`).trim();
    return { ok: false as const, error: errorText || "Telegram API request failed." };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: message || "Telegram API request failed." };
  } finally {
    clearTimeout(timeoutId);
  }
};

const isFatalTelegramDeliveryError = (errorTextRaw: string) => {
  const errorText = String(errorTextRaw ?? "").toLowerCase();
  return errorText.includes("blocked by the user") ||
    errorText.includes("chat not found") ||
    errorText.includes("user is deactivated") ||
    errorText.includes("forbidden");
};

const computeEnergyFullEventMs = (
  stateRaw: Record<string, unknown> | null,
  profileUpdatedAtMs: number,
  nowMs: number,
) => {
  const state = stateRaw && typeof stateRaw === "object" && !Array.isArray(stateRaw)
    ? stateRaw
    : {} as Record<string, unknown>;

  const energyMax = Math.max(1, asInt(state.energyMax, ENERGY_MAX_DEFAULT));
  const energy = clampInt(state.energy, 0, energyMax);
  const timer = clampInt(state.energyTimer, 1, ENERGY_REGEN_SECONDS);
  const energyUpdatedAt = Math.max(0, asInt(state.energyUpdatedAt, profileUpdatedAtMs));

  if (energyUpdatedAt <= 0) return null;
  if (energy >= energyMax) return energyUpdatedAt;

  const missing = Math.max(0, energyMax - energy);
  const fullAtMs = energyUpdatedAt + (timer + Math.max(0, missing - 1) * ENERGY_REGEN_SECONDS) * 1000;
  if (fullAtMs > nowMs) return null;
  return fullAtMs;
};

const buildNotificationText = (options: { worldBoss: boolean; energyFull: boolean; energyMax: number }) => {
  const lines: string[] = ["🐾 Doge Quest alert!"];

  if (options.worldBoss) {
    lines.push("🔥 World Boss is LIVE! Spend your tickets and push max damage this cycle.");
  }

  if (options.energyFull) {
    lines.push(`⚡ Your energy is full (${options.energyMax}/${options.energyMax}) and ready for action.`);
  }

  lines.push("Jump in now, farm crystals, and climb the leaderboard! ⚔️💎");
  return lines.join("\n");
};

const ensureWorldBossCycle = async (supabase: ReturnType<typeof createClient>, now: Date) => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await supabase
      .from("world_boss")
      .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) return { ok: false as const, error: "Failed to load world boss state." };

    const existing = normalizeWorldBoss(data);
    if (!existing) {
      const cycleStart = now.toISOString();
      const cycleEnd = new Date(now.getTime() + WORLD_BOSS_DURATION_SECONDS * 1000).toISOString();
      const { data: inserted, error: insertError } = await supabase
        .from("world_boss")
        .upsert({
          id: 1,
          cycle_start: cycleStart,
          cycle_end: cycleEnd,
          prize_pool: WORLD_BOSS_PRIZE_POOL,
          last_cycle_start: null,
          last_cycle_end: null,
          last_prize_pool: null,
          updated_at: now.toISOString(),
        }, { onConflict: "id" })
        .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
        .maybeSingle();

      if (insertError || !inserted) continue;
      const normalized = normalizeWorldBoss(inserted);
      if (!normalized) continue;
      return { ok: true as const, boss: normalized, rotated: true };
    }

    if (new Date(existing.cycle_end).getTime() > now.getTime()) {
      return { ok: true as const, boss: existing, rotated: false };
    }

    const nextStart = existing.cycle_end;
    const nextEnd = new Date(new Date(nextStart).getTime() + WORLD_BOSS_DURATION_SECONDS * 1000).toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("world_boss")
      .update({
        cycle_start: nextStart,
        cycle_end: nextEnd,
        prize_pool: WORLD_BOSS_PRIZE_POOL,
        last_cycle_start: existing.cycle_start,
        last_cycle_end: existing.cycle_end,
        last_prize_pool: existing.prize_pool,
        updated_at: now.toISOString(),
      })
      .eq("id", 1)
      .eq("cycle_end", existing.cycle_end)
      .select("id, cycle_start, cycle_end, prize_pool, last_cycle_start, last_cycle_end, last_prize_pool, updated_at")
      .maybeSingle();

    if (!updateError && updated) {
      const normalized = normalizeWorldBoss(updated);
      if (normalized) return { ok: true as const, boss: normalized, rotated: true };
    }
  }

  return { ok: false as const, error: "Failed to sync world boss cycle." };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = String(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? Deno.env.get("TG_BOT_TOKEN") ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Missing Supabase env." }, 500);
  }
  if (!botToken) {
    return json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const now = new Date();
  const nowMs = now.getTime();

  const bossResult = await ensureWorldBossCycle(supabase, now);
  if (!bossResult.ok) {
    return json({ ok: false, error: bossResult.error }, 500);
  }

  const currentCycleStart = bossResult.boss.cycle_start;

  const { data: profileRowsRaw, error: profilesError } = await supabase
    .from("profiles")
    .select("wallet, state, updated_at")
    .like("wallet", "tg:%");

  if (profilesError) {
    return json({ ok: false, error: "Failed to load Telegram profiles." }, 500);
  }

  const profileRows = ((profileRowsRaw as Record<string, unknown>[] | null) ?? [])
    .map((row) => ({
      wallet: String(row.wallet ?? "").trim(),
      state: row.state && typeof row.state === "object" && !Array.isArray(row.state)
        ? (row.state as Record<string, unknown>)
        : null,
      updated_at: row.updated_at ? String(row.updated_at) : null,
    }) as TelegramProfileRow)
    .filter((row) => row.wallet.length > 0);

  const { data: notificationRowsRaw, error: notificationError } = await supabase
    .from("telegram_notification_state")
    .select("wallet, tg_user_id, energy_enabled, world_boss_enabled, last_energy_full_event_ms, last_world_boss_cycle_start, delivery_blocked, last_error");

  if (notificationError) {
    return json({ ok: false, error: "Failed to load Telegram notification state." }, 500);
  }

  const notificationMap = new Map<string, NotificationStateRow>();
  for (const rowRaw of (notificationRowsRaw as unknown[] | null) ?? []) {
    const row = normalizeNotificationRow(rowRaw);
    if (!row) continue;
    notificationMap.set(row.wallet, row);
  }

  const bootstrapRows: Record<string, unknown>[] = [];

  let sent = 0;
  let failed = 0;
  let blocked = 0;
  let deferred = 0;
  let energyNotifications = 0;
  let worldBossNotifications = 0;

  for (const profile of profileRows) {
    const wallet = profile.wallet;
    const tgUserId = parseTelegramUserId(wallet);
    if (!tgUserId) continue;

    const profileUpdatedAtMs = profile.updated_at ? new Date(profile.updated_at).getTime() : nowMs;
    const safeProfileUpdatedAtMs = Number.isFinite(profileUpdatedAtMs) ? Math.max(0, profileUpdatedAtMs) : nowMs;
    const energyEventMs = computeEnergyFullEventMs(profile.state, safeProfileUpdatedAtMs, nowMs);
    const energyMax = Math.max(1, asInt(profile.state?.energyMax, ENERGY_MAX_DEFAULT));

    const currentState = notificationMap.get(wallet);
    if (!currentState) {
      bootstrapRows.push({
        wallet,
        tg_user_id: tgUserId,
        energy_enabled: true,
        world_boss_enabled: true,
        last_energy_full_event_ms: Math.max(0, asInt(energyEventMs, 0)),
        last_world_boss_cycle_start: currentCycleStart,
        delivery_blocked: false,
        last_error: "",
        updated_at: now.toISOString(),
      });
      continue;
    }

    if (currentState.delivery_blocked) continue;

    const dueWorldBoss = currentState.world_boss_enabled && currentState.last_world_boss_cycle_start !== currentCycleStart;
    const dueEnergy = currentState.energy_enabled &&
      energyEventMs != null &&
      energyEventMs > Math.max(0, asInt(currentState.last_energy_full_event_ms, 0));

    if (!dueWorldBoss && !dueEnergy) continue;

    if (sent >= MAX_MESSAGES_PER_RUN) {
      deferred += 1;
      continue;
    }

    const text = buildNotificationText({
      worldBoss: dueWorldBoss,
      energyFull: dueEnergy,
      energyMax,
    });

    const sendResult = await callTelegramBotApi(botToken, "sendMessage", {
      chat_id: tgUserId,
      text,
      disable_web_page_preview: true,
    });

    if (!sendResult.ok) {
      failed += 1;
      const fatal = isFatalTelegramDeliveryError(sendResult.error);

      if (fatal) {
        blocked += 1;
        await supabase
          .from("telegram_notification_state")
          .update({
            delivery_blocked: true,
            last_error: sendResult.error.slice(0, 500),
            updated_at: now.toISOString(),
          })
          .eq("wallet", wallet);
      }

      await auditEvent(supabase, wallet, "telegram_notification_failed", {
        dueWorldBoss,
        dueEnergy,
        fatal,
        error: sendResult.error,
      });
      continue;
    }

    sent += 1;
    if (dueWorldBoss) worldBossNotifications += 1;
    if (dueEnergy) energyNotifications += 1;

    await supabase
      .from("telegram_notification_state")
      .update({
        tg_user_id: tgUserId,
        last_world_boss_cycle_start: dueWorldBoss ? currentCycleStart : currentState.last_world_boss_cycle_start,
        last_energy_full_event_ms: dueEnergy && energyEventMs != null
          ? Math.max(0, asInt(energyEventMs, 0))
          : Math.max(0, asInt(currentState.last_energy_full_event_ms, 0)),
        last_error: "",
        updated_at: now.toISOString(),
      })
      .eq("wallet", wallet);
  }

  if (bootstrapRows.length > 0) {
    await supabase
      .from("telegram_notification_state")
      .upsert(bootstrapRows, { onConflict: "wallet" });
  }

  return json({
    ok: true,
    cycleStart: currentCycleStart,
    cycleEnd: bossResult.boss.cycle_end,
    cycleRotated: bossResult.rotated,
    telegramProfiles: profileRows.length,
    bootstrapRows: bootstrapRows.length,
    sent,
    failed,
    blocked,
    deferred,
    worldBossNotifications,
    energyNotifications,
    maxMessagesPerRun: MAX_MESSAGES_PER_RUN,
  });
});
