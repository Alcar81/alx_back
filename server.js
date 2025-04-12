// 📁 backend/server.js

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.set("trust proxy", 1); // 🔐 Docker + Reverse proxy

// 🧪 Middleware pour journaliser chaque requête entrante
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} | IP: ${req.ip}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("📦 Données reçues :", req.body);
  }
  next();
});

app.use(express.json());

// 🔐 Helmet (sans CSP ici car déjà défini dans OpenLiteSpeed)
app.use(helmet());

// 🔐 Génération d’un nonce pour tes composants frontend (React inline)
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// ✅ Routes API
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// 📦 Servir les fichiers statiques frontend
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

      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext]);
      }

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

// 🌐 Servir index.html avec injection de nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  if (!fs.existsSync(indexPath)) {
    console.error("❌ index.html introuvable !");
    return res.status(500).send("Erreur : Fichier index.html manquant.");
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ Erreur de lecture index.html :", err);
      return res.status(500).send("Erreur lecture HTML.");
    }

    const updatedHtml = data.replace(/__NONCE__/g, nonce);
    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// 🔁 Gestion des erreurs globales
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// 🚀 Démarrage du serveur
const PORT = process.env.SERVER_PORT || 7000;
const API_URL = process.env.REACT_APP_API_URL || "https://dev.alxmultimedia.com/api";

app.listen(PORT, () => {
  console.log("🚀===============================");
  console.log(`✅ Serveur backend lancé sur le port ${PORT}`);
  console.log(`🌐 API disponible à : ${API_URL}`);
  console.log("🛡️  Middleware de sécurité actif (Helmet + Nonce)");
  console.log("🧪 Logs de requêtes activés");
  console.log("🚀===============================");
});
