#!/bin/bash

# Nom du conteneur
CONTAINER_NAME="back_node_dev"

# Chemin vers le script à exécuter dans le conteneur
SCRIPT_PATH="scripts/dev-only/seedRoles.js"

echo "📦 Exécution de $SCRIPT_PATH dans le conteneur $CONTAINER_NAME..."

docker exec "$CONTAINER_NAME" node "$SCRIPT_PATH"

# Vérifie le code de sortie
if [ $? -eq 0 ]; then
  echo "✅ Script exécuté avec succès."
else
  echo "❌ Une erreur s’est produite pendant l'exécution du script."
fi
