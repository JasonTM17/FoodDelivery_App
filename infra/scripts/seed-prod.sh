#!/bin/sh
# FoodFlow Production Seed Script
# Seeds the database with initial data for production deployment.
# Requires explicit confirmation — never run against prod by accident.
set -e
if [ "${ALLOW_PROD_SEED}" != "true" ]; then
  echo "Refusing to seed: set ALLOW_PROD_SEED=true to proceed."
  echo "WARNING: seed creates well-known demo passwords (Admin@123 etc)."
  exit 1
fi
if [ "${I_UNDERSTAND_SEED_OVERWRITES}" != "yes" ]; then
  echo "Refusing to seed: set I_UNDERSTAND_SEED_OVERWRITES=yes after reviewing impact."
  exit 1
fi
echo "Running production seed (ALLOW_PROD_SEED=true)..."
cd "$(dirname "$0")/../../backend" || exit 1
npx ts-node prisma/seed.ts
echo "Seed complete! Rotate all demo passwords immediately."

