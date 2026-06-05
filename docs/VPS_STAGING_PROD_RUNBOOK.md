# FitCoach VPS Staging + Production Runbook

This is the repo-level source of truth for operating FitCoach on a VPS with Docker Compose, Nginx, and Let's Encrypt.

## 1. Host prerequisites

Confirm these are installed on the VPS:

```bash
docker --version
docker compose version
nginx -v
certbot --version
git --version
```

Expected routing:

- `fitcoach.akoroglu.com.tr` -> production
- `staging.fitcoach.akoroglu.com.tr` -> staging
- optional: `studio.fitcoach.akoroglu.com.tr` -> Prisma Studio

## 2. Secret and env setup

Do not use repo-local ignored `.env*` files as deploy documentation. The tracked template is:

```bash
cp .env.docker.example .env.docker.prod
```

Generate the random auth and VAPID secrets once:

```bash
npm run deploy:secrets
```

Then fill the rest of `.env.docker.prod` manually:

- SMTP credentials
- OpenAI key
- RTC provider values
- media storage credentials
- final domain URLs

Rotation rule:

- any previously exposed secret must be treated as compromised
- rotate `NEXTAUTH_SECRET`, `NEXTAUTH_SECRET_STAGING`, `OPENAI_API_KEY`, `SMTP_PASS`, `VAPID_*`, `WS_AUTH_SECRET`, `RTC_INTERNAL_API_SECRET`, and `MEDIA_S3_SECRET_ACCESS_KEY`

## 3. Nginx and SSL

Example config:

- `docs/deploy/fitcoach.nginx.conf.example`

Install and reload:

```bash
sudo cp docs/deploy/fitcoach.nginx.conf.example /etc/nginx/sites-available/fitcoach
sudo ln -sf /etc/nginx/sites-available/fitcoach /etc/nginx/sites-enabled/fitcoach
sudo nginx -t
sudo systemctl reload nginx
```

Issue certificates if missing:

```bash
sudo certbot certonly --nginx -d fitcoach.akoroglu.com.tr
sudo certbot certonly --nginx -d staging.fitcoach.akoroglu.com.tr
sudo certbot certonly --nginx -d studio.fitcoach.akoroglu.com.tr
sudo certbot renew --dry-run
```

## 4. Staging deploy

Standard flow:

```bash
git checkout main
git pull --ff-only origin main
./scripts/deploy-staging.sh
```

This flow:

- refuses dirty working trees
- refreshes `main`
- builds a new staging image
- starts `staging_postgres`, `staging_nextjs_app`, `staging_ws_server`
- runs a health check
- records state in `.deploy/state.json`

Re-seed staging only when you intentionally want a fresh disposable demo dataset:

```bash
docker compose --env-file .env.docker.prod --profile staging-tools run --rm staging_seed
```

Never point the staging seed at production.

## 5. Production promotion

Production is promoted only from the latest successful staging image:

```bash
./scripts/promote-production.sh
```

Optional SHA lock:

```bash
./scripts/promote-production.sh <full_commit_sha>
```

This flow:

- re-tags the last successful staging image
- restarts `nextjs_app` and `ws_server`
- runs production health checks
- attempts rollback to the previous production tag if health fails

## 6. Production database rule

Allowed:

```bash
docker compose exec nextjs_app npx prisma migrate deploy
```

Allowed only on the first bootstrap of an empty production database:

```bash
docker compose exec nextjs_app npm run db:seed:production
```

Never use the production seed to refresh or repopulate live data.

## 7. Minimum smoke checks

After staging:

- `/`
- `/coaches`
- coach login
- `/coach/dashboard`
- `/coach/clients`
- `/coach/team`
- `/coach/admin`
- call flow from `/coach/messages` or `/client/messages`
- push click-through into `/calls/[id]` if `RTC_*`, `VAPID_*`, and `WS_AUTH_SECRET` are real

After production:

- landing opens
- login works
- dashboard opens
- websocket stays connected
- one public and one protected media upload succeeds
- no auth/env/media/storage crash in logs

## 8. Monitoring and backup

Useful commands:

```bash
docker compose ps
docker compose logs -f nextjs_app
docker compose logs -f ws_server
docker compose logs -f staging_nextjs_app
docker compose logs -f staging_ws_server
sudo tail -f /var/log/nginx/error.log
```

Keep `pg_backup` enabled for production, and also copy backups off the VPS.
