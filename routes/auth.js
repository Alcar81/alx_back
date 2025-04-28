// 📁 backend/routes/auth.js

const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware"); // ✅ Import du bon middleware

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", authenticateToken, async (req, res) => {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles || [],
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur." });
  }
});

module.exports = router;

