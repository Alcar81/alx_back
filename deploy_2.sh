#!/bin/bash
echo "Déploiement Niveau 2"

# Passer à master, faire un pull et une réinitialisation de dev
git checkout master || exit 1
git pull origin master || exit 1
git reset --hard origin/dev || exit 1
git push origin master --force || exit 1

# Revenir sur dev pour continuer les travaux de développement
git checkout dev || exit 1

echo "Déploiement Niveau 2 terminé."
