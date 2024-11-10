// C:\projetChatGPT\backend\routes\users.js

const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth'); // Importer le middleware d'authentification

const prisma = new PrismaClient();

// Fonction pour exclure le mot de passe des réponses
const excludePassword = (user) => {
    const { password, ...userWithoutPassword } = user; // Exclure le mot de passe
    return userWithoutPassword;
};

// Ajouter un utilisateur
router.post('/', async (req, res) => {
    console.log(req.body); // Log des données reçues

    // Vérifiez si req.body est un objet
    if (typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({ message: 'Le corps de la requête doit être un objet JSON valide.' });
    }

    const { firstName, lastName, email, password } = req.body;

    // Validation des données
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        // Hashage du mot de passe avant la création
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer un nouvel utilisateur
        const newUser = await prisma.user.create({
            data: { firstName, lastName, email, password: hashedPassword },
        });
        res.status(201).json(excludePassword(newUser)); // Exclure le mot de passe de la réponse
    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'L\'email doit être unique.' });
        }
        res.status(500).json({ message: 'Erreur lors de la création de l\'utilisateur.', details: error.message });
    }
});

// Obtenir tous les utilisateurs avec authentification
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users.map(excludePassword)); // Exclure le mot de passe de chaque utilisateur
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs.', details: error.message });
    }
});

module.exports = router;
