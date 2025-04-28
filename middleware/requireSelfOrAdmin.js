// 📁 backend/middleware/requireSelfOrAdmin.js

const logger = require("../utils/logger");

/**
 * Middleware qui permet :
 * - Si l'utilisateur est l'auteur de la ressource (`req.params.id === req.user.id`)
 * - OU si l'utilisateur a le rôle ADMIN
 * Sinon ➔ 403 Forbidden
 */
const requireSelfOrAdmin = (req, res, next) => {
  const user = req.user;
  const targetId = req.params.id; // par exemple /users/:id

  if (!user) {
    logger.warn(`[AUTH] 🚫 Requête sans utilisateur identifié vers ${req.originalUrl}`);
    return res.status(401).json({ message: "Non autorisé. Utilisateur manquant." });
  }

  const isSelf = user.id === targetId;
  const isAdmin = user.roles.includes("ADMIN"); // Ajuste selon ton modèle de roles

  if (isSelf || isAdmin) {
    logger.info(`[AUTH] ✅ Accès autorisé pour ${user.email} sur ${req.originalUrl}`);
    return next();
  }

  logger.warn(`[AUTH] 🚫 Accès refusé pour ${user.email} vers ${req.originalUrl}`);
  return res.status(403).json({ message: "Accès interdit." });
};

module.exports = { requireSelfOrAdmin };
