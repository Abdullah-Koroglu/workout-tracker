#!/bin/bash

# Docker'ın yedekleri attığı yerel klasör
LOCAL_DIR="/root/projects/workout-tracker/db_backups"

# Drive'daki hedef (Rclone config'de verdiğimiz isim:KlasörAdı)
REMOTE_DIR="gdrive:Fitcoach_Backups"

# Log dosyası (Hata takibi için)
LOG_FILE="/root/projects/workout-tracker/rclone_backup.log"

echo "Senkronizasyon basladi: $(date)" >> "$LOG_FILE"
rclone sync "$LOCAL_DIR" "$REMOTE_DIR" -v >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "Senkronizasyon BASARILI: $(date)" >> "$LOG_FILE"
else
    echo "Senkronizasyon HATALI (exit code: $EXIT_CODE): $(date)" >> "$LOG_FILE"
fi
echo "-----------------------------------" >> "$LOG_FILE"

exit $EXIT_CODE

