// 📁 backend/routes/users.js

const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 🔐 Supprimer le mot de passe des réponses
const excludePassword = (user) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// ✅ GET tous les utilisateurs
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(excludePassword));
  } catch (error) {
    console.error("❌ Erreur récupération utilisateurs :", error);
    res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', details: error.message });
  }
});

// ✅ PATCH utilisateur
router.patch('/:id', authenticateJWT, async (req, res) => {
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(excludePassword(updatedUser));
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour.', details: error.message });
  }
});

// ✅ DELETE utilisateur
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression.', details: error.message });
  }
});

module.exports = router;
