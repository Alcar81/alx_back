// 📁 backend/utils/requestLogger.js

const logger = require("./logger");

const requestLogger = (req, res, next) => {
  const baseUrl = req.baseUrl || req.path;

  if (baseUrl.startsWith("/api/users")) {
    logger.info(`🧑‍💻 [UserRoute] ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      logger.info(`📦 [User Payload] ➔ ${JSON.stringify(req.body)}`);
    }
  } else if (baseUrl.startsWith("/api/admin")) {
    logger.info(`🛡️ [AdminRoute] ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      logger.info(`📦 [Admin Payload] ➔ ${JSON.stringify(req.body)}`);
    }
  } else if (baseUrl.startsWith("/api")) {
    logger.info(`🌐 [ApiRoute] ${req.method} ${req.originalUrl} | IP: ${req.ip}`);
  }
  
  next();
};

module.exports = requestLogger;
