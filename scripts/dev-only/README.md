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
