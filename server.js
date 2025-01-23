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
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, "'unsafe-inline'"],
        styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", API_URL],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Ajustez selon vos besoins
  })
);

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

    // Remplacement des placeholders __NONCE__ par le nonce généré
    const updatedHtml = data.replace(/__NONCE__/g, nonce);

    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
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
