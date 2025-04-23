#!/bin/bash
set -e  # Interrompt en cas d'erreur

# Début
echo "                                                                     " 
echo " Début Migration ====================================================" 
echo "🧠 Script de migration automatique Prisma (dans le conteneur)"

# Paramètres
CONTAINER_NAME="back_node_dev"
MIGRATION_NAME="migration"
LOG_DIR="logs/migrations"
SERVER_LOG="logs/server.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migrate_${TIMESTAMP}.log"
LOCAL_MIGRATION_PATH="prisma/migrations"
SCHEMA_PATH_CONTAINER="/app/prisma/schema.prisma"
SCHEMA_PATH_LOCAL="prisma/schema.prisma"
DONE_FLAG="/tmp/migration_done.flag"

# Fonction log multi-destination
log() {
  echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] [migrate_auto] $1" | tee -a "$LOG_FILE" "$SERVER_LOG"
}

# Nettoyage du flag existant
rm -f "$DONE_FLAG"

# Étape 1 - Préparation des dossiers
mkdir -p "$LOG_DIR"
mkdir -p "$LOCAL_MIGRATION_PATH"

log "📁 1. Dossier de logs créé : $LOG_DIR"
log "📄 2. Log détaillé : $LOG_FILE"

# Étape 3 - Copier le schéma
log "📄 3. Copie du fichier $SCHEMA_PATH_LOCAL vers le conteneur $CONTAINER_NAME..."
docker cp "$SCHEMA_PATH_LOCAL" "$CONTAINER_NAME:$SCHEMA_PATH_CONTAINER"
if [ $? -ne 0 ]; then
  log "❌ [ERREUR 3] Échec de la copie du fichier schema.prisma vers le conteneur."
  exit 1
fi

# Étape 4 - Lancer la migration dans le conteneur
log "🚀 4. Lancement de la migration Prisma dans le conteneur..."
docker exec "$CONTAINER_NAME" npx prisma migrate dev --name "$MIGRATION_NAME" --schema="$SCHEMA_PATH_CONTAINER" | tee -a "$LOG_FILE" "$SERVER_LOG"
if grep -q "Error" "$LOG_FILE"; then
  log "❌ [ERREUR 4] Échec de la migration. Voir détails dans : $LOG_FILE"
  exit 1
fi

# Étape 5 - Vérification du dossier de migrations
log "📦 5. Vérification de l'existence du dossier de migrations dans le conteneur..."
docker exec "$CONTAINER_NAME" test -d /app/prisma/migrations
if [ $? -ne 0 ]; then
  log "⚠️ [INFO] Aucune migration générée (aucun changement détecté)."
  log "📄 6. Aucun nouveau dossier à copier. Voir logs : $LOG_FILE"
  touch "$DONE_FLAG"
  exit 0
fi

# Étape 6 - Copie des migrations vers le local
log "📦 6. Copie des migrations depuis le conteneur vers le local (sans duplication)..."
docker exec "$CONTAINER_NAME" sh -c "cd /app/prisma/migrations && tar -cf - ." | tar -xf - -C "$LOCAL_MIGRATION_PATH"
if [ $? -ne 0 ]; then
  log "❌ [ERREUR 6] Échec de la copie du contenu de migrations depuis le conteneur."
  exit 1
fi

# Étape 7 - Succès
log "✅ [SUCCÈS 7] Migration terminée. Dossier 'migrations' mis à jour localement."

# Étape 9 - Introspection finale
log "📊 8. Introspection Prisma (db pull)..."
docker exec "$CONTAINER_NAME" npx prisma db pull --print | tee -a "$LOG_FILE" "$SERVER_LOG"

# Étape 10 - Flag de fin
log "✅ 9. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 11 - Nettoyage logs anciens
log "🧹 10. Nettoyage des fichiers de logs de migration vieux de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

log "🏁 Fin du script de migration automatique"
echo " Fin Migration =====================================================" 
echo "                                                                    " 
