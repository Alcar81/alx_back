#!/bin/bash
# deploy_backend.sh

# Configuration des répertoires
REPO_PROD="/home/alxmultimedia.com/backend"
REPO_DEV="/home/dev.alxmultimedia.com/backend"

# Définir le répertoire des logs et le fichier log
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/deployment_back.log"

# Vérifier et créer le répertoire des logs s'il n'existe pas encore
if [ ! -d "$LOG_DIR" ]; then
  echo "[INFO] Création du répertoire des logs : $LOG_DIR"
  mkdir -p "$LOG_DIR"
  chmod 755 "$LOG_DIR"
fi

# Créer le fichier log s'il n'existe pas encore
if [ ! -f "$LOG_FILE" ]; then
  echo "[INFO] Création du fichier de log : $LOG_FILE"
  touch "$LOG_FILE"
fi

# Rotation des logs si nécessaire
MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
  echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak"
  mv "$LOG_FILE" "$LOG_FILE.bak"
  touch "$LOG_FILE"
fi

# Donner les permissions au fichier log
chmod 644 "$LOG_FILE"

# Rediriger les sorties vers le fichier log
exec >> "$LOG_FILE" 2>&1

echo "=== Déploiement Backend commencé : $(date) ==="

# Fonction pour gérer les erreurs
error_exit() {
  echo "[ERROR] $1" | tee -a "$LOG_FILE"
  exit 1
}

# Étape 1 : Synchronisation du répertoire de production
echo "[INFO] Passage à la branche master dans le répertoire de production..."
cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD."

git fetch origin || error_exit "Échec du fetch sur origin."
git checkout master || error_exit "Échec du checkout de master."
git reset --hard origin/dev || error_exit "Échec du reset hard avec origin/dev."
git push origin master --force || error_exit "Échec du push forcé sur master."

echo "[INFO] Attente de 30 secondes pour la propagation des changements..."
sleep 30

echo "[INFO] Mise à jour locale des fichiers pour master..."
git pull origin master || error_exit "Échec du pull sur master."

# Étape 2 : Synchronisation du répertoire de développement
echo "[INFO] Passage à la branche dev dans le répertoire de développement..."
cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."

git checkout dev || error_exit "Échec du checkout de dev."
git pull origin dev || error_exit "Échec du pull sur dev."

echo "=== Déploiement Backend terminé avec succès : $(date) ==="
echo "Les logs sont disponibles ici : $LOG_FILE"
