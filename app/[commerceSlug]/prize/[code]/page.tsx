import dbConnect from "@/lib/db/connect";
import Winner from "@/lib/db/models/Winner";
import Link from "next/link";
import { notFound } from "next/navigation";
import PrizeCard from "@/components/client/PrizeCard";

interface PageProps {
  params: Promise<{ commerceSlug: string; code: string }>;
}

export default async function PrizePage({ params }: PageProps) {
  await dbConnect();

  const { commerceSlug, code } = await params;

  // Récupérer le gain par le code
  const winner = await Winner.findOne({ claimCode: code })
    .populate("commerceId")
    .lean();

  if (!winner) {
    notFound();
  }

  // Vérifier que le commerce correspond
  const commerce = winner.commerceId as any;
  if (commerce.slug !== commerceSlug) {
    notFound();
  }

  // Vérifier si le gain est expiré
  const isExpired = new Date() > new Date(winner.expiresAt);
  const isClaimed = winner.status === "claimed";

  // Sérialiser les données pour le client
  const serializedWinner = {
    ...winner,
    _id: winner._id.toString(),
    commerceId: commerce._id.toString(),
    campaignId: winner.campaignId?.toString(),
    prizeId: winner.prizeId?.toString(),
    expiresAt: winner.expiresAt.toISOString(),
    claimedAt: winner.claimedAt?.toISOString(),
    createdAt: winner.createdAt?.toISOString(),
    updatedAt: winner.updatedAt?.toISOString(),
  };

  const serializedCommerce = {
    _id: commerce._id.toString(),
    name: commerce.name,
    slug: commerce.slug,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl mx-auto">
        <Link
          href={`/${commerceSlug}`}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          ← Retour
        </Link>
      </div>

      <PrizeCard
        winner={serializedWinner as any}
        commerce={serializedCommerce}
        isExpired={isExpired}
        isClaimed={isClaimed}
      />
    </div>
  );
}
