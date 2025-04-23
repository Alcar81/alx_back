const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const [,, emailArg = "", roleArg = "ADMIN"] = process.argv;

if (!emailArg || !roleArg) {
  console.error("❌ Usage : node setAdmin.js <email> <role>");
  process.exit(1);
}

const email = emailArg.toLowerCase();
const role = roleArg.toUpperCase();

(async () => {
  try {
    // Vérifier si l'utilisateur existe
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const defaultPassword = "Fake1234!";
      const hashed = await bcrypt.hash(defaultPassword, 10);
      user = await prisma.user.create({
        data: {
          email,
          password: hashed,
          firstName: "Test",
          lastName: "Admin",
        },
      });
      console.log(`🆕 Utilisateur ${email} créé avec le mot de passe : ${defaultPassword}`);
    }

    // Vérifier si le rôle existe
    let roleRecord = await prisma.role.findUnique({ where: { name: role } });
    if (!roleRecord) {
      console.log(`📌 Le rôle '${role}' est absent, création...`);
      roleRecord = await prisma.role.create({
        data: { name: role },
      });
      console.log(`✅ Rôle '${role}' créé.`);
    }

    // Vérifier l'association UserRole
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      },
    });

    if (existing) {
      console.log(`ℹ️ L'utilisateur a déjà le rôle '${role}'.`);
    } else {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });
      console.log(`✅ Rôle '${role}' attribué à ${email}`);
    }

    console.log("🎉 Opération terminée avec succès.");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
