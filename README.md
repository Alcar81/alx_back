📄 backend/README.md

# 📦 Backend - AlxMultimedia

Bienvenue dans le backend du projet **AlxMultimedia**.

Ce backend est construit avec :

- ⚡ Express.js
- 🔒 Authentification sécurisée JWT
- 🛢 Prisma ORM pour la base de données
- 📋 Winston pour la journalisation (`server.log`)
- 🧠 Middlewares personnalisés pour la sécurité

---

## 📂 Structure du projet

backend/
  ├── controllers/ # Logique métier (register, login, etc.)
  ├── middleware/ # Authentification et autorisations
  ├── routes/ # Définition des routes API
  ├── utils/ # Logger et utilitaires
  ├── prisma/ # Définition du schéma Prisma
  ├── doc/ # Documentation interne
  ├── server.js # Point d'entrée du serveur Express 
  └── README.md # Ce fichier


---

## 🚀 Lancer le serveur en local

1. Installer les dépendances :

```bash
npm install
Configurer votre fichier .env :

env
Copier
Modifier
JWT_SECRET=ton_secret_ici
DATABASE_URL=postgresql://user:password@localhost:5432/nom_de_ton_db
Générer Prisma :

bash
Copier
Modifier
npx prisma generate
Lancer le serveur :

bash
Copier
Modifier
npm start
Le serveur sera accessible sur http://localhost:7000 ou selon ton port.

🔐 Authentification
Utilisation de JWT (JSON Web Tokens).

L'utilisateur doit fournir un token dans l'en-tête Authorization: Bearer <token>.

Les routes sont protégées par authenticateToken et/ou authorizeRoles.

🧠 Middlewares utilisés

Middleware	Rôle
authenticateToken	Vérifie et charge l'utilisateur connecté depuis son token JWT
authorizeRoles(["ADMIN"])	Autorise l'accès seulement à certains rôles
requireSelfOrAdmin	Autorise un utilisateur à modifier son profil, ou un admin
📋 Routes principales

Méthode	Endpoint	Protection	Description
POST	/api/register	❌ Public	Inscription d'un nouvel utilisateur
POST	/api/login	❌ Public	Connexion d'un utilisateur
GET	/api/me	🔒 Authentifié	Récupérer ses propres infos
GET	/api/users	🔒 Authentifié	Récupérer tous les utilisateurs
PATCH	/api/users/:id	🔒 Propriétaire ou Admin	Modifier un utilisateur
PATCH	/api/users/:id/password	🔒 Propriétaire ou Admin	Modifier son mot de passe
DELETE	/api/users/:id	🔒 Propriétaire ou Admin	Supprimer un utilisateur
GET	/api/admin/dashboard	🔒 Admin uniquement	Tableau de bord d'administration
📜 Journalisation
Tous les accès, tentatives refusées et erreurs critiques sont logués dans backend/logs/server.log via Winston.

📚 Documentation complémentaire
Voir doc/architecture_backend.md pour plus de détails sur l'architecture technique.

📢 Notes
Ce backend est conçu pour fonctionner derrière un reverse proxy (OpenLiteSpeed / Nginx).

Toutes les communications sont sécurisées via HTTPS en production.

La journalisation est activée sur tous les accès sensibles.

Les bonnes pratiques de développement sont appliquées (contrôle d'accès, sanitation des données, erreurs explicites).

🔥 Auteur
Projet développé par Alexandre Carignan

En collaboration technique avec ChatGPT 🤖