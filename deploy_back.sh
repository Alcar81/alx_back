#!/bin/bash
# deploy_backend.sh

# Configuration des répertoires
REPO_PROD="/home/alxmultimedia.com/backend"
REPO_DEV="/home/dev.alxmultimedia.com/backend"
REPO_GIT_URL="git@github.com:VotreDépôt.git"

# Définir le répertoire des logs et le fichier log
LOG_DIR="../logs"
LOG_FILE="$LOG_DIR/deployment_back.log"

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

if [ -d "$REPO_PROD" ]; then
  echo "[INFO] 1.1 Suppression de l'ancien répertoire de production..." | tee -a "$LOG_FILE"
  rm -rf "$REPO_PROD" || error_exit "Échec de la suppression de l'ancien répertoire de production."
  echo "[SUCCESS] Ancien répertoire de production supprimé." | tee -a "$LOG_FILE"
fi

echo "[INFO] 1.2 Clonage du dépôt pour la production..." | tee -a "$LOG_FILE"
git clone "$REPO_GIT_URL" "$REPO_PROD" || error_exit "Échec du clonage pour la production."
echo "[SUCCESS] Clonage pour la production réussi." | tee -a "$LOG_FILE"

echo "[INFO] 1.3 Passage à la branche master..." | tee -a "$LOG_FILE"
cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD."
git checkout master || error_exit "Échec du checkout de master."
echo "[SUCCESS] Passage à master réussi." | tee -a "$LOG_FILE"

# Étape 2 : Synchronisation du répertoire de développement (dev)
echo "=== Étape 2 : Synchronisation du répertoire de développement (dev) ===" | tee -a "$LOG_FILE"

if [ -d "$REPO_DEV" ]; then
  echo "[INFO] 2.1 Suppression de l'ancien répertoire de développement..." | tee -a "$LOG_FILE"
  rm -rf "$REPO_DEV" || error_exit "Échec de la suppression de l'ancien répertoire de développement."
  echo "[SUCCESS] Ancien répertoire de développement supprimé." | tee -a "$LOG_FILE"
fi

echo "[INFO] 2.2 Clonage du dépôt pour le développement..." | tee -a "$LOG_FILE"
git clone "$REPO_GIT_URL" "$REPO_DEV" || error_exit "Échec du clonage pour le développement."
echo "[SUCCESS] Clonage pour le développement réussi." | tee -a "$LOG_FILE"

echo "[INFO] 2.3 Passage à la branche dev..." | tee -a "$LOG_FILE"
cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."
git checkout dev || error_exit "Échec du checkout de dev."
echo "[SUCCESS] Passage à dev réussi." | tee -a "$LOG_FILE"

echo "=== Déploiement Backend terminé avec succès : $(date) ===" | tee -a "$LOG_FILE"
echo "Les logs sont disponibles ici : $LOG_FILE" | tee -a "$LOG_FILE"