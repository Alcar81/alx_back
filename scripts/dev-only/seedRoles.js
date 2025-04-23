const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const rolesToSeed = ["USER", "ADMIN", "SUPERADMIN"];

(async () => {
  try {
    console.log("🌱 Initialisation des rôles...");

    for (const roleName of rolesToSeed) {
      const exists = await prisma.role.findUnique({
        where: { name: roleName },
      });

      if (!exists) {
        await prisma.role.create({
          data: { name: roleName },
        });
        console.log(`✅ Rôle '${roleName}' ajouté.`);
      } else {
        console.log(`ℹ️ Rôle '${roleName}' déjà présent.`);
      }
    }

    console.log("🎉 Initialisation des rôles terminée.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur lors de l’initialisation :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
