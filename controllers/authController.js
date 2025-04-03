// 📌 backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  console.log("📩 Données reçues pour l'inscription :", req.body);

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const userExist = await prisma.user.findUnique({ where: { email } });

    if (userExist) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "Inscription réussie",
      userId: newUser.id,
    });
  } catch (err) {
    console.error("❌ Erreur d'inscription :", err);
    return res.status(500).json({ message: "Erreur serveur", details: err.message });
  }
};
