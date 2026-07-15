# backend/Dockerfile — Multi-stage (distroless runtime)
FROM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates g++ make openssl python3 \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY prisma/ ./prisma/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN DATABASE_URL=postgresql://foodflow:foodflow_dev@localhost:5432/foodflow \
  DIRECT_URL=postgresql://foodflow:foodflow_dev@localhost:5432/foodflow \
  pnpm prisma generate && pnpm build

FROM gcr.io/distroless/nodejs22-debian13@sha256:39d204f9061e310d3e090edd185f48b1e9f70ef4771819a555ed716ccb42d229 AS migrator
WORKDIR /app
ARG BUILD_SHA
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/FoodDelivery_App"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-migrate"

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
USER 65532:65532
CMD ["node_modules/prisma/build/index.js", "migrate", "deploy", "--schema", "prisma/schema.prisma"]

FROM builder AS prod-deps
RUN pnpm prune --prod

FROM gcr.io/distroless/nodejs22-debian13@sha256:39d204f9061e310d3e090edd185f48b1e9f70ef4771819a555ed716ccb42d229 AS runner
WORKDIR /app

ARG BUILD_SHA
ENV BUILD_SHA=$BUILD_SHA
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/FoodDelivery_App"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-backend"

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
USER 65534:65534
EXPOSE 3001
# Railway assigns a dynamic PORT and owns the API healthcheck. The entrypoint
# fails closed for unknown roles instead of silently starting the wrong process.
CMD ["dist/process-entrypoint.js"]
