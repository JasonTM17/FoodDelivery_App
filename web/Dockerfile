# web/Dockerfile — Multi-stage Next.js for FoodFlow monorepo
# Build: docker build --build-arg APP_NAME=admin -t foodflow-web-admin .
# Build: docker build --build-arg APP_NAME=restaurant -t foodflow-web-restaurant .

# Global build args (declared before first FROM for global scope)
ARG APP_NAME=admin
ARG BUILD_SHA=dev

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app

# Copy workspace config files for pnpm install
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./

# Copy package.json for each workspace member (layer caching)
COPY apps/admin/package.json ./apps/admin/package.json
COPY apps/restaurant/package.json ./apps/restaurant/package.json
COPY packages/ui/package.json ./packages/ui/package.json

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM deps AS builder

ARG APP_NAME

# Copy all source code (Turbo needs everything for dependency graph)
COPY apps/${APP_NAME}/ ./apps/${APP_NAME}/
COPY packages/ ./packages/

# Build only the target app and its workspace dependencies
RUN pnpm turbo build --filter=${APP_NAME}...

# =============================================================================
# Stage 3: Runner (distroless)
# =============================================================================
FROM gcr.io/distroless/nodejs22-debian12 AS runner

ARG APP_NAME
ARG BUILD_SHA

# OCI labels
LABEL org.opencontainers.image.source="https://github.com/JasonTM17/foodflow"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.revision=$BUILD_SHA

WORKDIR /app

# Copy standalone output produced by Next.js
COPY --from=builder /app/apps/${APP_NAME}/.next/standalone ./

# Copy static files (Next.js standalone output does not include these)
COPY --from=builder /app/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static

# Copy public assets if they exist
COPY --from=builder /app/apps/${APP_NAME}/public ./apps/${APP_NAME}/public

USER 65534:65534
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 --start-period=5s \
  CMD ["node", "-e", "require('http').get('http://localhost:3000/',r=>{process.exit(r.statusCode===200?0:1)})"]

CMD ["node", "server.js"]
