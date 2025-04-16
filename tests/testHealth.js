// 📁 backend/tests/testHealth.js
const fetch = require("node-fetch");

(async () => {
  console.log("🌐 Lancement de testHealth.js...");

  try {
    const response = await fetch("http://localhost:7001/health", {
      method: "GET",
      headers: {
        "X-Test-Request": "true"
      }
    });

    const status = response.status;

    if (status === 200) {
      console.log("✅ /health est opérationnel.");
      process.exit(0);
    } else {
      console.error(`❌ /health a retourné ${status} au lieu de 200`);
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Erreur lors du test de /health :", err.message);
    process.exit(1);
  }
})();
