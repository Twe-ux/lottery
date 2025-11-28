import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Campaign from '@/lib/db/models/Campaign';
import PrizePool from '@/lib/db/models/PrizePool';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get public campaign info (no auth required)
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;
    const campaign = await Campaign.findById(id)
      .populate('commerceId', 'name slug googleBusinessUrl')
      .populate('prizePoolId');

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Ne retourner que les infos publiques
    const publicCampaign = {
      _id: campaign._id,
      name: campaign.name,
      description: campaign.description,
      commerceId: campaign.commerceId,
      isActive: campaign.isActive,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    };

    // Récupérer les prizes du prize pool
    let prizes = [];
    if (campaign.prizePoolId) {
      const prizePool = await PrizePool.findById(campaign.prizePoolId).populate('prizes.prizeId');
      if (prizePool && prizePool.prizes) {
        // Extraire les prizes populés avec leurs probabilités
        prizes = prizePool.prizes.map((p: any) => ({
          ...p.prizeId._doc,
          probability: p.probability,
        }));
      }
    }

    return NextResponse.json({ campaign: publicCampaign, prizes });
  } catch (error) {
    console.error('Error fetching public campaign:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
