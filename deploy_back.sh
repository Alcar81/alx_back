# deploy_back.sh
echo "=============================================================================="
echo "=== Étape 1 : Préparation de la migration : $(date) === $(date)" | tee -a "$LOG_FILE"

# 1.1.0 Fonction pour gérer les erreurs et restaurer la branche dev.
  echo "[INFO 1.1.0] Fonction pour gérer les erreurs et restaurer la branche dev... $(date)" | tee -a "$LOG_FILE"
  error_exit() {
    echo "[ERROR] $1 $(date)" | tee -a "$LOG_FILE"
    
    # Assurer le retour à la branche dev
    echo "[INFO] Restauration de la branche dev en cas d'erreur... $(date)" | tee -a "$LOG_FILE"
    git checkout dev || echo "[WARNING] Échec du retour à la branche dev. Veuillez vérifier manuellement. $(date)" | tee -a "$LOG_FILE"

    exit 1
  }

# 1.1.1 Naviguer vers la racine du dépôt Git
  echo "[INFO 1.1.1] Naviguer vers la racine du dépôt Git... $(date)" | tee -a "$LOG_FILE"
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -z "$REPO_ROOT" ]; then
    error_exit "Ce script doit être exécuté dans un dépôt Git valide. $(date)" | tee -a "$LOG_FILE"
  fi

  cd "$REPO_ROOT" || error_exit "Impossible de naviguer vers la racine du dépôt Git : $REPO_ROOT. $(date)" | tee -a "$LOG_FILE"


# 1.1.2 Détection du domaine en fonction du répertoire de base
  echo "[INFO 1.1.2] Détection du domaine en fonction du répertoire de base... : $(date)" | tee -a "$LOG_FILE"
  BASE_DIR=$(dirname "$(realpath "$0")")
  PARENT_DIR=$(basename "$(dirname "$BASE_DIR")")  # Parent du script
  CURRENT_DIR=$(basename "$BASE_DIR")             # Nom du répertoire courant

  if [[ "$PARENT_DIR" == dev.* ]]; then
    DOMAIN="${PARENT_DIR#dev.}"  # Supprime le préfixe "dev."
  else
    DOMAIN="$PARENT_DIR"
  fi

  REPO_PROD="/home/${DOMAIN}/backend"
  REPO_DEV="/home/dev.${DOMAIN}/backend"

# 1.1.4 Vérification des chemins générés
  echo "BASE_DIR=$BASE_DIR $(date)" | tee -a "$LOG_FILE"
  echo "DOMAIN=$DOMAIN $(date)" | tee -a "$LOG_FILE"
  echo "REPO_PROD=$REPO_PROD $(date)" | tee -a "$LOG_FILE"
  echo "REPO_DEV=$REPO_DEV $(date)" | tee -a "$LOG_FILE"  

# 1.2.2 Définir le répertoire des logs et le fichier log
  echo "[INFO 1.2.2] Définir le répertoire des logs et le fichier log... : $(date)" | tee -a "$LOG_FILE"
  LOG_DIR="../logs"
  LOG_FILE="$LOG_DIR/deployment_back.log"

  echo "LOG_DIR=$LOG_DIR $(date)" | tee -a "$LOG_FILE"
  echo "LOG_FILE=$LOG_FILE $(date)" | tee -a "$LOG_FILE"

# 1.2.2 Rotation des logs si nécessaire
  echo "[INFO 1.2.2] Rotation des logs si nécessaire... $(date)" | tee -a "$LOG_FILE"
  MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
  if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
    echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak $(date)" | tee -a "$LOG_FILE"
    mv "$LOG_FILE" "$LOG_FILE.bak" || error_exit "Échec de la rotation du fichier de log. $(date)" | tee -a "$LOG_FILE"
  fi

# 1.2.3 Créer le répertoire des logs s'il n'existe pas encore
  echo "[INFO 1.2.3] Créer le répertoire des logs s'il n'existe pas encore... : $(date)" | tee -a "$LOG_FILE"
  if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR" || error_exit "Échec de la création du répertoire des logs. $(date)" | tee -a "$LOG_FILE"
  fi

# 1.2.4 Donner les permissions au répertoire et au fichier log
  echo "[INFO 1.2.4] Donner les permissions au répertoire et au fichier log... : $(date)" | tee -a "$LOG_FILE"
  chmod 755 "$LOG_DIR" || error_exit "Échec de la mise à jour des permissions pour le répertoire des logs. $(date)" | tee -a "$LOG_FILE"
  touch "$LOG_FILE" || error_exit "Échec de la création du fichier de log. $(date)" | tee -a "$LOG_FILE"
  chmod 644 "$LOG_FILE" || error_exit "Échec de la mise à jour des permissions pour le fichier de log. $(date)" | tee -a "$LOG_FILE"


# Rediriger les sorties vers le fichier log
  echo "[INFO] 1.2.5 Rediriger les sorties vers le fichier log... : $(date)" | tee -a "$LOG_FILE"
  exec >> "$LOG_FILE" 2>&1

echo "=== Étape 2 : Déploiement Backend commencé : $(date) === $(date)" | tee -a "$LOG_FILE"

# 2.1 Vérifier si les branches existent
  echo "[INFO 2.1] Vérifier si les branches existent... : $(date)" | tee -a "$LOG_FILE"
  if ! git show-ref --quiet refs/heads/master; then
    error_exit "La branche 'master' n'existe pas. Vérifiez votre dépôt. $(date)" | tee -a "$LOG_FILE"
  fi

  if ! git show-ref --quiet refs/heads/dev; then
  error_exit "La branche 'dev' n'existe pas. Vérifiez votre dépôt. $(date)" | tee -a "$LOG_FILE"
  fi

# 2.2 Vérifier les modifications non validées
  echo "[INFO 2.2] Vérifier les modifications non validées... : $(date)" | tee -a "$LOG_FILE"
  if [ "$(git status --porcelain)" ]; then
    error_exit "Des modifications locales non validées ont été détectées. $(date)" | tee -a "$LOG_FILE"
    echo "Les fichiers suivants ont été modifiés et doivent être validés ou ignorés : $(date)" | tee -a "$LOG_FILE"
    git status --porcelain | awk '{print $2}'
    echo "Veuillez exécuter 'git status' pour plus de détails. $(date)" | tee -a "$LOG_FILE"
    echo "Ajoutez les fichiers avec 'git add', validez-les avec 'git commit', ou stash-les avec 'git stash'. $(date)" | tee -a "$LOG_FILE"
    exit 1
  fi

# 2.3.1 Passer à master, réinitialiser et écraser avec dev
  echo "[INFO 2.3.1] Passer à master, réinitialiser et écraser avec dev... : $(date)" | tee -a "$LOG_FILE"
  echo "[INFO 2.3.1] Déploiement : Passage à la branche master... $(date)" | tee -a "$LOG_FILE"
  git checkout master || error_exit "Échec du checkout vers master. $(date)" | tee -a "$LOG_FILE"

  echo "[INFO 2.3.2] Réinitialisation de master avec dev... $(date)" | tee -a "$LOG_FILE"
  git reset --hard origin/dev || error_exit "Échec de la réinitialisation de master avec dev. $(date)" | tee -a "$LOG_FILE"

  echo "[INFO 2.3.3] Poussée forcée vers la branche master... Déclanche le deploy_backend.yml $(date)" | tee -a "$LOG_FILE"
  git push origin master --force || error_exit "Échec de la poussée forcée vers master. $(date)" | tee -a "$LOG_FILE"

echo "=== Étape 3 : Synchronisation du répertoire de production (master) : $(date) ===" | tee -a "$LOG_FILE"

# Étape 3.1 : Sauvegarder le contenu du répertoire de production  
  BACKUP_DIR="../backups_back"
  BACKUP_FILE="$BACKUP_DIR/backend_backup_$(date +'%Y%m%d_%H%M%S').tar.gz"
  MAX_BACKUPS=5

  echo "[INFO 3.1.1] Vérification et création du répertoire de sauvegarde si nécessaire... $(date)" | tee -a "$LOG_FILE"
  if [ ! -d "$BACKUP_DIR" ]; then
    echo "[INFO] Création du répertoire de sauvegarde : $BACKUP_DIR $(date)" | tee -a "$LOG_FILE"
    mkdir -p "$REPO_PROD" || error_exit "Échec de la création du répertoire $REPO_PROD. $(date)" | tee -a "$LOG_FILE"
  fi

  if [ -d "$REPO_PROD" ]; then
    echo "[INFO 3.1.2] Sauvegarde du contenu actuel de $REPO_PROD dans $BACKUP_FILE... $(date)" | tee -a "$LOG_FILE"
    tar -czf "$BACKUP_FILE" -C "$REPO_PROD" . || error_exit "Échec de la sauvegarde du contenu de production. $(date)" | tee -a "$LOG_FILE"
    echo "[SUCCESS] Sauvegarde réalisée avec succès : $BACKUP_FILE $(date)" | tee -a "$LOG_FILE"

    echo "[INFO 3.1.3] Rotation des sauvegardes pour limiter à $MAX_BACKUPS fichiers... $(date)" | tee -a "$LOG_FILE"
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
      echo "[INFO 3.1.4] Suppression des sauvegardes les plus anciennes... $(date)" | tee -a "$LOG_FILE"
      ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f || error_exit "Échec de la rotation des sauvegardes. $(date)" | tee -a "$LOG_FILE"
      echo "[SUCCESS] Rotation des sauvegardes effectuée avec succès. $(date)" | tee -a "$LOG_FILE"
    fi
  else
    echo "[INFO] Le répertoire $REPO_PROD n'existe pas. Aucune sauvegarde nécessaire. $(date)" | tee -a "$LOG_FILE"
  fi

# Étape 3.2 : Suppression du contenu existant ou création du répertoire de production  
echo "[INFO 3.2] Préparation du répertoire de production ($REPO_PROD)... $(date)" | tee -a "$LOG_FILE"

# Vérifie si le répertoire cible existe
if [ -d "$REPO_PROD" ]; then
  echo "[INFO 3.2.1] Le répertoire $REPO_PROD existe. Suppression de son contenu... $(date)" | tee -a "$LOG_FILE"
  rm -rf "$REPO_PROD"/* || error_exit "Échec de la suppression du contenu existant dans $REPO_PROD. $(date)" | tee -a "$LOG_FILE"
  echo "[SUCCESS 3.2.1] Contenu du répertoire $REPO_PROD supprimé avec succès. $(date)" | tee -a "$LOG_FILE"
else
  echo "[INFO 3.2.2] Le répertoire $REPO_PROD n'existe pas. Création en cours... $(date)" | tee -a "$LOG_FILE"
  mkdir -p "$REPO_PROD" || error_exit "Échec de la création du répertoire $REPO_PROD. $(date)" | tee -a "$LOG_FILE"
  echo "[SUCCESS 3.2.2] Répertoire $REPO_PROD créé avec succès. $(date)" | tee -a "$LOG_FILE"
fi

# Étape 3.3 : Copier le contenu du répertoire source vers le répertoire cible
  echo "[INFO 3.3] Copie des fichiers de $REPO_DEV vers $REPO_PROD... $(date)" | tee -a "$LOG_FILE" 
  rsync -avh --progress "$REPO_DEV/" "$REPO_PROD/" || error_exit "Échec de la synchronisation vers le répertoire de production. $(date)" | tee -a "$LOG_FILE"
  echo "[SUCCESS] Étape 3.3 Synchronisation terminée. $(date)" | tee -a "$LOG_FILE"

# Étape 3.3 : Naviguer vers le répertoire de production
  echo "[INFO 3.3] Naviguer vers le répertoire de production... $(date)" | tee -a "$LOG_FILE"
  cd "$REPO_PROD" || error_exit "Impossible d'accéder au répertoire $REPO_PROD. : $(date)"  | tee -a "$LOG_FILE"

# Étape 3.4 : Fetch des références distantes
  echo "[INFO] 3.4 Fetch des références distantes... : $(date)" | tee -a "$LOG_FILE"
  git fetch origin || error_exit "Échec du fetch sur origin. $(date)" | tee -a "$LOG_FILE"
  echo "[SUCCESS] Fetch réussi. : $(date)"  | tee -a "$LOG_FILE"

# Étape 4 : Synchronisation du répertoire de développement (dev)
  echo "=== Étape 4 : Synchronisation du répertoire de développement (dev) : $(date) === $(date)" | tee -a "$LOG_FILE"
  cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV. $(date)" | tee -a "$LOG_FILE"

# 4.1 : Passage à la branche dev
  echo "[INFO] 4.1 Passage à la branche dev..." | tee -a "$LOG_FILE"
  git checkout dev || error_exit "Échec du checkout de dev. $(date)" | tee -a "$LOG_FILE"
  echo "[SUCCESS] Passage à dev réussi. : $(date)"  | tee -a "$LOG_FILE"

echo "=== Déploiement Backend terminé avec succès : $(date) === $(date)" | tee -a "$LOG_FILE"
echo "Les logs sont disponibles ici : $LOG_FILE $(date)" | tee -a "$LOG_FILE"
echo "=============================================================================="