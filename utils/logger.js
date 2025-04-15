// 📁 backend/utils/logger.js
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// 🔧 S'assurer que le dossier logs existe
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // ✅ Affichage terminal
    new winston.transports.File({     // ✅ Écriture dans logs/server.log
      filename: path.join(logDir, "server.log"),
      handleExceptions: true,
    }),
  ],
});

module.exports = logger;