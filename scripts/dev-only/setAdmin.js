// 📁 scripts/dev-only/setAdmin.js
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// 🛠️ Liste manuelle basée sur l'enum Prisma
const validRoles = ["USER", "ADMIN", "SUPERADMIN"];

const [,, emailInput = "", roleInput = "ADMIN"] = process.argv;
const email = emailInput.toLowerCase();
const role = roleInput.toUpperCase();

if (!email || !role) {
  console.error("❌ Usage : node setAdmin.js <email> <role>");
  process.exit(1);
}

if (!validRoles.includes(role)) {
  console.error(`❌ Rôle invalide : '${role}'.`);
  console.log("🎭 Rôles valides :", validRoles.join(", "));
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
          role,
        },
      });
      console.log(`🆕 Utilisateur ${email} créé avec le mot de passe : ${defaultPassword}`);
    } else {
      await prisma.user.update({
        where: { email },
        data: { role },
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
