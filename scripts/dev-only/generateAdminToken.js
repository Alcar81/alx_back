// 📁 backend/scripts/dev-only/generateAdminToken.js

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
require("dotenv").config(); // Charge .env existant

const envPath = path.resolve(__dirname, "../../.env"); // chemin vers backend/.env

const secret = process.env.JWT_SECRET;

if (!secret) {
  console.error("❌ JWT_SECRET manquant dans .env !");
  process.exit(1);
}

// Crée un nouveau token admin
const payload = {
  id: "admin-test-id-123", // ⚡ ID fictif d'un utilisateur admin pour tests
  email: "admin@example.com",
  roles: ["ADMIN"],
};

const options = {
  expiresIn: "7d",
};

const newToken = jwt.sign(payload, secret, options);

// Lit tout le fichier .env
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch (error) {
  console.error(`❌ Impossible de lire ${envPath}`, error);
  process.exit(1);
}

// Retire toute ancienne ligne ADMIN_TEST_TOKEN
const newEnvContent = envContent
  .split("\n")
  .filter((line) => !line.startsWith("ADMIN_TEST_TOKEN="))
  .concat([`ADMIN_TEST_TOKEN=${newToken}`])
  .join("\n");

// Réécrit proprement .env
try {
  fs.writeFileSync(envPath, newEnvContent, "utf-8");
  console.log("✅ ADMIN_TEST_TOKEN mis à jour dans .env avec succès !");
} catch (error) {
  console.error(`❌ Impossible d'écrire dans ${envPath}`, error);
  process.exit(1);
}

// Affiche le nouveau token si besoin
console.log("\n🆕 Nouveau token généré :");
console.log(newToken);
