#!/bin/sh
# FoodFlow Database Restore Script
# Usage: ./restore-db.sh <backup_file>

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup_file>"
  exit 1
fi

BACKUP_FILE="$1"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "Decompressing $BACKUP_FILE..."
  gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U foodflow foodflow
else
  docker compose exec -T postgres psql -U foodflow foodflow < "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
  echo "Restore complete!"
else
  echo "Restore failed!"
  exit 1
fi
