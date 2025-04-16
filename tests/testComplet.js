// backend/tests/testComplet.js
const { execSync } = require("child_process");

const runTest = (description, command) => {
  console.log(`\n🔎 ${description}`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} - Succès`);
  } catch (error) {
    console.warn(`⚠️ ${description} - Échec ou réponse inattendue`);
    process.exit(1);
  }
};

const printBanner = () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║ 🎉 Tous les tests ont passé avec succès !            🎉 ║
║                                                        ║
║ 🚀 Backend prêt à recevoir des requêtes               ║
║ 🔐 Authentification fonctionnelle                     ║
║ 🩺 Santé du serveur confirmée                         ║
║ 🧪 Prisma opérationnel                                ║
║ 🔐 Test de route protégée : OK                        ║
║ ❓ Gestion des erreurs 404 : OK                        ║
║ 🧼 Comportement sans payload JSON validé              ║
║                                                        ║
║ 🎯 CI/CD terminé sans erreur !                        ║
╚════════════════════════════════════════════════════════╝
  `);
};

(async () => {
  console.log("🚀 Lancement de testComplet.js...\n");

  runTest("Test 1/7 - testPrisma.js", "node /app/tests/testPrisma.js");
  runTest("Test 2/7 - testHealth.js", "node /app/tests/testHealth.js");
  runTest("Test 3/7 - testRegister.js", "node /app/tests/testRegister.js");
  runTest("Test 4/7 - testLogin.js", "node /app/tests/testLogin.js");
  runTest("Test 5/7 - testRegisterEmpty.js", "node /app/tests/testRegisterEmpty.js");
  runTest("Test 6/7 - testProtectedRoute.js", "node /app/tests/testProtectedRoute.js");
  runTest("Test 7/7 - test404.js", "node /app/tests/test404.js");

  printBanner();
})();
