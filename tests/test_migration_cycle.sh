# backend/tests/test_migration_cycle.sh

set -e  # Interrompt immédiatement en cas d'erreur (utile surtout en CI/CD)

echo "                                                                " 
echo " Début test ====================================================" 
echo "🧪 Test de migration de bout en bout Prisma (ajout + suppression d'une table)"

# Détection du répertoire racine
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"
echo "📁 Répertoire racine du projet : $PROJECT_ROOT"

SCHEMA_FILE="prisma/schema.prisma"
BACKUP_FILE="prisma/schema.prisma.bak"
TABLE_NAME="TestTable"
CONTAINER_NAME="back_node_dev"
MIGRATION_SCRIPT="./migrate_auto.sh"

# 1. Sauvegarde du schema.prisma
echo "📦 1. Sauvegarde du fichier $SCHEMA_FILE..."
cp "$SCHEMA_FILE" "$BACKUP_FILE" || { echo "❌ Erreur : impossible de sauvegarder $SCHEMA_FILE"; exit 1; }

# 2. Ajout de la table
echo "📝 2. Ajout de la table $TABLE_NAME dans le schéma..."
cat <<EOT >> "$SCHEMA_FILE"

model $TABLE_NAME {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
}
EOT

# 3. Diff entre le schéma original et modifié
echo "🔍 3. Diff entre le schema original et modifié :"
diff "$BACKUP_FILE" "$SCHEMA_FILE" || echo "✅ Modifications détectées."

# 4. Migration (ajout)
echo "🚀 4. Lancement de $MIGRATION_SCRIPT (ajout)..."
sh "$MIGRATION_SCRIPT"

# 5. Vérification par introspection si la table a bien été ajoutée
echo "📊 5. Vérification si $TABLE_NAME existe dans le schema introspecté..."
if docker exec "$CONTAINER_NAME" npx prisma db pull --print | grep -q "$TABLE_NAME"; then
  echo "✅ Table $TABLE_NAME détectée dans le schéma introspecté"
else
  echo "❌ Table $TABLE_NAME manquante dans l’introspection."
fi

# 6. Suppression de la table et restauration
echo "🧹 6. Suppression du test, retour au schéma original..."
cp "$BACKUP_FILE" "$SCHEMA_FILE"

# 7. Confirmation du retour
echo "🔍 7. Vérification retour au schéma d'origine :"
diff "$SCHEMA_FILE" "$BACKUP_FILE" || echo "✅ Retour confirmé."

# 8. Migration (suppression)
echo "🚀 8. Lancement de $MIGRATION_SCRIPT (suppression)..."
sh "$MIGRATION_SCRIPT"

# 9. Vérification si la table a bien été supprimée
echo "📊 9. Vérification si $TABLE_NAME a été supprimée..."
if docker exec "$CONTAINER_NAME" npx prisma db pull --print | grep -q "$TABLE_NAME"; then
  echo "❌ Table $TABLE_NAME encore présente après suppression."
else
  echo "✅ Table $TABLE_NAME supprimée avec succès."
fi

# Nettoyage du fichier backup
rm -f "$BACKUP_FILE"

echo "🎯 Test de migration terminé."
echo " Fin test ======================================================"
echo "                                                                "
