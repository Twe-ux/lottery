import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Winner from '@/lib/db/models/Winner';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { claimCode } = body;

    if (!claimCode) {
      return NextResponse.json(
        { error: 'Claim code is required' },
        { status: 400 }
      );
    }

    const winner = await Winner.findOne({ claimCode: claimCode.toUpperCase() });

    if (!winner) {
      return NextResponse.json({ error: 'Winner not found' }, { status: 404 });
    }

    if (winner.status === 'claimed') {
      return NextResponse.json(
        { error: 'Prize already claimed' },
        { status: 400 }
      );
    }

    if (winner.status === 'expired' || new Date() > new Date(winner.expiresAt)) {
      winner.status = 'expired';
      await winner.save();
      return NextResponse.json({ error: 'Prize expired' }, { status: 400 });
    }

    winner.status = 'claimed';
    winner.claimedAt = new Date();
    winner.claimedBy = session.user?.email || 'admin';
    await winner.save();

    return NextResponse.json({
      success: true,
      winner,
    });
  } catch (error) {
    console.error('Error claiming prize:', error);
    return NextResponse.json(
      { error: 'Failed to claim prize' },
      { status: 500 }
    );
  }
}
