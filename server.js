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
//console.log(process.env.DATABASE_URL) = `${DATABASE_TYPE}://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

console.log(process.env.DATABASE_URL) = 'postgresql://usr_db_dev:dw33kMyiQvNL62p3aCjd@postgres_dev:5433/postgres_dev';


const prisma = new PrismaClient();

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'prod'
    ? ['https://alxmultimedia.com']  // Production
    : ['https://dev.alxmultimedia.com', 'http://localhost:3000'],  // Développement
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

console.log("DATABASE_URL: ", process.env.DATABASE_URL);

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
