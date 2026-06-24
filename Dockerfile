# syntax=docker/dockerfile:1

# ============================================================
# Ganesh Trading Company — Storefront + Admin + API (Next.js)
# Multi-stage production image. The mobile app is excluded via .dockerignore.
# ============================================================

# Debian-slim base (glibc) — matches Prisma's default engine, no musl headaches.
FROM node:20-bookworm-slim AS base
# OpenSSL is required by the Prisma query engine at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- 1. Install dependencies ----
FROM base AS deps
# Copy manifests + Prisma schema first (postinstall runs `prisma generate`).
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- 2. Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so they must be present now.
# Pass them with --build-arg (see docker build command below).
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_BUSINESS_NAME
ARG NEXT_PUBLIC_BUSINESS_PHONE
ARG NEXT_PUBLIC_BUSINESS_ADDRESS
ARG NEXT_PUBLIC_BUSINESS_MAP_URL
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ARG NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_BUSINESS_NAME=$NEXT_PUBLIC_BUSINESS_NAME \
    NEXT_PUBLIC_BUSINESS_PHONE=$NEXT_PUBLIC_BUSINESS_PHONE \
    NEXT_PUBLIC_BUSINESS_ADDRESS=$NEXT_PUBLIC_BUSINESS_ADDRESS \
    NEXT_PUBLIC_BUSINESS_MAP_URL=$NEXT_PUBLIC_BUSINESS_MAP_URL \
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME \
    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=$NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

# `npm run build` = prisma generate + next build (produces .next/standalone).
RUN npm run build

# ---- 3. Runtime ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + the assets it expects alongside it.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Standalone output emits server.js at the app root.
CMD ["node", "server.js"]
