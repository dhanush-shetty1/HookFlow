# Multi-stage production Dockerfile for HookFlow
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package manifests
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN npm install --prefix client

# Copy application source code
COPY . .

# Build client production bundle
RUN npm run build --prefix client

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
COPY client/package*.json ./client/

# Install production dependencies only
RUN npm ci --only=production

# Copy built assets and server code from builder stage
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000

CMD ["npx", "tsx", "server/index.ts"]
