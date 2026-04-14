FROM denoland/deno:2.2.14

WORKDIR /app
COPY . /app
EXPOSE 8080
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "router.ts"]
