// 📁 backend/tests/testAdmin.js

const fetch = require("node-fetch");

const ADMIN_EMAIL = "testadmin@alxmultimedia.com"; // ⚡ Corrigé (pas de majuscule au "A")
const ADMIN_PASSWORD = "Fake1234!";
const BASE_URL = "http://localhost:7001";

async function getAdminToken() {
  console.log("🔐 Connexion avec le compte admin de test...");

  const response = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    console.error(`❌ Échec de connexion admin - code ${response.status}`);
    const body = await response.text();
    console.error("Contenu :", body);
    process.exit(1);
  }

  const data = await response.json();

  if (!data.token) {
    console.error("❌ Aucun token reçu après connexion !");
    process.exit(1);
  }

  console.log(`✅ Connexion réussie. Token reçu pour ${data.firstName} ${data.lastName}`);
  return data.token;
}

async function testAdminRoute() {
  try {
    console.log("🧪 Test d'accès à /api/admin/public...");

    const token = await getAdminToken();

    const response = await fetch(`${BASE_URL}/api/admin/public`, {
      headers: { Authorization: `Bearer ${token}` },
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
