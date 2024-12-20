#!/bin/bash
# deploy_back.sh
echo "=============================================================================="
echo "=== Étape 1 : Préparation de la migration : $(date) ===" | tee -a "$LOG_FILE"

# 1.1.1 Naviguer vers la racine du dépôt Git
  echo "[INFO 1.1.1] Naviguer vers la racine du dépôt Git..." | tee -a "$LOG_FILE"
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -z "$REPO_ROOT" ]; then
    echo "[ERROR] Ce script doit être exécuté dans un dépôt Git valide."
    exit 1
  fi

  cd "$REPO_ROOT" || { echo "[ERROR] Impossible de naviguer vers la racine du dépôt Git : $REPO_ROOT."; exit 1; }

# 1.1.2 Détection du domaine en fonction du répertoire de base
  echo "[INFO 1.1.2] Détection du domaine en fonction du répertoire de base... : $(date)" | tee -a "$LOG_FILE"
  BASE_DIR=$(dirname "$(realpath "$0")")
  DOMAIN=$(basename "$(dirname "$BASE_DIR")")
  APP_NAME=$(basename "$BASE_DIR")

  echo "BASE_DIR=$BASE_DIR" | tee -a "$LOG_FILE"
  echo "DOMAIN=$DOMAIN" | tee -a "$LOG_FILE"
  echo "DOMAIN=$APP_NAME" | tee -a "$LOG_FILE"

# 1.2.1 Configuration des répertoires dynamiques
  echo "[INFO] 1.2.1 Configuration des répertoires dynamiques... : $(date)" | tee -a "$LOG_FILE"
  REPO_PROD="/home/${DOMAIN}/backend"
  REPO_DEV="/home/dev.${DOMAIN}/backend"

  echo "REPO_PROD=$REPO_PROD" | tee -a "$LOG_FILE"
  echo "REPO_DEV=$REPO_DEV" | tee -a "$LOG_FILE"

# 1.2.2 Définir le répertoire des logs et le fichier log
  echo "[INFO 1.2.2] Définir le répertoire des logs et le fichier log... : $(date)" | tee -a "$LOG_FILE"
  LOG_DIR="../logs"
  LOG_FILE="$LOG_DIR/deployment_back.log"

  echo "LOG_DIR=$LOG_DIR" | tee -a "$LOG_FILE"
  echo "LOG_FILE=$LOG_FILE" | tee -a "$LOG_FILE"

# 1.2.2 Rotation des logs si nécessaire
  echo "[INFO 1.2.2] Rotation des logs si nécessaire..." | tee -a "$LOG_FILE"
  MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
  if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
    echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak"
    mv "$LOG_FILE" "$LOG_FILE.bak"
  fi

# 1.2.3 Créer le répertoire des logs s'il n'existe pas encore
  echo "[INFO 1.2.3] Créer le répertoire des logs s'il n'existe pas encore... : $(date)" | tee -a "$LOG_FILE"
  if [ ! -d "$LOG_DIR" ]; then
    echo "[INFO] Création du répertoire des logs : $LOG_DIR"
    mkdir -p "$LOG_DIR"
  fi

# 1.2.4 Donner les permissions au répertoire et au fichier log
echo "[INFO 1.2.4] Donner les permissions au répertoire et au fichier log... : $(date)" | tee -a "$LOG_FILE"
  chmod 755 "$LOG_DIR"
  touch "$LOG_FILE"
  chmod 644 "$LOG_FILE"

# Rediriger les sorties vers le fichier log
  echo "[INFO] 1.2.5 Rediriger les sorties vers le fichier log... : $(date)" | tee -a "$LOG_FILE"
  exec >> "$LOG_FILE" 2>&1

echo "=== Étape 2 : Déploiement Backend commencé : $(date) ===" | tee -a "$LOG_FILE"

# 2.1 Vérifier si les branches existent
  echo "[INFO 2.1] Vérifier si les branches existent... : $(date) ===" | tee -a "$LOG_FILE"
  if ! git show-ref --quiet refs/heads/master; then
    echo "[ERROR] La branche 'master' n'existe pas. Vérifiez votre dépôt."
    exit 1
  fi

  if ! git show-ref --quiet refs/heads/dev; then
    echo "[ERROR] La branche 'dev' n'existe pas. Vérifiez votre dépôt."
    exit 1
  fi

# 2.2 Vérifier les modifications non validées
  echo "[INFO 2.2] Vérifier les modifications non validées... : $(date)" | tee -a "$LOG_FILE"
  if [ "$(git status --porcelain)" ]; then
    echo "[ERROR] Des modifications locales non validées ont été détectées."
    echo "Les fichiers suivants ont été modifiés et doivent être validés ou ignorés :"
    git status --porcelain | awk '{print $2}'
    echo "Veuillez exécuter 'git status' pour plus de détails."
    echo "Ajoutez les fichiers avec 'git add', validez-les avec 'git commit', ou stash-les avec 'git stash'."
    exit 1
  fi

# 2.3.1 Passer à master, réinitialiser et écraser avec dev
  echo "[INFO 2.3.1] Passer à master, réinitialiser et écraser avec dev... : $(date)" | tee -a "$LOG_FILE"
  echo "[INFO 2.3.1] Déploiement : Passage à la branche master..."
  git checkout master || { echo "[ERROR] Échec du checkout master."; exit 1; }

  echo "[INFO 2.3.2] Réinitialisation de master avec dev..."
  git reset --hard origin/dev || { echo "[ERROR] Échec de la réinitialisation de master avec dev."; exit 1; }

  echo "[INFO 2.3.3] Poussée forcée vers la branche master... Déclanche le deploy_backend.yml"
  git push origin master --force || { echo "[ERROR] Échec de la poussée forcée vers master."; exit 1; }

echo "=== Étape 3 : Synchronisation du répertoire de production (master) : $(date) ===" | tee -a "$LOG_FILE"

# 3.1 : Vérifier si le répertoire cible existe
  echo "[INFO 3.1] Synchronisation de $REPO_DEV vers $REPO_PROD..." | tee -a "$LOG_FILE"  
  if [ ! -d "$REPO_PROD" ]; then
    echo "[INFO 3.1] Le répertoire $REPO_PROD n'existe pas. Création en cours..."
    mkdir -p "$REPO_PROD" || { echo "[ERROR] Échec de la création de $REPO_PROD."; exit 1; }
  else
    echo "[INFO 3.1] Le répertoire $REPO_PROD existe. Suppression de son contenu..." | tee -a "$LOG_FILE"  
    rm -rf "$REPO_PROD"/* || { echo "[ERROR] Échec de la suppression du contenu de $REPO_PROD."; exit 1; }
  fi

# 3.2 : Copier le contenu du répertoire source vers le répertoire cible
  echo "[INFO 3.2] Copie des fichiers de $REPO_DEV vers $REPO_PROD..." | tee -a "$LOG_FILE"  
  rsync -avh --progress "$REPO_DEV/" "$REPO_PROD/" || { echo "[ERROR] Échec de la copie."; exit 1; }

  echo "[SUCCESS] Étape 3.2 Synchronisation terminée." | tee -a "$LOG_FILE"

# Étape 3.3 : Naviguer vers le répertoire de production
  echo "[INFO 3.3] Naviguer vers le répertoire de production..." | tee -a "$LOG_FILE"
  cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD. : $(date)"  | tee -a "$LOG_FILE"

# Étape 3.4 : Fetch des références distantes
  echo "[INFO] 3.4 Fetch des références distantes... : $(date)" | tee -a "$LOG_FILE"
  git fetch origin || error_exit "Échec du fetch sur origin."
  echo "[SUCCESS] Fetch réussi. : $(date)"  | tee -a "$LOG_FILE"

# Étape 4 : Synchronisation du répertoire de développement (dev)
  echo "=== Étape 4 : Synchronisation du répertoire de développement (dev) : $(date) ===" | tee -a "$LOG_FILE"
  cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."

# 4.1 : Passage à la branche dev
  echo "[INFO] 4.1 Passage à la branche dev..." | tee -a "$LOG_FILE"
  git checkout dev || error_exit "Échec du checkout de dev."
  echo "[SUCCESS] Passage à dev réussi. : $(date)"  | tee -a "$LOG_FILE"

echo "=== Déploiement Backend terminé avec succès : $(date) ===" | tee -a "$LOG_FILE"
echo "Les logs sont disponibles ici : $LOG_FILE" | tee -a "$LOG_FILE"
echo "=============================================================================="