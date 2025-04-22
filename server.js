// 📁 backend/server.js

process.env.TZ = 'America/Toronto';

import express from "express";
import helmet from "helmet";
import crypto from "crypto";
import path from "path";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";
import dotenv from "dotenv";
import logger from "./utils/logger.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
logger.info("🟢 [BOOT] Initialisation de server.js...");

const app = express();
app.set("trust proxy", 1);

// ✅ Middleware
app.use(express.json());
app.use(helmet());

// 📥 Logger middleware
app.use((req, res, next) => {
  logger.info(`📥 ${req.method} ${req.url} | IP: ${req.ip}`);
  if (["POST", "PUT"].includes(req.method)) {
    logger.info(`📦 Données reçues : ${JSON.stringify(req.body)}`);
  }
  next();
});

// 🔐 CSP Nonce
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// ✅ Routes API
logger.info("🔌 Chargement des routes /api...");
import authRoutes from "./routes/auth.js";
app.use("/api", authRoutes);

logger.info("🔌 Chargement des routes /api/admin...");
import adminRoutes from "./routes/admin.js";
app.use("/api/admin", adminRoutes);

// 📌 Route API inexistante
app.use("/api", (_, res) => {
  res.status(404).json({ message: "Route API non trouvée." });
});

// ✅ Endpoint de santé
app.get("/health", (_, res) => {
  res.status(200).send("OK");
});

// 📦 Fichiers statiques React
logger.info("📦 Préparation des fichiers statiques...");
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
      if (mimeTypes[ext]) res.setHeader("Content-Type", mimeTypes[ext]);
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

// 🧪 TEMP : désactivation temporaire du fallback React (à réactiver plus tard)
// app.get("*", (req, res, next) => {
//   const nonce = res.locals.nonce;
//   const indexPath = path.join(__dirname, "../public_html/build/index.html");

//   if (!fs.existsSync(indexPath)) {
//     logger.info("❌ index.html introuvable !");
//     return res.status(500).send("Erreur : Fichier index.html manquant.");
//   }

//   fs.readFile(indexPath, "utf8", (err, data) => {
//     if (err) {
//       logger.error("❌ Erreur de lecture index.html : " + err.message);
//       return next(err); // NE BLOQUE PLUS TOUT
//     }
//     const updatedHtml = data.replace(/__NONCE__/g, nonce);
//     res.setHeader("Content-Type", "text/html");
//     res.send(updatedHtml);
//   });
// });

// 🔁 Gestion des erreurs
import errorHandler from "./middleware/errorHandler.js";
app.use(errorHandler);

// 🚀 Lancement sécurisé
const PORT = parseInt(process.env.SERVER_PORT || "7001", 10);
const API_URL = process.env.REACT_APP_API_URL || "http://localhost/api";
const prisma = new PrismaClient();

const startServer = async () => {
  try {
    logger.info("🕸 Connexion à la base de données...");
    await prisma.$connect();
    logger.info("🗃️ Connexion à la base de données : ✅ SUCCÈS");

    app.listen(PORT, async () => {
      logger.info(`✅ app.listen lancé sur le port ${PORT}`);

      const launchTime = new Date().toLocaleString("fr-CA", {
        timeZone: "America/Toronto",
      });

      logger.info("🚀===============================");
      logger.info(`🕒 Démarrage à : ${launchTime}`);
      logger.info("📌 SERVER_PORT = " + process.env.SERVER_PORT);
      logger.info(`🌐 API = ${API_URL}`);
      logger.info("🛡️  Helmet actif");

      if (API_URL.startsWith("http")) {
        try {
          const res = await fetch(API_URL, { method: "HEAD" });
          logger.info(`🌍 Frontend HEAD ➜ ${API_URL} : ${res.status}`);
        } catch (err) {
          logger.error(`🌍 Erreur de test HEAD vers frontend : ${err.message}`);
        }
      }

      logger.info("🧪 Serveur prêt à recevoir des requêtes !");
      logger.info("🚀===============================");
    });
  } catch (err) {
    logger.error("❌ Erreur fatale serveur : " + err.message);
    process.exit(1);
  }
};

startServer();
