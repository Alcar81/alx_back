// 📁 backend/scripts/dev-only/generateAdminToken.js

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const envPath = path.resolve(__dirname, "../../.env");
const backupPath = path.resolve(__dirname, "../../.env.bak");

const prisma = new PrismaClient();
const secret = process.env.JWT_SECRET;

async function main() {
  if (!secret) {
    console.error("❌ JWT_SECRET manquant dans .env !");
    process.exit(1);
  }

  try {
    // 🧪 Recherche de l'utilisateur admin@example.com
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
      include: { roles: { select: { role: true } } },
    });

    if (!adminUser) {
      console.error("❌ Utilisateur admin@example.com introuvable dans la base.");
      process.exit(1);
    }

    // 🔒 Construction du payload dynamique
    const payload = {
      id: adminUser.id,
      email: adminUser.email,
      roles: adminUser.roles.map((r) => r.role.name),
    };

    const options = { expiresIn: "7d" };

    const newToken = jwt.sign(payload, secret, options);

    // 📄 Lecture de l'ancien .env
    let envContent = "";
    try {
      envContent = fs.readFileSync(envPath, "utf-8");
    } catch (error) {
      console.error(`❌ Impossible de lire ${envPath}`, error);
      process.exit(1);
    }

    // 🛡️ Sauvegarde du .env actuel
    try {
      fs.writeFileSync(backupPath, envContent, "utf-8");
      console.log(`🛡️  Backup créé : ${backupPath}`);
    } catch (error) {
      console.error(`❌ Impossible de créer une sauvegarde ${backupPath}`, error);
      process.exit(1);
    }

    // 🧹 Nettoyage de l'ancien ADMIN_TEST_TOKEN
    const cleanedEnvContent = envContent
      .split("\n")
      .filter((line) => !line.startsWith("ADMIN_TEST_TOKEN="))
      .join("\n");

    // ✍️ Réécriture propre du nouveau token
    const finalEnvContent = `${cleanedEnvContent.trim()}\nADMIN_TEST_TOKEN=${newToken}\n`;

    try {
      fs.writeFileSync(envPath, finalEnvContent, "utf-8");
      console.log("✅ ADMIN_TEST_TOKEN mis à jour dans .env avec succès !");
    } catch (error) {
      console.error(`❌ Impossible d'écrire dans ${envPath}`, error);
      process.exit(1);
    }

    // ✅ Affiche uniquement le token final (important pour ton pipeline)
    console.log(newToken);

  } catch (error) {
    console.error("❌ Erreur lors de la génération du token :", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
