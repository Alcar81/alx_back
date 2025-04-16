// testProtectedRoute.js
const fetch = require("node-fetch");

(async () => {
  console.log("🔐 Test d’une route protégée...");

  try {
    // Connexion pour récupérer le token
    const login = await fetch("http://localhost:7001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "fakebot@example.com", password: "Fake1234!" }),
    });

    const loginData = await login.json();
    const token = loginData.token;

    if (!token) throw new Error("Token manquant dans la réponse de connexion.");

    const response = await fetch("http://localhost:7001/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const status = response.status;
    const data = await response.json();

    if (status === 200 && data.email === "fakebot@example.com") {
      console.log("✅ Route protégée accessible avec succès.");
      process.exit(0);
    } else {
      console.warn("⚠️ Échec de l’accès à la route protégée.");
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Erreur pendant le test de la route protégée :", err.message);
    process.exit(1);
  }
})();
