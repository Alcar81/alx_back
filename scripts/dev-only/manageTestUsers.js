// 📁 backend/scripts/dev-only/manageTestUsers.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger"); // ✅ Correction chemin

const prisma = new PrismaClient();

// ✅ Définition des utilisateurs de test
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

// ✅ Vérification du mode verbose
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
  try {
    const password = "Fake1234!";
    const hashedPassword = await bcrypt.hash(password, 10);
    const results = [];

    for (const userData of TEST_USERS) {
      logInfo(`🔎 Vérification de "${userData.email}"...`);

      // Vérifie si l'utilisateur existe
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

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
        logInfo("👤 Utilisateur déjà existant.");
        results.push({ email: userData.email, status: "✔️ Déjà existant" });
      }

      // Vérifie si le rôle existe
      let role = await prisma.role.findUnique({
        where: { name: userData.roleName },
      });

      if (!role) {
        logInfo(`🛡️ Rôle "${userData.roleName}" non trouvé. Création...`);
        role = await prisma.role.create({
          data: { name: userData.roleName },
        });
      }

      // Vérifie l'association UserRole
      const userRole = await prisma.userRole.findFirst({
        where: {
          userId: user.id,
          roleId: role.id,
        },
      });

      if (!userRole) {
        logInfo(`🔗 Attribution du rôle "${userData.roleName}" à ${userData.email}`);
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });
      } else {
        logInfo(`🔗 L'utilisateur possède déjà le rôle "${userData.roleName}".`);
      }
    }

    // Résumé final
    logInfo("\n📋 Résultats :");
    logInfo("------------------------------------------------------");
    logInfo("| Utilisateur                  | Statut              |");
    logInfo("------------------------------------------------------");
    for (const result of results) {
      logInfo(`| ${result.email.padEnd(28)} | ${result.status.padEnd(18)} |`);
    }
    logInfo("------------------------------------------------------");

    process.exit(0);

  } catch (error) {
    logError(`❌ Erreur fatale : ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
