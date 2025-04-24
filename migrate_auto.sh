#backend/migrate_auto.sh
#!/bin/sh
set -e  # Interrompt en cas d'erreur

# Début
echo "                                                                     " 
echo " Début Migration ===================================================="
echo "🧠 Script de migration automatique Prisma (dans le conteneur)"

# Paramètres
MIGRATION_NAME="migration"
LOG_DIR="logs/migrations"
SERVER_LOG="logs/server.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migrate_${TIMESTAMP}.log"
DONE_FLAG="/tmp/migration_done.flag"
SCHEMA_PATH_LOCAL="prisma/schema.prisma"
MIGRATIONS_DIR="prisma/migrations"

# Fonction log multi-destination
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG"
}

# Nettoyage du flag existant
rm -f "$DONE_FLAG"

# Étape 1 - Préparation des dossiers
mkdir -p "$LOG_DIR"
mkdir -p "$MIGRATIONS_DIR"

log "📁 1. Dossier de logs créé : $LOG_DIR"
log "📄 2. Log détaillé : $LOG_FILE"

# Étape 3 - Vérification du fichier schema.prisma
log "📄 3. Vérification de la présence de $SCHEMA_PATH_LOCAL..."
if [ ! -f "$SCHEMA_PATH_LOCAL" ]; then
  log "❌ Fichier $SCHEMA_PATH_LOCAL introuvable."
  exit 1
fi

# Étape 4 - Lancer la migration dans le conteneur
log "🚀 4. Lancement de la migration Prisma..."
npx prisma migrate dev --name "$MIGRATION_NAME" --skip-seed --force | tee -a "$LOG_FILE" "$SERVER_LOG"
if grep -q "Error" "$LOG_FILE"; then
  log "❌ [ERREUR 4] Échec de la migration. Voir détails dans : $LOG_FILE"
  exit 1
fi

# Étape 5 - Vérification du dossier de migrations
log "📦 5. Vérification de l'existence du dossier de migrations..."
if [ ! -d "$MIGRATIONS_DIR" ] || [ -z "$(ls -A "$MIGRATIONS_DIR")" ]; then
  log "⚠️ Aucune migration générée (aucun changement détecté)."
  log "📄 Voir logs pour confirmation : $LOG_FILE"
  touch "$DONE_FLAG"
  exit 0
fi

# Étape 6 - Succès
log "✅ [SUCCÈS] Migration terminée. Dossier 'migrations' prêt."

# Étape 7 - Création du flag
log "✅ 6. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 8 - Nettoyage des anciens logs
log "🧹 7. Nettoyage des fichiers de logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="
echo "      