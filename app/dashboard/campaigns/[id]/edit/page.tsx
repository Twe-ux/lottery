'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Commerce {
  _id: string;
  name: string;
}

interface PrizePool {
  _id: string;
  name: string;
  description?: string;
  commerceName?: string;
  prizesCount?: number;
  totalProbability?: number;
  isComplete?: boolean;
}

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [prizePools, setPrizePools] = useState<PrizePool[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commerceId: '',
    startDate: '',
    endDate: '',
    prizePoolId: '',
    expirationDays: 30,
    maxParticipations: '',
    isActive: true,
  });

  useEffect(() => {
    fetchCampaign();
    fetchCommerces();
    fetchAllPrizePools();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (res.ok) {
        const campaign = await res.json();
        setFormData({
          name: campaign.name,
          description: campaign.description || '',
          commerceId: campaign.commerceId._id || campaign.commerceId,
          startDate: new Date(campaign.startDate).toISOString().split('T')[0],
          endDate: new Date(campaign.endDate).toISOString().split('T')[0],
          prizePoolId: campaign.prizePoolId._id || campaign.prizePoolId,
          expirationDays: campaign.settings?.expirationDays || 30,
          maxParticipations: campaign.settings?.maxParticipations?.toString() || '',
          isActive: campaign.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommerces = async () => {
    try {
      const res = await fetch('/api/commerces');
      if (res.ok) {
        const data = await res.json();
        setCommerces(data);
      }
    } catch (error) {
      console.error('Error fetching commerces:', error);
    }
  };

  const fetchAllPrizePools = async () => {
    try {
      // Récupérer tous les commerces pour ensuite charger tous les prize pools
      const commercesRes = await fetch('/api/commerces');
      if (!commercesRes.ok) return;

      const commercesData = await commercesRes.json();

      // Charger tous les prize pools de tous les commerces
      const allPrizePools: PrizePool[] = [];

      for (const commerce of commercesData) {
        const res = await fetch(`/api/prize-pools?commerceId=${commerce._id}`);
        if (res.ok) {
          const data = await res.json();
          // Ajouter le nom du commerce à chaque pool pour l'affichage
          const poolsWithCommerce = data.map((pool: PrizePool) => ({
            ...pool,
            commerceName: commerce.name,
          }));
          allPrizePools.push(...poolsWithCommerce);
        }
      }

      setPrizePools(allPrizePools);
    } catch (error) {
      console.error('Error fetching prize pools:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        commerceId: formData.commerceId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        prizePoolId: formData.prizePoolId,
        isActive: formData.isActive,
        settings: {
          expirationDays: formData.expirationDays,
          maxParticipations: formData.maxParticipations
            ? parseInt(formData.maxParticipations)
            : undefined,
        },
      };

      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/dashboard/campaigns');
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la modification de la campagne');
      }
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Erreur lors de la modification de la campagne');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

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

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Modifier la campagne
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la campagne *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commerce *
            </label>
            <select
              required
              value={formData.commerceId}
              onChange={(e) =>
                setFormData({ ...formData, commerceId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un commerce</option>
              {commerces.map((commerce) => (
                <option key={commerce._id} value={commerce._id}>
                  {commerce.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ensemble de lots *
            </label>
            <select
              required
              value={formData.prizePoolId}
              onChange={(e) =>
                setFormData({ ...formData, prizePoolId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sélectionner un ensemble de lots</option>
              {prizePools.map((pool) => (
                <option key={pool._id} value={pool._id}>
                  {pool.name} - {pool.commerceName} ({pool.prizesCount || 0} lot{(pool.prizesCount || 0) > 1 ? 's' : ''} - {pool.totalProbability || 0}%)
                  {!pool.isComplete && ' ⚠️ Incomplet'}
                </option>
              ))}
            </select>
            {formData.prizePoolId && prizePools.find(p => p._id === formData.prizePoolId && !p.isComplete) && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ Cet ensemble n'atteint pas 100%. Complétez-le avant de lancer la campagne.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jours avant expiration du lot
              </label>
              <input
                type="number"
                min="1"
                value={formData.expirationDays}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    expirationDays: parseInt(e.target.value) || 30,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participations max par utilisateur
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxParticipations}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxParticipations: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Illimité"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Campagne active</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Link
              href="/dashboard/campaigns"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
