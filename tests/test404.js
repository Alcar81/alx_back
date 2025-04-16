// test404.js
const fetch = require("node-fetch");

(async () => {
  console.log("🔍 Test d’une route inexistante...");

  try {
    const response = await fetch("http://localhost:7001/api/route-qui-nexiste-pas");
    if (response.status === 404) {
      console.log("✅ Route inexistante renvoie bien une erreur 404.");
      process.exit(0);
    } else {
      console.warn(`⚠️ Code inattendu : ${response.status}`);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Erreur durant le test 404 :", err.message);
    process.exit(1);
  }
})();
