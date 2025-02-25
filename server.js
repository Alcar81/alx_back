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

// Middleware pour injecter le nonce
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  console.log(`✅ Nonce généré : ${nonce}`); // Debug nonce
  next();
});

// ✅ Utiliser Helmet avec CSP bien configuré
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          `'nonce-${res.locals.nonce}'`, // Autorisation du nonce pour les scripts
          "'strict-dynamic'",
          "*.google.com",
          "*.googletagmanager.com",
          "*.google-analytics.com",
          "*.gstatic.com",
          "*.youtube.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // ✅ Nécessaire pour les styles MUI
          "https://fonts.googleapis.com", // ✅ Ajouté pour Material-UI
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com", // ✅ Nécessaire pour Material-UI
        ],
        imgSrc: ["'self'", "data:", "*.google-analytics.com"],
        connectSrc: ["'self'", API_URL],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Désactiver si nécessaire pour éviter les erreurs avec certaines ressources
  })
);

// ✅ Servir les fichiers statiques avec les bons types MIME
app.use(
  express.static(path.join(__dirname, "../frontend/build"), {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      const mimeTypes = {
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".html": "text/html",
      };

      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }

      // Désactiver la mise en cache
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    },
  })
);

// ✅ Endpoint pour servir index.html avec injection du nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../frontend/build/index.html");

  if (!fs.existsSync(indexPath)) {
    console.error("❌ Erreur : index.html introuvable après build !");
    return res.status(500).send("Erreur : Fichier index.html introuvable.");
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Erreur : Impossible de lire index.html :", err);
      return res.status(500).send("Erreur lors de la lecture du fichier HTML.");
    }

    // Injection dynamique du nonce
    const updatedHtml = data.replace(/__NONCE__/g, nonce);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// ✅ Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ API URL configurée : ${API_URL}`);
});
