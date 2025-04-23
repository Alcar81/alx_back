const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const [,, email = "", role = "ADMIN"] = process.argv;

if (!email || !role) {
  console.error("❌ Usage : node setAdmin.js <email> <role>");
  process.exit(1);
}

(async () => {
  try {
    // 🔍 Vérifier si l'utilisateur existe
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      const defaultPassword = "Fake1234!";
      const hashed = await bcrypt.hash(defaultPassword, 10);
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashed,
          firstName: "Test",
          lastName: "Admin",
        },
      });
      console.log(`🆕 Utilisateur ${email} créé avec le mot de passe : ${defaultPassword}`);
    }

    // 🔍 Vérifier si le rôle existe dans la table Role
    const roleRecord = await prisma.role.findUnique({
      where: {
        name: role.toUpperCase(),
      },
    });

    if (!roleRecord) {
      throw new Error(`❌ Le rôle '${role}' n'existe pas dans la table Role.`);
    }

    // 🔍 Vérifier si l'association UserRole existe déjà
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: roleRecord.id,
      },
    });

    if (existingRole) {
      console.log(`ℹ️ L'utilisateur possède déjà le rôle '${role.toUpperCase()}'`);
    } else {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });
      console.log(`✅ Rôle '${role.toUpperCase()}' attribué à ${email}`);
    }

    console.log("🎉 Opération terminée avec succès.");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
