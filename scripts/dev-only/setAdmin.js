// 📁 scripts/dev-only/setAdmin.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const [,, emailInput = "", roleInput = "ADMIN"] = process.argv;
const email = emailInput.toLowerCase();
const roleName = roleInput.toUpperCase();

if (!email || !roleName) {
  console.error("❌ Usage : node setAdmin.js <email> <role>");
  process.exit(1);
}

(async () => {
  try {
    // 1. Créer le rôle s'il n'existe pas
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      role = await prisma.role.create({ data: { name: roleName } });
      console.log(`🆕 Rôle '${roleName}' créé.`);
    }

    // 2. Chercher ou créer l'utilisateur
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const hashed = await bcrypt.hash("Fake1234!", 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName: "Test",
          lastName: "Admin",
        },
      });
      console.log(`🆕 Utilisateur '${email}' créé.`);
    }

    // 3. Ajouter le rôle à l'utilisateur s'il ne l'a pas
    const existing = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (existing) {
      console.log(`ℹ️ L'utilisateur '${email}' a déjà le rôle '${roleName}'`);
    } else {
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      console.log(`✅ Rôle '${roleName}' attribué à '${email}'`);
    }

    console.log("🎉 setAdmin terminé avec succès.");
  } catch (err) {
    console.error("❌ Erreur dans setAdmin :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
