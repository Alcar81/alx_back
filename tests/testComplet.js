// 📁 backend/tests/testComplet.js

const { execSync } = require("child_process");
const fs = require("fs");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runTest = async (description, command) => {
  console.log(`\n🔎 ${description}`);
  const start = Date.now();

  try {
    execSync(command, { stdio: "inherit" });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ ${description} - Succès (${duration}s)`);
  } catch (error) {
    console.warn(`⚠️ ${description} - Échec ou réponse inattendue`);
    process.exit(1);
  }

  await sleep(300); // ⏱️ Petite pause pour éviter l'effet mitraillette
};

const printBanner = () => {
  console.clear();
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

  const files = [
    "testPrisma.js",
    "testHealth.js",
    "testRegister.js",
    "testLogin.js",
    "testRegisterEmpty.js",
    "testProtectedRoute.js",
    "test404.js"
  ];

  console.log("🔍 Vérification des fichiers de test...");
  files.forEach((file) => {
    const path = `/app/tests/${file}`;
    if (!fs.existsSync(path)) {
      console.error(`❌ Le fichier ${file} est manquant dans /app/tests.`);
      process.exit(1);
    }
    console.log(`✅ ${file} trouvé`);
  });

  await runTest("Test 1/7 - testPrisma.js", "node /app/tests/testPrisma.js");
  await runTest("Test 2/7 - testHealth.js", "node /app/tests/testHealth.js");
  await runTest("Test 3/7 - testRegister.js", "node /app/tests/testRegister.js");
  await runTest("Test 4/7 - testLogin.js", "node /app/tests/testLogin.js");
  await runTest("Test 5/7 - testRegisterEmpty.js", "node /app/tests/testRegisterEmpty.js");
  await runTest("Test 6/7 - testProtectedRoute.js", "node /app/tests/testProtectedRoute.js");
  await runTest("Test 7/7 - test404.js", "node /app/tests/test404.js");

  printBanner();
})();
