// 📁 backend/tests/testAdmin.js

const fetch = require("node-fetch");

const TEST_URL = "http://localhost:7001/api/admin/public";

console.log("🧪 Test d'accès à /api/admin/public...");

fetch(TEST_URL)
  .then(async (res) => {
    const text = await res.text();
    if (res.status === 200 && text.includes("Section publique")) {
      console.log("✅ Test réussi : accès public OK");
      process.exit(0);
    } else {
      console.error(`❌ Échec - code ${res.status}`);
      console.error("Contenu :", text);
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error("❌ Erreur de connexion :", err.message);
    process.exit(1);
  });
