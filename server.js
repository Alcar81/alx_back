// /home/alxmultimedia.com/backend/server.js

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Construire dynamiquement DATABASE_URL
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgresql';
const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT;
const DB_NAME = process.env.DB_NAME;

// Configurer DATABASE_URL pour Prisma
process.env.DATABASE_URL = `${DATABASE_TYPE}://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

const prisma = new PrismaClient();

// Middleware
const corsOptions = {
  origin: [
    'https://alxmultimedia.com'  // Spécifique pour la production
  ],
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type']
};
app.use(cors(corsOptions));
app.use(express.json());  // Remplace bodyParser.json()

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

// Lancer le serveur HTTP
app.listen(PORT, () => {
  console.log(`Le serveur de production fonctionne sur le port ${PORT}`);
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
