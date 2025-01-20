//serveur.js
const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto"); // Utilisé pour générer un nonce
const fs = require("fs");
const path = require("path");
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
      img-src 'self' data: https:;
      connect-src 'self';
      object-src 'none';
      frame-ancestors 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, " ").trim() // Nettoie les espaces pour compresser l'en-tête
  );

  next();
});

// Middleware pour servir les fichiers statiques (CSS, JS, images) avec types MIME corrigés
app.use(
  express.static(path.join(__dirname, "../public_html/build"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
  })
);

// Middleware pour activer CORS et JSON parsing
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

// Injection dynamique du nonce dans le fichier HTML
app.get("*", (req, res) => {
  const nonce = res.locals.nonce; // Récupère le nonce généré
  const indexPath = path.join(__dirname, "../public_html/build/index.html"); // Chemin vers index.html

  // Vérifie si le fichier index.html existe
  if (!fs.existsSync(indexPath)) {
    console.error("Fichier index.html introuvable !");
    res.status(404).send("Fichier index.html introuvable !");
    return;
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lors de la lecture du fichier index.html :", err);
      res.status(500).send("Erreur interne");
      return;
    }

    // Remplace les placeholders pour le nonce
    const updatedHtml = data
      .replace(/<script /g, `<script nonce="${nonce}" `)
      .replace(/<link /g, `<link nonce="${nonce}" `);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// Routes principales
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Lancer le serveur HTTP
app.listen(PORT, () => {
  console.log(`Le serveur est en cours d'exécution sur le port ${PORT}`);
});
