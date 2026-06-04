#!/bin/sh
# FoodFlow Database Backup Script
# Usage: ./backup-db.sh [output_dir]

OUTPUT_DIR=${1:-./backups}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/foodflow_backup_$TIMESTAMP.sql"

mkdir -p "$OUTPUT_DIR"
echo "Backing up FoodFlow database to $BACKUP_FILE..."

docker compose exec -T postgres pg_dump -U foodflow foodflow > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "Backup complete: $BACKUP_FILE"
  gzip "$BACKUP_FILE"
  echo "Compressed: $BACKUP_FILE.gz"
else
  echo "Backup failed!"
  exit 1
fi
