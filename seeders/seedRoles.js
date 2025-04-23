// 📁 backend/seeders/seedRoles.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const roles = ["USER", "ADMIN", "SUPERADMIN"];

(async () => {
  try {
    for (const name of roles) {
      const existing = await prisma.role.findUnique({ where: { name } });

      if (!existing) {
        await prisma.role.create({ data: { name } });
        console.log(`✅ Rôle '${name}' inséré.`);
      } else {
        console.log(`ℹ️ Rôle '${name}' existe déjà.`);
      }
    }
    console.log("🎉 Tous les rôles de base sont présents.");
  } catch (err) {
    console.error("❌ Erreur lors de l'initialisation des rôles :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
