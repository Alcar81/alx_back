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
PATCH_SQL="prisma/generated_patch.sql"
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

# Étape 2 - Vérification du fichier schema.prisma
log "📄 3. Vérification de la présence de $SCHEMA_PATH_LOCAL..."
if [ ! -f "$SCHEMA_PATH_LOCAL" ]; then
  log "❌ Fichier $SCHEMA_PATH_LOCAL introuvable."
  exit 1
fi

# Étape 3 - Appliquer les migrations existantes
log "🚀 4. Application des migrations Prisma existantes..."
npx prisma migrate deploy | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 4 - Génération de diff SQL
log "🚀 5. Génération du patch SQL pour diff entre le schema et la DB..."
npx prisma migrate diff \
  --from-schema-datamodel "$SCHEMA_PATH_LOCAL" \
  --to-url "$DATABASE_URL" \
  --script > "$PATCH_SQL"

if grep -Eq "(CREATE|ALTER|DROP) TABLE" "$PATCH_SQL"; then
  log "⚙️ Différences détectées ➔ Application du patch SQL..."
  psql -U "$DB_USERNAME" -d "$DB_NAME" -f "$PATCH_SQL" | tee -a "$LOG_FILE" "$SERVER_LOG"
else
  log "✅ Aucun correctif à appliquer. Base déjà synchronisée."
fi

# Étape 5 - Prisma generate pour s'assurer de la cohérence
log "🔧 6. Regénération du client Prisma..."
npx prisma generate | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 6 - Flag de fin
log "✅ 7. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 7 - Nettoyage des anciens logs
log "🪜 8. Nettoyage des logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

# Fin
log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="