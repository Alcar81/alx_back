// testRegister.js
const fetch = require("node-fetch");
const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];

console.log(`${timestamp} 🧪 Lancement du test d'inscription...`);

(async () => {
  try {
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
    });

    const status = response.status;
    const data = await response.json();

    if (status === 201 || (status === 409 && data.message.includes("déjà utilisé"))) {
      console.log(`${timestamp} ✅ Inscription test acceptée (${status}) : ${data.message}`);
      process.exit(0);
    } else {
      console.log(`${timestamp} ⚠️ Inscription test refusée (code ${status}) : ${data.message || data}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`${timestamp} ❌ Erreur lors du test d'inscription : ${err.message}`);
    process.exit(1);
  }
})();
