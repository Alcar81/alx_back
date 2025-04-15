process.env.TZ = "America/Toronto"; // ✅ Forcer le fuseau horaire

const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger"); // ✅ Utilisation du logger central

const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany();
    logger.info(`✅ Connexion réussie. Utilisateurs trouvés : ${users.length}`);
    process.exit(0);
  } catch (e) {
    logger.error(`❌ Erreur de connexion ou de requête Prisma : ${e.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
