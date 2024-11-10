const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Hacher le mot de passe défini dans .env
  const password = process.env.DEMO_USER_PASSWORD;
  if (!password) {
    throw new Error("Le mot de passe DEMO_USER_PASSWORD n'est pas défini dans .env");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  // Créer des utilisateurs démo
  await prisma.user.createMany({
    data: [
      {
        email: 'jean.dupont@example.com',
        password: hashedPassword,
        name: 'Jean Dupont',
        createdAt: new Date(),
      },
      {
        email: 'marie.curie@example.com',
        password: hashedPassword,
        name: 'Marie Curie',
        createdAt: new Date(),
      },
    ],
    skipDuplicates: true, // Ignore les erreurs si l'utilisateur existe déjà
  });

  console.log('Utilisateurs démo ajoutés avec succès.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
