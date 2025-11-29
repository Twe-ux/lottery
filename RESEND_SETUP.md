# Configuration Resend pour l'envoi d'emails

## 📧 Configuration en production

### 1. Créer un compte Resend

1. Aller sur [resend.com](https://resend.com)
2. Créer un compte gratuit ou payant selon vos besoins
3. Vérifier votre domaine (ou utiliser le domaine de test fourni par Resend)

### 2. Obtenir votre clé API

1. Aller dans **Settings** > **API Keys**
2. Cliquer sur **Create API Key**
3. Donner un nom à la clé (ex: "Production ReviewLottery")
4. Copier la clé générée (elle commence par `re_`)

### 3. Configurer les variables d'environnement

Dans votre fichier `.env.local` (ou variables Vercel) :

```bash
# Clé API Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Email expéditeur (doit être vérifié dans Resend)
RESEND_FROM_EMAIL=ReviewLottery <noreply@votredomaine.com>
```

### 4. Vérifier votre domaine (recommandé pour la production)

Pour éviter que vos emails soient marqués comme spam :

1. Dans Resend, aller dans **Domains**
2. Ajouter votre domaine
3. Configurer les enregistrements DNS (SPF, DKIM, DMARC)
4. Attendre la vérification (quelques minutes à quelques heures)

Une fois vérifié, vous pouvez utiliser n'importe quelle adresse de ce domaine comme expéditeur.

## 🧪 Test en développement

Sans clé API configurée, l'application fonctionnera en mode "simulation" :
- Les emails ne seront pas envoyés
- Un message de confirmation sera affiché
- Les logs montreront le contenu de l'email qui aurait été envoyé

## 📊 Limites du plan gratuit

- **100 emails/jour**
- **3,000 emails/mois**
- 1 domaine vérifié
- Support email

Pour des volumes plus importants, consulter [les plans payants](https://resend.com/pricing).

## 🎨 Template d'email

L'email envoyé aux clients contient :
- **En-tête coloré** avec titre "Félicitations !"
- **Carte du prix** avec nom, description et valeur
- **Code de réclamation** en gros et en évidence
- **Date d'expiration** clairement visible
- **Instructions** pour récupérer le gain
- **Bouton CTA** pour voir le gain en ligne
- Design responsive compatible mobile/desktop

## 🔧 Personnalisation

Pour modifier le template d'email, éditer :
```
/app/api/send-prize-email/route.ts
```

Le template utilise des tables HTML pour garantir une compatibilité maximale avec tous les clients email.
