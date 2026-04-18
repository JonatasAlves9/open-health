FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/db/migrations ./src/db/migrations
RUN mkdir -p /data
ENV NODE_ENV=production
ENV DATABASE_URL=/data/open-health.db
EXPOSE 3001
CMD ["node", "dist/index.js"]
