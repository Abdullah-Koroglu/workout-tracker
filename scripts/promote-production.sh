#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_IMAGE="${DEPLOY_RUNTIME_IMAGE:-node:20-alpine}"
WEBHOOK_ENV_FILE="${ROOT_DIR}/scripts/webhook.env"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker bulunamadi." >&2
  exit 1
fi

ENV_ARGS=()
if [[ -f "${WEBHOOK_ENV_FILE}" ]]; then
  ENV_ARGS+=(--env-file "${WEBHOOK_ENV_FILE}")
fi

exec docker run --rm \
  -v "${ROOT_DIR}:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -w /workspace \
  "${ENV_ARGS[@]}" \
  "${RUNTIME_IMAGE}" \
  sh -lc 'apk add --no-cache git docker-cli >/dev/null && node scripts/promote-production.mjs --approve "$@"' sh "$@"
