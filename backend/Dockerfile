# backend/Dockerfile — Multi-stage (distroless runtime)
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma/ ./prisma/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN DATABASE_URL=postgresql://foodflow:foodflow_dev@localhost:5432/foodflow \
  DIRECT_URL=postgresql://foodflow:foodflow_dev@localhost:5432/foodflow \
  pnpm prisma generate && pnpm build

FROM builder AS migrator
CMD ["pnpm", "prisma", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM builder AS prod-deps
RUN pnpm prune --prod

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

ARG BUILD_SHA
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/foodflow"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-backend"

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
USER 65534:65534
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3001/api/healthz',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"]
# API entrypoint. Worker reuses this image with:
#   command: ["dist/workers/main.js"]
CMD ["dist/main.js"]
