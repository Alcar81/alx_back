
# Utiliser une image Node.js comme base
FROM node:18

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier le fichier package.json et package-lock.json dans le conteneur
COPY package*.json ./

# Installer les dépendances du backend
RUN npm install

# Installer Prisma et générer le client
RUN npm install prisma @prisma/client pg
COPY prisma ./prisma
RUN npx prisma generate

# Recompiler bcrypt pour l'environnement Docker
RUN npm rebuild bcrypt

# Copier tout le code source dans le répertoire de travail
COPY . .

# Exposer le port sur lequel le backend va écouter
EXPOSE 7000

# Lancer l'application (ici on utilise server.js directement)
CMD ["node", "server.js"]
