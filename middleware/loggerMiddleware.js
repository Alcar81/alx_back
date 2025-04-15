// backend/middleware/loggerMiddleware.js

const logger = require("../utils/logger");
const chalk = require("chalk");

module.exports = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip;

    const baseMessage = `${method} ${url} | IP: ${ip} | Status: ${status} | Durée: ${duration}ms`;

    // Détermine le niveau de log
    const level =
      status >= 500 ? "error" :
      status >= 400 ? "warn" :
      "info";

    // Log dans Winston (fichier + console)
    logger[level](baseMessage);

    // Log console colorisé (chalk)
    let colored = "";

    if (status >= 500) {
      colored = chalk.redBright(baseMessage);
    } else if (status >= 400) {
      colored = chalk.yellowBright(baseMessage);
    } else {
      colored = chalk.green(baseMessage);
    }

    console.log(colored);

    // Log du body si POST ou PUT
    if (["POST", "PUT"].includes(method)) {
      const bodyStr = JSON.stringify(req.body);
      logger.info(`📦 Corps de la requête : ${bodyStr}`);
      console.log(chalk.gray(`📦 Corps : ${bodyStr}`));
    }
  });

  next();
};
