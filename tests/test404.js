// test404.js
const fetch = require("node-fetch");

(async () => {
  console.log("🔍 Test d’une route inexistante...");

  try {
    const response = await fetch("http://localhost:7001/api/doesnotexist", {
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
