"use client";

import { CheckCircle, Gift, Star, Trophy } from "lucide-react";
import { signIn } from "next-auth/react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  commerceId: {
    name: string;
    slug: string;
  };
}

export default function WelcomePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const commerceSlug = params.commerceSlug as string;
  const campaignId = searchParams.get("c");

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/public/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    router.push(`/${commerceSlug}/lottery?c=${campaignId}`);
  };

  const handleGoogleSignIn = async () => {
    await signIn("google", {
      callbackUrl: `/${commerceSlug}/lottery?c=${campaignId}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-lg text-gray-600">Campagne non trouvée</p>
        </div>
      </div>
    );
  }

  const steps = [
    {
      icon: Star,
      title: "Donnez votre avis",
      description: "Partagez votre expérience chez " + campaign.commerceId.name,
      color: "bg-yellow-500",
    },
    {
      icon: Trophy,
      title: "Tournez la roue",
      description: "Tentez votre chance à notre jeu de loterie",
      color: "bg-purple-500",
    },
    {
      icon: Gift,
      title: "Gagnez des prix",
      description: "Remportez des cadeaux et réductions exclusifs",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-6">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Bienvenue chez {campaign.commerceId.name}!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Partagez votre avis et tentez de gagner des prix exclusifs
          </p>
        </div>

        {/* Campaign Info */}
        {campaign.description && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-12 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {campaign.name}
            </h2>
            <p className="text-gray-600">{campaign.description}</p>
          </div>
        )}

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 text-center transform hover:scale-105 transition-transform"
            >
              <div
                className={`inline-flex items-center justify-center w-16 h-16 ${step.color} rounded-full mb-4`}
              >
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {index + 1}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Pourquoi participer ?
          </h2>
          <div className="space-y-4">
            {[
              "Partagez votre expérience en quelques secondes",
              "Aidez-nous à améliorer nos services",
              "100% de chances de gagner un prix",
              "Cadeaux et réductions exclusifs",
            ].map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-lg">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="max-w-md mx-auto space-y-4">
          {/* <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Choisissez votre méthode
            </h3>
            <p className="text-sm text-gray-600">
              Connexion Google = formulaire pré-rempli automatiquement
            </p>
          </div> */}

          {/* Google Sign In - Recommandé */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-blue-600 text-gray-900 text-lg font-semibold rounded-full hover:bg-blue-50 transform hover:scale-105 transition-all shadow-lg hover:shadow-xl"
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
            Continuer avec Google
            {/* <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
              RECOMMANDÉ
            </span> */}
          </button>

          {/* Continuer sans compte */}
          {/* <button
            onClick={handleStart}
            className="w-full inline-flex items-center justify-center px-8 py-4 bg-gray-100 text-gray-700 text-base font-medium rounded-full hover:bg-gray-200 transition-all"
          >
            Continuer sans compte
            <ArrowRight className="w-5 h-5 ml-2" />
          </button> */}

          <p className="text-xs text-center text-gray-500 mt-4">
            Cela ne prendra que 2 minutes • 100% gratuit
          </p>
        </div>
      </div>
    </div>
  );
}
