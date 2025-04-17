// 📁 backend/tests/testDbConnection.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
  console.log("🧪 Vérification de la connexion à la base de données...");

  try {
    await prisma.$connect();
    console.log("✅ Connexion à la base de données : SUCCÈS");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connexion échouée :", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
