  process.env.TZ = "America/Toronto";
  const { PrismaClient } = require("@prisma/client");
  const logger = require("../utils/logger");
  const prisma = new PrismaClient();
  async function clean() {
    try {
      // Ensure the 'user' model exists in your Prisma schema
      const result = await prisma.user.deleteMany({
        where: { email: "fakebot@example.com" }
      });
      console.log(`🧹 Utilisateurs supprimés : ${result.count}`);
    } catch (e) {
      console.error("❌ Échec de la suppression :", e.message);
      process.exit(1); // Exit with error code for better error handling
    } finally {
      await prisma.$disconnect();
    }
  }
  clean();
