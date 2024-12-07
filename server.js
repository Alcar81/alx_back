// backend/server.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { PrismaClient } = require('@prisma/client');

// Charger les variables d'environnement (injectées depuis GitHub)
require('dotenv').config();
const app = express();
const PORT = process.env.BACKEND_PORT || 7001; // Valeur par défaut si la variable n'existe pas

// Initialisation de Prisma avec la configuration centralisée
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL, // Utilisation directe de DATABASE_URL injectée
    },
  },
});

// Middleware
app.use(cors()); // Ajoutez une configuration ici si nécessaire
app.use(express.json());

// Endpoint de santé
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Vérification rapide de la connexion à la base de données
    res.status(200).send('OK');
  } catch (error) {
    console.error('Erreur de santé :', error);
    res.status(500).send('Erreur interne');
  }
});

// Routes principales
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Lancer le serveur HTTP
app.listen(PORT, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${PORT}`);
});
