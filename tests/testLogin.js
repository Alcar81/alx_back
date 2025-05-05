// 📁 tests/testLogin.js

const fetch = require("node-fetch");

const PORT = process.env.SERVER_PORT;

// 🛡️ Vérifie que le port est bien défini
if (!PORT) {
  console.error("❌ SERVER_PORT non défini dans process.env");
  process.exit(1);
}

const log = (msg) => {
  const now = new Date().toLocaleString("fr-CA", {
    timeZone: "America/Toronto",
  });
  console.log(`[${now}] ${msg}`);
};

(async () => {
  log("🔐 Lancement du test de connexion...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // ⏱️ 5 secondes timeout

    const response = await fetch(`http://localhost:${PORT}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Test-Request": "true",
      },
      body: JSON.stringify({
        email: "fakebot@example.com",
        password: "Fake1234!",
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

    if (status === 200) {
      log(
        `✅ Connexion test réussie : ${data.firstName} ${data.lastName} (${data.email})`
      );
      process.exit(0);
    } else {
      log(
        `⚠️ Connexion test échouée (code ${status}) : ${
          data.message || JSON.stringify(data)
        }`
      );
      process.exit(1);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      log("❌ Le test a dépassé le délai imparti (timeout)");
    } else {
      log(`❌ Erreur pendant le test de connexion : ${error.message}`);
    }
    process.exit(1);
  }
})();
