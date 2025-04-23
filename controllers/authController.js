// 📌 backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

exports.registerUser = async (req, res) => {
  logger.info("🟡 [registerUser] ➜ Requête reçue");

  try {
    const isTestRequest = req.headers["x-test-request"] === "true";

    if (!req.is("application/json")) {
      logger.warn(`⚠️ Type de contenu invalide${isTestRequest ? " (test WARN voulu)" : ""}`);
      return res.status(415).json({ message: "Type de contenu invalide. Utilisez application/json." });
    }

    let { firstName, lastName, email, password } = req.body;
    email = email.toLowerCase();
    logger.info(`📩 Données reçues : ${JSON.stringify({ firstName, lastName, email })}`);

    if (!firstName || !lastName || !email || !password) {
      logger.warn("⚠️ Champs requis manquants");
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const userExist = await prisma.user.findUnique({ where: { email } });
    if (userExist) {
      logger.warn(`⚠️ Email déjà utilisé : ${email}`);
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword },
    });

    logger.info(`✅ Utilisateur créé : ID ${newUser.id}, Email: ${newUser.email}`);

    // 🎯 Attribution automatique du rôle USER
    const defaultRole = await prisma.role.findUnique({ where: { name: "USER" } });

    if (defaultRole) {
      await prisma.userRole.create({
        data: {
          userId: newUser.id,
          roleId: defaultRole.id,
        },
      });
      logger.info(`🔐 Rôle USER attribué à l'utilisateur ${email}`);
    } else {
      logger.warn("⚠️ Le rôle USER n'existe pas dans la table Role.");
    }

    return res.status(201).json({ message: "Inscription réussie", userId: newUser.id });

  } catch (err) {
    logger.error(`❌ Erreur serveur dans registerUser : ${err.message}`);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.loginUser = async (req, res) => {
  logger.info("🟡 [loginUser] ➜ Requête reçue");

  try {
    const isTestRequest = req.headers["x-test-request"] === "true";

    if (!req.is("application/json")) {
      logger.warn(`⚠️ Type de contenu invalide${isTestRequest ? " (test WARN voulu)" : ""}`);
      return res.status(415).json({ message: "Type de contenu invalide. Utilisez application/json." });
    }

    let { email, password } = req.body;
    email = email.toLowerCase();
    logger.info(`📩 Données reçues : ${JSON.stringify({ email })}`);

    if (!email || !password) {
      logger.warn("⚠️ Email ou mot de passe manquant");
      return res.status(400).json({ message: "Email et mot de passe sont requis." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn("❌ Utilisateur non trouvé");
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn("❌ Mot de passe incorrect");
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    logger.info(`✅ Connexion réussie pour ${user.email}`);
    return res.json({
      message: "Connexion réussie",
      token,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

  } catch (err) {
    logger.error(`❌ Erreur serveur dans loginUser : ${err.message}`);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
};