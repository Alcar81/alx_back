// 📁 backend/scripts/dev-only/setupInitialAdmin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const logger = require("../../utils/logger");

const prisma = new PrismaClient();

async function main() {
  try {
    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });

    // Vérifie si un utilisateur avec le rôle ADMIN existe
    const existingAdmin = await prisma.userRole.findFirst({
      where: {
        role: {
          name: "ADMIN",
        },
      },
      include: {
        user: true,
      },
    });

    if (existingAdmin) {
      logger.info("🛡️ Un utilisateur admin existe déjà. Aucun changement.");
      return;
    }

    logger.info(
      "🛠 Aucun administrateur trouvé ➜ création du premier compte admin..."
    );

    const password = "Alx1234!Admin!";
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        email: "admin@alxmultimedia.com",
        firstName: "Super",
        lastName: "Admin",
        password: hashedPassword,
      },
    });

    // Crée le rôle ADMIN si nécessaire
    const role =
      adminRole ||
      (await prisma.role.create({
        data: { name: "ADMIN" },
      }));

    await prisma.userRole.create({
      data: {
        userId: newAdmin.id,
        roleId: role.id,
      },
    });

    logger.info(
      "✅ Compte admin initial créé avec succès : admin@alxmultimedia.com / Admin1234!"
    );
  } catch (err) {
    logger.error("❌ Erreur dans setupInitialAdmin.js : " + err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
