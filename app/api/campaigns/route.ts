import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/lib/db/models/Campaign';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const campaigns = await Campaign.find()
      .populate('commerceId', 'name slug')
      .populate('prizePoolId', 'name description')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();

    // Créer la campagne d'abord pour avoir l'ID
    const campaign = await Campaign.create(body);

    // Récupérer le commerce pour avoir le slug
    const populatedCampaign = await Campaign.findById(campaign._id).populate('commerceId', 'slug');

    // Générer l'URL du QR code qui pointe vers la page de bienvenue
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const qrCodeUrl = `${baseUrl}/${populatedCampaign.commerceId.slug}/welcome?c=${campaign._id}`;

    // Mettre à jour la campagne avec l'URL
    campaign.qrCodeUrl = qrCodeUrl;
    await campaign.save();

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}
