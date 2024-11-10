#!/bin/bash

# deploy_backend.sh

# Arrête l'exécution en cas d'erreur
set -e

# Variables d'environnement
ENVIRONMENT=$1  # doit être 'dev', 'test' ou 'prod'
DOCKER_IMAGE_NAME="my_backend_image"
DOCKER_REGISTRY="mydockerregistry.com" # Remplace par le nom de ton registre Docker
CONTAINER_NAME="back_node_${ENVIRONMENT}"
NETWORK="${ENVIRONMENT}_network"

# Définir des variables spécifiques pour chaque environnement
case "$ENVIRONMENT" in
  "dev")
    POSTGRES_USER="usr_db_dev"
    POSTGRES_PASSWORD="dw33kMyiQvNL62p3aCjd"
    POSTGRES_DB="postgres_dev"
    PORT="7001"
    ;;
  "test")
    POSTGRES_USER="usr_db_test"
    POSTGRES_PASSWORD="DEwmOlBcFj2TtolwDbjZ"
    POSTGRES_DB="postgres_test"
    PORT="7002"
    ;;
  "prod")
    POSTGRES_USER="usr_db_prod"
    POSTGRES_PASSWORD="joXrN6QPkckYW6oCYWiv"
    POSTGRES_DB="postgres_prod"
    PORT="7003"
    ;;
  *)
    echo "Environnement inconnu : ${ENVIRONMENT}. Utiliser 'dev', 'test' ou 'prod'."
    exit 1
    ;;
esac

# Étape 1 : Construire l'image Docker
echo "Construction de l'image Docker pour l'environnement ${ENVIRONMENT}..."
docker build -t ${DOCKER_IMAGE_NAME}:${ENVIRONMENT} .

# Étape 2 : Tag et push de l'image sur le registre Docker
echo "Push de l'image sur le registre Docker..."
docker tag ${DOCKER_IMAGE_NAME}:${ENVIRONMENT} ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${ENVIRONMENT}
docker push ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${ENVIRONMENT}

# Étape 3 : Déployer sur le serveur
echo "Déploiement du conteneur sur le serveur..."
docker stop ${CONTAINER_NAME} || true
docker rm ${CONTAINER_NAME} || true

docker run -d --name ${CONTAINER_NAME} \
  --network ${NETWORK} \
  -e NODE_ENV=${ENVIRONMENT} \
  -e DB_USERNAME=${POSTGRES_USER} \
  -e DB_PASSWORD=${POSTGRES_PASSWORD} \
  -e DB_HOST=postgres_${ENVIRONMENT} \
  -e DB_PORT=5432 \
  -e DB_NAME=${POSTGRES_DB} \
  -p ${PORT}:7000 \
  ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${ENVIRONMENT}

echo "Déploiement terminé pour l'environnement ${ENVIRONMENT}."
