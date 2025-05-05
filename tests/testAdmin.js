// 📁 backend/tests/testAdmin.js

const fetch = require("node-fetch");
const PORT = process.env.SERVER_PORT;

// 🛡️ Vérifie que le port est bien défini
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

const BASE_URL = "http://localhost:${PORT}";

// 🔥 Nouveau ➔ lire ADMIN_TEST_TOKEN de l'environnement
const ADMIN_TEST_TOKEN = process.env.ADMIN_TEST_TOKEN;

async function testAdminRoute() {
  try {
    console.log("🧪 Test d'accès à /api/admin/public...");

    if (!ADMIN_TEST_TOKEN) {
      console.error("❌ ADMIN_TEST_TOKEN manquant dans .env !");
      process.exit(1);
    }

    const response = await fetch(`${BASE_URL}/api/admin/public`, {
      headers: {
        Authorization: `Bearer ${ADMIN_TEST_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log("✅ Accès Admin OK.");
      process.exit(0);
    } else if (response.status === 403) {
      console.error("❌ Accès interdit (403) - Vérification du rôle ADMIN...");
      const body = await response.json();
      if (body && body.message) {
        console.error("Message serveur :", body.message);
      }
      process.exit(1);
    } else {
      console.error(`❌ Échec accès Admin - code ${response.status}`);
      const body = await response.text();
      console.error("Contenu :", body);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur inattendue lors du test Admin :", error.message);
    process.exit(1);
  }
}

testAdminRoute();
