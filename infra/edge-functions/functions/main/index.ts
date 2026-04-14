import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
    },
  });

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
      },
    });
  }

  const url = new URL(req.url);
  const serviceName = url.pathname.split("/").filter(Boolean)[0] ?? "";
  if (!serviceName) {
    return json({ error: "missing function name in request" }, 400);
  }

  const servicePath = `/home/deno/functions/${serviceName}`;
  const envVarsObj = Deno.env.toObject();
  const envVars = Object.keys(envVarsObj).map((key) => [key, envVarsObj[key]]);

  try {
    const worker = await EdgeRuntime.userWorkers.create({
      servicePath,
      memoryLimitMb: 256,
      workerTimeoutMs: 60000,
      noModuleCache: false,
      importMapPath: null,
      envVars,
    });
    return await worker.fetch(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message, serviceName }, 500);
  }
});
