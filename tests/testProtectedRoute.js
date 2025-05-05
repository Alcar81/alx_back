// 📁 backend/tests/testProtectedRoute.js
const fetch = require("node-fetch");

const PORT = process.env.SERVER_PORT;

// 🛡️ Vérifie que le port est bien défini
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

(async () => {
  console.log("🔐 Test d’une route protégée (/api/me)");

  try {
    // ➤ 1. Connexion avec un faux utilisateur pour obtenir le token
    const loginRes = await fetch(`http://localhost:${PORT}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "fakebot@example.com",
        password: "Fake1234!",
      }),
    });

    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      console.error("❌ Token manquant dans la réponse de connexion.");
      process.exit(1);
    }

    console.log("✅ Token reçu :", token.slice(0, 20) + "...");

    // ➤ 2. Requête vers la route protégée
    const meRes = await fetch(`http://localhost:${PORT}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const status = meRes.status;
    const data = await meRes.json();

    if (status === 200 && data.email === "fakebot@example.com") {
      console.log("✅ Route protégée accessible avec succès.");
      process.exit(0);
    } else {
      console.warn(`⚠️ Réponse inattendue : status=${status}, data=`, data);
      process.exit(1);
    }
  } catch (err) {
    console.error(
      "❌ Erreur pendant le test de la route protégée :",
      err.message
    );
    process.exit(1);
  }
})();
