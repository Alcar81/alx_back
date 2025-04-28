// backent/scripts/dev-only/manageTestUsers.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: "testadmin@alxmultimedia.com",
    firstName: "Test",
    lastName: "Admin",
    roleName: "ADMIN",
  },
  {
    email: "testusager@alxmultimedia.com",
    firstName: "Test",
    lastName: "Usager",
    roleName: "USER",
  },
];

// 📦 Vérifie si l'option --verbose est passée
const isVerbose = process.argv.includes("--verbose");

function logInfo(message) {
  logger.info(message);
  if (isVerbose) console.log(message);
}

function logError(message) {
  logger.error(message);
  if (isVerbose) console.error(message);
}

async function main() {
  const password = "Fake1234!";
  const hashedPassword = await bcrypt.hash(password, 10);
  const results = [];

  for (const userData of TEST_USERS) {
    try {
      logInfo(`🔎 Vérification de "${userData.email}"...`);

      let user = await prisma.user.findUnique({ where: { email: userData.email } });

      if (!user) {
        logInfo("👤 Utilisateur non trouvé. Création...");
        user = await prisma.user.create({
          data: {
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
          },
        });
        results.push({ email: userData.email, status: "✅ Utilisateur créé" });
      } else {
        logInfo("👤 Utilisateur existant.");
        results.push({ email: userData.email, status: "✅ Déjà existant" });
      }

      let role = await prisma.role.findUnique({ where: { name: userData.roleName } });
      if (!role) {
        logInfo(`🛡️ Rôle "${userData.roleName}" non trouvé. Création...`);
        role = await prisma.role.create({ data: { name: userData.roleName } });
      }

      const existingUserRole = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: role.id },
      });

      if (!existingUserRole) {
        logInfo(`🔗 Attribution du rôle "${userData.roleName}" à ${userData.email}`);
        await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
      } else {
        logInfo(`🔗 Rôle "${userData.roleName}" déjà attribué.`);
      }
    } catch (error) {
      logError(`❌ Erreur avec "${userData.email}": ${error.message}`);
      results.push({ email: userData.email, status: `❌ Erreur: ${error.message}` });
    }
  }

  // Résumé final
  logInfo("\n📋 Résultats :");
  logInfo("--------------------------------------------------");
  logInfo("| Utilisateur               | Statut             |");
  logInfo("--------------------------------------------------");
  results.forEach((r) => {
    logInfo(`| ${r.email.padEnd(25)} | ${r.status.padEnd(18)} |`);
  });
  logInfo("--------------------------------------------------");

  process.exit(0);
}

main().catch((error) => {
  logError("❌ Erreur fatale :", error);
  process.exit(1);
});
