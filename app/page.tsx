import dbConnect from "@/lib/db/connect";
import Campaign from "@/lib/db/models/Campaign";
import Commerce from "@/lib/db/models/Commerce";
import { Gift, Star, TrendingUp, Store, Calendar } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  await dbConnect();

  // Récupérer toutes les campagnes actives
  const campaigns = await Campaign.find({
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Récupérer tous les commerces associés
  const commerceIds = campaigns.map((c) => c.commerceId);
  const commerces = await Commerce.find({
    _id: { $in: commerceIds },
  }).lean();

  // Créer un map pour accès rapide aux commerces
  const commerceMap = new Map();
  commerces.forEach((c) => {
    commerceMap.set(c._id.toString(), c);
  });

  // Associer les commerces aux campagnes
  const campaignsWithCommerce = campaigns.map((campaign) => {
    const commerce = commerceMap.get(campaign.commerceId.toString());
    return {
      _id: campaign._id.toString(),
      name: campaign.name,
      description: campaign.description,
      commerce: commerce
        ? {
            _id: commerce._id.toString(),
            name: commerce.name,
            slug: commerce.slug,
            logo: commerce.logo,
          }
        : null,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">ReviewLottery</h1>
            <p className="text-gray-600 mt-1">
              Donnez votre avis et gagnez des cadeaux !
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
              <Gift className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Partagez votre expérience dans vos commerces préférés et tournez
              la roue de la chance pour remporter des cadeaux.
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

          <div className="text-center">
            <p className="text-sm text-gray-500">
              🎁 Garantie 100% gagnant - Aucun perdant !
            </p>
          </div>
        </div>

        {/* Active Campaigns */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center justify-center">
            <Calendar className="w-6 h-6 mr-2" />
            Campagnes en cours
          </h3>

          {campaignsWithCommerce.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                Aucune campagne active pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignsWithCommerce.map((campaign) => (
                <Link
                  key={campaign._id}
                  href={
                    campaign.commerce
                      ? `/${campaign.commerce.slug}/lottery?c=${campaign._id}`
                      : "#"
                  }
                  className="group border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-xl transition-all cursor-pointer"
                >
                  {/* Commerce Info */}
                  {campaign.commerce && (
                    <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                      {campaign.commerce.logo ? (
                        <img
                          src={campaign.commerce.logo}
                          alt={campaign.commerce.name}
                          className="w-12 h-12 rounded-lg object-cover mr-3"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                          <Store className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {campaign.commerce.name}
                        </h4>
                        <p className="text-xs text-gray-500">Commerce</p>
                      </div>
                    </div>
                  )}

                  {/* Campaign Info */}
                  <div className="mb-4">
                    <h5 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                      {campaign.name}
                    </h5>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg group-hover:from-blue-700 group-hover:to-purple-700 transition-all">
                    <Gift className="w-4 h-4 mr-2" />
                    Participer maintenant
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* RGPD Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            🔒 Protection de vos données personnelles
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            Conformément au RGPD, nous collectons vos données personnelles (nom,
            prénom, adresse email) uniquement dans le cadre de votre
            participation à cette loterie. Ces données sont utilisées pour :
            <br />
            • Vous identifier en tant que participant
            <br />
            • Vous attribuer votre gain
            <br />
            • Vous contacter concernant votre lot
            <br />
            <br />
            Vos données ne sont jamais partagées avec des tiers. <strong>À votre demande lors de la récupération de votre lot,
            vos coordonnées personnelles seront immédiatement et définitivement supprimées</strong>, seul le code de gain
            sera conservé pour notre gestion interne. Vous disposez également d'un droit d'accès et de rectification
            de vos données. Pour exercer ces droits, contactez-nous à l'adresse email du commerce concerné.
          </p>
        </div>
      </main>
    </div>
  );
}
