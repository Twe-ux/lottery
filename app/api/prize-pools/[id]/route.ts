import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import PrizePool from '@/lib/db/models/PrizePool';
import Prize from '@/lib/db/models/Prize';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single prize pool
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const prizePool = await PrizePool.findById(id);

    if (!prizePool) {
      return NextResponse.json({ error: 'Prize pool not found' }, { status: 404 });
    }

    return NextResponse.json(prizePool);
  } catch (error) {
    console.error('Error fetching prize pool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update prize pool
export async function PUT(req: NextRequest, context: RouteContext) {
  console.log('🟢🟢🟢 PUT FUNCTION CALLED 🟢🟢🟢');

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('🟢 [PUT API] Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const body = await req.json();

    console.log('🟢 [PUT API] Received ID:', id);
    console.log('🟢 [PUT API] Received body:', JSON.stringify(body, null, 2));

    const updateData: any = {};
    const allowedFields = ['name', 'description', 'isActive', 'prizes'];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    console.log('🟢 [PUT API] Update data:', JSON.stringify(updateData, null, 2));

    const updatedPool = await PrizePool.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPool) {
      return NextResponse.json({ error: 'Prize pool not found' }, { status: 404 });
    }

    console.log('🟢 [PUT API] Updated prizePool:', JSON.stringify(updatedPool.toObject(), null, 2));

    return NextResponse.json(updatedPool);
  } catch (error) {
    console.error('Error updating prize pool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete prize pool
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;

    const prizePool = await PrizePool.findByIdAndDelete(id);

    if (!prizePool) {
      return NextResponse.json({ error: 'Prize pool not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Prize pool deleted successfully' });
  } catch (error) {
    console.error('Error deleting prize pool:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
