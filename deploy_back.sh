#!/bin/bash
# deploy_backend.sh

# Configuration des répertoires
REPO_PROD="/home/alxmultimedia.com/backend"
REPO_DEV="/home/dev.alxmultimedia.com/backend"

# Définir le répertoire des logs et le fichier log
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/deployment_back.log"

# Étape 0 : Préparation des logs
echo "=== Étape 0 : Préparation des logs ==="
if [ ! -d "$LOG_DIR" ]; then
  echo "[INFO] Création du répertoire des logs : $LOG_DIR"
  mkdir -p "$LOG_DIR"
  chmod 755 "$LOG_DIR"
fi

if [ ! -f "$LOG_FILE" ]; then
  echo "[INFO] Création du fichier de log : $LOG_FILE"
  touch "$LOG_FILE"
fi

MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
  echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak"
  mv "$LOG_FILE" "$LOG_FILE.bak"
  touch "$LOG_FILE"
fi

chmod 644 "$LOG_FILE"
exec >> "$LOG_FILE" 2>&1
echo "[SUCCESS] Étape 0 terminée : Logs prêts."

# Fonction pour gérer les erreurs
error_exit() {
  echo "[ERROR] $1" | tee -a "$LOG_FILE"
  exit 1
}

# Étape 1 : Synchronisation du répertoire de production (master)
echo "=== Étape 1 : Synchronisation du répertoire de production (master) ==="
cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD."

echo "[INFO] 1.1 Fetch des références distantes..."
git fetch origin || error_exit "Échec du fetch sur origin."
echo "[SUCCESS] Fetch réussi."

echo "[INFO] 1.2 Passage à la branche master..."
git checkout master || error_exit "Échec du checkout de master."
echo "[SUCCESS] Passage à master réussi."

echo "[INFO] 1.3 Réinitialisation de master avec origin/dev..."
git reset --hard origin/dev || error_exit "Échec du reset hard avec origin/dev."
echo "[SUCCESS] Réinitialisation réussie."

echo "[INFO] 1.4 Poussée forcée vers master..."
git push origin master --force || error_exit "Échec du push forcé sur master."
echo "[SUCCESS] Push vers master réussi."

echo "[INFO] 1.5 Attente pour la propagation des changements..."
sleep 30
echo "[SUCCESS] Attente terminée."

echo "[INFO] 1.6 Pull des mises à jour de master..."
git pull origin master || error_exit "Échec du pull sur master."
echo "[SUCCESS] Pull sur master réussi."

# Étape 2 : Synchronisation du répertoire de développement (dev)
echo "=== Étape 2 : Synchronisation du répertoire de développement (dev) ==="
cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."

echo "[INFO] 2.1 Passage à la branche dev..."
git checkout dev || error_exit "Échec du checkout de dev."
echo "[SUCCESS] Passage à dev réussi."

echo "[INFO] 2.2 Pull des mises à jour de dev..."
git pull origin dev || error_exit "Échec du pull sur dev."
echo "[SUCCESS] Pull sur dev réussi."

echo "=== Déploiement Backend terminé avec succès : $(date) ==="
echo "Les logs sont disponibles ici : $LOG_FILE"