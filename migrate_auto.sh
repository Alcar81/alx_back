# //backend/migrate_auto.sh
#!/bin/bash
set -e  # Interrompt en cas d'erreur

echo "                                                                     " 
echo " Début Migration ====================================================" 
echo "🧠 Script de migration automatique Prisma (dans le conteneur)"

# Paramètres
CONTAINER_NAME="back_node_dev"
MIGRATION_NAME="migration"
LOG_DIR="logs/migrations"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/migrate_${TIMESTAMP}.log"
LOCAL_MIGRATION_PATH="prisma/migrations"
SCHEMA_PATH_CONTAINER="/app/prisma/schema.prisma"
SCHEMA_PATH_LOCAL="prisma/schema.prisma"
DONE_FLAG="/tmp/migration_done.flag"

# Nettoyage du flag existant
rm -f "$DONE_FLAG"

# Étape 1 - Préparation des dossiers
mkdir -p "$LOG_DIR"
mkdir -p "$LOCAL_MIGRATION_PATH"

echo "📁 1. Création du dossier de logs : $LOG_DIR"
echo "📄 2. Log en cours : $LOG_FILE"

# Étape 3 - Copier le schéma vers le conteneur
echo "📄 3. Copie du fichier $SCHEMA_PATH_LOCAL vers le conteneur $CONTAINER_NAME..."
docker cp "$SCHEMA_PATH_LOCAL" "$CONTAINER_NAME:$SCHEMA_PATH_CONTAINER"
if [ $? -ne 0 ]; then
  echo "❌ [ERREUR 3] Échec de la copie du fichier schema.prisma vers le conteneur." | tee -a "$LOG_FILE"
  exit 1
fi

# Étape 4 - Lancer la migration
echo "🚀 4. Lancement de la migration Prisma dans le conteneur..."
docker exec "$CONTAINER_NAME" npx prisma migrate dev --name "$MIGRATION_NAME" --schema="$SCHEMA_PATH_CONTAINER" | tee "$LOG_FILE"
if grep -q "Error" "$LOG_FILE"; then
  echo "❌ [ERREUR 4] Échec de la migration. Voir détails dans : $LOG_FILE"
  exit 1
fi

# Étape 5 - Vérifier l'existence du dossier de migration
echo "📦 5. Vérification de l'existence du dossier de migrations dans le conteneur..."
docker exec "$CONTAINER_NAME" test -d /app/prisma/migrations
if [ $? -ne 0 ]; then
  echo "⚠️ [INFO] Aucune migration générée (aucun changement détecté)."
  echo "📄 6. Aucun nouveau dossier à copier. Voir logs pour confirmation : $LOG_FILE"
  touch "$DONE_FLAG"
  exit 0
fi

# Étape 6 - Copier proprement le contenu (sans duplication)
echo "📦 6. Copie des migrations depuis le conteneur vers le local (sans duplication)..."
docker exec "$CONTAINER_NAME" sh -c "cd /app/prisma/migrations && tar -cf - ." | tar -xf - -C "$LOCAL_MIGRATION_PATH"
if [ $? -ne 0 ]; then
  echo "❌ [ERREUR 6] Échec de la copie du contenu de migrations depuis le conteneur." | tee -a "$LOG_FILE"
  exit 1
fi

# Étape 7 - Succès
echo "✅ [SUCCÈS 7] Migration terminée et dossier migrations mis à jour localement."
echo "📄 8. Détails de la migration enregistrés dans : $LOG_FILE"

# Étape 9 - Introspection finale
echo "📊 9. Introspection : affichage des tables connues par Prisma..."
docker exec "$CONTAINER_NAME" npx prisma db pull --print | tee -a "$LOG_FILE"

# Étape 10 - Création du flag pour indiquer la fin
echo "✅ 10. Création du flag de fin : $DONE_FLAG"
touch "$DONE_FLAG"

# Étape 11 - Nettoyage des logs trop anciens
echo "🧹 11. Nettoyage des fichiers de logs de migration vieux de plus de 30 jours..."
find "$LOG_DIR" -type f -name "*.log" -mtime +30 -exec rm -f {} \;

echo " Fin Migration =====================================================" 
echo "           