// 📁 backend/server.js

process.env.TZ = 'America/Toronto';

const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const logger = require("./utils/logger");
const requestLogger = require("./utils/requestLogger");

logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
logger.info("🟢 [BOOT] Initialisation de server.js...");

const app = express();
app.set("trust proxy", 1);

// 📌 Middleware général
app.use(express.json());
app.use(helmet());

// 📌 Middleware de logs API
app.use(requestLogger);

// 📌 CSP - Nonce pour chaque réponse
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// 📌 Chargement des routes API
logger.info("📌 Chargement des routes API...");

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

// 📌 Gestion des routes API inexistantes
app.use("/api", (req, res) => {
  logger.warn(`❌ [API 404] Route introuvable ➔ ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: "Route API non trouvée." });
});

// 📦 Gestion des fichiers statiques (Frontend)
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

// 📌 Endpoint de santé
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// 🌐 Fallback pour React (Single Page App)
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  if (!fs.existsSync(indexPath)) {
    logger.error("❌ index.html introuvable !");
    return res.status(500).send("Erreur : Fichier index.html manquant.");
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      logger.error("❌ Erreur lecture index.html : " + err.message);
      return res.status(500).send("Erreur lecture HTML.");
    }
    const updatedHtml = data.replace(/__NONCE__/g, nonce);
    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// 🔥 Gestion des erreurs serveur
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// 🚀 Démarrage du serveur
const rawPort = process.env.SERVER_PORT;
const PORT = parseInt(rawPort, 10);
const prisma = new PrismaClient();

const startServer = async () => {
  try {
    logger.info("🕸 Connexion à la base de données...");
    await prisma.$connect();
    logger.info("🗃️ Connexion à la base de données : ✅");

    app.listen(PORT, async () => {
      logger.info(`🚀 Serveur backend lancé sur le port ${PORT}`);
      logger.info(`🌐 API disponible à : ${process.env.REACT_APP_API_URL || "http://localhost/api"}`);
      
      if (process.env.REACT_APP_API_URL?.startsWith("http")) {
        try {
          logger.info(`🌐 Test HEAD vers ${process.env.REACT_APP_API_URL}...`);
          const res = await fetch(process.env.REACT_APP_API_URL, { method: "HEAD" });
          logger.info(`🌍 Frontend répond : ${res.ok ? `✅ ${res.status}` : `⚠️ ${res.status}`}`);
        } catch (err) {
          logger.error("❌ Erreur de connexion au frontend : " + err.message);
        }
      }
    });

  } catch (error) {
    logger.error("❌ Impossible de connecter Prisma : " + error.message);
    process.exit(1);
  }
};

startServer().catch((err) => {
  logger.error("❌ Erreur fatale au lancement : " + err.message);
  process.exit(1);
});
