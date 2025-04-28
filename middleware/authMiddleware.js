// 📁 src/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Middleware pour vérifier si l'utilisateur est connecté
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    logger.warn(`[AUTH] 🚫 Accès sans token vers ${req.originalUrl}`);
    return res.status(401).json({ message: "Non autorisé. Token manquant." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Optionnel : charger plus d'infos utilisateur si nécessaire
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { roles: true }, // si tu utilises une table rôles
    });

    if (!user) {
      logger.warn(`[AUTH] 🚫 Token invalide - Utilisateur non trouvé pour ${req.originalUrl}`);
      return res.status(401).json({ message: "Non autorisé. Utilisateur introuvable." });
    }

    req.user = user; // Injection de l'utilisateur dans req pour les routes suivantes
    logger.info(`[AUTH] ✅ Accès autorisé : ${user.email} vers ${req.originalUrl}`);
    next();
  } catch (error) {
    logger.warn(`[AUTH] 🚫 Token invalide vers ${req.originalUrl}`);
    return res.status(403).json({ message: "Accès interdit. Token invalide." });
  }
};

// Middleware pour vérifier le rôle d'un utilisateur
const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      logger.warn(`[AUTH] 🚫 Tentative d'accès sans utilisateur chargé`);
      return res.status(401).json({ message: "Non autorisé." });
    }

    const userRoles = req.user.roles.map(role => role.name || role); // Adapter selon ta structure

    const hasRole = allowedRoles.length === 0 || allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      logger.warn(`[AUTH] 🚫 Accès interdit pour ${req.user.email} vers ${req.originalUrl}`);
      return res.status(403).json({ message: "Accès interdit." });
    }

    logger.info(`[AUTH] ✅ Rôle autorisé pour ${req.user.email} sur ${req.originalUrl}`);
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles,
};
