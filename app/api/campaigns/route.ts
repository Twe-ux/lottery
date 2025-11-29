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

    console.log('[CAMPAIGNS API] Fetching campaigns for user:', session.user.email);

    // Récupérer les campagnes sans populate pour éviter les erreurs
    const rawCampaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .lean();

    console.log('[CAMPAIGNS API] Found raw campaigns:', rawCampaigns.length);

    // Populer manuellement pour gérer les références manquantes
    const Commerce = (await import('@/lib/db/models/Commerce')).default;
    const PrizePool = (await import('@/lib/db/models/PrizePool')).default;

    const campaigns = await Promise.all(
      rawCampaigns.map(async (campaign: any) => {
        try {
          // Récupérer le commerce
          let commerceData = null;
          if (campaign.commerceId) {
            commerceData = await Commerce.findById(campaign.commerceId)
              .select('name slug')
              .lean();
          }

          // Récupérer le prize pool
          let prizePoolData = null;
          if (campaign.prizePoolId) {
            prizePoolData = await PrizePool.findById(campaign.prizePoolId)
              .select('name description')
              .lean();
          }

          return {
            ...campaign,
            commerceId: commerceData || { _id: campaign.commerceId, name: 'Commerce supprimé' },
            prizePoolId: prizePoolData || { _id: campaign.prizePoolId, name: 'Pool supprimé' },
          };
        } catch (err) {
          console.error('[CAMPAIGNS API] Error populating campaign:', campaign._id, err);
          // Retourner la campagne avec des données par défaut
          return {
            ...campaign,
            commerceId: { _id: campaign.commerceId, name: 'Commerce supprimé' },
            prizePoolId: { _id: campaign.prizePoolId, name: 'Pool supprimé' },
          };
        }
      })
    );

    console.log('[CAMPAIGNS API] Campaigns populated:', campaigns.length);

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('[CAMPAIGNS API] Error fetching campaigns:', error);
    console.error('[CAMPAIGNS API] Error stack:', (error as Error).stack);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', message: (error as Error).message },
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
    const campaignDoc = await Campaign.create(body);
    const campaign = Array.isArray(campaignDoc) ? campaignDoc[0] : campaignDoc;

    // Récupérer le commerce pour avoir le slug
    const populatedCampaign = await Campaign.findById(campaign._id).populate('commerceId', 'slug');

    if (!populatedCampaign) {
      return NextResponse.json({ error: 'Campaign not found after creation' }, { status: 500 });
    }

    // Générer l'URL du QR code qui pointe vers la page de bienvenue
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const commerceSlug = (populatedCampaign.commerceId as any).slug;
    const qrCodeUrl = `${baseUrl}/${commerceSlug}/welcome?c=${campaign._id}`;

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
