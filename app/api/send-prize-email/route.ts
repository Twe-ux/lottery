import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, claimCode, prizeName, expiresAt, commerceName, prizeUrl } = body;

    console.log('[SEND EMAIL] Sending prize email to:', email);
    console.log('[SEND EMAIL] Prize:', prizeName);
    console.log('[SEND EMAIL] Code:', claimCode);

    // TODO: Intégrer un service d'email (SendGrid, Resend, etc.)
    // Pour l'instant, on simule l'envoi

    // Exemple de contenu email :
    const emailContent = `
      Bonjour,

      Félicitations ! Vous avez gagné : ${prizeName}

      Votre code de réclamation : ${claimCode}

      Valable jusqu'au : ${new Date(expiresAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}

      Pour récupérer votre gain :
      1. Présentez ce code en magasin
      2. Le personnel validera votre gain
      3. Profitez de votre cadeau !

      Lien vers votre gain : ${prizeUrl}

      Commerce : ${commerceName}

      Cordialement,
      L'équipe ReviewLottery
    `;

    console.log('[SEND EMAIL] Email content:', emailContent);

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully (simulated)'
    });

  } catch (error) {
    console.error('[SEND EMAIL] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
