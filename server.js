const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const fetch = require("node-fetch");

// Chargement du fichier .env
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.set("trust proxy", 1);

// 📂 Création du répertoire des logs s'il n'existe pas
const logDir = path.join(__dirname, "logs");
const logFile = path.join(logDir, "server.log");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// 📝 Fonction pour logger dans console + fichier
function log(message, type = "INFO") {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${type}] ${message}\n`;
  console.log(line.trim());
  fs.appendFileSync(logFile, line);
}

// Middleware de log des requêtes
app.use((req, res, next) => {
  log(`📥 ${req.method} ${req.url} | IP: ${req.ip}`);
  if (req.method === "POST" || req.method === "PUT") {
    log(`📦 Données reçues : ${JSON.stringify(req.body)}`);
  }
  next();
});

app.use(express.json());
app.use(helmet());

// 🔐 Génération d’un nonce pour CSP inline
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Routes API
const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

// Fichiers statiques frontend
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

// Injection nonce dans index.html
app.get("*", (req, res) => {
  const nonce = res.locals.nonce;
  const indexPath = path.join(__dirname, "../public_html/build/index.html");

  if (!fs.existsSync(indexPath)) {
    const errMsg = "❌ index.html introuvable !";
    log(errMsg, "ERROR");
    return res.status(500).send("Erreur : Fichier index.html manquant.");
  }

  fs.readFile(indexPath, "utf8", (err, data) => {
    if (err) {
      log(`❌ Erreur de lecture index.html : ${err}`, "ERROR");
      return res.status(500).send("Erreur lecture HTML.");
    }

    const updatedHtml = data.replace(/__NONCE__/g, nonce);
    res.setHeader("Content-Type", "text/html");
    res.send(updatedHtml);
  });
});

// Middleware global des erreurs
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

// ============================
// 🚀 Lancement du serveur
// ============================
const rawPort = process.env.SERVER_PORT;
const PORT = parseInt(rawPort, 10);
const API_URL = process.env.REACT_APP_API_URL || "http://localhost/api";
const prisma = new PrismaClient();

app.listen(PORT, async () => {
  const launchTime = new Date().toLocaleString("fr-CA");

  log("🚀===============================");
  log(`🕒 Démarrage à : ${launchTime}`);
  log(`✅ Serveur backend lancé sur le port ${PORT}`);
  log(`📌 process.env.SERVER_PORT = ${rawPort}`);
  log(`🌐 API accessible à : ${API_URL}`);
  log("🛡️  Middleware de sécurité actif (Helmet + Nonce)");
  log("📦 Variables d'environnement :");
  log(`🔧 NODE_ENV = ${process.env.NODE_ENV}`);
  log(`🔧 APP_ENV = ${process.env.APP_ENV}`);
  log(`🛠️  APP_NAME = ${process.env.APP_NAME}`);
  log(`📡 PORT = ${process.env.PORT}`);
  log(`📡 SERVER_PORT = ${process.env.SERVER_PORT}`);
  log(`🗃️ DATABASE_URL = ${process.env.DATABASE_URL?.replace(/\/\/.*:.*@/, '//***:***@')}`);
  log(`🌐 REACT_APP_API_URL = ${process.env.REACT_APP_API_URL}`);
  log(`🧪 LOG_LEVEL = ${process.env.LOG_LEVEL || "default"}`);
  log(`🧩 ENABLE_CACHE = ${process.env.ENABLE_CACHE || "false"}`);
  log(`🛡️ JWT_SECRET présent : ${!!process.env.JWT_SECRET ? "✅" : "❌ manquant"}`);

  // 🔌 Test de connexion à la base de données
  try {
    await prisma.$connect();
    log("🗃️ Connexion à la base de données : ✅ SUCCÈS");
  } catch (error) {
    log("🗃️ Connexion à la base de données : ❌ ÉCHEC", "ERROR");
    log(error.message || error, "ERROR");
    process.exit(1);
  }

  // 🌐 Test de connectivité au frontend
  if (API_URL.startsWith("http")) {
    try {
      const res = await fetch(API_URL, { method: "HEAD" });
      if (res.ok) {
        log(`🌍 Frontend réactif à ${API_URL} : ✅ ${res.status}`);
      } else {
        log(`🌍 Frontend à ${API_URL} : ⚠️ Code ${res.status}`, "WARNING");
      }
    } catch (err) {
      log(`🌍 Impossible d’atteindre le frontend (${API_URL})`, "WARNING");
    }
  }

  log("🧪 Logs de requêtes activés");
  log("🚀===============================");
});
