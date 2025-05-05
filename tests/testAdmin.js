// 📁 backend/tests/testAdmin.js
const fetch = require("node-fetch");
const PORT = process.env.SERVER_PORT;
const ENV = process.env.ENV || "dev"; // 🌍 récupère l’environnement
const ADMIN_TEST_TOKEN = process.env.ADMIN_TEST_TOKEN;

// 🛡️ Vérifie les variables nécessaires
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

if (ENV === "prod") {
  console.warn("⚠️ Test Admin désactivé en production.");
  process.exit(0);
}

if (!ADMIN_TEST_TOKEN) {
  console.error("❌ ADMIN_TEST_TOKEN manquant dans .env !");
  process.exit(1);
}

const BASE_URL = `http://localhost:${PORT}`;

async function testAdminRoute() {
  try {
    console.log("🧪 Test d'accès à /api/admin/public...");

    const response = await fetch(`${BASE_URL}/api/admin/public`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TEST_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log("✅ Accès Admin OK.");
      process.exit(0);
    } else if (response.status === 403) {
      console.warn("⚠️ Accès interdit (403) ➜ rôle ADMIN absent ?");
      process.exit(1);
    } else {
      console.warn(`⚠️ Échec - code ${response.status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test Admin :", error.message);
    process.exit(1);
  }
}

testAdminRoute();
