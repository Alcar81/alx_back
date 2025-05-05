// 📁 backend/tests/testHealth.js
const fetch = require("node-fetch");
const PORT = process.env.SERVER_PORT;

(async () => {
  const url = `http://localhost:${PORT}/health`; // ✅ interpolation dynamique
  console.log(`🌐 Lancement de testHealth.js...\n📡 URL testée : ${url}`);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Test-Request": "true",
      },
    });

    const status = response.status;

    if (status === 200) {
      console.log("✅ /health est opérationnel.");
      process.exit(0);
    } else {
      console.error(`❌ /health a retourné le code ${status} (attendu : 200)`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`❌ Erreur lors du test de /health : ${err.message}`);
    process.exit(1);
  }
})();
