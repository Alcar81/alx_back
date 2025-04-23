// 📁 scripts/dev-only/setAdmin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const [,, emailInput = "", roleInput = "ADMIN"] = process.argv;
const email = emailInput.toLowerCase();
const role = roleInput.toUpperCase();

if (!email || !role) {
  console.error("❌ Usage : node setAdmin.js <email> <role>");
  process.exit(1);
}

(async () => {
  try {
    // 🔍 Vérifie ou crée le rôle dans la table Role
    let roleRecord = await prisma.role.findUnique({ where: { name: role } });

    if (!roleRecord) {
      roleRecord = await prisma.role.create({
        data: {
          name: role,
        },
      });
      console.log(`🆕 Rôle '${role}' créé.`);
    }

    // 🔍 Vérifie si l'utilisateur existe
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const defaultPassword = "Fake1234!";
      const hashed = await bcrypt.hash(defaultPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName: "Test",
          lastName: "Admin",
        },
      });
      console.log(`🆕 Utilisateur ${email} créé avec le mot de passe : ${defaultPassword}`);
    }

    // 🔍 Vérifie si l'association user-role existe déjà
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    });

    if (existingUserRole) {
      console.log(`ℹ️ L'utilisateur ${email} a déjà le rôle '${role}'.`);
    } else {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });
      console.log(`✅ Rôle '${role}' attribué à ${email}`);
    }

    console.log("🎉 Opération terminée avec succès.");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
