# syntax=docker/dockerfile:1.6

# --- Stage 1: Build ---
ARG BASE_IMAGE
FROM ${BASE_IMAGE} AS builder

WORKDIR /app
ENV COREPACK_HOME=/usr/local/share/corepack

RUN apk add --no-cache openssl ca-certificates
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack install
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
RUN chmod -R a+rX "${COREPACK_HOME}"

# --- Stage 2: Runtime ---
FROM builder AS runner

USER node
CMD ["node", "dist/src/main.js"]
