# Webhook Deploy Automation

This setup implements:

- Auto deploy to staging when `main` receives a push.
- Manual promote to production only when you run a command.

## 1) New Commands

Run from repository root:

```bash
chmod +x scripts/deploy-webhook.sh scripts/deploy-staging.sh scripts/promote-production.sh scripts/deploy-status.sh
./scripts/deploy-webhook.sh
./scripts/deploy-staging.sh
./scripts/promote-production.sh
./scripts/deploy-status.sh
```

Optional SHA pinning for manual promote:

```bash
./scripts/promote-production.sh <full_commit_sha>
```

## 2) Webhook Listener Setup

1. Copy environment template:

```bash
cp scripts/webhook.env.example scripts/webhook.env
```

1. Edit `scripts/webhook.env`:

- set `GITHUB_WEBHOOK_SECRET`
- set `GITHUB_REPOSITORY` (example: `my-org/fitcoach`)
- verify `DOCKER_ENV_FILE` path

1. Start listener:

```bash
./scripts/deploy-webhook.sh
```

## 3) GitHub Webhook Configuration

In GitHub repository settings:

- Payload URL: `https://<your-domain>/github/webhook`
- Content type: `application/json`
- Secret: same as `GITHUB_WEBHOOK_SECRET`
- Events: `Just the push event`
- Active: enabled

Important behavior:

- Only `refs/heads/main` triggers deployment.
- Signature check (`X-Hub-Signature-256`) is mandatory.
- If a deploy is already running, exactly one extra deploy is queued.

## 4) Production Promotion (Manual)

Production deploy is never triggered by webhook.

Run only when you approve:

```bash
./scripts/promote-production.sh
```

The promotion script:

- Requires explicit manual approval (the shell wrapper passes `--approve`).
- Promotes only the last successful staging image.
- Runs production health check after deployment.
- Tries rollback to previous known production tag on health failure.

## 5) Recommended Service Install (Linux)

A sample systemd unit file is provided:

- `docs/deploy/fitcoach-webhook.service`

Install steps:

```bash
sudo cp docs/deploy/fitcoach-webhook.service /etc/systemd/system/fitcoach-webhook.service
sudo systemctl daemon-reload
sudo systemctl enable fitcoach-webhook
sudo systemctl start fitcoach-webhook
sudo systemctl status fitcoach-webhook
```

## 6) State and Lock Files

Runtime files are written to `.deploy/`:

- `.deploy/state.json`: last successful staging/prod metadata
- `.deploy/staging-deploy.lock`: staging lock file
- `.deploy/production-promote.lock`: production lock file

`.deploy/` is gitignored.

## 7) Smoke and Health URLs

Defaults:

- Staging: `http://127.0.0.1:3002/`
- Production: `http://127.0.0.1:3000/`

Override with:

- `STAGING_HEALTH_URL`
- `PRODUCTION_HEALTH_URL`

## 8) Safety Notes

- Keep deployment repo clone dedicated to automation.
- Do not run deploy scripts in a dirty working tree.
- Store webhook secret only in server env files, never in git.
- Restrict inbound access to the webhook endpoint via firewall/reverse proxy.

## 9) Minimal Host Requirements

- `docker` + `docker compose`

If `npm`, `node`, or `git` are missing on the host, deployment still works.
Shell wrappers run the deploy scripts inside a temporary Docker runtime.
