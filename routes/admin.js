// 📁 backend/routes/admin.js

const express = require("express");
const router = express.Router();

// Middleware d'authentification (optionnel)
const { authenticateJWT } = require("../middleware/auth");

// ✅ Exemple de route protégée (nécessite un token JWT valide)
router.get("/", authenticateJWT, (req, res) => {
  res.json({ message: "Bienvenue dans l'administration 👑", user: req.user });
});

// ✅ Exemple de route publique (sans authentification)
router.get("/public", (req, res) => {
  res.json({ message: "Section publique de l'administration." });
});

module.exports = router;
