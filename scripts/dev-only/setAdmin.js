// backend/scripts/dev-only/setAdmin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

(async () => {
  const email = process.argv[2] || "testAdmin@alxmultimedia.com";
  const roleName = process.argv[3] || "ADMIN";
  const password = "Fake1234!";

  try {
    console.log(`🧪 Tentative de promotion de ${email} en ${roleName}...`);

    // Crée le rôle s'il n'existe pas
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`🛠️ Rôle ${roleName} non trouvé. Création...`);
      role = await prisma.role.create({ data: { name: roleName } });
    }

    // Vérifie si l'utilisateur existe
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`👤 Utilisateur ${email} non trouvé. Création...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: "Test",
          lastName: "Admin"
        }
      });
    }

    // Vérifie si l'association existe déjà
    const alreadyAssigned = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id }
    });

    if (!alreadyAssigned) {
      console.log(`🔗 Attribution du rôle ${roleName} à ${email}...`);
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });
    } else {
      console.log(`✅ ${email} a déjà le rôle ${roleName}`);
    }

    console.log("🎉 Promotion terminée avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur dans setAdmin :\n", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
