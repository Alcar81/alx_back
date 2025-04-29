// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 🔒 Middleware d'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      logger.warn(`[AUTH] 🚫 Accès sans token vers ${req.originalUrl}`);
      return res.status(401).json({ message: "Non autorisé. Token manquant." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (process.env.NODE_ENV === "dev") {
      req.user = decoded;
      logger.info(`[AUTH] ✅ [DEV] Accès autorisé (token brut) vers ${req.originalUrl}`);
      return next();
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: true },
    });

    if (!user) {
      logger.warn(`[AUTH] 🚫 Token invalide - Utilisateur non trouvé pour ${req.originalUrl}`);
      return res.status(401).json({ message: "Non autorisé. Utilisateur introuvable." });
    }

    req.user = user;
    logger.info(`[AUTH] ✅ Accès autorisé : ${user.email} vers ${req.originalUrl}`);
    next();
  } catch (error) {
    logger.warn(`[AUTH] 🚫 Token invalide vers ${req.originalUrl} : ${error.message}`);
    return res.status(403).json({ message: "Accès interdit. Token invalide." });
  } finally {
    // 🛠️ Libère la connexion Prisma proprement après CHAQUE requête
    await prisma.$disconnect().catch((err) => {
      logger.warn(`[PRISMA] ⚠️ Erreur lors de la déconnexion Prisma : ${err.message}`);
    });
  }
};

// 🔒 Middleware d'autorisation
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`[AUTH] 🚫 Tentative d'accès sans utilisateur chargé`);
      return res.status(401).json({ message: "Non autorisé." });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles.map(role => role.name || role)
      : [];

    if (process.env.NODE_ENV === "dev") {
      const hasDevRole = allowedRoles.some(role => userRoles.includes(role));
      if (hasDevRole) {
        logger.info(`[AUTH] ✅ [DEV] Rôle autorisé (token brut) pour ${req.user.email || "anonyme"} sur ${req.originalUrl}`);
        return next();
      }
    }

    const hasProdRole = allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role));

    if (!hasProdRole) {
      logger.warn(`[AUTH] 🚫 Accès interdit pour ${req.user.email || "anonyme"} vers ${req.originalUrl}`);
      return res.status(403).json({ message: "Accès interdit." });
    }

    logger.info(`[AUTH] ✅ Rôle autorisé pour ${req.user.email || "anonyme"} sur ${req.originalUrl}`);
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
