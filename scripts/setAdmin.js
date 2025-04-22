// scripts/setAdmin.js

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
          role
        }
      });
      console.log(`🆕 Utilisateur ${email} créé avec le mot de passe : ${defaultPassword}`);
    } else {
      await prisma.user.update({
        where: { email },
        data: { role }
      });
      console.log(`🔄 Rôle de ${email} mis à jour en : ${role}`);
    }

    console.log("✅ Opération terminée.");
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
