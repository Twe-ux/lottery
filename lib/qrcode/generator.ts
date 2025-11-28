import QRCode from 'qrcode';

/**
 * Génère un QR code pour une campagne
 * @param campaignId - ID de la campagne
 * @param commerceSlug - Slug du commerce
 * @returns Data URL du QR code (base64)
 */
export async function generateCampaignQR(
  campaignId: string,
  commerceSlug: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
  const url = `${baseUrl}/${commerceSlug}?c=${campaignId}&ref=qr`;

  const options = {
    width: 1024,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H' as const,
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, options);
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Génère un QR code pour un code de réclamation
 * @param claimCode - Code de réclamation
 * @param commerceSlug - Slug du commerce
 * @returns Data URL du QR code (base64)
 */
export async function generateClaimCodeQR(
  claimCode: string,
  commerceSlug: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3001';
  const url = `${baseUrl}/${commerceSlug}/prize/${claimCode}`;

  const options = {
    width: 512,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M' as const,
  };

  try {
    const dataUrl = await QRCode.toDataURL(url, options);
    return dataUrl;
  } catch (error) {
    console.error('Error generating claim code QR:', error);
    throw new Error('Failed to generate claim code QR');
  }
}

/**
 * Génère un QR code personnalisé
 * @param data - Données à encoder
 * @param options - Options personnalisées
 * @returns Data URL du QR code (base64)
 */
export async function generateCustomQR(
  data: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  const qrOptions = {
    width: options?.width || 512,
    margin: options?.margin || 2,
    color: {
      dark: options?.darkColor || '#000000',
      light: options?.lightColor || '#FFFFFF',
    },
  };

  try {
    const dataUrl = await QRCode.toDataURL(data, qrOptions);
    return dataUrl;
  } catch (error) {
    console.error('Error generating custom QR code:', error);
    throw new Error('Failed to generate custom QR code');
  }
}
