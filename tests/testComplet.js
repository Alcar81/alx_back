const { execSync } = require("child_process");

const runTest = (description, command) => {
  console.log(`\n🔎 ${description}`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} - Succès`);
  } catch (error) {
    console.warn(`⚠️ ${description} - Échec ou réponse inattendue`);
    process.exit(1); // On peut rendre ça optionnel selon ENV
  }
};

(async () => {
  console.log("🚀 Lancement de testComplet.js...\n");

  runTest("Test 1/5 - testPrisma.js", "node /app/tests/testPrisma.js");
  runTest("Test 2/5 - testHealth.js", "node /app/tests/testHealth.js");
  runTest("Test 3/5 - testRegister.js", "node /app/tests/testRegister.js");
  runTest("Test 4/5 - testLogin.js", "node /app/tests/testLogin.js");

  console.log("Test 5/5 - Requête POST sans payload (via curl)");
  try {
    const output = execSync(`curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:7001/api/register -H "X-Test-Request: true"`).toString().trim();
    if (output === "415") {
      console.log("✅ /api/register a bien renvoyé 415 (comportement attendu)");
    } else {
      console.warn(`⚠️ /api/register a renvoyé ${output} (attendu : 415)`);
    }
  } catch (err) {
    console.error("❌ Erreur lors du test curl : ", err.message);
  }

  console.log("\n🎯 Tous les tests sont terminés.");
})();