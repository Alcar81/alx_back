// 📁 backend/scripts/dev-only/manageTestUsers.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger");
const prisma = new PrismaClient();

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

// ✅ Liste des utilisateurs à créer (sans champ `id`)
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
  {
    email: "admin@example.com",
    firstName: "Admin",
    lastName: "Token",
    roleName: "ADMIN",
  },
];

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

        results.push({ email: userData.email, status: "✅ Utilisateur créé", color: "green" });
      } else {
        logInfo("👤 Utilisateur déjà existant.");
        results.push({ email: userData.email, status: "⚠️ Déjà existant", color: "yellow" });
      }

      // Vérification du rôle
      let role = await prisma.role.findUnique({ where: { name: userData.roleName } });
      if (!role) {
        logInfo(`🛡️ Rôle "${userData.roleName}" non trouvé. Création...`);
        role = await prisma.role.create({ data: { name: userData.roleName } });
      }

      // Vérification de l'association UserRole
      const userRole = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: role.id },
      });

      if (!userRole) {
        logInfo(`🔗 Attribution du rôle "${userData.roleName}" à ${userData.email}`);
        await prisma.userRole.create({
          data: { userId: user.id, roleId: role.id },
        });
      } else {
        logInfo(`🔗 L'utilisateur possède déjà le rôle "${userData.roleName}".`);
      }
    }

    // Résumé
    logInfo("\n📋 Résultats :");
    logInfo("------------------------------------------------------");
    logInfo("| Utilisateur                  | Statut              |");
    logInfo("------------------------------------------------------");
    for (const result of results) {
      const color = COLORS[result.color] || COLORS.reset;
      const reset = COLORS.reset;
      console.log(`| ${result.email.padEnd(28)} | ${color}${result.status.padEnd(18)}${reset} |`);
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
