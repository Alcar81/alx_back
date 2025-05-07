// 📁 backend/utils/logger.js
const winston = require("winston");
const path = require("path");
const fs = require("fs");

process.env.TZ = "America/Toronto";

// Détecter le nom du fichier de log selon l'environnement
const env = process.env.ENV === "prod" ? "prod" : "dev";
const logFileName = `server-${env}.log`;

const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const timezoned = () =>
  new Date().toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
    hour12: false,
  });

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: timezoned }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(logDir, logFileName),
      handleExceptions: true,
    }),
  ],
});

module.exports = logger;
