// backend/routes/users.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// 🔒 Fonction pour exclure le mot de passe des réponses
const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ✅ GET - Récupérer tous les utilisateurs
router.get("/users", authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
      },
    });

    const usersWithRoles = users.map((u) => ({
      ...excludePassword(u),
      roles: u.roles.map((ur) => ur.role.name),
    }));

    res.json(usersWithRoles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs." });
  }
});

// ✅ PATCH - Modifier un utilisateur + ses rôles
router.patch("/users/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: "Le champ 'roles' doit être un tableau." });
    }

    // 🔄 Mise à jour des informations
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email },
    });

    // 🔁 Mise à jour des rôles
    await prisma.userRole.deleteMany({ where: { userId } });

    for (const roleName of roles) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (role) {
        await prisma.userRole.create({
          data: { userId, roleId: role.id },
        });
      } else {
        console.warn(`⚠️ Rôle non trouvé : ${roleName}`);
      }
    }

    // 🧹 Rechargement des rôles après mise à jour
    const refreshedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } },
    });

    const userResponse = {
      ...excludePassword(refreshedUser),
      roles: refreshedUser.roles.map((ur) => ur.role.name),
    };

    res.json(userResponse);
  } catch (error) {
    console.error("❌ Erreur PATCH /users/:id :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour.", details: error.message });
  }
});

// ✅ PATCH - Modifier son mot de passe
router.patch("/users/:id/password", authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Ancien et nouveau mot de passe requis." });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // 🔒 Vérification du mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe actuel incorrect." });
    }

    // 🔐 Hashage du nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Mot de passe changé avec succès." });
  } catch (error) {
    console.error("❌ Erreur PATCH /users/:id/password :", error);
    res.status(500).json({ message: "Erreur lors du changement de mot de passe.", details: error.message });
  }
});

// ✅ DELETE - Supprimer un utilisateur
router.delete("/users/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;

    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression.", details: error.message });
  }
});

module.exports = router;
