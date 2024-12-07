// backend/server.js
const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { PrismaClient } = require('@prisma/client');
const config = require('./config/config'); // Importer la configuration centralisée

// Charger les variables d'environnement
require('dotenv').config();
const app = express();
const PORT = config.port;

// Initialisation de Prisma avec la configuration centralisée
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

// Middleware
app.use(cors(config.cors.options)); // Utilisation de la configuration CORS centralisée
app.use(express.json());

// Endpoint de santé
app.get('/health', async (req, res) => {
  try {
    // Vérifier la connexion à la base de données
    await prisma.$queryRaw`SELECT 1`; // Simple requête pour valider la connexion
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

// Tester la connexion avec Prisma
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Connexion à la base de données réussie avec Prisma.');
  } catch (error) {
    console.error('Impossible de se connecter à la base de données :', error);
  } finally {
    await prisma.$disconnect(); // Se déconnecter après le test
  }
}

testDatabaseConnection();
