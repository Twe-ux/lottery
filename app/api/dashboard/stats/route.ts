import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Review from '@/lib/db/models/Review';
import Winner from '@/lib/db/models/Winner';
import Participation from '@/lib/db/models/Participation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Compter les participations (scans QR)
    const totalParticipations = await Participation.countDocuments();

    // Compter les avis postés
    const totalReviews = await Review.countDocuments({ status: 'posted' });

    // Compter les gains distribués (réclamés)
    const totalWinnersClaimed = await Winner.countDocuments({ status: 'claimed' });

    // Compter tous les gains
    const totalWinners = await Winner.countDocuments();

    // Calculer le taux de conversion (avis postés / participations)
    const conversionRate = totalParticipations > 0
      ? Math.round((totalReviews / totalParticipations) * 100)
      : 0;

    // Calculer la note moyenne
    const reviewsWithRatings = await Review.find({ rating: { $exists: true } });
    const avgRating = reviewsWithRatings.length > 0
      ? reviewsWithRatings.reduce((sum, r) => sum + r.rating, 0) / reviewsWithRatings.length
      : 0;

    return NextResponse.json({
      totalParticipations,
      totalReviews,
      totalWinnersClaimed,
      totalWinners,
      conversionRate,
      avgRating: avgRating.toFixed(1),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
