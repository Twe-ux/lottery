/**
 * Génère un code de réclamation unique
 * Format: RVW-XXXXXX
 * Où XXXXXX = 6 caractères alphanumériques (majuscules + chiffres)
 * Excluant caractères ambigus : 0, O, I, 1, L
 */

const ALLOWED_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateClaimCode(): string {
  let code = 'RVW-';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }

  return code;
}

/**
 * Vérifie si un code a le bon format
 */
export function isValidClaimCodeFormat(code: string): boolean {
  const regex = /^RVW-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
  return regex.test(code);
}

/**
 * Génère un code unique en vérifiant qu'il n'existe pas déjà
 * @param checkExists - Fonction async pour vérifier si le code existe
 * @param maxAttempts - Nombre max de tentatives (défaut: 10)
 */
export async function generateUniqueClaimCode(
  checkExists: (code: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateClaimCode();
    const exists = await checkExists(code);

    if (!exists) {
      return code;
    }
  }

  throw new Error('Failed to generate unique claim code after multiple attempts');
}
