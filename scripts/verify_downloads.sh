#!/usr/bin/env bash
# Anonymous check of every download URL on the site: HTTP 200 (after redirects),
# size and SHA-256 match the values published on the download page, and
# `sha256sum -c SHA256SUMS` passes. Read-only; downloads into a temp directory.
set -euo pipefail
BASE=https://github.com/TASK-Preparedness/TASK/releases/download/v0.1.0-alpha.1
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT; cd "$tmp"
declare -A SHA=(
 [TASK-0.1.0-alpha.1-source.tar.gz]=217c7285087f67b0dffbe0a762ce54ab66fd9146cc48c6c2f4f69507796606bc
 [TASK-0.1.0-alpha.1-source.zip]=2c2a3a404bde16c94116f7907abd8ab19b3bacca42e52f256204301fd5416b20
 [TASK-volunteer-test-debs-20261123.zip]=ba50f7de2e599023e60f0c186a9de144a708ffd6ff83c88a61ee0f508a0fbf4e
 [SHA256SUMS]=4f6db85504c36e0ea29bd7f603f1c306b256d54bf0fc179699843cf3f832115b )
declare -A SIZE=(
 [TASK-0.1.0-alpha.1-source.tar.gz]=2486637 [TASK-0.1.0-alpha.1-source.zip]=3023164
 [TASK-volunteer-test-debs-20261123.zip]=859549 [SHA256SUMS]=299 )
rc=0
for f in "${!SHA[@]}"; do
  code=$(curl -sSL -o "$f" -w '%{http_code}' "$BASE/$f")
  got=$(sha256sum "$f" | cut -d' ' -f1); size=$(stat -c %s "$f")
  if [[ $code == 200 && $got == "${SHA[$f]}" && $size == "${SIZE[$f]}" ]]; then echo "PASS $f http=$code size=$size sha256=ok"
  else echo "FAIL $f http=$code size=$size sha256=$got"; rc=1; fi
done
sha256sum -c SHA256SUMS || rc=1
exit $rc
