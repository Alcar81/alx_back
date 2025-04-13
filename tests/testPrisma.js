// backend/tests/testPrisma.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany();
    console.log("✅ Connexion réussie. Utilisateurs trouvés :", users.length);
    process.exit(0);
  } catch (e) {
    console.error("❌ Erreur de connexion ou de requête Prisma :", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
