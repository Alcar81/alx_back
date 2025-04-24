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
GENERATED_SQL="prisma/generated_migration.sql"

# Fonction log multi-destination
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG"
}

# Nettoyage du flag existant
rm -f "$DONE_FLAG"

# Étape 1 - Préparation des dossiers
mkdir -p "$LOG_DIR"
log "📁 1. Dossier de logs créé : $LOG_DIR"
log "📄 2. Log détaillé : $LOG_FILE"

# Étape 3 - Vérification du fichier schema.prisma
log "📄 3. Vérification de la présence de $SCHEMA_PATH_LOCAL..."
if [ ! -f "$SCHEMA_PATH_LOCAL" ]; then
  log "❌ Fichier $SCHEMA_PATH_LOCAL introuvable."
  exit 1
fi

# Étape 4 - Génération du SQL de migration à la volée
log "🚀 4. Génération de la migration SQL..."
npx prisma migrate diff --from-empty --to-schema-datamodel "$SCHEMA_PATH_LOCAL" --script > "$GENERATED_SQL" || {
  log "❌ Erreur lors de la génération du fichier SQL."
  exit 1
}

# Vérifier si le fichier généré est vide
if [ ! -s "$GENERATED_SQL" ]; then
  log "⚠️ Aucun changement détecté dans le schema. Aucune migration nécessaire."
  touch "$DONE_FLAG"
  exit 0
fi

# Étape 5 - Appliquer le SQL directement
log "📦 5. Application du fichier SQL à la base de données..."
psql "$DATABASE_URL" -f "$GENERATED_SQL" | tee -a "$LOG_FILE" "$SERVER_LOG" || {
  log "❌ Erreur lors de l'application du fichier SQL."
  exit 1
}

# Étape 6 - Génération du client Prisma
log "🔧 6. Regénération du client Prisma..."
npx prisma generate | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 7 - Création du flag
log "✅ 7. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 8 - Nettoyage des anciens logs
log "🧹 8. Nettoyage des fichiers de logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="