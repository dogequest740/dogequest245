FROM ghcr.io/supabase/edge-runtime:v1.69.27

COPY supabase/functions /home/deno/functions

ENV SUPABASE_INTERNAL_JWT_SECRET=local-dev-secret

CMD ["start", "--main-service", "/home/deno/functions", "-p", "8080"]
