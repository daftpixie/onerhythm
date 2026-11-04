# syntax=docker/dockerfile:1
#
# OneRhythm — the LANDING-ONLY public web build, for Railway (ADR 0023).
#
# Stage 1 builds the Expo web export with EXPO_PUBLIC_SITE_MODE=landing.
# Stage 2 serves the static files with Caddy on Railway's $PORT, as a non-root
# user, with the security headers and cache rules in deploy/Caddyfile.
#
# No secrets. No Supabase variables: the landing build needs none, and none
# are declared as build arguments, so Railway service variables cannot reach
# the build. .dockerignore keeps every .env file out of the context.
#
# Images are pinned by version AND by manifest digest (checked on Docker Hub
# on 2026-11-03). Update both together.

FROM node:22.21.1-bookworm-slim@sha256:25b3eb23a00590b7499f2a2ce939322727fcce1b15fdd69754fcd09536a3ae2c AS build

# The public deploy is landing-only until the launch gates are met. Railway
# passes a service variable of this name as a build argument; any value other
# than "landing" stops the build rather than shipping the member platform.
ARG EXPO_PUBLIC_SITE_MODE=landing
RUN if [ "$EXPO_PUBLIC_SITE_MODE" != "landing" ]; then \
      echo "Refusing to build: EXPO_PUBLIC_SITE_MODE must be 'landing' (ADR 0023)." >&2; \
      exit 1; \
    fi

WORKDIR /app
ENV CI=1 \
    EXPO_NO_TELEMETRY=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN EXPO_PUBLIC_SITE_MODE=landing npx expo export --platform web --output-dir dist

# Belt and braces: the landing bundle must carry no Supabase project address
# or key. (supabase-js itself contains the pattern "*.supabase.co"; a real
# project address has a 20-character reference before it.)
RUN if grep -rIlE "[a-z0-9]{20}\.supabase\.(co|in)|sb_publishable_[A-Za-z0-9_-]{8,}|sb_secret_[A-Za-z0-9_-]{8,}" dist; then \
      echo "Refusing to ship: a Supabase address or key is in the landing bundle." >&2; \
      exit 1; \
    fi
# Cloudflare-only file; Caddy does the SPA fallback itself.
RUN rm -f dist/_redirects


FROM caddy:2.10.2-alpine@sha256:4c6e91c6ed0e2fa03efd5b44747b625fec79bc9cd06ac5235a779726618e530d

# A non-root user that owns only Caddy's own state directories.
RUN addgroup -S web && adduser -S -G web -H -s /sbin/nologin web \
 && mkdir -p /data /config \
 && chown -R web:web /data /config

COPY --chown=root:root deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=root:root /app/dist /srv

USER web
# Railway sets PORT at runtime; 8080 is the local default.
ENV PORT=8080
EXPOSE 8080

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
