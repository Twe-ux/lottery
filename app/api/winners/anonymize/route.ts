import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Winner from '@/lib/db/models/Winner';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { winnerId } = body;

    if (!winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required' },
        { status: 400 }
      );
    }

    const winner = await Winner.findById(winnerId);

    if (!winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    // Vérifier que le gain a bien été réclamé
    if (winner.status !== 'claimed') {
      return NextResponse.json(
        { error: 'Le gain doit être réclamé avant de pouvoir supprimer les coordonnées' },
        { status: 400 }
      );
    }

    // Anonymiser les données personnelles
    winner.clientName = '[SUPPRIMÉ]';
    winner.clientEmail = '[SUPPRIMÉ]';
    winner.claimedBy = session.user.email; // Garder une trace de qui a effectué la suppression

    await winner.save();

    return NextResponse.json({
      message: 'Coordonnées supprimées avec succès',
      winner: {
        _id: winner._id.toString(),
        clientName: winner.clientName,
        clientEmail: winner.clientEmail,
      },
    });
  } catch (error) {
    console.error('Error anonymizing winner data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
