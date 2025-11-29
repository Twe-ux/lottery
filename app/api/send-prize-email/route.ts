import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, claimCode, prizeName, expiresAt, commerceName, prizeUrl, prizeValue, prizeDescription } = body;

    console.log('[SEND EMAIL] Sending prize email to:', email);
    console.log('[SEND EMAIL] Prize:', prizeName);
    console.log('[SEND EMAIL] Code:', claimCode);

    // Formater la date d'expiration
    const expirationDate = new Date(expiresAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Template HTML de l'email
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre gain - ${prizeName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">
                🎉 Félicitations !
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px;">
                Vous avez gagné un prix
              </p>
            </td>
          </tr>

          <!-- Prize Details -->
          <tr>
            <td style="padding: 40px;">
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
                <h2 style="margin: 0 0 8px; color: #1f2937; font-size: 28px; font-weight: bold;">
                  ${prizeName}
                </h2>
                ${prizeDescription ? `
                  <p style="margin: 8px 0; color: #4b5563; font-size: 16px;">
                    ${prizeDescription}
                  </p>
                ` : ''}
                ${prizeValue ? `
                  <p style="margin: 16px 0 0; color: #059669; font-size: 20px; font-weight: 600;">
                    Valeur: ${prizeValue}€
                  </p>
                ` : ''}
              </div>

              <!-- Claim Code -->
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Code de réclamation
                </p>
                <div style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 4px; margin-bottom: 16px;">
                  ${claimCode}
                </div>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                  ⏰ Valable jusqu'au ${expirationDate}
                </p>
              </div>

              <!-- Instructions -->
              <div style="background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 16px; color: #1e40af; font-size: 18px; font-weight: 600;">
                  📋 Comment récupérer votre gain ?
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #1e40af; font-size: 15px; line-height: 1.8;">
                  <li>Présentez ce code en magasin</li>
                  <li>Le personnel validera votre gain</li>
                  <li>Profitez de votre cadeau !</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${prizeUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Voir mon gain
                </a>
              </div>

              <!-- Footer Info -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                  Commerce: <strong style="color: #1f2937;">${commerceName}</strong>
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  ReviewLottery - Votre programme de fidélité
                </p>
              </div>
            </td>
          </tr>

        </table>

        <!-- Email Footer -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                Vous recevez cet email car vous avez participé à notre loterie.<br>
                Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Vérifier si Resend est configuré
    if (!process.env.RESEND_API_KEY) {
      console.log('[SEND EMAIL] RESEND_API_KEY not configured - simulating send');
      console.log('[SEND EMAIL] Would send to:', email);

      return NextResponse.json({
        success: true,
        message: 'Email simulated (RESEND_API_KEY not set)',
        preview: htmlContent.substring(0, 200) + '...'
      });
    }

    // Envoyer l'email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'ReviewLottery <noreply@reviewlottery.com>',
      to: [email],
      subject: `🎉 Votre gain: ${prizeName} - Code: ${claimCode}`,
      html: htmlContent,
    });

    if (error) {
      console.error('[SEND EMAIL] Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    console.log('[SEND EMAIL] Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      emailId: data?.id
    });

  } catch (error) {
    console.error('[SEND EMAIL] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', message: (error as Error).message },
      { status: 500 }
    );
  }
}
