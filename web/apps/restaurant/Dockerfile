# web/apps/restaurant/Dockerfile — Multi-stage Next.js standalone runtime
FROM --platform=$BUILDPLATFORM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/restaurant/package.json ./apps/restaurant/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim@sha256:53ada149d435c38b14476cb57e4a7da73c15595aba79bd6971b547ceb6d018bf AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.11.0 --activate
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
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_RESTAURANT_URL
ARG NEXT_PUBLIC_MAP_PROVIDER
ARG NEXT_PUBLIC_MAP_STYLE_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_REALTIME_PROVIDER=$NEXT_PUBLIC_REALTIME_PROVIDER
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_RESTAURANT_URL=$NEXT_PUBLIC_RESTAURANT_URL
ENV NEXT_PUBLIC_MAP_PROVIDER=$NEXT_PUBLIC_MAP_PROVIDER
ENV NEXT_PUBLIC_MAP_STYLE_URL=$NEXT_PUBLIC_MAP_STYLE_URL
RUN pnpm --filter restaurant build

FROM gcr.io/distroless/nodejs22-debian13@sha256:39d204f9061e310d3e090edd185f48b1e9f70ef4771819a555ed716ccb42d229 AS runner
WORKDIR /app

ARG BUILD_SHA
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_REALTIME_PROVIDER
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_RESTAURANT_URL
ARG NEXT_PUBLIC_MAP_PROVIDER
ARG NEXT_PUBLIC_MAP_STYLE_URL
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/FoodDelivery_App"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-restaurant"

ENV NODE_ENV=production
ENV BUILD_SHA=$BUILD_SHA
ENV PORT=3002
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_REALTIME_PROVIDER=$NEXT_PUBLIC_REALTIME_PROVIDER
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_RESTAURANT_URL=$NEXT_PUBLIC_RESTAURANT_URL
ENV NEXT_PUBLIC_MAP_PROVIDER=$NEXT_PUBLIC_MAP_PROVIDER
ENV NEXT_PUBLIC_MAP_STYLE_URL=$NEXT_PUBLIC_MAP_STYLE_URL

COPY --from=builder /app/apps/restaurant/.next/standalone ./
COPY --from=builder /app/apps/restaurant/.next/static ./apps/restaurant/.next/static
COPY --from=builder /app/apps/restaurant/public ./apps/restaurant/public

USER 65532:65532
EXPOSE 3002
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3002/api/healthz',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"]
CMD ["apps/restaurant/server.js"]
