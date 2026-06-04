#!/bin/sh
# FoodFlow Production Seed Script
# Seeds the database with initial data for production deployment
echo "Running production seed..."
cd "$(dirname "$0")/../../backend" || exit 1
npx ts-node prisma/seed.ts
echo "Seed complete!"
