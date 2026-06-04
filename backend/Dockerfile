# backend/Dockerfile — Multi-stage
FROM node:26-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN corepack enable && corepack prepare pnpm@10 --activate && pnpm install --frozen-lockfile
COPY prisma/ ./prisma/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ ./src/
RUN pnpm prisma generate && pnpm build && pnpm prune --prod

FROM node:26-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
USER nestjs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "require('http').get('http://localhost:3001/api/healthz',r=>{process.exit(r.statusCode===200?0:1)})"
CMD ["node", "dist/main.js"]
