// 📁 backend/server.js

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);

// Middleware de logs
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} | IP: ${req.ip}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("📦 Données reçues :", req.body);
  }
  next();
});

app.use(express.json());
app.use(helmet());

// Génération d’un nonce pour le CSP inline
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Routes API
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// Fichiers statiques
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

// Servir index.html avec injection de nonce
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

// Gestion globale des erreurs
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ================================
// 🚀 Lancement du serveur
// ================================
const rawPort = process.env.SERVER_PORT;
const PORT = parseInt(rawPort, 10);
if (!PORT) {
  console.error("❌ PORT invalide ou manquant dans .env (SERVER_PORT)");
  process.exit(1);
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost/api";
const prisma = new PrismaClient();

app.listen(PORT, async () => {
  const launchTime = new Date().toLocaleString("fr-CA");

  console.log("🚀===============================");
  console.log(`🕒 Démarrage à : ${launchTime}`);
  console.log(`✅ Serveur backend lancé sur le port ${PORT}`);
  console.log("📌 process.env.SERVER_PORT =", rawPort);
  console.log(`🌐 API accessible à : ${API_URL}`);
  console.log("🛡️  Middleware de sécurité actif (Helmet + Nonce)");

  // 🔍 Affichage des variables d'environnement clés
  console.log("🚀===============================");
  console.log("📦 Variables d'environnement :");
  console.log("🔧 NODE_ENV =", process.env.NODE_ENV);
  console.log("🔧 APP_ENV  =", process.env.APP_ENV);
  console.log("🛠️  APP_NAME =", process.env.APP_NAME);
  console.log("📡 PORT =", process.env.PORT);
  console.log("📡 SERVER_PORT =", process.env.SERVER_PORT);
  console.log("🗃️ DATABASE_URL =", process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@'));
  console.log("🌐 REACT_APP_API_URL =", process.env.REACT_APP_API_URL);
  console.log("🧪 LOG_LEVEL =", process.env.LOG_LEVEL || "default");
  console.log("🧩 ENABLE_CACHE =", process.env.ENABLE_CACHE || "false");
  console.log("🛡️ JWT_SECRET présent :", !!process.env.JWT_SECRET ? "✅" : "❌ manquant");

  // 🔌 Test de connexion à la base de données
  try {
    await prisma.$connect();
    console.log("🗃️ Connexion à la base de données : ✅ SUCCÈS");
  } catch (error) {
    console.error("🗃️ Connexion à la base de données : ❌ ÉCHEC");
    console.error(error);
    process.exit(1); // 💣 Ajout de l'arrêt du serveur en cas d'échec
  }

  // 🌐 Test de ping vers le frontend (si API URL définie)
  if (API_URL && API_URL.startsWith("http")) {
    try {
      const res = await fetch(API_URL, { method: "HEAD" });
      if (res.ok) {
        console.log(`🌍 Frontend réactif à ${API_URL} : ✅ ${res.status}`);
      } else {
        console.warn(`🌍 Frontend à ${API_URL} : ⚠️ Code ${res.status}`);
      }
    } catch (err) {
      console.warn(`🌍 Impossible d’atteindre le frontend (${API_URL})`);
    }
  }

  console.log("🧪 Logs de requêtes activés");
  console.log("🚀===============================");
});
