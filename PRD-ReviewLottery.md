# PRD - ReviewLottery
## Application de Loterie avec Avis Google pour Commerces

---

## 1. Vue d'ensemble

### 1.1 Résumé exécutif
ReviewLottery est une plateforme SaaS permettant aux commerces de gamifier la collecte d'avis Google. Les clients scannent un QR code, rédigent un avis via l'interface de l'application (connectée à leur compte Google), puis accèdent à une roulette pour gagner un cadeau. Chaque commerce configure ses propres lots et probabilités.

### 1.2 Objectifs
- Augmenter le nombre d'avis Google pour les commerces partenaires
- Offrir une expérience ludique aux clients avec une roulette animée
- Fournir un dashboard complet pour la gestion des campagnes et le suivi des gains
- Garantir que chaque participation génère un gain (pas de perdant)

### 1.3 Stack Technique
- **Frontend** : Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend** : Next.js API Routes / Server Actions
- **Base de données** : MongoDB avec Mongoose
- **Authentification** : NextAuth.js (credentials pour admin, OAuth Google pour clients)
- **Animations** : Framer Motion (roulette)
- **QR Codes** : Génération dynamique (qrcode ou react-qr-code)

---

## 2. Architecture

### 2.1 Structure du projet
```
src/
├── app/
│   ├── (client)/                    # Routes publiques client
│   │   ├── [commerceSlug]/          # Page commerce dynamique
│   │   │   ├── page.tsx             # Landing + scan QR info
│   │   │   ├── review/page.tsx      # Rédaction avis (OAuth Google)
│   │   │   ├── lottery/page.tsx     # Roulette
│   │   │   └── prize/[code]/page.tsx # Page gain avec code
│   │   └── layout.tsx
│   │
│   ├── (admin)/                     # Routes dashboard admin
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # Overview stats
│   │   │   ├── commerces/           # Gestion commerces
│   │   │   ├── prizes/              # Configuration lots
│   │   │   ├── campaigns/           # Campagnes actives
│   │   │   ├── reviews/             # Suivi avis postés
│   │   │   ├── winners/             # Suivi gains/réclamations
│   │   │   ├── qrcodes/             # Gestion QR codes
│   │   │   └── settings/            # Paramètres compte
│   │   └── layout.tsx
│   │
│   ├── api/
│   │   ├── auth/[...nextauth]/      # NextAuth config
│   │   ├── google/                  # Intégration Google Reviews
│   │   │   ├── auth/route.ts        # OAuth Google client
│   │   │   └── post-review/route.ts # Publication avis
│   │   ├── commerces/               # CRUD commerces
│   │   ├── prizes/                  # CRUD lots
│   │   ├── campaigns/               # CRUD campagnes
│   │   ├── lottery/
│   │   │   ├── spin/route.ts        # Tirage roulette
│   │   │   └── claim/route.ts       # Réclamation gain
│   │   ├── qrcodes/                 # Génération QR
│   │   └── stats/                   # Statistiques
│   │
│   ├── layout.tsx
│   └── page.tsx                     # Landing page SaaS
│
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── client/
│   │   ├── ReviewForm.tsx           # Formulaire avis
│   │   ├── RouletteWheel.tsx        # Composant roulette animée
│   │   ├── PrizeReveal.tsx          # Révélation du gain
│   │   └── GoogleAuthButton.tsx     # Connexion Google
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── StatsCards.tsx
│   │   ├── PrizeConfigurator.tsx    # Config lots + probas
│   │   ├── CampaignForm.tsx
│   │   ├── WinnersTable.tsx
│   │   ├── ReviewsTable.tsx
│   │   └── QRCodeGenerator.tsx
│   └── shared/
│       ├── Header.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── db/
│   │   ├── connect.ts               # Connexion MongoDB
│   │   └── models/
│   │       ├── User.ts              # Admin users
│   │       ├── Commerce.ts          # Commerces
│   │       ├── Prize.ts             # Lots/cadeaux
│   │       ├── Campaign.ts          # Campagnes
│   │       ├── Review.ts            # Avis postés
│   │       ├── Participation.ts     # Participations loterie
│   │       └── Winner.ts            # Gains
│   ├── google/
│   │   ├── oauth.ts                 # Config OAuth Google
│   │   └── reviews-api.ts           # API Google Reviews
│   ├── lottery/
│   │   ├── engine.ts                # Logique tirage
│   │   └── probability.ts           # Calcul probabilités
│   ├── qrcode/
│   │   └── generator.ts             # Génération QR dynamique
│   └── utils/
│       ├── auth.ts                  # Helpers auth
│       └── helpers.ts
│
├── hooks/
│   ├── useRoulette.ts               # Hook animation roulette
│   └── useCampaign.ts
│
└── types/
    └── index.ts                     # Types TypeScript
```

### 2.2 Modèles de données (MongoDB/Mongoose)

```typescript
// Commerce
{
  _id: ObjectId,
  name: string,
  slug: string,                      // URL unique
  googlePlaceId: string,             // ID Google Maps
  googleBusinessUrl: string,         // Lien page Google Business
  logo?: string,
  primaryColor?: string,             // Personnalisation
  ownerId: ObjectId,                 // Ref User admin
  subscription: {
    plan: 'free' | 'pro' | 'enterprise',
    validUntil: Date
  },
  settings: {
    probabilityMode: 'fixed' | 'star-based',  // Mode de probabilité
    defaultExpirationDays: number,            // Expiration gains par défaut
  },
  createdAt: Date,
  updatedAt: Date
}

// Prize (Lot/Cadeau)
{
  _id: ObjectId,
  commerceId: ObjectId,
  name: string,                      // "Café offert", "10% de réduction"
  description?: string,
  image?: string,
  value?: number,                    // Valeur en euros (optionnel)
  
  // Configuration probabilité
  probability: {
    mode: 'fixed' | 'star-based',
    
    // Mode fixe : pourcentage global
    fixedPercent?: number,           // ex: 25 = 25% de chance
    
    // Mode star-based : pourcentage par nombre d'étoiles
    starBased?: {
      star1: number,                 // % si avis 1 étoile
      star2: number,                 // % si avis 2 étoiles
      star3: number,                 // % si avis 3 étoiles
      star4: number,                 // % si avis 4 étoiles
      star5: number,                 // % si avis 5 étoiles
    }
  },
  
  stock?: number,                    // null = illimité
  isActive: boolean,
  displayOrder: number,              // Ordre sur la roulette
  color: string,                     // Couleur segment roulette
  createdAt: Date,
  updatedAt: Date
}

// Campaign (Campagne)
{
  _id: ObjectId,
  commerceId: ObjectId,
  name: string,
  startDate: Date,
  endDate: Date,
  isActive: boolean,
  prizes: [ObjectId],                // Refs Prize
  qrCodeUrl: string,                 // URL encodée dans QR
  qrCodeImage: string,               // QR code généré (base64 ou URL)
  settings: {
    expirationDays: number,          // Jours avant expiration gain
    maxParticipations?: number,      // Limite totale participations
  },
  stats: {
    totalScans: number,
    totalReviews: number,
    totalWinners: number,
  },
  createdAt: Date,
  updatedAt: Date
}

// Review (Avis posté)
{
  _id: ObjectId,
  campaignId: ObjectId,
  commerceId: ObjectId,
  
  // Info client
  clientEmail: string,
  clientName: string,
  clientGoogleId: string,
  
  // Avis
  rating: 1 | 2 | 3 | 4 | 5,
  reviewText: string,
  googleReviewId?: string,           // ID retourné par Google
  googleReviewUrl?: string,          // Lien vers l'avis
  
  status: 'pending' | 'posted' | 'failed',
  postedAt?: Date,
  
  // Lien participation
  participationId?: ObjectId,
  
  createdAt: Date
}

// Participation (Participation loterie)
{
  _id: ObjectId,
  reviewId: ObjectId,
  campaignId: ObjectId,
  commerceId: ObjectId,
  
  clientEmail: string,
  clientName: string,
  
  // Résultat
  prizeWonId: ObjectId,              // Ref Prize
  spinResult: {
    angle: number,                   // Angle final roulette
    segment: number,                 // Index segment
  },
  
  createdAt: Date
}

// Winner (Gain)
{
  _id: ObjectId,
  participationId: ObjectId,
  reviewId: ObjectId,
  campaignId: ObjectId,
  commerceId: ObjectId,
  prizeId: ObjectId,
  
  clientEmail: string,
  clientName: string,
  
  // Code unique réclamation
  claimCode: string,                 // ex: "RVW-A1B2C3"
  claimQrCode?: string,              // QR du code (optionnel)
  
  status: 'pending' | 'claimed' | 'expired',
  expiresAt: Date,
  claimedAt?: Date,
  claimedBy?: string,                // Nom employé qui a validé
  
  // Snapshot du prix (au cas où modifié après)
  prizeSnapshot: {
    name: string,
    description?: string,
    value?: number,
  },
  
  createdAt: Date,
  updatedAt: Date
}

// User (Admin)
{
  _id: ObjectId,
  email: string,
  password: string,                  // hashé
  name: string,
  role: 'super_admin' | 'commerce_admin' | 'employee',
  commerceId?: ObjectId,             // Si commerce_admin ou employee
  permissions: string[],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 3. Fonctionnalités détaillées

### 3.1 Parcours Client

#### 3.1.1 Scan QR Code & Landing
1. Client scanne le QR code (affiché en commerce)
2. Redirection vers `/{commerceSlug}?campaign={campaignId}`
3. Page d'accueil commerce avec :
   - Logo et nom du commerce
   - Explication du concept (avis → roulette → cadeau)
   - Aperçu des lots à gagner
   - Bouton "Participer" → connexion Google

#### 3.1.2 Connexion Google & Rédaction Avis
1. OAuth Google (scope: profil + écriture avis Google Business)
2. Formulaire de rédaction :
   - Sélecteur d'étoiles (1-5) avec animations
   - Zone de texte pour l'avis (min 10 caractères)
   - Prévisualisation
3. Bouton "Publier mon avis"
4. L'app poste l'avis via l'API Google au nom du client
5. Confirmation + redirection vers la roulette

#### 3.1.3 Loterie (Roulette)
1. Page avec roulette animée (Framer Motion)
2. Segments colorés avec noms des lots
3. Bouton "Lancer la roulette"
4. Animation de rotation (3-5 secondes)
5. Arrêt sur le lot gagné (calculé côté serveur)
6. Animation de célébration (confettis)
7. Affichage du gain avec :
   - Nom du cadeau
   - Code de réclamation unique
   - QR code du code
   - Date d'expiration
   - Instructions de réclamation

#### 3.1.4 Page Récapitulatif Gain
- URL unique : `/{commerceSlug}/prize/{claimCode}`
- Affichage du gain, code, QR, expiration
- Possibilité d'envoyer par email
- Le client peut montrer cette page en caisse

### 3.2 Dashboard Admin

#### 3.2.1 Authentification Admin
- Login email/password (NextAuth credentials)
- Rôles : super_admin, commerce_admin, employee
- Protection des routes via middleware

#### 3.2.2 Overview Dashboard
- Statistiques globales :
  - Nombre de scans QR (aujourd'hui/semaine/mois/total)
  - Nombre d'avis postés
  - Taux de conversion scan → avis
  - Nombre de gains distribués
  - Gains réclamés vs non réclamés
- Graphiques évolution temporelle
- Derniers avis postés
- Derniers gains

#### 3.2.3 Gestion Commerces (Super Admin)
- Liste des commerces inscrits
- Création/édition commerce
- Configuration Google Place ID
- Personnalisation (logo, couleurs)
- Gestion abonnement

#### 3.2.4 Configuration des Lots
Interface de configuration des cadeaux avec 2 modes au choix :

**Mode 1 : Probabilité Fixe**
```
| Lot              | Probabilité | Stock  | Actif |
|------------------|-------------|--------|-------|
| Café offert      | 40%         | ∞      | ✓     |
| -10% sur commande| 35%         | 100    | ✓     |
| Dessert offert   | 20%         | 50     | ✓     |
| Menu offert      | 5%          | 10     | ✓     |
```
*Total doit = 100%*

**Mode 2 : Probabilité selon Étoiles**
```
| Lot              | ⭐1  | ⭐2  | ⭐3  | ⭐4  | ⭐5  | Stock |
|------------------|------|------|------|------|------|-------|
| Café offert      | 80%  | 60%  | 40%  | 20%  | 10%  | ∞     |
| -10% sur commande| 15%  | 25%  | 35%  | 40%  | 30%  | 100   |
| Dessert offert   | 5%   | 10%  | 20%  | 30%  | 40%  | 50    |
| Menu offert      | 0%   | 5%   | 5%   | 10%  | 20%  | 10    |
```
*Total par colonne doit = 100%*

**Fonctionnalités configuration :**
- Drag & drop pour réordonner
- Color picker pour couleur segment roulette
- Upload image du lot
- Activation/désactivation rapide
- Gestion stock avec alertes bas stock

#### 3.2.5 Gestion Campagnes
- Création campagne avec :
  - Nom, dates début/fin
  - Sélection des lots actifs
  - Durée expiration gains
  - Limite participations (optionnel)
- Génération automatique QR code dynamique
- Téléchargement QR (PNG, SVG, PDF pour impression)
- Duplication campagne
- Archivage

#### 3.2.6 Suivi des Avis
Table avec :
- Date/heure
- Nom client
- Email client
- Note (étoiles)
- Extrait avis
- Statut (posté/échec)
- Lien vers avis Google
- Lot gagné

Filtres : période, note, campagne
Export CSV/Excel

#### 3.2.7 Suivi des Gains (Winners)
Table avec :
- Date/heure gain
- Nom client
- Email
- Lot gagné
- Code réclamation
- Statut (en attente/réclamé/expiré)
- Date réclamation
- Validé par (employé)

Actions :
- Marquer comme réclamé
- Renvoyer email au client
- Prolonger expiration
- Annuler gain

Filtres : période, lot, statut, campagne
Export CSV/Excel

#### 3.2.8 Gestion QR Codes
- Liste des QR codes générés
- Régénération QR
- Statistiques par QR (scans)
- Téléchargement multiple formats

#### 3.2.9 Paramètres
- Profil utilisateur
- Gestion équipe (inviter employés)
- Configuration emails (templates)
- Intégration Google (reconnexion si besoin)
- Webhooks (optionnel)

---

## 4. Intégration Google

### 4.1 Google OAuth pour Clients
```typescript
// Scopes requis
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/business.manage',  // Pour poster avis
];
```

### 4.2 Publication d'avis
**Option recommandée : Google Business Profile API**

L'API Google Business Profile permet de gérer les avis, mais la publication directe d'avis au nom d'un utilisateur est restreinte. 

**Solution alternative (plus réaliste) :**
1. Client connecté via OAuth Google
2. L'app génère le texte de l'avis
3. Redirection vers la page Google de l'établissement avec pré-remplissage si possible
4. Le client publie manuellement (1 clic)
5. Webhook ou vérification périodique pour confirmer la publication
6. OU : confiance utilisateur avec case à cocher "J'ai publié mon avis"

**Note importante :** L'API Google My Business ne permet pas de poster des avis au nom des utilisateurs pour des raisons évidentes de fraude. La solution sera :
1. Ouvrir la page d'avis Google dans un nouvel onglet/iframe
2. L'utilisateur publie lui-même
3. Retour sur l'app + déclaration "J'ai publié mon avis" + sélection des étoiles données
4. Vérification optionnelle via scraping ou API (complexe)

---

## 5. Logique de la Loterie

### 5.1 Algorithme de tirage
```typescript
// lottery/engine.ts
interface SpinResult {
  prizeId: string;
  prizeName: string;
  angle: number;      // Angle final pour animation
  segment: number;    // Index du segment
}

function spinRoulette(
  prizes: Prize[],
  starRating?: number,
  mode: 'fixed' | 'star-based'
): SpinResult {
  // 1. Filtrer les lots actifs avec stock disponible
  const availablePrizes = prizes.filter(p => 
    p.isActive && (p.stock === null || p.stock > 0)
  );
  
  // 2. Calculer les probabilités selon le mode
  let probabilities: number[];
  
  if (mode === 'fixed') {
    probabilities = availablePrizes.map(p => p.probability.fixedPercent);
  } else {
    const starKey = `star${starRating}` as keyof StarBased;
    probabilities = availablePrizes.map(p => p.probability.starBased[starKey]);
  }
  
  // 3. Normaliser si le total ≠ 100 (à cause du stock)
  const total = probabilities.reduce((a, b) => a + b, 0);
  const normalized = probabilities.map(p => p / total);
  
  // 4. Tirage aléatoire pondéré
  const random = Math.random();
  let cumulative = 0;
  let selectedIndex = 0;
  
  for (let i = 0; i < normalized.length; i++) {
    cumulative += normalized[i];
    if (random <= cumulative) {
      selectedIndex = i;
      break;
    }
  }
  
  // 5. Calculer l'angle pour l'animation
  const segmentAngle = 360 / availablePrizes.length;
  const baseAngle = selectedIndex * segmentAngle;
  const randomOffset = Math.random() * (segmentAngle * 0.8); // Éviter les bords
  const spins = 5 + Math.floor(Math.random() * 3); // 5-7 tours
  const finalAngle = (spins * 360) + baseAngle + randomOffset;
  
  return {
    prizeId: availablePrizes[selectedIndex]._id,
    prizeName: availablePrizes[selectedIndex].name,
    angle: finalAngle,
    segment: selectedIndex,
  };
}
```

### 5.2 Garantie de gain
- Toujours au moins 1 lot actif avec stock disponible
- Vérification avant spin : si aucun lot dispo → message d'erreur
- Le lot "par défaut" peut être configuré (ex: petit cadeau symbolique)

### 5.3 Sécurité
- Le tirage est effectué côté serveur
- L'angle est retourné au client pour l'animation
- Vérification anti-fraude :
  - 1 participation par email par campagne
  - Rate limiting sur l'API
  - Tokens CSRF

---

## 6. Composant Roulette

### 6.1 Spécifications visuelles
```typescript
// components/client/RouletteWheel.tsx
interface RouletteWheelProps {
  prizes: Prize[];
  onSpinComplete: (result: SpinResult) => void;
  disabled?: boolean;
}

// Caractéristiques :
// - Roue divisée en segments colorés
// - Chaque segment : couleur + nom du lot + icône optionnelle
// - Flèche/pointeur en haut (fixe)
// - Animation de rotation avec easing (ease-out)
// - Durée : 4-5 secondes
// - Sons optionnels (tick pendant rotation, fanfare à la fin)
// - Confettis à la révélation
```

### 6.2 Animation (Framer Motion)
```typescript
const spinAnimation = {
  rotate: [0, finalAngle],
  transition: {
    duration: 5,
    ease: [0.25, 0.1, 0.25, 1], // Cubic bezier
  }
};
```

---

## 7. Génération Code de Réclamation

### 7.1 Format
```
RVW-XXXXXX

Où XXXXXX = 6 caractères alphanumériques (majuscules + chiffres)
Excluant caractères ambigus : 0, O, I, 1, L

Exemples : RVW-A3B7K9, RVW-M4N2P8
```

### 7.2 Unicité
- Vérification en base avant insertion
- Index unique sur le champ claimCode

---

## 8. QR Codes Dynamiques

### 8.1 URL encodée
```
https://{domain}/{commerceSlug}?c={campaignId}&ref=qr

Paramètres :
- c : ID campagne (pour tracking)
- ref : source (qr, email, social, etc.)
```

### 8.2 Génération
```typescript
// lib/qrcode/generator.ts
import QRCode from 'qrcode';

async function generateCampaignQR(campaign: Campaign): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_URL}/${campaign.commerce.slug}?c=${campaign._id}&ref=qr`;
  
  const options = {
    width: 1024,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  };
  
  return await QRCode.toDataURL(url, options);
}
```

---

## 9. Notifications

### 9.1 Emails transactionnels
- **Confirmation participation** : Récap avis + gain + code
- **Rappel expiration** : J-3 avant expiration du gain
- **Gain expiré** : Notification d'expiration

### 9.2 Provider recommandé
- Resend ou Nodemailer avec SMTP

---

## 10. Sécurité

### 10.1 Authentification
- NextAuth.js avec JWT
- Credentials provider pour admin
- Google OAuth pour clients
- Sessions sécurisées (httpOnly, secure, sameSite)

### 10.2 Autorisations
```typescript
// Middleware de vérification
function checkPermission(user: User, action: string, resource: string): boolean {
  // Super admin : tout
  // Commerce admin : son commerce uniquement
  // Employee : lecture + valider gains uniquement
}
```

### 10.3 Protection API
- Rate limiting (upstash/ratelimit)
- Validation Zod sur tous les inputs
- CORS configuré
- Headers sécurité (helmet)

### 10.4 Anti-fraude
- 1 participation par email par campagne
- Vérification Google OAuth token
- Logs de toutes les actions

---

## 11. Performance

### 11.1 Optimisations
- ISR pour pages commerce (revalidate: 60)
- Cache Redis pour stats (optionnel)
- Images optimisées (next/image)
- Lazy loading composants lourds (roulette)

### 11.2 Indexes MongoDB
```javascript
// Indexes recommandés
db.commerces.createIndex({ slug: 1 }, { unique: true });
db.campaigns.createIndex({ commerceId: 1, isActive: 1 });
db.reviews.createIndex({ campaignId: 1, clientEmail: 1 });
db.winners.createIndex({ claimCode: 1 }, { unique: true });
db.winners.createIndex({ commerceId: 1, status: 1 });
db.winners.createIndex({ expiresAt: 1 });
```

---

## 12. Environnement

### 12.1 Variables d'environnement
```env
# App
NEXT_PUBLIC_URL=https://reviewlottery.com
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://...

# NextAuth
NEXTAUTH_URL=https://reviewlottery.com
NEXTAUTH_SECRET=...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Email (Resend)
RESEND_API_KEY=...

# Optionnel
REDIS_URL=...
```

---

## 13. Phases de développement

### Phase 1 : MVP (Sprint 1-2)
- [ ] Setup projet Next.js + MongoDB
- [ ] Modèles de données
- [ ] Auth admin (NextAuth credentials)
- [ ] Dashboard basique (CRUD commerces, lots)
- [ ] Page client simple (sans OAuth Google)
- [ ] Roulette fonctionnelle
- [ ] Génération codes + QR

### Phase 2 : Core Features (Sprint 3-4)
- [ ] OAuth Google clients
- [ ] Intégration publication avis (ou workflow alternatif)
- [ ] Animation roulette complète
- [ ] Système de probabilités (2 modes)
- [ ] Gestion campagnes
- [ ] Suivi gains complet

### Phase 3 : Polish (Sprint 5)
- [ ] Statistiques avancées + graphiques
- [ ] Emails transactionnels
- [ ] Export données
- [ ] Personnalisation commerce
- [ ] Optimisations performance

### Phase 4 : SaaS (Sprint 6+)
- [ ] Landing page SaaS
- [ ] Système d'abonnement
- [ ] Multi-commerce complet
- [ ] Documentation

---

## 14. Livrables attendus

1. **Application Next.js fonctionnelle** avec toutes les fonctionnalités décrites
2. **Documentation technique** (README, setup, API)
3. **Tests** (unitaires sur logique loterie, e2e sur parcours critique)
4. **Scripts de seed** pour données de test

---

## 15. Notes importantes pour Claude Code

### Conventions à respecter
- Composants React : PascalCase
- Fichiers : kebab-case
- Variables/fonctions : camelCase
- Types/Interfaces : PascalCase avec préfixe I optionnel
- Utiliser `"use client"` uniquement quand nécessaire
- Server Components par défaut
- Server Actions pour mutations simples
- API Routes pour logique complexe

### Patterns recommandés
- Zod pour validation
- React Hook Form pour formulaires
- TanStack Query pour data fetching client
- Zustand si state global nécessaire (sinon Context)

### UI/UX
- Design moderne, épuré
- Animations subtiles (Framer Motion)
- Responsive mobile-first
- Accessibilité (a11y) : labels, focus, contraste
- Feedback utilisateur : loading states, toasts, erreurs

---

*Document généré pour Claude Code - ReviewLottery v1.0*
