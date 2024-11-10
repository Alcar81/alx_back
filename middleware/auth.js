// C:\projetChatGPT\backend\middleware\auth.js

const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(403).json({ message: 'Token manquant, accès refusé.' }); // Forbidden
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erreur de vérification du token:', err);
            return res.status(403).json({ message: 'Token invalide.' }); // Forbidden
        }
        req.user = user;
        next();
    });
};

module.exports = {
    authenticateJWT,
};
