import dbConnect from "@/lib/db/connect";
import Campaign from "@/lib/db/models/Campaign";
import Commerce from "@/lib/db/models/Commerce";
import Prize from "@/lib/db/models/Prize";
import PrizePool from "@/lib/db/models/PrizePool";
import { Gift, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ commerceSlug: string }>;
  searchParams: Promise<{ c?: string; ref?: string }>;
}

export default async function CommerceLandingPage({
  params,
  searchParams,
}: PageProps) {
  await dbConnect();

  const { commerceSlug } = await params;
  const { c, ref } = await searchParams;

  // Récupérer le commerce
  const commerce = await Commerce.findOne({ slug: commerceSlug }).lean();

  if (!commerce) {
    notFound();
  }

  // Récupérer la campagne active (ou celle spécifiée)
  let campaign;
  if (c) {
    campaign = await Campaign.findById(c).lean();
  } else {
    campaign = await Campaign.findOne({
      commerceId: commerce._id,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    }).lean();
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Aucune campagne active
          </h1>
          <p className="text-gray-600">
            Ce commerce n'a pas de campagne en cours pour le moment.
          </p>
        </div>
      </div>
    );
  }

  // Récupérer le pool de lots
  const prizePool = await PrizePool.findById(campaign.prizePoolId).lean();

  // Récupérer les lots de la campagne
  const prizeIds = prizePool?.prizes.map((p) => p.prizeId) || [];
  const prizes = await Prize.find({
    _id: { $in: prizeIds },
    isActive: true,
  }).lean();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            {commerce.logo && (
              <img
                src={commerce.logo}
                alt={commerce.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {commerce.name}
              </h1>
              <p className="text-gray-600">Participez et gagnez !</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Donnez votre avis et tentez de gagner !
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Partagez votre expérience chez {commerce.name} et tournez la roue
              de la chance pour remporter l'un de nos nombreux cadeaux.
            </p>
          </div>

          {/* How it works */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                1. Laissez un avis
              </h3>
              <p className="text-sm text-gray-600">
                Partagez votre expérience sur Google
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                2. Tournez la roue
              </h3>
              <p className="text-sm text-gray-600">
                Lancez la roue de la chance
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                3. Gagnez un cadeau
              </h3>
              <p className="text-sm text-gray-600">
                Recevez votre code et réclamez votre lot
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href={`/${commerceSlug}/lottery?c=${campaign._id}`}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Participer maintenant
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              🎁 Garantie 100% gagnant - Aucun perdant !
            </p>
          </div>
        </div>

        {/* Prizes Showcase */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Lots à gagner
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {prizes.map((prize) => (
              <div
                key={prize._id.toString()}
                className="border-2 border-gray-200 rounded-xl p-4 text-center hover:border-purple-400 hover:shadow-lg transition-all"
              >
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                  style={{ backgroundColor: prize.color }}
                >
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {prize.name}
                </h4>
                {prize.value && (
                  <p className="text-sm text-green-600 font-medium">
                    Valeur: {prize.value}€
                  </p>
                )}
                {prize.description && (
                  <p className="text-xs text-gray-500 mt-2">
                    {prize.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            En participant, vous acceptez de laisser un avis honnête sur Google.
            <br />
            Les gains sont valables {campaign.settings.expirationDays} jours.
          </p>
        </div>
      </main>
    </div>
  );
}
