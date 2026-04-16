# Step 1: Base image
FROM node:20-alpine AS base

# Install libc6-compat for Prisma and other native addons
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package config and prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies (this also runs "prisma generate" due to postinstall script)
RUN npm ci

# Step 2: Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js app 
# (This creates the standalone bundle in .next/standalone)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Step 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output and static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
