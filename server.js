// 📁 backend/server.js

process.env.TZ = 'America/Toronto'; // ✅ Heure locale pour tous les logs

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");


require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const logger = require("./utils/logger");

logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
logger.info("🟢 [BOOT] Initialisation de server.js...");

const app = express();
app.set("trust proxy", 1);



// ✅ Lire le JSON avant les middlewares personnalisés
app.use(express.json());

// === 📥 Logs des requêtes entrantes
app.use((req, res, next) => {
  logger.info(`📥 ${req.method} ${req.url} | IP: ${req.ip}`);
  if (req.method === "POST" || req.method === "PUT") {
    logger.info(`📦 Données reçues : ${JSON.stringify(req.body)}`);
  }
  next();
});

app.use(helmet());

// 🔐 Nonce pour CSP inline
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// ✅ Routes API
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// 📦 Fichiers statiques frontend
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

// ✅ Endpoint /health pour tests de disponibilité
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 🌐 Fallback React avec injection du nonce
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  if (!fs.existsSync(indexPath)) {
    logger.info("❌ index.html introuvable !");
    return res.status(500).send("Erreur : Fichier index.html manquant.");
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      logger.info("❌ Erreur de lecture index.html : " + err.message);
      return res.status(500).send("Erreur lecture HTML.");
    }

    const updatedHtml = data.replace(/__NONCE__/g, nonce);
    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// 📌 Middleware 404 (à placer après tous les app.use(...) et routes définies)
app.use((req, res, next) => {
  res.status(404).json({ message: "Route non trouvée." });
});

// 🔁 Gestion des erreurs
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// 🚀 Démarrage du serveur
const rawPort = process.env.SERVER_PORT;
const PORT = parseInt(rawPort, 10);
if (!PORT) {
  logger.info("❌ PORT invalide ou manquant dans .env (SERVER_PORT)");
  process.exit(1);
}

const API_URL = process.env.REACT_APP_API_URL || "http://localhost/api";
const prisma = new PrismaClient();

app.listen(PORT, async () => {
  const launchTime = new Date().toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
  });

  logger.info("🚀===============================");
  logger.info(`🕒 Démarrage à : ${launchTime}`);
  logger.info(`✅ Serveur backend lancé sur le port ${PORT}`);
  logger.info("📌 process.env.SERVER_PORT = " + rawPort);
  logger.info(`🌐 API accessible à : ${API_URL}`);
  logger.info("🛡️  Middleware de sécurité actif (Helmet + Nonce)");

  // Variables d’environnement
  logger.info("📦 Variables d'environnement :");
  logger.info("🔧 NODE_ENV = " + process.env.NODE_ENV);
  logger.info("🔧 APP_ENV  = " + process.env.APP_ENV);
  logger.info("🛠️  APP_NAME = " + process.env.APP_NAME);
  logger.info("📡 PORT = " + process.env.PORT);
  logger.info("📡 SERVER_PORT = " + process.env.SERVER_PORT);
  logger.info(
    "🗃️ DATABASE_URL = " +
      (process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, "//***:***@") || "")
  );
  logger.info("🌐 REACT_APP_API_URL = " + process.env.REACT_APP_API_URL);
  logger.info("🧪 LOG_LEVEL = " + (process.env.LOG_LEVEL || "default"));
  logger.info("🧩 ENABLE_CACHE = " + (process.env.ENABLE_CACHE || "false"));
  logger.info("🛡️ JWT_SECRET présent : " + (process.env.JWT_SECRET ? "✅" : "❌ manquant"));

  // Test de connexion DB
  try {
    await prisma.$connect();
    logger.info("🗃️ Connexion à la base de données : ✅ SUCCÈS");
  } catch (error) {
    logger.info("🗃️ Connexion à la base de données : ❌ ÉCHEC");
    logger.info("🛑 Détail : " + error.message);
  }

  // Ping frontend
  if (API_URL.startsWith("http")) {
    try {
      const res = await fetch(API_URL, { method: "HEAD" });
      logger.info(
        `🌍 Frontend à ${API_URL} : ${
          res.ok ? `✅ ${res.status}` : `⚠️ ${res.status}`
        }`
      );
    } catch (err) {
      logger.info(`🌍 Frontend à ${API_URL} : ❌ Erreur de connexion`);
      logger.info("🛑 Détail : " + err.message);
    }
  }

  logger.info("🧪 Logs de requêtes activés");
  logger.info("🚀===============================");
});
