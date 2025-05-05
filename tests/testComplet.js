// 📁 backend/tests/testComplet.js

const { execSync } = require("child_process");
const fs = require("fs");
const net = require("net");

const args = process.argv.slice(2);
const debug = args.includes("--debug");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const debugMode = process.argv.includes("--debug");

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

  await sleep(300);
};

const checkPort = (port, host = "127.0.0.1") => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000;

    socket.setTimeout(timeout);
    socket
      .once("connect", () => {
        socket.destroy();
        resolve(true);
      })
      .once("timeout", () => {
        socket.destroy();
        resolve(false);
      })
      .once("error", () => {
        resolve(false);
      })
      .connect(port, host);
  });
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
║ 📂 Routes admin publiques accessibles : OK (si testé) ║
║ ❓ Gestion des erreurs 404 : OK                        ║
║ 🧼 Comportement sans payload JSON validé              ║
║                                                        ║
║ 🎯 CI/CD terminé sans erreur !                        ║
╚════════════════════════════════════════════════════════╝
  `);
};

(async () => {
  try {
    console.log("🚀 Lancement de testComplet.js...\n");

    if (debugMode) {
      console.log("🛠️ Mode DEBUG actif");
      console.log("🌐 SERVER_PORT = ", process.env.SERVER_PORT);
      console.log("📡 API = ", process.env.REACT_APP_API_URL);
    }

    const port = process.env.SERVER_PORT || 7001;
    const portOpen = await checkPort(port);
    if (!portOpen) {
      console.error(`❌ Le port ${port} n’est pas accessible !`);
      process.exit(1);
    } else if (debugMode) {
      console.log(`✅ Le port ${port} est ouvert`);
    }

    const files = [
      "testPrisma.js",
      "testHealth.js",
      "testRegister.js",
      "testLogin.js",
      "testRegisterEmpty.js",
      "testProtectedRoute.js",
      "test404.js",
    ];

    const adminToken = process.env.ADMIN_TEST_TOKEN;
    const includeAdminTest = !!adminToken;
    if (includeAdminTest) {
      files.push("testAdmin.js");
    } else {
      console.log("⚠️ ADMIN_TEST_TOKEN absent ➜ testAdmin.js ignoré.");
    }

    console.log("🔍 Vérification des fichiers de test...");
    files.forEach((file) => {
      const path = `/app/tests/${file}`;
      if (!fs.existsSync(path)) {
        console.error(`❌ Le fichier ${file} est manquant dans /app/tests.`);
        process.exit(1);
      }
      console.log(`✅ ${file} trouvé`);
    });

    for (let i = 0; i < files.length; i++) {
      await runTest(
        `Test ${i + 1}/${files.length} - ${files[i]}`,
        `node /app/tests/${files[i]}`
      );
    }

    printBanner();
  } catch (e) {
    console.error("❌ Une erreur inattendue est survenue :", e);
    process.exit(1);
  }
})();
