# 📜 Scripts de Gestion des Utilisateurs de Test (DEV ONLY)

Ce dossier contient des outils réservés **au développement** pour créer ou mettre à jour des comptes de test.

---

## ✨ Fichier : `manageTestUsers.js`

Ce script permet de :

- Créer un utilisateur **Admin** (`testadmin@alxmultimedia.com`)  
- Créer un utilisateur **Usager** (`testusager@alxmultimedia.com`)  
- Vérifier automatiquement si l'utilisateur et son rôle existent (sinon il les crée)
- Associer l'utilisateur à son rôle dans la table `UserRole`

---

## 🛠️ Commandes disponibles

Dans le dossier `backend/`, exécutez :

```bash
node scripts/dev-only/manageTestUsers.js admin

Pour voir également les informations en temps réel dans la console (et pas seulement dans logs/server.log), utilisez l'option --verbose :

node scripts/dev-only/manageTestUsers.js --verbose


Les mots de passe par défaut des utilisateurs de test est : Fake1234!

Ce script est idempotent :
➔ Si les comptes ou rôles existent déjà, ils ne seront pas dupliqués.

Les résultats seront également visibles dans le fichier de logs :
➔ backend/logs/server.log