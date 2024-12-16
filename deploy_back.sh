#!/bin/bash
# deploy_backend.sh

# Naviguer vers la racine du dépôt Git
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo "[ERROR] Ce script doit être exécuté dans un dépôt Git valide."
  exit 1
fi

cd "$REPO_ROOT" || { echo "[ERROR] Impossible de naviguer vers la racine du dépôt Git : $REPO_ROOT."; exit 1; }

# Définir le répertoire des logs et le fichier log
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/deployment_back.log"

# Rotation des logs si nécessaire
MAX_LOG_SIZE=$((1024 * 1024)) # 1 Mo
if [ -f "$LOG_FILE" ] && [ $(stat -c%s "$LOG_FILE") -ge $MAX_LOG_SIZE ]; then
  echo "[INFO] Rotation du fichier de log : $LOG_FILE -> $LOG_FILE.bak"
  mv "$LOG_FILE" "$LOG_FILE.bak"
fi

# Créer le répertoire des logs s'il n'existe pas encore
if [ ! -d "$LOG_DIR" ]; then
  echo "Création du répertoire $LOG_DIR..."
  mkdir -p "$LOG_DIR"
fi

# Donner les permissions au répertoire et au fichier log
chmod 755 "$LOG_DIR"
touch "$LOG_FILE"
chmod 644 "$LOG_FILE"

# Rediriger les sorties vers le fichier log
exec >> "$LOG_FILE" 2>&1

echo "=== Déploiement Backend commencé : $(date) ==="

# Vérifier si les branches existent
if ! git show-ref --quiet refs/heads/master; then
  echo "Erreur : La branche 'master' n'existe pas. Vérifiez votre dépôt."
  exit 1
fi

if ! git show-ref --quiet refs/heads/dev; then
  echo "Erreur : La branche 'dev' n'existe pas. Vérifiez votre dépôt."
  exit 1
fi

# Vérifier les modifications non validées
if [ "$(git status --porcelain)" ]; then
  echo "Erreur : Des modifications locales non validées ont été détectées."
  echo "Les fichiers suivants ont été modifiés et doivent être validés ou ignorés :"
  git status --porcelain | awk '{print $2}' # Afficher uniquement les noms de fichiers
  echo "Veuillez exécuter 'git status' pour plus de détails."
  echo "Ajoutez les fichiers avec 'git add', validez-les avec 'git commit', ou stash-les avec 'git stash'."
  exit 1
fi

# Passer à master, réinitialiser et écraser avec dev
echo '[INFO] Déploiement : Passage à la branche master...' | tee -a $LOG_FILE
git checkout master || { echo '[ERROR] Échec du checkout master.' | tee -a $LOG_FILE; exit 1; }

echo '[INFO] Réinitialisation de master avec dev...' | tee -a $LOG_FILE
git reset --hard origin/dev || { echo '[ERROR] Échec de la réinitialisation de master avec dev.' | tee -a $LOG_FILE; exit 1; }

echo '[INFO] Poussée forcée vers la branche master...' | tee -a $LOG_FILE
git push origin master --force || { echo '[ERROR] Échec de la poussée forcée vers master.' | tee -a $LOG_FILE; exit 1; }

# Revenir sur dev pour continuer les travaux de développement
git checkout dev || exit 1

echo "=== Déploiement Backend terminé : $(date) ==="
echo "Les logs de ce déploiement sont disponibles dans $LOG_FILE"
