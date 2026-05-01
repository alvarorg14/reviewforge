#!/bin/sh
set -e
cd /app
node ./scripts/migrate-db.mjs
exec node .output/server/index.mjs
