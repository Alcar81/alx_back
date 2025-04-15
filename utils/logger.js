// 📁 backend/utils/logger.js
const winston = require("winston");
const path = require("path");
const fs = require("fs");

// 🔧 Forcer le fuseau horaire global
process.env.TZ = "America/Toronto";

// 🔧 S’assurer que le dossier logs existe
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.printf(({ level, message }) => {
      const timestamp = new Date().toLocaleString("fr-CA", {
        timeZone: "America/Toronto",
        hour12: false,
      });
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, "server.log"),
      handleExceptions: true,
    }),
  ],
});

module.exports = logger;
