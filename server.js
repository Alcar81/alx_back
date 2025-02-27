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

// ✅ Middleware pour injecter le nonce et éviter les conflits
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  res.setHeader("X-Nonce", nonce); // ✅ Aide au debugging
  next();
});

// ✅ Utiliser Helmet avec une CSP qui autorise bien les styles et scripts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        frameSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`, // ✅ Génération dynamique
          "'strict-dynamic'",
          "*.google.com",
          "*.googletagmanager.com",
          "*.google-analytics.com",
          "*.gstatic.com",
          "*.youtube.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // ✅ Nécessaire pour Material-UI
          "https://fonts.googleapis.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],
        imgSrc: ["'self'", "data:", "*.google-analytics.com"],
        connectSrc: ["'self'", API_URL],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ✅ Servir les fichiers statiques sans conflit avec Helmet
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

    // ✅ Injection dynamique du nonce
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
