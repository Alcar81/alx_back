// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// 📁 Logger vers logs/server.log
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, "server.log");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logStream.write(line + "\n");
}

exports.registerUser = async (req, res, next) => {
  log("🟡 [registerUser] ➜ Requête reçue");

  try {
    if (!req.is("application/json")) {
      log("⚠️ Type de contenu invalide.");
      return res.status(415).json({ message: "Type de contenu invalide. Utilisez application/json." });
    }

    const { firstName, lastName, email, password } = req.body;
    log(`📩 Données reçues : ${JSON.stringify({ firstName, lastName, email })}`);

    if (!firstName || !lastName || !email || !password) {
      log("⚠️ Champs requis manquants");
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    log("🔎 Vérification si l'utilisateur existe...");
    const userExist = await prisma.user.findUnique({ where: { email } });

    if (userExist) {
      log(`⚠️ Email déjà utilisé : ${email}`);
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    log("🔐 Hashage du mot de passe...");
    const hashedPassword = await bcrypt.hash(password, 10);

    log("🛠️ Création de l'utilisateur...");
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    log(`✅ Utilisateur créé : ID ${newUser.id}, Email: ${newUser.email}`);

    return res.status(201).json({
      message: "Inscription réussie",
      userId: newUser.id,
    });

  } catch (err) {
    log(`❌ Erreur serveur dans registerUser : ${err.message}`);
    return res.status(500).json({
      message: "Erreur interne du serveur",
      error: err.message,
    });
  }
};
