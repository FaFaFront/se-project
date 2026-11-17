# syntax=docker/dockerfile:1.4
#
# All-in-one image: PostgreSQL + Express API + Next.js web in ONE container.
#
#   docker build -t se-project \
#     --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000/api \
#     --build-arg NEXT_PUBLIC_SOCKET_URL=http://localhost:4000 .
#
#   docker run -p 3000:3000 -p 4000:4000 -v se_pgdata:/var/lib/postgresql/data se-project
#
#   Web  -> http://localhost:3000        API docs -> http://localhost:4000/api-docs
#
# On first start the DB schema is created (prisma db push) and, if the User table is
# empty, seeded with tutor01..50@gmail.com (Tutor123!) / student01..50@gmail.com (Student123!).
#
# Optional runtime env: JWT_SECRET, POSTGRES_USER/PASSWORD/DB, CORS_ORIGIN, REDIS_URL,
# SEED_ON_EMPTY=false, GOOGLE_STORAGE_BUCKET / GOOGLE_CLOUD_PROJECT_ID /
# GOOGLE_STORAGE_SERVICE_ACCOUNT_KEY (uploads).
FROM node:22-alpine

RUN apk add --no-cache bash openssl postgresql16 su-exec && corepack enable

WORKDIR /app
ENV HUSKY=0

# Dependencies (cached unless manifests change)
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN yarn install --immutable

COPY apps/api apps/api
COPY apps/web apps/web

# API build
RUN cd apps/api && yarn prisma generate && yarn build

# Web build — NEXT_PUBLIC_* are inlined into the browser bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:4000/api
ARG NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
RUN cd apps/web && yarn build

ENV POSTGRES_USER=app \
    POSTGRES_PASSWORD=app \
    POSTGRES_DB=se_project \
    PGDATA=/var/lib/postgresql/data \
    SEED_ON_EMPTY=true

COPY <<'EOF_SCRIPT' /usr/local/bin/start.sh
#!/bin/bash
set -euo pipefail

mkdir -p "$PGDATA" /run/postgresql
chown -R postgres:postgres "$PGDATA" /run/postgresql
chmod 700 "$PGDATA"

# 1. PostgreSQL (listens on localhost only)
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[start] initialising PostgreSQL data directory"
  echo "$POSTGRES_PASSWORD" > /tmp/pgpass
  chown postgres /tmp/pgpass
  su-exec postgres initdb -D "$PGDATA" -U "$POSTGRES_USER" --auth=scram-sha-256 --pwfile=/tmp/pgpass >/dev/null
  rm -f /tmp/pgpass
fi
su-exec postgres pg_ctl -D "$PGDATA" -o "-c listen_addresses=127.0.0.1" -w -l /tmp/postgres.log start >/dev/null
export PGPASSWORD="$POSTGRES_PASSWORD"
PSQL=(psql -h 127.0.0.1 -U "$POSTGRES_USER" -v ON_ERROR_STOP=1 -tA)
if [ "$("${PSQL[@]}" -d postgres -c "SELECT 1 FROM pg_database WHERE datname='$POSTGRES_DB'")" != "1" ]; then
  "${PSQL[@]}" -d postgres -c "CREATE DATABASE \"$POSTGRES_DB\"" >/dev/null
fi

# 2. Schema + optional seed
export DATABASE_URL="${DATABASE_URL:-postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@127.0.0.1:5432/$POSTGRES_DB}"
export JWT_SECRET="${JWT_SECRET:-change-me-in-production}"
cd /app/apps/api
echo "[start] applying schema"
yarn prisma db push --skip-generate >/dev/null
if [ "$SEED_ON_EMPTY" = "true" ] && [ "$("${PSQL[@]}" -d "$POSTGRES_DB" -c 'SELECT COUNT(*) FROM users')" = "0" ]; then
  echo "[start] empty database, seeding"
  yarn db.seed
fi

# 3. API + Web
if [ -n "${REDIS_URL:-}" ]; then API_ENV=production; else API_ENV=development; fi
NODE_ENV=$API_ENV PORT=4000 yarn start &
API_PID=$!
(cd /app/apps/web && NODE_ENV=production PORT=3000 yarn start) &
WEB_PID=$!

shutdown() {
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  su-exec postgres pg_ctl -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true
  exit 0
}
trap shutdown TERM INT

# If either app dies, stop the container
wait -n "$API_PID" "$WEB_PID" || true
shutdown
EOF_SCRIPT
RUN chmod +x /usr/local/bin/start.sh

VOLUME /var/lib/postgresql/data
EXPOSE 3000 4000
CMD ["/usr/local/bin/start.sh"]
