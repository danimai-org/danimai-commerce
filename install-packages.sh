#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
for dir in packages/*/; do
  echo "=== $dir ==="
  (cd "$dir" && bun install)
done
for dir in storefront-admin storefront backend; do
  if [ -d "$dir" ]; then
    echo "=== $dir ==="
    (cd "$dir" && bun install)
  fi
done
