import dbConnect from "@/lib/db/connect";
import Campaign from "@/lib/db/models/Campaign";
import PrizePool from "@/lib/db/models/PrizePool";
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get public campaign info (no auth required)
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    await dbConnect();

    const { id } = await context.params;
    console.log("[PUBLIC API] Fetching campaign:", id);

    const campaign = await Campaign.findById(id).lean();

    console.log("[PUBLIC API] Campaign found:", !!campaign);
    console.log(
      "[PUBLIC API] Campaign data:",
      campaign
        ? JSON.stringify({
            _id: campaign._id,
            name: campaign.name,
            prizePoolId: campaign.prizePoolId,
            isActive: campaign.isActive,
          })
        : "null"
    );

    if (!campaign) {
      console.log("[PUBLIC API] Campaign not found in DB");
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Récupérer le commerce séparément
    let commerceData = null;
    if (campaign.commerceId) {
      const Commerce = (await import("@/lib/db/models/Commerce")).default;
      commerceData = await Commerce.findById(campaign.commerceId)
        .select("name slug googleBusinessUrl logo")
        .lean();
      console.log("[PUBLIC API] Commerce found:", !!commerceData);
    }

    // Ne retourner que les infos publiques
    const publicCampaign = {
      _id: campaign._id,
      name: campaign.name,
      description: campaign.description,
      commerceId: commerceData,
      isActive: campaign.isActive,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
    };

    // Récupérer les prizes du prize pool
    let prizes = [];
    if (campaign.prizePoolId) {
      console.log("[PUBLIC API] Fetching prize pool:", campaign.prizePoolId);
      try {
        const prizePool = await PrizePool.findById(campaign.prizePoolId).lean();
        console.log("[PUBLIC API] Prize pool found:", !!prizePool);

        if (prizePool && prizePool.prizes && Array.isArray(prizePool.prizes)) {
          console.log(
            "[PUBLIC API] Prize pool prizes count:",
            prizePool.prizes.length
          );

          // Récupérer les prizes
          const Prize = (await import("@/lib/db/models/Prize")).default;
          const prizeIds = prizePool.prizes.map((p: any) => p.prizeId);
          const prizesList = await Prize.find({
            _id: { $in: prizeIds },
          }).lean();

          console.log("[PUBLIC API] Prizes found:", prizesList.length);

          // Mapper les prizes avec leurs probabilités
          prizes = prizesList.map((prize: any) => {
            const poolPrize = prizePool.prizes.find(
              (p: any) => p.prizeId.toString() === prize._id.toString()
            );
            return {
              ...prize,
              probability: poolPrize?.probability || {
                mode: "fixed",
                fixedPercent: 0,
              },
            };
          });

          console.log("[PUBLIC API] Prizes extracted:", prizes.length);
        }
      } catch (poolError) {
        console.error("[PUBLIC API] Error fetching prize pool:", poolError);
        // Ne pas échouer si le prize pool n'existe pas, juste retourner prizes vide
      }
    } else {
      console.log("[PUBLIC API] No prizePoolId in campaign");
    }

    console.log("[PUBLIC API] Returning success with", prizes.length, "prizes");
    return NextResponse.json({ campaign: publicCampaign, prizes });
  } catch (error) {
    console.error("[PUBLIC API] Error fetching public campaign:", error);
    console.error("[PUBLIC API] Error name:", (error as Error).name);
    console.error("[PUBLIC API] Error message:", (error as Error).message);
    console.error("[PUBLIC API] Error stack:", (error as Error).stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: (error as Error).message,
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).stack
            : undefined,
      },
      { status: 500 }
    );
  }
}
