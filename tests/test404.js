// test404.js
const fetch = require("node-fetch");
const PORT = process.env.SERVER_PORT;

// 🛡️ Vérifie que le port est bien défini
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

(async () => {
  console.log("🔍 Test d’une route inexistante...");

  try {
    const response = await fetch(`http://localhost:${PORT}/api/register`, {
      method: "GET",
      headers: { "X-Test-Request": "true" },
    });

    const status = response.status;
    console.log(`📡 Code HTTP reçu : ${status}`);

    if (status === 404) {
      console.log("✅ Route inexistante a bien retourné 404.");
      process.exit(0);
    } else {
      console.warn(`⚠️ Code inattendu : ${status}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur lors du test de route 404 :", error.message);
    process.exit(1);
  }
})();
