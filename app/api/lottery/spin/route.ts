import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Prize from '@/lib/db/models/Prize';
import PrizePool from '@/lib/db/models/PrizePool';
import Review from '@/lib/db/models/Review';
import Participation from '@/lib/db/models/Participation';
import Winner from '@/lib/db/models/Winner';
import Campaign from '@/lib/db/models/Campaign';
import { spinRoulette } from '@/lib/lottery/engine';
import { generateUniqueClaimCode } from '@/lib/lottery/claim-code';

/**
 * POST /api/lottery/spin
 * Effectue un tirage de loterie pour un avis
 */
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { campaignId, commerceId, reviewData } = body;

    if (!campaignId || !commerceId || !reviewData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Créer l'avis
    const reviewDoc = await Review.create({
      commerceId,
      campaignId,
      rating: reviewData.rating,
      reviewText: reviewData.reviewText,
      clientName: reviewData.clientName,
      clientEmail: reviewData.clientEmail,
      clientGoogleId: reviewData.clientGoogleId || '',
      status: 'pending',
    });
    const review = Array.isArray(reviewDoc) ? reviewDoc[0] : reviewDoc;

    // Vérifier qu'il n'a pas déjà participé avec cet email
    const existingParticipation = await Participation.findOne({
      clientEmail: reviewData.clientEmail,
      campaignId
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: 'Already participated' },
        { status: 400 }
      );
    }

    // Récupérer la campagne
    const campaign = await Campaign.findById(campaignId);

    if (!campaign || !campaign.isActive) {
      return NextResponse.json(
        { error: 'Campaign not found or inactive' },
        { status: 404 }
      );
    }

    // Récupérer le prize pool et ses prizes
    console.log('🎯 Campaign prizePoolId:', campaign.prizePoolId);
    const prizePool = await PrizePool.findById(campaign.prizePoolId).populate('prizes.prizeId');
    console.log('🎯 Prize pool found:', !!prizePool);
    console.log('🎯 Prize pool prizes:', prizePool?.prizes?.length);

    if (!prizePool || !prizePool.prizes || prizePool.prizes.length === 0) {
      console.log('❌ No prize pool or prizes found');
      return NextResponse.json(
        { error: 'No prizes available' },
        { status: 400 }
      );
    }

    // Extraire les prizes populés avec leurs probabilités
    const prizesWithProbability = prizePool.prizes.map((p: any) => ({
      ...p.prizeId._doc,
      probability: p.probability,
    }));

    // Filtrer les lots actifs avec stock disponible
    console.log('🎯 All prizes:', prizesWithProbability.map((p: any) => ({ name: p.name, isActive: p.isActive, stock: p.stock })));
    const prizes = prizesWithProbability.filter(
      (p: any) => p.isActive && (p.stock === null || p.stock === undefined || p.stock > 0)
    );
    console.log('🎯 Filtered prizes:', prizes.length);

    if (prizes.length === 0) {
      console.log('❌ No active prizes with stock available');
      return NextResponse.json(
        { error: 'No prizes available' },
        { status: 400 }
      );
    }

    // Effectuer le tirage
    const spinResult = spinRoulette(prizes, review.rating);

    // Trouver le lot gagné par son ID (le moteur renvoie le prizeId)
    const wonPrize = prizes.find((p) => p._id.toString() === spinResult.prizeId);

    if (!wonPrize) {
      return NextResponse.json({ error: 'Prize not found' }, { status: 500 });
    }

    // Calculer l'index du lot gagné dans le tableau des lots actifs
    // pour que l'affichage côté client corresponde
    const activePrizes = prizes.filter(
      (p) => p.isActive && (p.stock === null || p.stock === undefined || p.stock > 0)
    );
    const segmentIndex = activePrizes.findIndex((p) => p._id.toString() === spinResult.prizeId);

    // Créer la participation
    const participation = await Participation.create({
      reviewId: review._id,
      campaignId,
      commerceId,
      clientEmail: review.clientEmail,
      clientName: review.clientName,
      prizeWonId: wonPrize._id,
      spinResult: {
        angle: spinResult.angle,
        segment: spinResult.segment,
      },
    });

    // Générer un code de réclamation unique
    const claimCode = await generateUniqueClaimCode(async (code) => {
      const existing = await Winner.findOne({ claimCode: code });
      return !!existing;
    });

    // Calculer la date d'expiration
    const expirationDays = campaign.settings.expirationDays || 30;
    const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);

    // Créer le gain
    const winner = await Winner.create({
      participationId: participation._id,
      reviewId: review._id,
      campaignId,
      commerceId,
      prizeId: wonPrize._id,
      clientEmail: review.clientEmail,
      clientName: review.clientName,
      claimCode,
      status: 'pending',
      expiresAt,
      prizeSnapshot: {
        name: wonPrize.name,
        description: wonPrize.description,
        value: wonPrize.value,
      },
    });

    // Décrémenter le stock si nécessaire
    if (wonPrize.stock !== null && wonPrize.stock !== undefined) {
      wonPrize.stock = Math.max(0, wonPrize.stock - 1);
      await wonPrize.save();
    }

    // Mettre à jour les stats de la campagne
    campaign.stats.totalWinners += 1;
    await campaign.save();

    // Lier la participation à l'avis
    review.participationId = participation._id;
    await review.save();

    // Retourner le résultat
    return NextResponse.json({
      success: true,
      spinResult: {
        angle: spinResult.angle,
        segment: segmentIndex, // Utiliser l'index calculé côté serveur
      },
      prize: {
        id: wonPrize._id,
        name: wonPrize.name,
        description: wonPrize.description,
        value: wonPrize.value,
        color: wonPrize.color,
      },
      claimCode,
      expiresAt,
      winnerId: winner._id,
    });
  } catch (error) {
    console.error('Error in lottery spin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
