// backend/tests/testRegisterEmpty.js
const fetch = require("node-fetch");

const PORT = process.env.SERVER_PORT;

// 🛡️ Vérifie que le port est bien défini
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

(async () => {
  console.log("🧪 Lancement du test d'inscription sans payload...");
  console.log(`📡 URL testée : http://localhost:${PORT}/api/register`);

  try {
    const response = await fetch(`http://localhost:${PORT}/api/register`, {
      method: "POST",
      headers: {
        "X-Test-Request": "true",
      },
      // Pas de body
    });

    const status = response.status;
    const body = await response.text();

    if (status === 415) {
      console.log(
        "✅ /api/register a bien renvoyé 415 (Content-Type manquant)"
      );
      process.exit(0);
    } else {
      console.warn(`⚠️ Réponse inattendue : ${status}`);
      console.warn(`📩 Corps de la réponse : ${body}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Erreur pendant le test :", error.message);
    process.exit(1);
  }
})();
