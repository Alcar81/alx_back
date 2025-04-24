// backend/scripts/dev-only/setAdmin.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const email = process.argv[2];
const roleName = process.argv[3] || "ADMIN";

(async () => {
  try {
    console.log(`🧪 Tentative de promotion de ${email} en ${roleName}...`);

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`❌ Utilisateur ${email} non trouvé.`);
      process.exit(1);
    }

    // Vérifier si le rôle existe
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.log(`🔧 Rôle ${roleName} inexistant ➜ création...`);
      role = await prisma.role.create({ data: { name: roleName } });
    }

    // Vérifier si l'utilisateur a déjà ce rôle
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
    });

    if (existing) {
      console.log(`✅ ${email} a déjà le rôle ${roleName}.`);
    } else {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
      console.log(`✅ ${email} a bien reçu le rôle ${roleName}.`);
    }

    // 🔍 Afficher tous les rôles de l'utilisateur
    const roles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true },
    });

    console.log(`\n📋 Rôles associés à ${email} :`);
    console.table(roles.map(r => ({ id: r.role.id, name: r.role.name, assignedAt: r.createdAt })));

    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur dans setAdmin :", err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
