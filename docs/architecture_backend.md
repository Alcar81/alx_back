backend/
├── controllers/
│   └── authController.js       # Logique métier pour /register et /login
├── middleware/
│   ├── authMiddleware.js        # 🔒 Vérifie token + charge utilisateur + logger
│   └── requireSelfOrAdmin.js     # 🔒 Vérifie que l'utilisateur est owner ou admin
├── routes/
│   ├── auth.js                  # Routes : /register, /login, /me
│   ├── users.js                 # Routes : /users, /users/:id, /users/:id/password
│   └── admin.js                 # Routes : /admin/dashboard, /admin/settings
├── utils/
│   └── logger.js                # 📋 Winston logger (trace dans server.log)
├── prisma/
│   └── schema.prisma            # 📄 Définition DB (User, Role, UserRole, etc.)
├── server.js                    # 🚀 Lance le serveur Express
└── doc/
    └── architecture_backend.md  # 📚 (futur fichier pour documenter ton backend)


📚 Middleware Application

Fichier	Fonction	Où utilisé ?
authMiddleware.js	Vérifie et authentifie le token JWT, charge req.user, trace les accès	Partout (auth, users, admin)
requireSelfOrAdmin.js	Autoriser uniquement le propriétaire de la ressource OU un admin	PATCH/DELETE sur /users/:id

📋 Résumé des routes

Route	Protection appliquée	Description
POST /register	❌ (public)	Créer un nouvel utilisateur
POST /login	❌ (public)	Authentifier un utilisateur
GET /me	authenticateToken	Récupérer son profil connecté
GET /users	authenticateToken	Liste tous les utilisateurs (connecté requis)
PATCH /users/:id	authenticateToken + requireSelfOrAdmin	Modifier ses infos ou être admin
PATCH /users/:id/password	authenticateToken + requireSelfOrAdmin	Changer son mot de passe
DELETE /users/:id	authenticateToken + requireSelfOrAdmin	Supprimer son compte ou par admin
GET /admin/dashboard	authenticateToken + authorizeRoles(["ADMIN"])	Accès admin uniquement
GET /admin/settings	authenticateToken + authorizeRoles(["ADMIN"])	Accès admin uniquement
🚀 Flow d'une requête protégée
Exemple : accéder à /users/123

markdown
Copier
Modifier
1. L'utilisateur fait une requête PATCH /users/123 avec son token JWT.

2. Le serveur passe dans authenticateToken :
    - Vérifie le token,
    - Recharge les infos de l'utilisateur depuis Prisma,
    - Enregistre l'accès dans server.log.

3. Ensuite, le serveur passe dans requireSelfOrAdmin :
    - Vérifie si req.user.id === req.params.id
    - OU si req.user.roles contient "ADMIN"
    - Sinon => 403 Forbidden.

4. Si autorisé ➔ passe au contrôleur pour effectuer la modification.

✨ Résumé Visuel Ultra-Compact
   
    Frontend
      ↳ Auth ➔ Token JWT 
    Backend (server.js)
      ↳ Middleware authenticateToken
        ↳ Middleware requireSelfOrAdmin (optionnel selon route)
          ↳ Contrôleur (authController, userController, etc.)
            ↳ Prisma ORM (DB)


🎯 Conclusion
✅ Backend propre
✅ Sécurisé
✅ Traçable dans server.log
✅ Prêt pour Production
✅ Documenté pour tes futurs toi ou collaborateurs