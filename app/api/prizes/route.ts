import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Prize from '@/lib/db/models/Prize';

// GET - List all prizes for a commerce
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    console.log('[PRIZES API] Fetching prizes for user:', session.user.email);
    console.log('[PRIZES API] User role:', session.user.role);
    console.log('[PRIZES API] User commerceId:', session.user.commerceId);

    const { searchParams } = new URL(req.url);
    const commerceId = searchParams.get('commerceId');
    const prizePoolId = searchParams.get('prizePoolId');

    console.log('[PRIZES API] Query params - commerceId:', commerceId, 'prizePoolId:', prizePoolId);

    let prizes;

    if (prizePoolId) {
      // Filtrer par prize pool
      console.log('[PRIZES API] Fetching by prizePoolId:', prizePoolId);
      prizes = await Prize.find({ prizePoolId }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    } else if (commerceId) {
      // Filtrer par commerce (ancien système de compatibilité)
      console.log('[PRIZES API] Fetching by commerceId:', commerceId);

      // Vérifier les permissions
      if (
        session.user.role !== 'super_admin' &&
        commerceId !== session.user.commerceId
      ) {
        console.log('[PRIZES API] Permission denied for commerceId:', commerceId);
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      prizes = await Prize.find({ commerceId }).sort({ displayOrder: 1, createdAt: -1 }).lean();
    } else {
      console.log('[PRIZES API] No commerceId or prizePoolId provided');
      return NextResponse.json(
        { error: 'commerceId or prizePoolId is required' },
        { status: 400 }
      );
    }

    console.log('[PRIZES API] Found prizes:', prizes.length);

    return NextResponse.json(prizes);
  } catch (error) {
    console.error('[PRIZES API] Error fetching prizes:', error);
    console.error('[PRIZES API] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Internal server error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Create new prize
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();
    const { commerceId } = body;

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      session.user.role !== 'commerce_admin'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (
      session.user.role === 'commerce_admin' &&
      commerceId !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const prize = await Prize.create(body);

    return NextResponse.json(prize, { status: 201 });
  } catch (error) {
    console.error('Error creating prize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
