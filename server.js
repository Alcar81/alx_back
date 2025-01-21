const express = require("express");
const cors = require("cors");
const crypto = require("crypto"); // Utilisé pour générer un nonce
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.BACKEND_PORT || 7000;

// Middleware pour générer un nonce et configurer la CSP
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;

  res.setHeader(
    "Content-Security-Policy",
    `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'unsafe-inline';
      style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
      img-src 'self' data:;
      connect-src 'self';
      object-src 'none';
      frame-ancestors 'none';
      base-uri 'self';
    `.trim()
  );

  next();
});

// Middleware pour servir les fichiers statiques
app.use(
  express.static(path.join(__dirname, "../public_html/build"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (filePath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
  })
);

// Endpoint pour servir le fichier HTML avec injection de nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("Erreur lors de la lecture du fichier HTML :", err);
      res.status(500).send("Erreur lors de la lecture du fichier HTML.");
      return;
    }

    // Remplace les placeholders __NONCE_PLACEHOLDER__ par le nonce généré
    const updatedHtml = data.replace(/__NONCE_PLACEHOLDER__/g, nonce);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// Activation de CORS si nécessaire (en développement ou configuration spécifique)
if (process.env.NODE_ENV === "development") {
  app.use(cors());
  console.log("CORS activé pour le développement.");
}

// Lancer le serveur
app.listen(PORT, () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
});
