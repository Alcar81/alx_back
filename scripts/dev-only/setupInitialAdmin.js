// 📁 backend/scripts/prod-only/setupInitialAdmin.js

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

const ADMIN_EMAIL = "admin@alxmultimedia.com";
const ADMIN_PASSWORD = "Alx1234!Admin!";
const ADMIN_FIRSTNAME = "Admin";
const ADMIN_LASTNAME = "Alx";

async function main() {
  try {
    logger.info("🔐 [setupInitialAdmin] ➜ Démarrage du script...");

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // 1. Vérifie si un utilisateur avec un rôle "ADMIN" existe
    const existingAdmin = await prisma.userRole.findFirst({
      where: {
        role: { name: "ADMIN" },
      },
    });

    if (existingAdmin) {
      logger.info(
        "✅ Un utilisateur avec le rôle ADMIN existe déjà. Aucun changement."
      );
      console.log(
        `${COLORS.yellow}⚠️ Aucun admin créé : un utilisateur admin existe déjà.${COLORS.reset}`
      );
      return;
    }

    // 2. Création du compte utilisateur admin
    let user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
      logger.info("👤 Utilisateur admin introuvable ➜ création...");
      user = await prisma.user.create({
        data: {
          email: ADMIN_EMAIL,
          firstName: ADMIN_FIRSTNAME,
          lastName: ADMIN_LASTNAME,
          password: hashedPassword,
        },
      });
      console.log(
        `${COLORS.green}✅ Utilisateur admin créé : ${ADMIN_EMAIL}${COLORS.reset}`
      );
    } else {
      console.log(
        `${COLORS.yellow}⚠️ Utilisateur ${ADMIN_EMAIL} déjà existant.${COLORS.reset}`
      );
    }

    // 3. Création du rôle ADMIN si nécessaire
    let role = await prisma.role.findUnique({ where: { name: "ADMIN" } });
    if (!role) {
      logger.info("🛡️ Rôle ADMIN introuvable ➜ création...");
      role = await prisma.role.create({ data: { name: "ADMIN" } });
    }

    // 4. Association UserRole
    const existingUserRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (!existingUserRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
      console.log(
        `${COLORS.green}✅ Rôle ADMIN associé à ${ADMIN_EMAIL}${COLORS.reset}`
      );
    } else {
      console.log(
        `${COLORS.yellow}⚠️ ${ADMIN_EMAIL} possède déjà le rôle ADMIN.${COLORS.reset}`
      );
    }

    logger.info("🏁 [setupInitialAdmin] Script terminé avec succès.");
  } catch (error) {
    logger.error(`❌ Erreur setupInitialAdmin : ${error.message}`);
    console.error(`${COLORS.red}❌ Erreur : ${error.message}${COLORS.reset}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
