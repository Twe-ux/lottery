import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import PrizePool from '@/lib/db/models/PrizePool';
import Prize from '@/lib/db/models/Prize';

// GET - List all prize pools
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const commerceId = searchParams.get('commerceId');

    if (!commerceId) {
      return NextResponse.json({ error: 'commerceId required' }, { status: 400 });
    }

    const prizePools = await PrizePool.find({ commerceId }).sort({ createdAt: -1 });

    // Pour chaque pool, calculer le total des probabilités depuis le tableau prizes
    const poolsWithStats = prizePools.map((pool) => {
      const poolObj = pool.toObject();
      const totalProbability = (poolObj.prizes || []).reduce((sum: number, p: any) => {
        if (p.probability.mode === 'fixed' && p.probability.fixedPercent) {
          return sum + p.probability.fixedPercent;
        }
        return sum;
      }, 0);

      return {
        ...poolObj,
        prizesCount: (poolObj.prizes || []).length,
        totalProbability: Math.round(totalProbability * 10) / 10,
        isComplete: Math.abs(totalProbability - 100) < 0.1,
      };
    });

    return NextResponse.json(poolsWithStats);
  } catch (error) {
    console.error('Error fetching prize pools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new prize pool
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { commerceId, name, description, prizes } = body;

    if (!commerceId || !name) {
      return NextResponse.json(
        { error: 'commerceId and name are required' },
        { status: 400 }
      );
    }

    const prizePool = await PrizePool.create({
      commerceId,
      name,
      description,
      prizes: prizes || [],
      isActive: true,
    });

    return NextResponse.json(prizePool, { status: 201 });
  } catch (error) {
    console.error('Error creating prize pool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
