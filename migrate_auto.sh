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

# Section d'en-tête dans server.log
echo "" | tee -a "$SERVER_LOG"
echo "═══════════════════════════════════════════════════════════════════════" | tee -a "$SERVER_LOG"
echo "🕓 DÉBUT MIGRATION [$(date '+%Y-%m-%d %H:%M:%S')] - Script migrate_auto.sh" | tee -a "$SERVER_LOG"
echo "═══════════════════════════════════════════════════════════════════════" | tee -a "$SERVER_LOG"

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

# Étape 4 - Application des migrations
log "🚀 4. Application des migrations Prisma existantes..."
npx prisma migrate deploy | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 5 - Patch SQL s'il reste des écarts
log "🚀 5. Génération du patch SQL pour diff entre le schema et la DB..."
if ! npx prisma migrate diff --script > prisma/generated_patch.sql 2>> "$LOG_FILE"; then
  log "❌ Erreur lors de la génération du patch SQL. Voir $LOG_FILE pour les détails."
  exit 6
fi

if grep -qE "(CREATE|ALTER|DROP|INSERT|UPDATE)" prisma/generated_patch.sql; then
  log "⚙️ Différences détectées ➔ Application du patch SQL..."
  if ! psql -U "$DB_USERNAME" -d "$DB_NAME" -f prisma/generated_patch.sql | tee -a "$LOG_FILE" "$SERVER_LOG"; then
    log "⚠️ Impossible d'appliquer le patch SQL. Des erreurs peuvent subsister."
    exit 6
  fi
else
  log "✅ Aucun correctif à appliquer. Base déjà synchronisée."
fi

# Étape 6 - Regénération du client Prisma
log "🔧 6. Regénération du client Prisma..."
npx prisma generate | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 7 - Création du flag
log "✅ 7. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 8 - Nettoyage des anciens logs
log "🪜 8. Nettoyage des logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

# Étape 9 - Fin
log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="
