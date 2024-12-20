#!/bin/bash

echo "=============================================================================="
echo "=== Test : Création du répertoire de sauvegarde et rotation ==="
echo "Date : $(date)"
echo "=============================================================================="

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

# Variables
BACKUP_DIR="$(dirname "$REPO_PROD")/backups/backend"
BACKUP_FILE="$BACKUP_DIR/backend_backup_$(date +'%Y%m%d_%H%M%S').tar.gz"
MAX_BACKUPS=5

# Valider les chemins
if [ -z "$REPO_PROD" ]; then
  echo "[ERROR] Répertoire de production non défini."; exit 1
fi
if [ -z "$BACKUP_DIR" ]; then
  echo "[ERROR] Répertoire de sauvegarde non défini."; exit 1
fi

# Afficher les résultats
echo "=============================================================================="
echo "=== Résultats de la détection des chemins ==="
echo "[INFO] Répertoire de production : $REPO_PROD"
echo "[INFO] Répertoire de sauvegarde : $BACKUP_DIR"
echo "[INFO] Fichier de sauvegarde : $BACKUP_FILE"
echo "=============================================================================="

# 2.1 Vérification et création du répertoire de sauvegarde
if [ ! -d "$BACKUP_DIR" ]; then
  echo "[INFO] Création du répertoire $BACKUP_DIR..."
  mkdir -p "$BACKUP_DIR" || { echo "[ERROR] Échec de la création du répertoire $BACKUP_DIR."; exit 1; }
else
  echo "[INFO] Le répertoire de sauvegarde existe déjà : $BACKUP_DIR"
fi

# 2.2 Vérifier que le répertoire de production existe
if [ ! -d "$REPO_PROD" ]; then
  echo "[ERROR] Le répertoire de production $REPO_PROD n'existe pas. Abandon."
  exit 1
fi

# 3.1 Effectuer la sauvegarde
echo "[INFO] Sauvegarde du contenu actuel de $REPO_PROD dans $BACKUP_FILE..."
tar -czf "$BACKUP_FILE" -C "$REPO_PROD" . || { echo "[ERROR] Échec de la sauvegarde."; exit 1; }

# Tester la validité du fichier de sauvegarde
if ! tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
  echo "[ERROR] Le fichier de sauvegarde $BACKUP_FILE est corrompu."; exit 1
fi

echo "[SUCCESS] Sauvegarde réalisée avec succès : $BACKUP_FILE"

# 3.2 Rotation des sauvegardes
echo "[INFO] Rotation des sauvegardes pour limiter à $MAX_BACKUPS fichiers..."
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
  echo "[INFO] Suppression des sauvegardes les plus anciennes..."
  ls -1t "$BACKUP_DIR"/*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f || { echo "[ERROR] Échec de la rotation des sauvegardes."; exit 1; }
  echo "[SUCCESS] Rotation effectuée avec succès."
else
  echo "[INFO] Pas de rotation nécessaire. Nombre actuel de sauvegardes : $BACKUP_COUNT"
fi

# 4.1 Afficher le contenu du répertoire de sauvegarde
echo "[INFO] Contenu actuel du répertoire de sauvegarde :"
ls -lh "$BACKUP_DIR"

echo "=============================================================================="
echo "=== Sauvegarde terminée avec succès ==="
echo "=============================================================================="
