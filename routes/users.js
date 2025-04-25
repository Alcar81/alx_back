const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticateJWT } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// 🔒 Exclure le mot de passe des réponses
const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ✅ GET tous les utilisateurs avec leurs rôles
router.get("/admin/users", authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: { role: true },
        },
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

// ✅ PATCH utilisateur avec réattribution de rôles
router.patch("/admin/users/:id", authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, lastName, email, roles } = req.body;

    if (!Array.isArray(roles)) {
      return res.status(400).json({ message: "Le champ 'roles' doit être un tableau." });
    }

    // 🔄 Mise à jour des informations principales
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email },
    });

    // 🔁 Suppression des anciens rôles
    await prisma.userRole.deleteMany({ where: { userId } });

    // ➕ Attribution des nouveaux rôles
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
      include: {
        roles: { include: { role: true } },
      },
    });

    const userResponse = {
      ...excludePassword(refreshedUser),
      roles: refreshedUser.roles.map((ur) => ur.role.name),
    };

    res.json(userResponse);
  } catch (error) {
    console.error("❌ Erreur PATCH /admin/users/:id :", error);
    res.status(500).json({ message: "Erreur lors de la mise à jour.", details: error.message });
  }
});

// ✅ DELETE utilisateur
router.delete("/admin/users/:id", authenticateJWT, async (req, res) => {
  try {
    await prisma.userRole.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la suppression.", details: error.message });
  }
});

module.exports = router;
