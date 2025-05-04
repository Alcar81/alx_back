# deploy_back.sh
# Script de déploiement du backend
# Étape 0 : Préparation des logs
  echo "=============================================================================="
  echo "=== Début du script de déploiement Backend : $(date) ==="

# Étape 0 : Configuration des logs
  LOG_DIR="../logs"
  LOG_FILE="$LOG_DIR/deployment_back.log"

  echo "[INFO] Configuration des logs..."
  echo "Répertoire des logs : $LOG_DIR"
  echo "Fichier de log : $LOG_FILE"

# Rotation des logs si nécessaire
  MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
  if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
    echo "[INFO] Rotation du fichier de log..."
    mv "$LOG_FILE" "$LOG_FILE.bak" || error_exit "Échec de la rotation du fichier de log."
  fi

# Créer le répertoire des logs s'il n'existe pas encore
  if [ ! -d "$LOG_DIR" ]; then
    echo "[INFO] Création du répertoire des logs..."
    mkdir -p "$LOG_DIR" || error_exit "Échec de la création du répertoire des logs."
  fi
# Donner les permissions au répertoire et au fichier log  
    chmod 755 "$LOG_DIR" || error_exit "Échec de la mise à jour des permissions pour le répertoire des logs."
    touch "$LOG_FILE" || error_exit "Échec de la création du fichier de log."
    chmod 644 "$LOG_FILE" || error_exit "Échec de la mise à jour des permissions pour le fichier de log."
# Rediriger les sorties vers le fichier log
  exec >> "$LOG_FILE" 2>&1
  echo "[SUCCESS] Configuration des logs terminée."

# Fonction pour gérer les erreurs
  error_exit() {
    echo "[ERROR] $1"
    echo "[INFO] Tentative de retour à la branche dev en cas d'erreur..."
    git checkout dev || echo "[WARNING] Échec du retour à la branche dev. Vérifiez manuellement."
    exit 1
  }

# Étape 1 : Préparation
echo "=============================================================================="
echo "=== Étape 1 : Préparation de la migration : $(date) ==="

# 1.1 Naviguer vers la racine du dépôt Git
  REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
  if [ -z "$REPO_ROOT" ]; then
    echo "[ERROR] Ce script doit être exécuté dans un dépôt Git valide."
    exit 1
  fi
  cd "$REPO_ROOT" || { echo "[ERROR] Impossible de naviguer vers la racine du dépôt Git : $REPO_ROOT."; exit 1; }

  echo "[INFO] Répertoire racine du dépôt Git : $REPO_ROOT"

# 1.2 Détection des chemins
  BASE_DIR=$(dirname "$(realpath "$0")")
  PARENT_DIR=$(basename "$(dirname "$BASE_DIR")")
  CURRENT_DIR=$(basename "$BASE_DIR")

  case "$BASE_DIR" in
    *dev.*)
      REPO_DEV="$BASE_DIR"
      REPO_PROD=$(echo "$BASE_DIR" | sed 's/dev\.//') # Remplace "dev." par rien
      ;;
    *)
      REPO_PROD="$BASE_DIR"
      REPO_DEV=$(echo "$BASE_DIR" | sed 's/\/home\//\/home\/dev./') # Ajoute "dev." après "/home/"
      ;;
  esac

  # Afficher les résultats
  echo "=============================================================================="
  echo "=== Résultats de la détection des chemins ==="
  echo "[INFO] BASE_DIR      : $BASE_DIR"
  echo "[INFO] PARENT_DIR    : $PARENT_DIR"
  echo "[INFO] CURRENT_DIR   : $CURRENT_DIR"
  echo "[INFO] REPO_PROD     : $REPO_PROD"
  echo "[INFO] REPO_DEV      : $REPO_DEV"
  echo "=============================================================================="


# Étape 2 : Synchronisation Git
  echo "=============================================================================="
  echo "=== Étape 2 : Synchronisation Git : $(date) ==="

  # 2.1 Vérifier si les branches existent
  echo "[INFO 2.1] Vérification des branches Git..."
  if ! git show-ref --quiet refs/heads/master; then
    error_exit "La branche 'master' n'existe pas. Vérifiez votre dépôt."
  fi
  if ! git show-ref --quiet refs/heads/dev; then
    error_exit "La branche 'dev' n'existe pas. Vérifiez votre dépôt."
  fi

  # 2.1.1 Vérifier la connexion au dépôt distant
  echo "[INFO 2.1.1] Connexion au dépôt distant :"
  git remote -v || error_exit "Impossible de se connecter au dépôt distant."

  # 2.2 Vérifier les modifications locales
  echo "[INFO 2.2] Vérification des modifications locales..."
  git update-index --assume-unchanged .env && echo "[INFO] Le fichier .env est ignoré (assume-unchanged)."

  if [ "$(git status --porcelain)" ]; then
    echo "[ERROR] Des modifications locales non validées ont été détectées."
    git status --short
    echo "➡️  Veuillez valider, ignorer ou stasher vos modifications."
    echo "   Exemple : git stash && ./deploy_back.sh"
    error_exit "Arrêt du déploiement pour éviter une perte de données."
  fi

  # 2.3 Passage à master et synchronisation
  echo "[INFO 2.3.1] Passage à la branche master..."
  git checkout master || error_exit "Échec du passage à la branche master."

  # 2.3.2 Réinitialisation forcée avec origin/dev
  echo "[INFO 2.3.2] Réinitialisation de master avec origin/dev..."
  git reset --hard origin/dev || error_exit "Échec du reset --hard."

  # 2.3.3 Push forcé vers master ➜ déclenche GitHub Actions
  echo "[INFO 2.3.3] Push forcé vers master (déclenche CI/CD)..."
  git push origin master --force || error_exit "Échec du push vers master."

  echo "[SUCCESS] Étape 2 : Synchronisation Git terminée avec succès."


# Étape 3 : Gestion du répertoire de production
  echo "=============================================================================="
  echo "=== Étape 3 : Gestion du répertoire de production : $(date) ==="

# 3.1. Variables
  BACKUP_DIR="$(dirname "$REPO_PROD")/backups/backend"
  BACKUP_FILE="$BACKUP_DIR/backend_backup_$(date +'%Y%m%d_%H%M%S').tar.gz"
  MAX_BACKUPS=5

# 3.1.2 Valider les chemins
  if [ -z "$REPO_PROD" ]; then
    echo "[ERROR] Répertoire de production non défini."; exit 1
  fi
  if [ -z "$BACKUP_DIR" ]; then
    echo "[ERROR] Répertoire de sauvegarde non défini."; exit 1
  fi

# 3.1.3 Afficher les résultats
  echo "=============================================================================="
  echo "=== Résultats de la détection des chemins ==="
  echo "[INFO] Répertoire de production : $REPO_PROD"
  echo "[INFO] Répertoire de sauvegarde : $BACKUP_DIR"
  echo "[INFO] Fichier de sauvegarde : $BACKUP_FILE"
  echo "=============================================================================="

# 3.1.4 Vérification et création du répertoire de sauvegarde
  if [ ! -d "$BACKUP_DIR" ]; then
    echo "[INFO] Création du répertoire $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR" || { echo "[ERROR] Échec de la création du répertoire $BACKUP_DIR."; exit 1; }
  else
    echo "[INFO] Le répertoire de sauvegarde existe déjà : $BACKUP_DIR"
  fi

# 3.1.5 Vérifier que le répertoire de production existe
  if [ ! -d "$REPO_PROD" ]; then
    echo "[ERROR] Le répertoire de production $REPO_PROD n'existe pas. Abandon."
    exit 1
  fi

# 3.1.6 Effectuer la sauvegarde
  echo "[INFO] Sauvegarde du contenu actuel de $REPO_PROD dans $BACKUP_FILE..."
  tar -czf "$BACKUP_FILE" -C "$REPO_PROD" . || { echo "[ERROR] Échec de la sauvegarde."; exit 1; }

# 3.1.7 Tester la validité du fichier de sauvegarde
  if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    echo "[ERROR] Le fichier de sauvegarde $BACKUP_FILE est corrompu."; exit 1
  fi

  echo "[SUCCESS] Sauvegarde réalisée avec succès : $BACKUP_FILE"

# 3.1.8 Rotation des sauvegardes
  echo "[INFO] Rotation des sauvegardes pour limiter à $MAX_BACKUPS fichiers..."
  BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
  if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    echo "[INFO] Suppression des sauvegardes les plus anciennes..."
    ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f || { echo "[ERROR] Échec de la rotation des sauvegardes."; exit 1; }
    echo "[SUCCESS] Rotation effectuée avec succès."
  else
    echo "[INFO] Pas de rotation nécessaire. Nombre actuel de sauvegardes : $BACKUP_COUNT"
  fi

# 3.1.9 Afficher le contenu du répertoire de sauvegarde
  echo "[INFO] Contenu actuel du répertoire de sauvegarde :"
  ls -lh "$BACKUP_DIR"

  echo "=============================================================================="
  echo "=== Sauvegarde terminée avec succès ==="
  echo "=============================================================================="

# Étape 3.2 : Préparation du répertoire de production
  echo "[INFO 3.2] Préparation du répertoire de production ($REPO_PROD)..."  

# 3.2.1 Sauvegarde temporaire des fichiers sensibles (.git et .env)
  echo "[INFO 3.2.1] Sauvegarde temporaire des fichiers sensibles (.git et .env)..."

# Définir les chemins de sauvegarde temporaire
  GIT_BACKUP="/tmp/git_backup_$(date +'%Y%m%d_%H%M%S')"
  ENV_BACKUP="/tmp/env_backup_$(date +'%Y%m%d_%H%M%S')"

# Sauvegarde du répertoire .git
  if [ -d "$REPO_PROD/.git" ]; then
    cp -r "$REPO_PROD/.git" "$GIT_BACKUP" || error_exit "[ERROR 3.2.1] Échec de la sauvegarde de .git."
    echo "[SUCCESS] Sauvegarde de .git réalisée avec succès."
  else
    echo "[WARNING] Aucun répertoire .git trouvé. Vérifiez manuellement si nécessaire."
  fi

# Sauvegarde du fichier .env
  if [ -f "$REPO_PROD/.env" ]; then
    cp "$REPO_PROD/.env" "$ENV_BACKUP" || error_exit "[ERROR 3.2.1] Échec de la sauvegarde de .env."
    echo "[SUCCESS] Sauvegarde de .env réalisée avec succès."
  else
    echo "[WARNING] Aucun fichier .env trouvé. Vérifiez manuellement si nécessaire."
  fi

  # Confirmation finale des sauvegardes
  echo "[SUCCESS 3.2.1] Sauvegarde des fichiers sensibles réalisée avec succès."

# 3.2.2 Nettoyage du répertoire tout en préservant les fichiers sensibles
  echo "[INFO 3.2.2] Suppression du contenu existant dans $REPO_PROD sauf .git et .env..."
  find "$REPO_PROD" -mindepth 1 -not -name ".git" -not -name ".env" -exec rm -rf {} + 2>/dev/null || error_exit "[ERROR 3.2.2] Échec de la suppression du contenu existant."
  echo "[SUCCESS 3.2.2] Nettoyage effectué avec succès."

# 3.2.3 Validation explicite de la présence de .git
  if [ ! -d "$REPO_PROD/.git" ]; then
    error_exit "[ERROR 3.2.3] Le répertoire $REPO_PROD n'est pas un dépôt Git valide après suppression. Abandon."
  fi

  # Vérification explicite de la présence de .env
  if [ ! -f "$REPO_PROD/.env" ]; then
    echo "[WARNING 3.2.3] Aucun fichier .env présent après suppression. Il sera restauré si sauvegardé."
  fi

# Étape 3.3 : Synchronisation des fichiers
  echo "[INFO 3.3] Début de la synchronisation des fichiers..."
  START_TIME=$(date +%s)

  rsync -a --delete --exclude=".git" --exclude=".env" "$REPO_DEV/" "$REPO_PROD/" || error_exit "[ERROR 3.3] Échec de la synchronisation des fichiers."
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  echo "[SUCCESS] Étape 3.3 Synchronisation terminée en $DURATION secondes."

# 3.3.1 Restauration des fichiers sensibles (.git et .env)
  echo "[INFO 3.3.1] Restauration des fichiers sensibles (.git et .env)..."
  cp -r "$GIT_BACKUP" "$REPO_PROD/.git" || error_exit "[ERROR 3.3.1] Échec de la restauration de .git."

  if [ -f "$ENV_BACKUP" ]; then
    cp "$ENV_BACKUP" "$REPO_PROD/.env" || error_exit "[ERROR 3.3.1] Échec de la restauration de .env."
    echo "[SUCCESS] Restauration de .env réussie."
  else
    echo "[WARNING] Aucun fichier .env à restaurer. Vérifiez manuellement si nécessaire."
  fi

# 3.3.2 Nettoyage des sauvegardes temporaires.  
  echo "[INFO 3.3.2] Nettoyage des sauvegardes temporaires..."
  rm -rf "$GIT_BACKUP" "$ENV_BACKUP" || echo "[WARNING 3.3.2] Impossible de supprimer les sauvegardes temporaires."
  echo "[SUCCESS 3.3.2] Nettoyage terminé."

# Étape 3.4 : Fetch des références distantes
  echo "[INFO 3.4] Fetch des références distantes dans $REPO_PROD..."
  cd "$REPO_PROD" || error_exit "[ERROR] 3.4 Impossible d'accéder au répertoire $REPO_PROD."

# 3.5 Vérification si $REPO_PROD est un dépôt Git
  if [ ! -d ".git" ]; then
    error_exit "[ERROR] 3.5 Le répertoire $REPO_PROD n'est pas un dépôt Git valide."
  fi

# 3.6 Fetch des références distantes
  git fetch origin || error_exit "[ERROR 3.6] Échec du fetch des références distantes."
  echo "[SUCCESS] 3.6 Fetch réussi."

# Étape 4 : Synchronisation du répertoire de développement (dev).
  echo "=== Étape 4 : Synchronisation du répertoire de développement (dev)"
  cd "$REPO_DEV" || error_exit "Impossible d'accéder au répertoire $REPO_DEV."

# 4.1 : Passage à la branche dev
  echo "[INFO] 4.1 Passage à la branche dev..."
  git checkout dev || error_exit "Échec du checkout de dev."
  echo "[SUCCESS] Passage à dev réussi. : $(date)"

# 4.1.1 : Ignorer les modifications du fichier .env localement pour éviter les conflits de commit
  git update-index --assume-unchanged .env && echo "[INFO] Le fichier .env est maintenant ignoré par Git (assume-unchanged)."


# 4.2 : Utilisation des ressources après déploiement
  echo "[INFO] Utilisation des ressources après déploiement :"
  df -h | grep "/$" || echo "[ERROR] Impossible d'obtenir l'état des disques."
  free -h || echo "[ERROR] Impossible d'obtenir l'état de la mémoire."
  uptime || echo "[ERROR] Impossible d'obtenir les informations système."

echo "[INFO] Le redémarrage du serveur backend est géré par GitHub Actions après déploiement."
echo "[INFO] Surveillez les journaux GitHub Actions pour confirmer que le serveur est bien relancé."

echo "=== Déploiement Backend terminé avec succès : $(date) ==="
echo "Les logs sont disponibles ici : $LOG_FILE"
echo "=============================================================================="