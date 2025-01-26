const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const crypto = require("crypto"); // Utilisé pour générer un nonce
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Charger les variables depuis .env
const PORT = process.env.SERVER_PORT || 7000;
const API_URL = process.env.REACT_APP_API_URL || "https://dev.alxmultimedia.com/api";
const ENV = process.env.NODE_ENV || "development";

// Débogage : Affichage des variables d'environnement
console.log({
  SERVER_PORT: process.env.SERVER_PORT,
  API_URL: process.env.REACT_APP_API_URL,
  NODE_ENV: process.env.NODE_ENV,
});

// Middleware pour générer un nonce
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  next();
});

// Configurer Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`,
        ],
        styleSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`,
        ],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", API_URL],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Désactiver si nécessaire
  })
);

// Middleware pour servir les fichiers statiques avec cache
app.use(
  express.static(path.join(__dirname, "../public_html/build"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".html": "text/html",
      };

      // Définir le type MIME approprié
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }

      // Ajouter les en-têtes de cache
      if (ext === ".html") {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      } else {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  })
);

// Endpoint pour servir le fichier HTML avec injection de nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  // Vérification que le fichier existe
  fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error("Fichier index.html introuvable :", indexPath);
      res.status(404).send("Fichier index.html introuvable.");
      return;
    }

    // Lecture et injection du nonce
    fs.readFile(indexPath, "utf8", (readErr, data) => {
      if (readErr) {
        console.error("Erreur lors de la lecture du fichier index.html :", readErr);
        res.status(500).send("Erreur lors de la lecture du fichier index.html.");
        return;
      }

      // Remplacement des placeholders __NONCE__ par le nonce généré
      const updatedHtml = data.replace(/__NONCE__/g, nonce);

      res.setHeader("Content-Type", "text/html");
      res.send(updatedHtml);
    });
  });
});

// Activation de CORS si nécessaire (en développement ou configuration spécifique)
if (ENV === "development") {
  app.use(cors());
  console.log("CORS activé pour le développement.");
}

// Endpoint pour déboguer les variables d'environnement
app.get("/debug", (req, res) => {
  res.json({
    serverPort: PORT,
    apiUrl: API_URL,
    environment: ENV,
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
  console.log(`Environnement : ${ENV}`);
  console.log(`API URL : ${API_URL}`);
});