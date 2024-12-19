#!/bin/bash
# deploy_backend.sh

# Détection du domaine en fonction du répertoire de base
BASE_DIR=$(dirname "$(realpath "$0")")
DOMAIN=$(basename "$(dirname "$BASE_DIR")")
APP_NAME=$(basename "$BASE_DIR")

# Configuration des répertoires dynamiques
REPO_PROD="/home/${DOMAIN}/backend"
REPO_DEV="/home/dev.${DOMAIN}/backend"

# Définir le répertoire des logs et le fichier log
LOG_DIR="${BASE_DIR}/../logs"
LOG_FILE="${LOG_DIR}/deployment_back.log"

# Étape 0 : Préparation des logs
echo "=== Étape 0 : Préparation des logs ===" | tee -a "$LOG_FILE"
if [ ! -d "$LOG_DIR" ]; then
  echo "[INFO] Création du répertoire des logs : $LOG_DIR" | tee -a "$LOG_FILE"
  mkdir -p "$LOG_DIR"
  chmod 755 "$LOG_DIR"
fi

if [ ! -f "$LOG_FILE" ]; then
  echo "[INFO] Création du fichier de log : $LOG_FILE" | tee -a "$LOG_FILE"
  touch "$LOG_FILE"
fi

MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
  echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak" | tee -a "$LOG_FILE"
  mv "$LOG_FILE" "$LOG_FILE.bak"
  touch "$LOG_FILE"
fi

chmod 644 "$LOG_FILE"

# Fonction pour gérer les erreurs
error_exit() {
  echo "[ERROR] $1" | tee -a "$LOG_FILE"
  exit 1
}

# Étape 1 : Synchronisation du répertoire de production (master)
echo "=== Étape 1 : Synchronisation du répertoire de production (master) ===" | tee -a "$LOG_FILE"
cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD."

echo "[INFO] 1.1 Fetch des références distantes..." | tee -a "$LOG_FILE"
git fetch origin || error_exit "Échec du fetch sur origin."
echo "[SUCCESS] Fetch réussi." | tee -a "$LOG_FILE"

echo "[INFO] 1.2 Passage à la branche master..." | tee -a "$LOG_FILE"
git checkout master || error_exit "Échec du checkout de master."
echo "[SUCCESS] Passage à master réussi." | tee -a "$LOG_FILE"

echo "[INFO] 1.3 Réinitialisation de master avec origin/dev..." | tee -a "$LOG_FILE"
git reset --hard origin/dev || error_exit "Échec du reset hard avec origin/dev."
echo "[SUCCESS] Réinitialisation réussie." | tee -a "$LOG_FILE"

echo "[INFO] 1.4 Poussée forcée vers master..." | tee -a "$LOG_FILE"
git push origin master --force || error_exit "Échec du push forcé sur master."
echo "[SUCCESS] Push vers master réussi." | tee -a "$LOG_FILE"

# Étape 2 : Synchronisation du répertoire de développement (dev)
echo "=== Étape 2 : Synchronisation du répertoire de développement (dev) ===" | tee -a "$LOG_FILE"
cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."

echo "[INFO] 2.1 Passage à la branche dev..." | tee -a "$LOG_FILE"
git checkout dev || error_exit "Échec du checkout de dev."
echo "[SUCCESS] Passage à dev réussi." | tee -a "$LOG_FILE"

echo "=== Déploiement Backend terminé avec succès : $(date) ===" | tee -a "$LOG_FILE"
echo "Les logs sont disponibles ici : $LOG_FILE" | tee -a "$LOG_FILE"