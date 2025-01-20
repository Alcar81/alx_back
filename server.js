// backend/server.js

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto"); // Utilisé pour générer un nonce
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");

// Charger les variables d'environnement
require("dotenv").config();

const app = express();
const PORT = process.env.BACKEND_PORT || 7000;

// Initialisation de Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middleware pour générer un nonce et configurer la CSP
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64"); // Génère un nonce unique
  res.locals.nonce = nonce; // Stocke le nonce pour utilisation côté frontend

  // Configuration complète de l'en-tête CSP
  res.setHeader(
    "Content-Security-Policy",
    `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'unsafe-eval';
      style-src 'self' 'nonce-${nonce}';
      img-src 'self' data:;
      connect-src 'self';
      object-src 'none';
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, " ").trim() // Nettoie les espaces pour compresser l'en-tête
  );

  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint de santé
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Vérification rapide de la base de données
    res.status(200).send("OK");
  } catch (error) {
    console.error("Erreur de santé :", error);
    res.status(500).send("Erreur interne");
  }
});

// Routes principales
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Lancer le serveur HTTP
app.listen(PORT, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${PORT}`);
});
