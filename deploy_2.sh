#!/bin/bash
echo "Déploiement Niveau 2"

# Se rendre dans le répertoire spécifié
cd $1

# Passer à master, faire un pull et une réinitialisation de dev
git checkout master || exit 1
git pull origin master || exit 1
git reset --hard origin/dev || exit 1
git push origin master --force || exit 1

echo "Déploiement Niveau 2 terminé."
