import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Commerce from '@/lib/db/models/Commerce';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single commerce
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const commerce = await Commerce.findById(id).populate('ownerId', 'name email');

    if (!commerce) {
      return NextResponse.json({ error: 'Commerce not found' }, { status: 404 });
    }

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      commerce._id.toString() !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(commerce);
  } catch (error) {
    console.error('Error fetching commerce:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update commerce
export async function PUT(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const commerce = await Commerce.findById(id);

    if (!commerce) {
      return NextResponse.json({ error: 'Commerce not found' }, { status: 404 });
    }

    // Vérifier les permissions
    if (
      session.user.role !== 'super_admin' &&
      commerce._id.toString() !== session.user.commerceId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Mise à jour des champs autorisés
    const allowedFields = [
      'name',
      'googlePlaceId',
      'googleBusinessUrl',
      'logo',
      'primaryColor',
      'settings',
    ];

    // Super admin peut aussi modifier le slug et l'abonnement
    if (session.user.role === 'super_admin') {
      allowedFields.push('slug', 'subscription');
    }

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        commerce[field] = body[field];
      }
    });

    await commerce.save();

    return NextResponse.json(commerce);
  } catch (error) {
    console.error('Error updating commerce:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete commerce
export async function DELETE(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { id } = await context.params;
    const commerce = await Commerce.findByIdAndDelete(id);

    if (!commerce) {
      return NextResponse.json({ error: 'Commerce not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Commerce deleted successfully' });
  } catch (error) {
    console.error('Error deleting commerce:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
