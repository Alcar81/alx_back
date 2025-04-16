const fetch = require("node-fetch");

const log = (msg) => {
  const now = new Date().toLocaleString("fr-CA", { timeZone: "America/Toronto" });
  console.log(`[${now}] ${msg}`);
};

(async () => {
  log("🧪 Lancement du test d'inscription...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // ⏱️ Timeout 5s

    const response = await fetch("http://localhost:7001/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Request": "true"
      },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "Bot",
        email: "fakebot@example.com",
        password: "Fake1234!"
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const status = response.status;

    let data;
    try {
      data = await response.json();
    } catch (jsonErr) {
      log(`❌ Erreur de parsing JSON : ${jsonErr.message}`);
      process.exit(1);
    }

    if (status === 201 || status === 409) {
      const info = status === 201 ? "utilisateur créé" : "email déjà utilisé";
      log(`✅ Inscription test acceptée (${status}) : ${info}`);
      process.exit(0);
    } else {
      log(`⚠️ Réponse inattendue (${status}) : ${data.message || JSON.stringify(data)}`);
      process.exit(1);
    }

  } catch (error) {
    if (error.name === "AbortError") {
      log("❌ Le test a expiré (timeout)");
    } else {
      log(`❌ Erreur pendant le test d'inscription : ${error.message}`);
    }
    process.exit(1);
  }
})();
