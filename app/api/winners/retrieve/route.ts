import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Winner from '@/lib/db/models/Winner';
import Prize from '@/lib/db/models/Prize';

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à vos gains' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await req.json();
    const { commerceId } = body;

    // Utiliser l'email de la session (sécurisé)
    const userEmail = session.user.email.toLowerCase();

    // Rechercher tous les gains de l'utilisateur connecté pour ce commerce
    const query: any = {
      clientEmail: userEmail, // CORRIGÉ: clientEmail au lieu de email
      status: { $in: ['pending', 'claimed'] }, // Pas les expirés
    };

    if (commerceId) {
      query.commerceId = commerceId;
    }

    const winners = await Winner.find(query)
      .sort({ createdAt: -1 })
      .lean();

    if (winners.length === 0) {
      return NextResponse.json(
        { error: 'Aucun gain trouvé pour votre compte' },
        { status: 404 }
      );
    }

    // Récupérer les informations des prix
    const prizeIds = winners.map(w => w.prizeId).filter(Boolean);
    const prizes = await Prize.find({ _id: { $in: prizeIds } }).lean();
    const prizeMap = new Map(prizes.map(p => [p._id.toString(), p]));

    // Sérialiser les gains
    const serializedWinners = winners.map(winner => {
      const prize = winner.prizeId ? prizeMap.get(winner.prizeId.toString()) : null;
      return {
        claimCode: winner.claimCode,
        prizeName: prize?.name || winner.prizeSnapshot?.name || 'Lot',
        status: winner.status,
        expiresAt: winner.expiresAt.toISOString(),
        isExpired: new Date() > new Date(winner.expiresAt),
      };
    });

    return NextResponse.json({ winners: serializedWinners });
  } catch (error) {
    console.error('Error retrieving winners:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des gains' },
      { status: 500 }
    );
  }
}
