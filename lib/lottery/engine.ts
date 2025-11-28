import { IPrize } from '@/lib/db/models/Prize';

export interface PrizeWithProbability extends IPrize {
  probability: {
    mode: 'fixed' | 'star-based';
    fixedPercent?: number;
    starBased?: {
      star1: number;
      star2: number;
      star3: number;
      star4: number;
      star5: number;
    };
  };
}

export interface SpinResult {
  prizeId: string;
  prizeName: string;
  angle: number;
  segment: number;
  visualSegment: number;
}

/**
 * Effectue un tirage de loterie pondéré selon les probabilités configurées
 * @param prizes - Tableau des lots disponibles avec probabilités
 * @param starRating - Note donnée (1-5) - utilisé uniquement en mode star-based
 * @returns Résultat du tirage avec l'angle d'animation
 */
export function spinRoulette(
  prizes: PrizeWithProbability[],
  starRating?: number
): SpinResult {
  // 1. Filtrer les lots actifs avec stock disponible
  const availablePrizes = prizes.filter(
    (p) => p.isActive && (p.stock === null || p.stock === undefined || p.stock > 0)
  );

  if (availablePrizes.length === 0) {
    throw new Error('Aucun lot disponible');
  }

  // 2. Calculer les probabilités selon le mode
  const probabilities: number[] = [];

  availablePrizes.forEach((prize) => {
    if (prize.probability.mode === 'fixed') {
      probabilities.push(prize.probability.fixedPercent || 0);
    } else if (prize.probability.mode === 'star-based' && starRating) {
      type StarKey = 'star1' | 'star2' | 'star3' | 'star4' | 'star5';
      const starKey = `star${starRating}` as StarKey;
      const starBased = prize.probability.starBased;
      probabilities.push(starBased ? starBased[starKey] || 0 : 0);
    } else {
      // Par défaut, si mode star-based sans note, utiliser une probabilité égale
      probabilities.push(100 / availablePrizes.length);
    }
  });

  // 3. Normaliser si le total ≠ 100 (à cause du stock)
  const total = probabilities.reduce((a, b) => a + b, 0);

  if (total === 0) {
    throw new Error('Somme des probabilités = 0');
  }

  const normalized = probabilities.map((p) => p / total);

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
  // La roulette affiche toujours 10 segments
  const TOTAL_SEGMENTS = 10;
  const segmentAngle = 360 / TOTAL_SEGMENTS;

  // Mapper l'index du prize à un segment de 0-9
  const segmentIndex = selectedIndex % TOTAL_SEGMENTS;
  const baseAngle = segmentIndex * segmentAngle;

  // Ajouter un offset aléatoire dans le segment (éviter les bords)
  const randomOffset = Math.random() * (segmentAngle * 0.8) + (segmentAngle * 0.1);

  // Nombre de tours complets (5-7 tours)
  const spins = 5 + Math.floor(Math.random() * 3);

  // Angle final = tours complets + position finale
  const finalAngle = spins * 360 + baseAngle + randomOffset;

  const selectedPrize = availablePrizes[selectedIndex];

  return {
    prizeId: selectedPrize._id.toString(),
    prizeName: selectedPrize.name,
    angle: finalAngle,
    segment: selectedIndex, // Index du prize dans le tableau filtré
    visualSegment: segmentIndex, // Segment visuel sur la roulette (0-9)
  };
}

/**
 * Valider que la somme des probabilités = 100%
 * @param prizes - Tableau des lots avec probabilités
 * @param mode - Mode de probabilité
 * @param starRating - Note (pour mode star-based)
 * @returns true si valide, false sinon
 */
export function validateProbabilities(
  prizes: PrizeWithProbability[],
  mode: 'fixed' | 'star-based',
  starRating?: number
): { valid: boolean; total: number } {
  const activePrizes = prizes.filter((p) => p.isActive);

  if (mode === 'fixed') {
    const total = activePrizes.reduce(
      (sum, prize) => sum + (prize.probability.fixedPercent || 0),
      0
    );
    return { valid: Math.abs(total - 100) < 0.01, total };
  } else if (starRating) {
    type StarKey = 'star1' | 'star2' | 'star3' | 'star4' | 'star5';
    const starKey = `star${starRating}` as StarKey;
    const total = activePrizes.reduce((sum, prize) => {
      const starBased = prize.probability.starBased;
      return sum + (starBased ? starBased[starKey] || 0 : 0);
    }, 0);
    return { valid: Math.abs(total - 100) < 0.01, total };
  }

  return { valid: false, total: 0 };
}
