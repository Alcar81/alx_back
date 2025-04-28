// 📁 backend/routes/admin.js

const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// ✅ Toutes les routes sous /admin sont sécurisées
router.use(authenticateToken);
router.use(authorizeRoles(["ADMIN"]));

// ✅ Route principale (admin connecté)
router.get("/", (req, res) => {
  res.json({ message: "Bienvenue dans l'administration 👑", user: req.user });
});

// ✅ Même /admin/public nécessite un token et rôle ADMIN
router.get("/public", (req, res) => {
  res.json({ message: "Section publique de l'administration protégée." });
});

module.exports = router;
