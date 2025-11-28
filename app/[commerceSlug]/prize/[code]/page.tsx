import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/db/connect';
import Winner from '@/lib/db/models/Winner';
import Commerce from '@/lib/db/models/Commerce';
import { Gift, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import QRCodeDisplay from '@/components/client/QRCodeDisplay';

interface PageProps {
  params: Promise<{ commerceSlug: string; code: string }>;
}

export default async function PrizePage({ params }: PageProps) {
  await dbConnect();

  const { commerceSlug, code } = await params;

  // Récupérer le gain par le code
  const winner = await Winner.findOne({ claimCode: code })
    .populate('commerceId')
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
  const isClaimed = winner.status === 'claimed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href={`/${commerceSlug}`}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            ← Retour
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner */}
          <div
            className={`py-4 text-center text-white font-semibold ${
              isExpired
                ? 'bg-red-500'
                : isClaimed
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}
          >
            {isExpired ? (
              <span className="flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Gain expiré
              </span>
            ) : isClaimed ? (
              <span className="flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Gain réclamé
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />
                Gain en attente
              </span>
            )}
          </div>

          {/* Prize Details */}
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {winner.prizeSnapshot.name}
              </h1>
              {winner.prizeSnapshot.description && (
                <p className="text-lg text-gray-600">
                  {winner.prizeSnapshot.description}
                </p>
              )}
              {winner.prizeSnapshot.value && (
                <p className="text-xl font-semibold text-green-600 mt-2">
                  Valeur: {winner.prizeSnapshot.value}€
                </p>
              )}
            </div>

            {/* Claim Code */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 text-center mb-3">
                Code de réclamation
              </p>
              <div className="text-4xl font-mono font-bold text-center text-blue-600 mb-4">
                {winner.claimCode}
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-lg p-4 inline-block mx-auto flex justify-center w-full">
                <QRCodeDisplay value={winner.claimCode} size={192} />
              </div>
            </div>

            {/* Winner Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <Gift className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Gagnant</p>
                  <p className="font-medium text-gray-900">{winner.clientName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Date d'expiration</p>
                  <p
                    className={`font-medium ${
                      isExpired ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {new Date(winner.expiresAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {isClaimed && winner.claimedAt && (
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Réclamé le</p>
                    <p className="font-medium text-gray-900">
                      {new Date(winner.claimedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {winner.claimedBy && (
                      <p className="text-sm text-gray-500">Par: {winner.claimedBy}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {!isExpired && !isClaimed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Comment récupérer votre gain ?
                </h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Présentez ce code en magasin</li>
                  <li>Montrez le QR code ci-dessus ou communiquez le code</li>
                  <li>Le personnel validera votre gain</li>
                  <li>Profitez de votre cadeau !</li>
                </ol>
              </div>
            )}

            {isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Gain expiré</h3>
                <p className="text-sm text-red-800">
                  Ce gain a expiré et ne peut plus être réclamé. Nous espérons vous
                  revoir bientôt !
                </p>
              </div>
            )}

            {isClaimed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Gain déjà réclamé
                </h3>
                <p className="text-sm text-green-800">
                  Ce gain a déjà été réclamé. Merci de votre participation !
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-center text-sm text-gray-600">
              Géré par {commerce.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
