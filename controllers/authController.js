// 📌 backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const prisma = require("../prisma/client");

exports.registerUser = async (req, res) => {
  const { nom, email, motDePasse } = req.body;

  if (!nom || !email || !motDePasse) {
    return res.status(400).json({ message: "Tous les champs sont requis." });
  }

  try {
    const userExist = await prisma.user.findUnique({ where: { email } });

    if (userExist) {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const [firstName, ...lastNameParts] = nom.trim().split(" ");
    const lastName = lastNameParts.join(" ") || "";

    const nouveau = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({ message: "Inscription réussie", userId: nouveau.id });
  } catch (err) {
    console.error("Erreur d'inscription :", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
