# web/apps/admin/Dockerfile — Multi-stage Next.js standalone runtime
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/admin ./apps/admin
COPY --from=deps /app/apps/admin/node_modules ./apps/admin/node_modules
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter foodflow-admin build

FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

ARG BUILD_SHA
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/foodflow"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA
LABEL org.opencontainers.image.title="foodflow-admin"

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./apps/admin/.next/static
COPY --from=builder /app/apps/admin/public ./apps/admin/public

USER 65532:65532
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://localhost:3000/api/healthz',r=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"]
CMD ["apps/admin/server.js"]
