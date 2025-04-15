// 📁 backend/scripts/clean_test_user.js
process.env.TZ = "America/Toronto";

const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

(async function clean() {
  try {
    const result = await prisma.user.deleteMany({
      where: { email: "fakebot@example.com" },
    });
    logger.info(`🧹 Utilisateurs supprimés : ${result.count}`);
  } catch (e) {
    logger.error("❌ Échec de la suppression :", e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
