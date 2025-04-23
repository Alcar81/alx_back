#!/bin/sh
set -e  # Interrompt en cas d'erreur

echo "                                                                     " 
echo " Début Migration ===================================================="
echo "🧠 Script de migration automatique Prisma (dans le conteneur)"

# Paramètres
LOG_DIR="logs/migrations"
SERVER_LOG="logs/server.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migrate_${TIMESTAMP}.log"
DONE_FLAG="/tmp/migration_done.flag"

# Fonction de log
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG"
}

# Nettoyage du flag précédent
rm -f "$DONE_FLAG"

# Étapes
mkdir -p "$LOG_DIR"

log "📁 1. Dossier de logs créé : $LOG_DIR"
log "📄 2. Log détaillé : $LOG_FILE"

log "🚀 3. Lancement de la migration Prisma (migrate deploy)..."
npx prisma migrate deploy | tee -a "$LOG_FILE" "$SERVER_LOG"
if [ $? -ne 0 ]; then
  log "❌ [ERREUR] Échec de l'application des migrations avec migrate deploy"
  exit 1
fi

log "📊 4. Introspection (db pull)..."
npx prisma db pull --print | tee -a "$LOG_FILE" "$SERVER_LOG"

log "✅ 5. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

log "🧹 6. Nettoyage des logs trop anciens..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="
echo "                                                                    "
