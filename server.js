const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();

// Charger les variables d'environnement
const PORT = process.env.SERVER_PORT || 7000;
const API_URL = process.env.REACT_APP_API_URL || "https://dev.alxmultimedia.com/api";

// Middleware pour générer un nonce sécurisé
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), fullscreen=(), usb=()");
  next();
});

// Configurer Helmet avec CSP
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
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Servir les fichiers statiques
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

      // Ajout de l'en-tête de cache pour optimiser le chargement des fichiers statiques
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

// Endpoint pour servir index.html avec injection de nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lors de la lecture du fichier HTML :", err);
      res.status(500).send("Erreur lors de la lecture du fichier HTML.");
      return;
    }

    // Vérification que le nonce est bien remplacé
    const updatedHtml = data.replace(/__NONCE__/g, nonce);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ API URL configurée : ${API_URL}`);
});
