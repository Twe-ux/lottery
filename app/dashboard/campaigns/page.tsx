'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Calendar, BarChart } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  commerceId: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  startDate: string;
  endDate: string;
  stats: {
    totalParticipations: number;
    totalReviews: number;
    totalWinners: number;
  };
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();

    // Recharger quand la page devient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCampaigns();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchCampaigns = async () => {
    try {
      console.log('[CAMPAIGNS PAGE] Fetching campaigns...');
      const response = await fetch('/api/campaigns');
      console.log('[CAMPAIGNS PAGE] Response status:', response.status);

      const data = await response.json();
      console.log('[CAMPAIGNS PAGE] Response data:', data);
      console.log('[CAMPAIGNS PAGE] Campaigns count:', data.campaigns?.length || 0);

      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('[CAMPAIGNS PAGE] Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) return;

    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCampaigns();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Campagnes</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle campagne
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune campagne
          </h3>
          <p className="text-gray-600 mb-4">
            Commencez par créer votre première campagne
          </p>
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une campagne
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campagne
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commerce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statistiques
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign._id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {campaign.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.commerceId.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(campaign.startDate).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="text-sm text-gray-500">
                      au {new Date(campaign.endDate).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {campaign.stats.totalParticipations} participations
                    </div>
                    <div className="text-sm text-gray-500">
                      {campaign.stats.totalWinners} gagnants
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/campaigns/${campaign._id}/stats`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <BarChart className="w-4 h-4 inline" />
                    </Link>
                    <Link
                      href={`/dashboard/campaigns/${campaign._id}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <Edit className="w-4 h-4 inline" />
                    </Link>
                    <button
                      onClick={() => deleteCampaign(campaign._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
