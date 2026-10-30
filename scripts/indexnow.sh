#!/usr/bin/env bash
# IndexNow (Bing/Yandex/etc) ping. Key file served at https://theworldtruth.com/6a8a7c36d3ca914dc2113e77df2791c1.txt
# Usage: scripts/indexnow.sh [url...]  (default: home, /truthle/, /true-false/, all /map/ URLs from sitemap)
set -euo pipefail
KEY=6a8a7c36d3ca914dc2113e77df2791c1; HOST=theworldtruth.com
if [ $# -gt 0 ]; then URLS=("$@"); else
  mapfile -t URLS < <( { printf 'https://%s/\nhttps://%s/truthle/\nhttps://%s/true-false/\n' $HOST $HOST $HOST; grep -oE "https://$HOST/map/[^<]+" "$(dirname "$0")/../public/sitemap.xml"; } | sort -u | head -10000)
fi
JSON=$(printf '%s\n' "${URLS[@]}" | python3 -c 'import json,sys;print(json.dumps({"host":"'$HOST'","key":"'$KEY'","keyLocation":"https://'$HOST'/'$KEY'.txt","urlList":[l.strip() for l in sys.stdin if l.strip()]}))')
curl -sS -o /dev/null -w 'IndexNow HTTP %{http_code}\n' -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json; charset=utf-8' -d "$JSON"
