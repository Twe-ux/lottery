"use client";

import RouletteWheel from "@/components/client/RouletteWheel";
import { useSession } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Prize {
  id: string;
  name: string;
  description?: string;
  value?: number;
  color: string;
}

interface SpinResultData {
  success: boolean;
  spinResult: {
    angle: number;
    segment: number;
  };
  prize: Prize;
  claimCode: string;
  expiresAt: string;
  winnerId: string;
}

export default function LotteryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState<
    "google-prompt" | "review" | "lottery" | "result"
  >("review");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [spinAngle, setSpinAngle] = useState<number | undefined>();
  const [spinSegment, setSpinSegment] = useState<number | undefined>();
  const [result, setResult] = useState<SpinResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState<string>("");
  const [hasOpenedGoogleReview, setHasOpenedGoogleReview] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [canParticipate, setCanParticipate] = useState(false);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    reviewText: "",
    clientName: "",
    clientEmail: "",
  });

  const commerceSlug = params.commerceSlug as string;
  const campaignId = searchParams.get("c");

  // Si connecté avec Google, aller directement à l'étape Google
  useEffect(() => {
    if (session?.user && session.user.isTemporary) {
      setReviewData({
        rating: 5,
        reviewText: "Avis laissé sur Google",
        clientName: session.user.name || "",
        clientEmail: session.user.email || "",
      });
      setStep("google-prompt");
    }
  }, [session]);

  // Compte à rebours de 45 secondes (en arrière-plan, sans affichage)
  useEffect(() => {
    if (hasOpenedGoogleReview && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (hasOpenedGoogleReview && timeRemaining === 0) {
      setCanParticipate(true);
    }
  }, [hasOpenedGoogleReview, timeRemaining]);

  useEffect(() => {
    if (campaignId) {
      fetchPrizes();
    }
  }, [campaignId]);

  const fetchPrizes = async () => {
    try {
      const response = await fetch(`/api/public/campaigns/${campaignId}`);
      const data = await response.json();

      if (data.campaign && data.prizes) {
        // Récupérer le lien Google Business du commerce
        if (data.campaign.commerceId?.googleBusinessUrl) {
          setGoogleBusinessUrl(data.campaign.commerceId.googleBusinessUrl);
        }

        // Palette de couleurs vives et variées
        const colorPalette = [
          "#EF4444", // red
          "#F59E0B", // amber
          "#10B981", // emerald
          "#3B82F6", // blue
          "#8B5CF6", // violet
          "#EC4899", // pink
          "#14B8A6", // teal
          "#F97316", // orange
          "#06B6D4", // cyan
          "#A855F7", // purple
        ];

        // Filtrer les lots actifs avec stock disponible (même logique que le serveur)
        const availablePrizes = data.prizes.filter(
          (p: any) =>
            p.isActive &&
            (p.stock === null || p.stock === undefined || p.stock > 0)
        );
        setPrizes(
          availablePrizes.map((p: any, index: number) => ({
            id: p._id,
            name: p.name,
            description: p.description,
            value: p.value,
            color: p.color || colorPalette[index % colorPalette.length],
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching prizes:", error);
      // Fallback vers des lots statiques en cas d'erreur
      setPrizes([
        { id: "1", name: "Café offert", color: "#8B4513" },
        { id: "2", name: "-10% sur commande", color: "#3B82F6" },
        { id: "3", name: "Dessert offert", color: "#EF4444" },
        { id: "4", name: "Menu complet", color: "#10B981" },
      ]);
    }
  };

  // const handleReviewSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);

  //   try {
  //     // Utilisateurs sans Google : passer directement à la loterie
  //     setLoading(false);
  //     setStep("lottery");
  //   } catch (error) {
  //     console.error("Error submitting review:", error);
  //     setLoading(false);
  //   }
  // };

  const handleGoogleReviewClick = () => {
    // Afficher la modale d'avertissement
    setShowWarningModal(true);
  };

  const handleConfirmOpenGoogle = () => {
    // Fermer la modale
    setShowWarningModal(false);
    // Ouvrir Google Reviews
    if (googleBusinessUrl) {
      window.open(googleBusinessUrl, "_blank");
      // Démarrer le compte à rebours de 45 secondes
      setHasOpenedGoogleReview(true);
      setTimeRemaining(45);
      setCanParticipate(false);
    }
  };

  const handleConfirmGoogleReview = () => {
    // Passer à la loterie
    setStep("lottery");
  };

  const handleSpinClick = async () => {
    if (!campaignId) return;

    setLoading(true);

    try {
      // Récupérer d'abord les détails de la campagne pour obtenir le commerceId
      const campaignResponse = await fetch(
        `/api/public/campaigns/${campaignId}`
      );
      const campaignData = await campaignResponse.json();

      if (!campaignData.campaign) {
        throw new Error("Campaign not found");
      }

      // Appeler l'API de tirage
      const response = await fetch("/api/lottery/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          commerceId:
            campaignData.campaign.commerceId._id ||
            campaignData.campaign.commerceId,
          reviewData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to spin");
      }

      setSpinAngle(data.spinResult.angle);
      setSpinSegment(data.spinResult.segment);
      setResult(data);
      setLoading(false);
    } catch (error) {
      console.error("Error spinning:", error);
      alert(error instanceof Error ? error.message : "Une erreur est survenue");
      setLoading(false);
    }
  };

  const handleSpinComplete = (prizeId: string) => {
    // Attendre un peu avant de montrer le résultat
    setTimeout(() => {
      setStep("result");
    }, 1500);
  };

  // Modale d'avertissement avant d'ouvrir Google
  const WarningModal = () => {
    if (!showWarningModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              ⚠️ Important !
            </h3>
            <div className="text-left bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-gray-800 font-medium  text-center mb-3">
                Une nouvelle fenêtre va s'ouvrir avec <br /> Google Avis.
              </p>
              <p className="text-gray-700 mb-4 text-center ">
                📝 <strong>Après avoir publié votre avis</strong>,<br /> revenez
                sur cette page pour tourner la roue et gagner votre cadeau ! 🎁
              </p>
              <p className="text-sm text-center text-gray-600 italic">
                💡 Astuce : Gardez cet onglet ouvert pendant que vous laissez
                votre avis.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmOpenGoogle}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg"
            >
              J'ai compris, ouvrir Google Avis
            </button>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Étape Google Prompt - pour les utilisateurs connectés avec Google
  if (step === "google-prompt") {
    return (
      <>
        <WarningModal />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Header avec profil Google */}
              <div className="text-center mb-8">
                {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                  </svg>
                </div> */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Bonjour <br /> {session?.user?.name} ! <br />
                  👋
                </h1>
                <p className="text-gray-600">
                  Merci de partager votre expérience
                </p>
              </div>

              {/* Étape 1 : Laisser un avis sur Google */}
              <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    1
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Laissez votre avis sur Google
                  </h3>
                  <div className="flex-1">
                    <p className="text-gray-700 mb-4">
                      Partagez votre expérience en quelques clics. Vous êtes
                      déjà connecté avec votre compte Google !
                    </p>
                    <button
                      onClick={handleGoogleReviewClick}
                      className="w-full flex flex-col items-center justify-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all shadow-lg"
                    >
                      <svg
                        className="w-6 h-6"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Ouvrir Google Avis
                    </button>
                  </div>
                </div>
              </div>

              {/* Étape 2 : Confirmer et jouer */}
              <div
                className={`p-6 border-2 rounded-xl transition-all ${
                  canParticipate
                    ? "bg-green-50 border-green-200"
                    : hasOpenedGoogleReview
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-gray-50 border-gray-300 opacity-60"
                }`}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      canParticipate
                        ? "bg-green-600 text-white"
                        : hasOpenedGoogleReview
                        ? "bg-yellow-500 text-white"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Tentez votre chance !
                  </h3>

                  <div className="flex-1">
                    {!hasOpenedGoogleReview ? (
                      <p className="text-gray-600 mb-4 italic">
                        🔒 Cliquez d'abord sur "Ouvrir Google Avis" ci-dessus
                      </p>
                    ) : !canParticipate ? (
                      <div className="mb-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
                          <p className="text-yellow-800 font-medium mb-1">
                            ⏳ Veuillez patienter...
                          </p>
                          <p className="text-yellow-700 text-sm">
                            Prenez le temps de laisser votre avis sur Google. Le
                            bouton se déverrouillera après la confirmation ! 🎁
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                          <p className="text-green-800 font-medium mb-1">
                            ✅ Parfait !
                          </p>
                          <p className="text-green-700 text-sm">
                            Vous pouvez maintenant tourner la roue et remporter
                            votre cadeau ! 🎁
                          </p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleConfirmGoogleReview}
                      disabled={!canParticipate}
                      className={`w-full px-2 py-4 font-bold text-lg rounded-lg transition-all shadow-lg ${
                        canParticipate
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 cursor-pointer"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {canParticipate
                        ? "Tourner la roue ! 🎉"
                        : !hasOpenedGoogleReview
                        ? "Déverrouillé après avoir publié un avis 🔒"
                        : "Veuillez patienter pendant la confirmation de la publication ...  ⏳"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // if (step === 'review') {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
  //       <div className="max-w-2xl mx-auto">
  //         <div className="bg-white rounded-2xl shadow-xl p-8">
  //           <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
  //             Laissez votre avis
  //           </h1>

  //           <form onSubmit={handleReviewSubmit} className="space-y-6">
  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Votre nom
  //               </label>
  //               <input
  //                 type="text"
  //                 required
  //                 value={reviewData.clientName}
  //                 onChange={(e) => setReviewData({ ...reviewData, clientName: e.target.value })}
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="Jean Dupont"
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Votre email
  //               </label>
  //               <input
  //                 type="email"
  //                 required
  //                 value={reviewData.clientEmail}
  //                 onChange={(e) => setReviewData({ ...reviewData, clientEmail: e.target.value })}
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="jean@example.com"
  //               />
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Note
  //               </label>
  //               <div className="flex space-x-2">
  //                 {[1, 2, 3, 4, 5].map((star) => (
  //                   <button
  //                     key={star}
  //                     type="button"
  //                     onClick={() => setReviewData({ ...reviewData, rating: star })}
  //                     className={`text-4xl ${
  //                       star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
  //                     }`}
  //                   >
  //                     ★
  //                   </button>
  //                 ))}
  //               </div>
  //             </div>

  //             <div>
  //               <label className="block text-sm font-medium text-gray-700 mb-2">
  //                 Votre avis
  //               </label>
  //               <textarea
  //                 required
  //                 rows={4}
  //                 value={reviewData.reviewText}
  //                 onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
  //                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  //                 placeholder="Partagez votre expérience..."
  //                 minLength={10}
  //               />
  //             </div>

  //             <button
  //               type="submit"
  //               disabled={loading}
  //               className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  //             >
  //               {loading ? (
  //                 <span className="flex items-center justify-center">
  //                   <Loader2 className="w-5 h-5 mr-2 animate-spin" />
  //                   Envoi en cours...
  //                 </span>
  //               ) : (
  //                 'Publier mon avis et participer'
  //               )}
  //             </button>
  //           </form>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  if (step === "lottery") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Tournez la roue !
            </h1>
            <p className="text-lg text-gray-600">
              Cliquez sur le bouton pour tenter votre chance
            </p>
          </div>

          {prizes.length > 0 && (
            <RouletteWheel
              prizes={prizes}
              spinAngle={spinAngle}
              spinSegment={spinSegment}
              onSpinComplete={handleSpinComplete}
              disabled={loading || !!spinAngle}
            />
          )}

          {!spinAngle && (
            <div className="text-center mt-8">
              <button
                onClick={handleSpinClick}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? "Préparation..." : "Cliquez pour lancer !"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "result" && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Félicitations !
              </h1>
              <p className="text-xl text-gray-600">Vous avez gagné :</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {result.prize.name}
              </h2>
              {result.prize.description && (
                <p className="text-gray-700">{result.prize.description}</p>
              )}
              {result.prize.value && (
                <p className="text-lg font-semibold text-green-600 mt-2">
                  Valeur: {result.prize.value}€
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Votre code de réclamation :
              </p>
              <div className="text-3xl font-mono font-bold text-blue-600 mb-4 select-all">
                {result.claimCode}
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Valable jusqu'au{" "}
                {new Date(result.expiresAt).toLocaleDateString("fr-FR")}
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2 text-sm">
                  💡 Sauvegardez votre code
                </h3>
                <p className="text-xs text-blue-800">
                  Prenez une capture d'écran ou cliquez sur "Voir les options de
                  sauvegarde" pour accéder à toutes les options (copie, email,
                  téléchargement).
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(`/${commerceSlug}/prize/${result.claimCode}`)
              }
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Voir les options de sauvegarde
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
