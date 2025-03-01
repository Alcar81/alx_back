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

// ✅ Middleware pour injecter le nonce
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  res.setHeader("X-Nonce", nonce);
  next();
});

// ✅ Helmet avec une CSP alignée avec vhost.conf
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.nonce}'`,
          "'strict-dynamic'",
          "*.google.com",
          "*.googletagmanager.com",
          "*.google-analytics.com",
          "*.gstatic.com",
          "*.youtube.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
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

// ✅ Endpoint pour servir `index.html`
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");
  const manifestPath = path.join(__dirname, "../public_html/build/asset-manifest.json");

  if (!fs.existsSync(indexPath)) {
    console.error("❌ Erreur : index.html introuvable après build !");
    return res.status(500).send("Erreur : Fichier index.html introuvable.");
  }

  if (!fs.existsSync(manifestPath)) {
    console.error("❌ Erreur : asset-manifest.json introuvable !");
    return res.status(500).send("Erreur : Manifest introuvable.");
  }

  // Lire le manifest pour récupérer les bons fichiers
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  // Vérification des fichiers hashés
  const hashedCSS = manifest.files["main.css"] || "/static/css/main.css";
  const hashedJS = manifest.files["main.js"] || "/static/js/main.js";

  // Remplacement dynamique dans index.html
  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Erreur : Impossible de lire index.html :", err);
      return res.status(500).send("Erreur lors de la lecture du fichier HTML.");
    }

    let updatedHtml = data
      .replace(/__NONCE__/g, nonce)
      .replace("/static/css/main.css", hashedCSS)
      .replace("/static/js/main.js", hashedJS);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// ✅ Lancer le serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
  console.log(`✅ API URL configurée : ${API_URL}`);
});
