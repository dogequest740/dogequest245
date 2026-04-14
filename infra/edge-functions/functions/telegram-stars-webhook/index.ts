import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_STARS_ORDER_SELECT = "id, wallet, tg_user_id, kind, product_ref, stars_amount, status, invoice_payload, invoice_link, telegram_charge_id, provider_charge_id, reward, paid_at, claimed_at, created_at, updated_at";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
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

    const message = String(data?.description ?? rawText ?? `${response.status} ${response.statusText}`).trim();
    return { ok: false as const, error: message || "Telegram API request failed." };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false as const, error: message || "Telegram API request failed." };
  } finally {
    clearTimeout(timeoutId);
  }
};

export const handler = async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = String(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "").trim();
  const webhookSecret = String(Deno.env.get("TELEGRAM_STARS_WEBHOOK_SECRET") ?? "").trim();

  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Missing Supabase env." }, 500);
  }
  if (!botToken) {
    return json({ ok: false, error: "Missing TELEGRAM_BOT_TOKEN." }, 500);
  }
  if (!webhookSecret) {
    return json({ ok: false, error: "Missing TELEGRAM_STARS_WEBHOOK_SECRET." }, 500);
  }

  const receivedSecret = String(req.headers.get("x-telegram-bot-api-secret-token") ?? "").trim();
  if (!receivedSecret || receivedSecret !== webhookSecret) {
    return json({ ok: false, error: "Unauthorized webhook." }, 401);
  }

  let update: Record<string, unknown> = {};
  try {
    update = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "Invalid JSON payload." }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const preCheckout = (update.pre_checkout_query && typeof update.pre_checkout_query === "object")
    ? update.pre_checkout_query as Record<string, unknown>
    : null;

  if (preCheckout) {
    const queryId = String(preCheckout.id ?? "").trim();
    const invoicePayload = String(preCheckout.invoice_payload ?? "").trim();
    const currency = String(preCheckout.currency ?? "").trim().toUpperCase();
    const totalAmount = Math.max(0, asInt(preCheckout.total_amount, 0));
    const from = (preCheckout.from && typeof preCheckout.from === "object")
      ? preCheckout.from as Record<string, unknown>
      : {};
    const fromId = String(from.id ?? "").trim();

    let allow = false;
    let errorMessage = "Payment validation failed.";

    if (!queryId || !invoicePayload || currency !== "XTR") {
      allow = false;
      errorMessage = "Unsupported invoice payload.";
    } else {
      const { data: orderRow, error } = await supabase
        .from("telegram_stars_orders")
        .select(TELEGRAM_STARS_ORDER_SELECT)
        .eq("invoice_payload", invoicePayload)
        .maybeSingle();

      if (!error && orderRow) {
        const row = orderRow as Record<string, unknown>;
        const orderStatus = String(row.status ?? "").trim();
        const orderAmount = Math.max(0, asInt(row.stars_amount, 0));
        const orderUserId = String(row.tg_user_id ?? "").trim();
        const allowedStatus = orderStatus === "pending";
        if (allowedStatus && orderAmount === totalAmount && orderUserId === fromId) {
          allow = true;
        } else {
          errorMessage = "Order mismatch. Please retry.";
        }
      } else {
        errorMessage = "Order not found.";
      }
    }

    const answer = await callTelegramBotApi(botToken, "answerPreCheckoutQuery", {
      pre_checkout_query_id: queryId,
      ok: allow,
      error_message: allow ? undefined : errorMessage,
    });

    if (!allow) {
      await auditEvent(supabase, `tg:${fromId || "0"}`, "tg_stars_precheckout_rejected", {
        invoicePayload,
        currency,
        totalAmount,
        reason: errorMessage,
        answerError: answer.ok ? "" : answer.error,
      });
    }

    return json({ ok: true });
  }

  const message = (update.message && typeof update.message === "object")
    ? update.message as Record<string, unknown>
    : null;
  const successfulPayment = message && message.successful_payment && typeof message.successful_payment === "object"
    ? message.successful_payment as Record<string, unknown>
    : null;

  if (successfulPayment) {
    const invoicePayload = String(successfulPayment.invoice_payload ?? "").trim();
    const currency = String(successfulPayment.currency ?? "").trim().toUpperCase();
    const totalAmount = Math.max(0, asInt(successfulPayment.total_amount, 0));
    const telegramChargeId = String(successfulPayment.telegram_payment_charge_id ?? "").trim();
    const providerChargeId = String(successfulPayment.provider_payment_charge_id ?? "").trim();

    const from = (message?.from && typeof message.from === "object")
      ? message.from as Record<string, unknown>
      : {};
    const fromId = String(from.id ?? "").trim();

    if (!invoicePayload || currency !== "XTR") {
      return json({ ok: true });
    }

    const { data: orderRow, error } = await supabase
      .from("telegram_stars_orders")
      .select(TELEGRAM_STARS_ORDER_SELECT)
      .eq("invoice_payload", invoicePayload)
      .maybeSingle();

    if (error || !orderRow) {
      await auditEvent(supabase, `tg:${fromId || "0"}`, "tg_stars_payment_missing_order", {
        invoicePayload,
        currency,
        totalAmount,
      });
      return json({ ok: true });
    }

    const row = orderRow as Record<string, unknown>;
    const wallet = String(row.wallet ?? "").trim();
    const orderStatus = String(row.status ?? "").trim();
    const orderAmount = Math.max(0, asInt(row.stars_amount, 0));
    const orderUserId = String(row.tg_user_id ?? "").trim();

    if (orderAmount !== totalAmount || orderUserId !== fromId) {
      await auditEvent(supabase, wallet || `tg:${fromId || "0"}`, "tg_stars_payment_mismatch", {
        invoicePayload,
        orderAmount,
        totalAmount,
        orderUserId,
        fromId,
        status: orderStatus,
      });
      return json({ ok: true });
    }

    if (orderStatus === "claimed" || orderStatus === "paid" || orderStatus === "claiming") {
      return json({ ok: true });
    }

    const paidAtIso = new Date().toISOString();
    await supabase
      .from("telegram_stars_orders")
      .update({
        status: "paid",
        telegram_charge_id: telegramChargeId,
        provider_charge_id: providerChargeId,
        paid_at: paidAtIso,
        updated_at: paidAtIso,
      })
      .eq("id", String(row.id ?? ""))
      .eq("wallet", wallet)
      .in("status", ["pending", "failed", "expired", "canceled"]);

    await auditEvent(supabase, wallet || `tg:${fromId || "0"}`, "tg_stars_paid", {
      orderId: String(row.id ?? ""),
      kind: String(row.kind ?? ""),
      productRef: String(row.product_ref ?? ""),
      starsAmount: totalAmount,
      telegramChargeId,
      providerChargeId,
    });

    return json({ ok: true });
  }

  return json({ ok: true, ignored: true });
};

if (import.meta.main) serve(handler);
