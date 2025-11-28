import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Commerce from '@/lib/db/models/Commerce';
import User from '@/lib/db/models/User';

// GET - List all commerces
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let commerces;

    // Super admin voit tous les commerces
    if (session.user.role === 'super_admin') {
      commerces = await Commerce.find().populate('ownerId', 'name email').sort({ createdAt: -1 });
    } else {
      // Autres rôles voient uniquement leur commerce
      commerces = await Commerce.find({ _id: session.user.commerceId })
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(commerces);
  } catch (error) {
    console.error('Error fetching commerces:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new commerce
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await req.json();

    const { name, slug, googlePlaceId, googleBusinessUrl, logo, primaryColor } = body;

    // Récupérer l'utilisateur depuis la DB par son email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ownerId = user._id;

    // Vérifier si le slug existe déjà
    const existingCommerce = await Commerce.findOne({ slug });
    if (existingCommerce) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    // Créer le commerce avec abonnement par défaut
    const commerce = await Commerce.create({
      name,
      slug: slug.toLowerCase(),
      googlePlaceId,
      googleBusinessUrl,
      logo,
      primaryColor: primaryColor || '#000000',
      ownerId,
      subscription: {
        plan: 'free',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      },
      settings: {
        probabilityMode: 'fixed',
        defaultExpirationDays: 30,
      },
    });

    return NextResponse.json(commerce, { status: 201 });
  } catch (error) {
    console.error('Error creating commerce:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
