// 📁 scripts/dev-only/seedRoles.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const roles = ["USER", "ADMIN", "SUPERADMIN"];

(async () => {
  try {
    for (const name of roles) {
      const existing = await prisma.role.findUnique({ where: { name } });
      if (!existing) {
        await prisma.role.create({ data: { name } });
        console.log(`✅ Rôle créé : ${name}`);
      } else {
        console.log(`ℹ️ Rôle déjà existant : ${name}`);
      }
    }
    console.log("🎉 Tous les rôles sont prêts !");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
