#!/usr/bin/env bash
# Pull the latest main and rebuild the containers. Run on the server, from anywhere.
set -euo pipefail

cd "$(dirname "$0")"

git pull --ff-only

# proxy-net is declared external in docker-compose.yml, so it must exist first
docker network inspect proxy-net >/dev/null 2>&1 || docker network create proxy-net

docker compose up -d --build
docker compose ps
