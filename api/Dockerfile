FROM node:22-alpine AS deps
WORKDIR /app
COPY api/package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY api/ .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++ && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/db/migrations ./dist/db/migrations
# Exercise images and metadata for seed script
COPY free-exercise-db/exercises ./data/exercise-images
COPY free-exercise-db/dist/exercises.json ./data/exercises.json
RUN mkdir -p /data && chown -R nodejs:nodejs /data ./data
ENV NODE_ENV=production
ENV DATABASE_URL=/data/open-health.db
USER nodejs
EXPOSE 3001
CMD ["node", "dist/index.js"]
