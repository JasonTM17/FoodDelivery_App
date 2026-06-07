# web/apps/restaurant/Dockerfile — Multi-stage Next.js standalone runtime
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/restaurant/package.json ./apps/restaurant/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/restaurant/node_modules ./apps/restaurant/node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/restaurant ./apps/restaurant
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @foodflow/restaurant build

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

ARG BUILD_SHA
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/foodflow"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-restaurant"

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/restaurant/.next/standalone ./
COPY --from=builder /app/apps/restaurant/.next/static ./apps/restaurant/.next/static
COPY --from=builder /app/apps/restaurant/public ./apps/restaurant/public

USER 65532:65532
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD ["node", "-e", "require('http').get('http://localhost:3002/api/health',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"]
CMD ["apps/restaurant/server.js"]
