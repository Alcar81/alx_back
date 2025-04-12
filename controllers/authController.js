// 📌 backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

exports.registerUser = async (req, res) => {
  console.log("🟡 [registerUser] ➜ Requête reçue");

  const { firstName, lastName, email, password } = req.body;
  console.log("📩 Données reçues :", { firstName, lastName, email });

  if (!firstName || !lastName || !email || !password) {
    console.warn("⚠️ Champs manquants");
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    console.log("🔎 Vérification si l'utilisateur existe...");
    const userExist = await prisma.user.findUnique({ where: { email } });

    if (userExist) {
      console.warn("⚠️ Email déjà utilisé :", email);
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    console.log("🔐 Hashage du mot de passe...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Mot de passe hashé");

    console.log("🛠️ Création de l'utilisateur dans la base de données...");
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    console.log("✅ Utilisateur créé :", { id: newUser.id, email: newUser.email });

    return res.status(201).json({
      message: "Inscription réussie",
      userId: newUser.id,
    });
  } catch (err) {
    console.error("❌ Erreur dans registerUser :", err);
    return res.status(500).json({ message: "Erreur serveur", details: err.message });
  }
};
