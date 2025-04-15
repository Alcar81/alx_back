// 📌 backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

// Logger vers logs/server.log
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFilePath = path.join(logDir, "server.log");
const logStream = fs.createWriteStream(logFilePath, { flags: "a" });

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  logStream.write(line + "\n");
}

exports.registerUser = async (req, res) => {
  log("🟡 [registerUser] ➜ Requête reçue");

  try {
    if (!req.is("application/json")) {
      log("⚠️ Type de contenu invalide");
      return res.status(415).json({ message: "Type de contenu invalide. Utilisez application/json." });
    }

    const { firstName, lastName, email, password } = req.body;
    log(`📩 Données reçues : ${JSON.stringify({ firstName, lastName, email })}`);

    if (!firstName || !lastName || !email || !password) {
      log("⚠️ Champs requis manquants");
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) {
      log(`⚠️ Email déjà utilisé : ${email}`);
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword },
    });

    log(`✅ Utilisateur créé : ID ${newUser.id}, Email: ${newUser.email}`);
    return res.status(201).json({ message: "Inscription réussie", userId: newUser.id });

  } catch (err) {
    log(`❌ Erreur serveur dans registerUser : ${err.message}`);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.loginUser = async (req, res) => {
  log("🟡 [loginUser] ➜ Requête reçue");

  try {
    if (!req.is("application/json")) {
      log("⚠️ Type de contenu invalide");
      return res.status(415).json({ message: "Type de contenu invalide. Utilisez application/json." });
    }

    const { email, password } = req.body;
    log(`📩 Données reçues : ${JSON.stringify({ email })}`);

    if (!email || !password) {
      log("⚠️ Email ou mot de passe manquant");
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      log("❌ Utilisateur non trouvé");
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      log("❌ Mot de passe incorrect");
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    log(`✅ Connexion réussie pour ${user.email}`);
    return res.json({
      message: "Connexion réussie",
      token,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

  } catch (err) {
    log(`❌ Erreur serveur dans loginUser : ${err.message}`);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
