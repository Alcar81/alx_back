// 📁 backend/scripts/dev-only/generateAdminToken.js

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

// ✅ Charge l'environnement existant
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const envPath = path.resolve(__dirname, "../../.env");
const backupPath = path.resolve(__dirname, "../../.env.bak");

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error("❌ JWT_SECRET manquant dans .env !");
  process.exit(1);
}

// ✅ Crée un token admin fictif
const payload = {
  id: "admin-test-id-123",
  email: "admin@example.com",
  roles: ["ADMIN"],
};

const options = {
  expiresIn: "7d",
};

const newToken = jwt.sign(payload, secret, options);

// ✅ Lecture de l'ancien .env
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch (error) {
  console.error(`❌ Impossible de lire ${envPath}`, error);
  process.exit(1);
}

// ✅ Sauvegarde avant modification
try {
  fs.writeFileSync(backupPath, envContent, "utf-8");
  console.log(`🛡️  Backup créé : ${backupPath}`);
} catch (error) {
  console.error(`❌ Impossible de créer une sauvegarde ${backupPath}`, error);
  process.exit(1);
}

// ✅ Nettoyage des anciennes entrées ADMIN_TEST_TOKEN
const cleanedEnvContent = envContent
  .split("\n")
  .filter((line) => !line.startsWith("ADMIN_TEST_TOKEN="))
  .join("\n");

// ✅ Ajout propre du nouveau token
const finalEnvContent = `${cleanedEnvContent.trim()}\nADMIN_TEST_TOKEN=${newToken}\n`;

// ✅ Réécriture du fichier .env
try {
  fs.writeFileSync(envPath, finalEnvContent, "utf-8");
  console.log("✅ ADMIN_TEST_TOKEN mis à jour dans .env avec succès !");
} catch (error) {
  console.error(`❌ Impossible d'écrire dans ${envPath}`, error);
  process.exit(1);
}

// ✅ Affiche uniquement le token (important pour le pipeline)
console.log(newToken);
