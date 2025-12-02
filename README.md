# ReviewLottery - MVP Phase 1

Application SaaS de gamification de collecte d'avis Google pour commerces.

## 🎯 Concept

ReviewLottery permet aux commerces de gamifier la collecte d'avis Google en offrant à leurs clients une chance de gagner des lots via une roue de loterie après avoir laissé un avis.

## 🚀 Fonctionnalités MVP (Phase 1)

### ✅ Administration

- 🔐 Authentification admin (NextAuth.js)
- 🏪 Gestion des commerces (CRUD)
- 🎁 Gestion des lots avec probabilités personnalisables
- 📢 Gestion des campagnes
- ⭐ Suivi des avis clients
- 🏆 Gestion des gagnants et validation des gains
- 📱 Génération de QR codes pour les campagnes
- ⚙️ Paramètres du compte

### ✅ Côté Client

- 🎯 Landing page par commerce (scan QR code)
- ✍️ Formulaire de soumission d'avis
- 🎰 Roue de loterie animée (Framer Motion)
- 🎫 Page de résultat avec code de réclamation + QR code
- ✅ 100% gagnant - Aucun perdant

## 🛠️ Stack Technique

- **Frontend**: Next.js 15+ (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Auth**: NextAuth.js
- **Animations**: Framer Motion
- **QR Codes**: qrcode

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Editer .env.local avec votre MongoDB URI
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Lancer la base de données (seed)
npm run seed

# Démarrer le serveur de développement
npm run dev
```

## 🔑 Accès

### Admin Dashboard

- URL: http://localhost:3001/dashboard
- Email: `admin@reviewlottery.com`
- Password: `admin123`

### Page Client (Démo)

- URL: http://localhost:3001/cafe-demo

## 📁 Structure du Projet

```
/app
  /dashboard          # Pages admin
    /commerces        # Gestion commerces
    /prizes           # Gestion lots
    /campaigns        # Gestion campagnes
    /reviews          # Suivi avis
    /winners          # Gestion gagnants
    /qrcodes          # QR codes
    /settings         # Paramètres
  /[commerceSlug]     # Pages client
    /page.tsx         # Landing page
    /lottery          # Page loterie
    /prize/[code]     # Page gain
  /api                # API Routes
    /auth             # NextAuth
    /commerces        # CRUD commerces
    /prizes           # CRUD lots
    /campaigns        # CRUD campagnes
    /reviews          # Gestion avis
    /winners          # Gestion gains
    /lottery/spin     # Tirage loterie

/lib
  /db
    /models           # Mongoose models
    /connect.ts       # MongoDB connection
  /auth               # NextAuth config
  /lottery
    /engine.ts        # Moteur de loterie
    /claim-code.ts    # Génération codes

/components
  /admin              # Composants admin
  /client             # Composants client
```

## 🎲 Moteur de Loterie

Le système de loterie supporte deux modes de probabilités:

### Mode Fixed (Fixe)

Chaque lot a une probabilité fixe définie (ex: 40%, 30%, 20%, 10%)

### Mode Star-Based (Basé sur les étoiles)

Les probabilités varient selon la note donnée par le client:

- ⭐ (1 étoile): Meilleurs lots plus probables
- ⭐⭐⭐⭐⭐ (5 étoiles): Tous les lots équiprobables

## 🎯 Workflow Client

1. Client scanne le QR code du commerce
2. Redirigé vers la landing page
3. Remplit le formulaire d'avis (nom, email, note, commentaire)
4. Soumission de l'avis
5. Accès à la roue de loterie
6. Clic sur "Lancer" → Tirage server-side
7. Animation de la roue
8. Affichage du résultat avec code de réclamation + QR code
9. Présentation du code en magasin pour récupérer le lot

## 📊 Models MongoDB

1. **User**: Comptes admin/employés
2. **Commerce**: Établissements clients
3. **Prize**: Lots configurables
4. **Campaign**: Campagnes avec dates et paramètres
5. **Review**: Avis clients
6. **Participation**: Historique des tirages
7. **Winner**: Gains à récupérer

## 🔐 Sécurité

- ✅ Tirage de loterie côté serveur (pas de triche possible)
- ✅ Codes de réclamation uniques (RVW-XXXXXX)
- ✅ Vérification d'unicité par email (1 participation max par campagne)
- ✅ Expiration des gains (30 jours par défaut)
- ✅ Authentification admin avec NextAuth

## 📝 TODO Phase 2

- [ ] Intégration Google OAuth pour clients
- [ ] Publication automatique des avis sur Google
- [ ] Webhook pour notifications
- [ ] Envoi d'emails (confirmation, rappels)
- [ ] Statistiques avancées et analytics
- [ ] Export de données (CSV, PDF)
- [ ] Gestion multi-commerces pour un seul compte
- [ ] Rôles et permissions avancés
- [ ] API publique pour intégrations tierces

## 🤝 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.

## 📄 Licence

Propriétaire - Tous droits réservés
