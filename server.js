const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { PrismaClient } = require('@prisma/client');

// Charger les variables d'environnement
const app = express();
const PORT = process.env.SERVER_PORT || 3000;

// Construction dynamique de DATABASE_URL
const DATABASE_URL = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT_EXT}/${process.env.DB_NAME}`;

// Initialisation de Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'prod'
    ? ['https://alxmultimedia.com'] // Production
    : ['https://dev.alxmultimedia.com', 'http://localhost:3000'], // Développement
  credentials: true,
  allowedHeaders: ['Authorization', 'Content-Type'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
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
