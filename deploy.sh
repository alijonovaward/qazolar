#!/usr/bin/env bash
set -euo pipefail

echo "=== 1. Git pull ==="
git pull origin main

echo "=== 2. Building and starting production containers ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

echo "=== 3. Running database migrations ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T backend python manage.py migrate

echo "=== Deployment completed successfully! ==="
