#!/bin/sh
# Fichier : backend/migrate_auto.sh
# Description : Migration automatique Prisma avec logs complets dans server-$env.log uniquement.
# Codes d'erreurs personnalisés :
#   6 = Erreur lors du diff Prisma (migrate diff)
#   7 = Échec d'application du patch SQL (psql)

set -e

# ==============================================================================
# 0. Informations générales
# ==============================================================================
echo ""
echo " Début Migration ===================================================="
echo "🧠 Script de migration automatique Prisma (dans le conteneur)"

# Identifier l'environnement
env_short="d"
if [ "$NODE_ENV" = "prod" ]; then
  env_short="p"
fi


# ==============================================================================
# 1. Déclaration des variables
# ==============================================================================
MIGRATION_NAME="migration"
LOG_DIR="logs/migrations"
SERVER_LOG="logs/server-$env_short.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migrate_${TIMESTAMP}.log"
DONE_FLAG="/tmp/migration_done.flag"
SCHEMA_PATH="prisma/schema.prisma"
MIGRATIONS_DIR="prisma/migrations"
PATCH_FILE="prisma/generated_patch.sql"

# ==============================================================================
# 2. Fonction de journalisation
# ==============================================================================
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG" > /dev/null
}

# Section d'en-tête dans server-env.log
{
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "🕓 DÉBUT MIGRATION [$(date '+%Y-%m-%d %H:%M:%S')] - Script migrate_auto.sh"
  echo "═══════════════════════════════════════════════════════════════════════"
} >> "$SERVER_LOG"

# ==============================================================================
# 3. Nettoyage initial
# ==============================================================================
rm -f "$DONE_FLAG"
mkdir -p "$LOG_DIR" "$MIGRATIONS_DIR"

log "📁 3.1 Dossiers préparés : $LOG_DIR, $MIGRATIONS_DIR"
log "📄 3.2 Fichier de log de migration : $LOG_FILE"

# ==============================================================================
# 4. Vérification du fichier schema.prisma
# ==============================================================================
log "📄 4. Vérification de la présence de $SCHEMA_PATH..."
if [ ! -f "$SCHEMA_PATH" ]; then
  log "❌ 4.1 Fichier introuvable : $SCHEMA_PATH"
  exit 1
fi

# ==============================================================================
# 5. Application des migrations existantes
# ==============================================================================
log "🚀 5. Application des migrations existantes avec prisma migrate deploy..."
if ! npx prisma migrate deploy >> "$LOG_FILE" 2>&1; then
  log "❌ 5.1 Échec de prisma migrate deploy"
  exit 2
fi

# ==============================================================================
# 6. Génération et application du patch SQL si nécessaire
# ==============================================================================
log "🛠️ 6.1 Génération du patch SQL via prisma migrate diff..."
if npx prisma migrate diff --from-schema-datamodel "$SCHEMA_PATH" --to-schema-database --script > "$PATCH_FILE" 2>> "$LOG_FILE"; then
  if grep -Eq "(CREATE|ALTER|DROP|INSERT|UPDATE)" "$PATCH_FILE"; then
    log "⚙️ 6.2 Différences détectées ➜ tentative d'application du patch..."
    if ! psql -U "$DB_USERNAME" -d "$DB_NAME" -f "$PATCH_FILE" >> "$LOG_FILE" 2>&1; then
      log "❌ 6.3 Échec lors de l'application du patch SQL"
      exit 7
    else
      log "✅ 6.4 Patch SQL appliqué avec succès."
    fi
  else
    log "✅ 6.5 Aucune modification détectée. La base est déjà à jour."
  fi
else
  log "❌ 6.6 Erreur lors du diff Prisma (diff ignoré mais logué)"
  exit 6
fi

# ==============================================================================
# 7. Regénération du Prisma Client
# ==============================================================================
log "🔧 7. Regénération du client Prisma..."
npx prisma generate >> "$LOG_FILE" 2>&1

# ==============================================================================
# 8. Création du flag de succès
# ==============================================================================
log "✅ 8. Création du fichier de succès : $DONE_FLAG"
touch "$DONE_FLAG"

# ==============================================================================
# 9. Nettoyage des anciens logs (plus de 30 jours)
# ==============================================================================
log "🧹 9. Nettoyage des logs vieux de plus de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

# ==============================================================================
# 10. Fin du script
# ==============================================================================
log "🏁 10. Script de migration terminé avec succès."
echo " Fin Migration ====================================================="
