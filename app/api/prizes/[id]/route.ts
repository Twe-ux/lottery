import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Prize from '@/lib/db/models/Prize';

// GET - Get single prize
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const prize = await Prize.findById(params.id);

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      prize.commerceId.toString() !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(prize);
  } catch (error) {
    console.error('Error fetching prize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update prize
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const prize = await Prize.findById(params.id);

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      prize.commerceId.toString() !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Mise à jour des champs
    Object.keys(body).forEach((key) => {
      if (body[key] !== undefined && key !== 'commerceId') {
        prize[key] = body[key];
      }
    });

    await prize.save();

    return NextResponse.json(prize);
  } catch (error) {
    console.error('Error updating prize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete prize
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const prize = await Prize.findById(params.id);

    if (!prize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 404 });
    }

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      prize.commerceId.toString() !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Prize.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Prize deleted successfully' });
  } catch (error) {
    console.error('Error deleting prize:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
