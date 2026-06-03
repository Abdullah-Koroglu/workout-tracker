#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
RUNTIME_IMAGE="${DEPLOY_RUNTIME_IMAGE:-node:20-alpine}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker bulunamadi." >&2
  exit 1
fi

exec docker run --rm \
  -v "${ROOT_DIR}:/workspace" \
  -w /workspace \
  "${RUNTIME_IMAGE}" \
  sh -lc "node scripts/deploy-status.mjs"
