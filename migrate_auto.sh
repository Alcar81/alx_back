#!/bin/sh
# Fichier : backend/migrate_auto.sh
# Description : Migration automatique Prisma avec logs complets dans server.log uniquement.
# Codes d'erreurs personnalisés :
# 6 = Erreur lors du diff Prisma (migrate diff)
# 7 = Échec d'application du patch SQL (psql)

set -e

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

# Fonction log multi-destination (vers log fichier seulement)
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG" > /dev/null
}

# Section d'en-tête dans server.log
{
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════"
  echo "🕓 DÉBUT MIGRATION [$(date '+%Y-%m-%d %H:%M:%S')] - Script migrate_auto.sh"
  echo "═══════════════════════════════════════════════════════════════════════"
} >> "$SERVER_LOG"

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
if ! npx prisma migrate deploy >> "$LOG_FILE" 2>&1; then
  log "❌ Échec de prisma migrate deploy."
  exit 2
fi

# Étape 5 - Patch SQL s'il reste des écarts
log "🚀 5. Génération du patch SQL pour diff entre le schema et la DB..."
if npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-database --script > prisma/generated_patch.sql 2>> "$LOG_FILE"; then
  if grep -qE "(CREATE|ALTER|DROP|INSERT|UPDATE)" prisma/generated_patch.sql; then
    log "⚙️ Différences détectées ➔ Application du patch SQL..."
    if ! psql -U "$DB_USERNAME" -d "$DB_NAME" -f prisma/generated_patch.sql >> "$LOG_FILE" 2>&1; then
      log "⚠️ Erreur lors de l'application du patch SQL."
    else
      log "✅ Patch SQL appliqué avec succès."
    fi
  else
    log "✅ Aucun correctif à appliquer. Base déjà synchronisée."
  fi
else
  log "❌ Erreur lors de la génération du patch SQL (code retour ignoré). Voir $LOG_FILE pour les détails."
fi

# Étape 6 - Regénération du client Prisma
log "🔧 6. Regénération du client Prisma..."
npx prisma generate >> "$LOG_FILE" 2>&1

# Étape 7 - Création du flag
log "✅ 7. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 8 - Nettoyage des anciens logs
log "🪜 8. Nettoyage des logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

# Étape 9 - Fin
log "🏁 Fin du script de migration automatique"
echo " Fin Migration ====================================================="