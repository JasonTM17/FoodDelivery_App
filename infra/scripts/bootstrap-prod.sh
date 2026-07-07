#!/bin/sh
# FoodFlow production database bootstrap.
# Runs schema migrations only. Demo/sample seed data is intentionally blocked
# from production because it creates fake users, restaurants, drivers, and menu data.
set -eu

echo "Running production database bootstrap..."
cd "$(dirname "$0")/../../backend" || exit 1
pnpm db:migrate:prod
echo "Production database bootstrap complete."
