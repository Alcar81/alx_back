// c:\projetChatGPT\backend\database.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tester la connexion
async function testConnection() {
    try {
        await prisma.$connect();
        console.log('Connexion à la base de données réussie !');
    } catch (err) {
        console.error('Impossible de se connecter à la base de données :', err);
    }
}

testConnection();

module.exports = prisma;
