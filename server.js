// 📁 backend/server.js

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// ✅ Chargement fiable du fichier .env avec chemin explicite
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

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

// ✅ Middleware : Vérification JSON valide
app.use(express.json({
  strict: true,
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (err) {
      res.status(400).json({ message: "Requête JSON invalide" });
      throw new Error("Requête JSON mal formée");
    }
  }
}));

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

// ✅ Route de test santé API (utile pour Docker/monitoring)
app.get("/health", (req, res) => {
  res.status(200).send("🟢 API OK");
});

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
const rawPort = process.env.SERVER_PORT;
const PORT = parseInt(rawPort, 10);

if (!PORT) {
  console.error("❌ PORT invalide ou manquant dans .env (SERVER_PORT)");
  process.exit(1);
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost/api";

app.listen(PORT, () => {
  console.log("🚀===============================");
  console.log(`✅ Serveur backend lancé sur le port ${PORT}`);
  console.log("📌 process.env.SERVER_PORT =", rawPort);
  console.log("📌 PORT utilisé =", PORT);
  console.log(`🌐 API disponible à : ${API_URL}`);
  console.log("🛡️  Middleware de sécurité actif (Helmet + Nonce)");
  console.log("🧪 Logs de requêtes activés");
  console.log("🚀===============================");
});
