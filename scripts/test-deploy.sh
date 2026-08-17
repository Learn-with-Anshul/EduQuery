#!/usr/bin/env bash
# Usage: ./scripts/test-deploy.sh https://your-project.vercel.app <PROXY_API_TOKEN>
set -euo pipefail

BASE_URL=${1:?Base URL required}
PROXY_TOKEN=${2:?Proxy token required}

if [[ "${BASE_URL: -1}" == "/" ]]; then
  BASE_URL=${BASE_URL%/}
fi

echo "Checking site root: $BASE_URL/"
if ! curl -fsS "$BASE_URL/" -o /dev/null; then
  echo "[FAIL] Root did not return HTTP 200"
  exit 1
fi

echo "[OK] Root returned HTTP 200"

echo "Testing /api/llm-proxy"
RESP=$(curl -fsS -X POST "$BASE_URL/api/llm-proxy" \
  -H "Authorization: Bearer $PROXY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Smoke test","max_tokens":16}') || { echo "[FAIL] Proxy request failed"; exit 1; }

echo "Proxy response (trimmed):"
echo "$RESP" | head -c 1000 || true

echo "[OK] Proxy responded"
