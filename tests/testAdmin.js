// 📁 backend/tests/testAdmin.js

require("dotenv").config(); // Charge le .env au début du fichier

const fetch = require("node-fetch");

async function testAdminRoute() {
  console.log("🧪 Test d'accès à /api/admin/public...");

  const token = process.env.ADMIN_TEST_TOKEN;

  if (!token) {
    console.error("❌ Aucun token admin trouvé dans .env !");
    process.exit(1);
  }

  const url = "http://localhost:7001/api/admin/public";

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    console.log("✅ Accès Admin OK.");
  } else {
    console.error(`❌ Échec accès Admin - code ${response.status}`);
    const body = await response.text();
    console.error("Contenu :", body);
    process.exit(1);
  }
}

testAdminRoute();
