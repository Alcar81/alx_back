// /home/alxmultimedia.com/backend/server.js

const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.SERVER_PORT || 3000;
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
