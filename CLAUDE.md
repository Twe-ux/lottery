# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReviewLottery is a SaaS platform that gamifies Google review collection for businesses. Customers scan a QR code, write a review via the app (connected to their Google account), then access a lottery wheel to win a prize. Each business configures their own prizes and probabilities.

**Tech Stack:**
- Frontend: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- Backend: Next.js API Routes / Server Actions
- Database: MongoDB with Mongoose
- Auth: NextAuth.js (credentials for admin, OAuth Google for clients)
- Animations: Framer Motion (lottery wheel)
- QR Codes: qrcode or react-qr-code

## Architecture

### Route Structure

**Client Routes (`/app/(client)/`):**
- `/{commerceSlug}/page.tsx` - Landing page after QR scan
- `/{commerceSlug}/review/page.tsx` - Review writing form (OAuth Google)
- `/{commerceSlug}/lottery/page.tsx` - Lottery wheel
- `/{commerceSlug}/prize/{code}/page.tsx` - Prize claim page with code

**Admin Routes (`/app/(admin)/dashboard/`):**
- `/dashboard/page.tsx` - Statistics overview
- `/dashboard/commerces/` - Commerce management
- `/dashboard/prizes/` - Prize configuration
- `/dashboard/campaigns/` - Campaign management
- `/dashboard/reviews/` - Review tracking
- `/dashboard/winners/` - Prize claim tracking
- `/dashboard/qrcodes/` - QR code management
- `/dashboard/settings/` - Account settings

**API Routes (`/app/api/`):**
- `/api/auth/[...nextauth]/` - NextAuth configuration
- `/api/google/auth/route.ts` - Google OAuth for clients
- `/api/google/post-review/route.ts` - Review publication
- `/api/lottery/spin/route.ts` - Lottery draw (server-side)
- `/api/lottery/claim/route.ts` - Prize claim

### Core Components

**Client Components (`/src/components/client/`):**
- `ReviewForm.tsx` - Review writing form
- `RouletteWheel.tsx` - Animated lottery wheel (Framer Motion)
- `PrizeReveal.tsx` - Prize reveal animation
- `GoogleAuthButton.tsx` - Google OAuth button

**Admin Components (`/src/components/admin/`):**
- `PrizeConfigurator.tsx` - Prize configuration with probability modes
- `CampaignForm.tsx` - Campaign creation/editing
- `WinnersTable.tsx` - Prize claims table
- `QRCodeGenerator.tsx` - Dynamic QR code generation

### Database Models (`/src/lib/db/models/`)

Key models:
- `Commerce.ts` - Business information, slug, Google Place ID
- `Prize.ts` - Prizes with two probability modes:
  - Fixed mode: single percentage for all reviews
  - Star-based mode: different percentages per star rating (1-5)
- `Campaign.ts` - Campaigns with date ranges, prizes, QR codes
- `Review.ts` - Posted reviews (rating, text, Google review ID)
- `Participation.ts` - Lottery participations
- `Winner.ts` - Prize wins with unique claim codes (format: RVW-XXXXXX)
- `User.ts` - Admin users with roles (super_admin, commerce_admin, employee)

### Core Logic (`/src/lib/`)

**Lottery Engine (`lottery/engine.ts`):**
- `spinRoulette()` - Server-side lottery draw with weighted probabilities
- Supports two modes: fixed percentage or star-rating-based
- Guarantees a prize (no losers)
- Returns final angle for animation and selected prize
- Security: all draws happen server-side, client receives only animation data

**Probability System (`lottery/probability.ts`):**
- Mode 1 (Fixed): Each prize has a single percentage (must total 100%)
- Mode 2 (Star-based): Each prize has 5 percentages (one per star rating, each column must total 100%)
- Normalizes probabilities when prizes run out of stock

**QR Code Generation (`qrcode/generator.ts`):**
- Generates dynamic QR codes with format: `{domain}/{commerceSlug}?c={campaignId}&ref=qr`
- Multiple export formats (PNG, SVG, PDF)

## Important Implementation Details

### Google Review Integration

**Critical limitation:** Google's API does not allow posting reviews on behalf of users (anti-fraud measure). The actual implementation should:
1. User connects via Google OAuth
2. App opens Google review page in new tab/iframe
3. User posts review manually
4. User returns to app and confirms review submission
5. Optional: verification via scraping or API (complex)

### Lottery Security

- All lottery draws execute server-side in `/api/lottery/spin/route.ts`
- Client receives only the final angle for animation
- Anti-fraud measures:
  - 1 participation per email per campaign
  - Rate limiting on API
  - CSRF tokens
  - Google OAuth token verification

### Claim Code Format

- Format: `RVW-XXXXXX` (6 alphanumeric characters)
- Excludes ambiguous characters: 0, O, I, 1, L
- Unique index in database
- Example: RVW-A3B7K9

### MongoDB Indexes

Required indexes for performance:
```javascript
db.commerces.createIndex({ slug: 1 }, { unique: true });
db.campaigns.createIndex({ commerceId: 1, isActive: 1 });
db.reviews.createIndex({ campaignId: 1, clientEmail: 1 });
db.winners.createIndex({ claimCode: 1 }, { unique: true });
db.winners.createIndex({ commerceId: 1, status: 1 });
db.winners.createIndex({ expiresAt: 1 });
```

## Code Conventions

- **Components:** PascalCase
- **Files:** kebab-case
- **Variables/functions:** camelCase
- **Types/Interfaces:** PascalCase
- Use `"use client"` only when necessary (interactivity, hooks)
- Server Components by default
- Server Actions for simple mutations
- API Routes for complex logic

### Recommended Patterns

- Zod for validation
- React Hook Form for forms
- TanStack Query for client data fetching
- Zustand for global state (or Context API)

## Development Priorities

### Phase 1: MVP
Setup Next.js + MongoDB, data models, admin auth, basic dashboard, simple client page, functional wheel, code/QR generation

### Phase 2: Core Features
Google OAuth, review workflow, full wheel animation, dual probability modes, campaign management, prize tracking

### Phase 3: Polish
Advanced statistics, transactional emails, data export, commerce customization, performance optimization

### Phase 4: SaaS
Landing page, subscription system, multi-commerce support, documentation
