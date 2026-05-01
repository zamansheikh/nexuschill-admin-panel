# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Use npm ci if lockfile exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts next-env.d.ts ./
COPY src ./src

# NEXT_PUBLIC_* vars are inlined into the JS bundle at build time —
# setting them at runtime via env_file is too late. docker-compose
# passes the value here from the VPS .env so the browser bundle hits
# the real backend instead of localhost:3000.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# next.config.mjs sets `output: 'standalone'` — produces a self-contained
# server bundle at .next/standalone with only the node_modules it needs.
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# Standalone output ships its own minimal node_modules — copy it
# alongside the static + public assets and drop the rest.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3001

CMD ["node", "server.js"]
