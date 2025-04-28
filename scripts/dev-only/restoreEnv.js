const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../../.env");
const backupPath = path.resolve(__dirname, "../../.env.bak");

if (!fs.existsSync(backupPath)) {
  console.error("❌ Aucun fichier .env.bak trouvé pour restauration.");
  process.exit(1);
}

try {
  fs.copyFileSync(backupPath, envPath);
  console.log("✅ Restauration du fichier .env effectuée avec succès !");
} catch (error) {
  console.error("❌ Erreur lors de la restauration :", error);
  process.exit(1);
}
