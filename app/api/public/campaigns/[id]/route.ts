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
    console.log('[PUBLIC API] Fetching campaign:', id);

    const campaign = await Campaign.findById(id)
      .populate('commerceId', 'name slug googleBusinessUrl')
      .populate('prizePoolId');

    console.log('[PUBLIC API] Campaign found:', !!campaign);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    console.log('[PUBLIC API] Campaign prizePoolId:', campaign.prizePoolId);

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
      console.log('[PUBLIC API] Fetching prize pool...');
      const prizePool = await PrizePool.findById(campaign.prizePoolId).populate('prizes.prizeId');
      console.log('[PUBLIC API] Prize pool found:', !!prizePool);
      console.log('[PUBLIC API] Prize pool prizes count:', prizePool?.prizes?.length);

      if (prizePool && prizePool.prizes) {
        // Extraire les prizes populés avec leurs probabilités
        prizes = prizePool.prizes
          .filter((p: any) => p.prizeId && typeof p.prizeId === 'object')
          .map((p: any) => {
            const prizeData = p.prizeId._doc || p.prizeId.toObject?.() || p.prizeId;
            return {
              ...prizeData,
              probability: p.probability,
            };
          });
        console.log('[PUBLIC API] Prizes extracted:', prizes.length);
      }
    }

    return NextResponse.json({ campaign: publicCampaign, prizes });
  } catch (error) {
    console.error('[PUBLIC API] Error fetching public campaign:', error);
    console.error('[PUBLIC API] Error stack:', (error as Error).stack);
    return NextResponse.json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}
