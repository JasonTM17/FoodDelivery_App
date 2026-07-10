# web/apps/restaurant/Dockerfile — Multi-stage Next.js standalone runtime
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/restaurant/package.json ./apps/restaurant/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/restaurant ./apps/restaurant
COPY --from=deps /app/apps/restaurant/node_modules ./apps/restaurant/node_modules
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_REALTIME_PROVIDER
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_RESTAURANT_URL
ARG NEXT_PUBLIC_GOOGLE_MAPS_KEY
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_REALTIME_PROVIDER=$NEXT_PUBLIC_REALTIME_PROVIDER
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_RESTAURANT_URL=$NEXT_PUBLIC_RESTAURANT_URL
ENV NEXT_PUBLIC_GOOGLE_MAPS_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_KEY
RUN pnpm --filter restaurant build

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
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3002/api/healthz',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"]
CMD ["apps/restaurant/server.js"]
