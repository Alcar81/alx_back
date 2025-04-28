// 📁 backend/routes/admin.js

const express = require("express");
const router = express.Router();

const { authenticateToken, authorizeRoles } = require("../middleware/authMiddleware");

// 🔒 Toutes les routes admin nécessitent d'être connecté et d'avoir le rôle ADMIN
router.use(authenticateToken);
router.use(authorizeRoles(["ADMIN"]));

// ✅ Exemple de route protégée (seulement pour ADMIN)
router.get("/", (req, res) => {
  res.json({ message: "Bienvenue dans l'administration 👑", user: req.user });
});

// ✅ Exemple de route publique dans /admin, sans protection
router.get("/public", (req, res) => {
  res.json({ message: "Section publique de l'administration." });
});

module.exports = router;
