'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Users, Trophy, Star, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  commerceId: {
    _id: string;
    name: string;
  };
  startDate: string;
  endDate: string;
  isActive: boolean;
  stats: {
    totalScans: number;
    totalReviews: number;
    totalWinners: number;
  };
}

export default function CampaignStatsPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignStats();
  }, [campaignId]);

  const fetchCampaignStats = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data);
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Campagne non trouvée</p>
        <Link
          href="/dashboard/campaigns"
          className="text-blue-600 hover:underline mt-4 inline-block"
        >
          Retour aux campagnes
        </Link>
      </div>
    );
  }

  const stats = [
    {
      name: 'Scans totaux',
      value: campaign.stats.totalScans || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Avis reçus',
      value: campaign.stats.totalReviews || 0,
      icon: Star,
      color: 'bg-green-500',
    },
    {
      name: 'Gagnants',
      value: campaign.stats.totalWinners || 0,
      icon: Trophy,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux campagnes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {campaign.name}
        </h1>
        {campaign.description && (
          <p className="text-gray-600 mb-4">{campaign.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {new Date(campaign.startDate).toLocaleDateString('fr-FR')} - {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} rounded-full p-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Informations complémentaires
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-gray-600">Commerce</span>
            <span className="font-medium text-gray-900">
              {campaign.commerceId.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
