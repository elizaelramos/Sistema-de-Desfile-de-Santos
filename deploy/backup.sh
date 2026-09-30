#!/usr/bin/env bash
# Backup do banco — rodar antes e depois de cada evento.
# Uso: deploy/backup.sh   (lê usuário/senha de ~/.my.cnf)
set -euo pipefail
destino="${BACKUP_DIR:-$HOME/backups/desfile}"
mkdir -p "$destino"
arquivo="$destino/desfile-$(date +%Y%m%d-%H%M%S).sql.gz"
mysqldump --single-transaction --routines desfile | gzip > "$arquivo"
echo "Backup salvo em $arquivo"
