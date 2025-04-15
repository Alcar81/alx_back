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
    // ✅ Timestamp en fuseau horaire local (Toronto)
    winston.format.timestamp({
      format: () =>
        new Date().toLocaleString("fr-CA", {
          timeZone: "America/Toronto",
          hour12: false,
        }),
    }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // ✅ Affichage terminal
    new winston.transports.File({
      filename: path.join(logDir, "server.log"),
      handleExceptions: true,
    }),
  ],
});

module.exports = logger;
