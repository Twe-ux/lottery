'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
  isActive: boolean;
  isComplete: boolean;
  prizesCount: number;
  totalProbability: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [prizePools, setPrizePools] = useState<PrizePool[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commerceId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    prizePoolId: '',
    expirationDays: 30,
    maxParticipations: '',
  });

  useEffect(() => {
    fetchCommerces();
  }, []);

  useEffect(() => {
    if (formData.commerceId) {
      fetchPrizePools(formData.commerceId);
    }
  }, [formData.commerceId]);

  const fetchCommerces = async () => {
    try {
      const res = await fetch('/api/commerces');
      if (res.ok) {
        const data = await res.json();
        setCommerces(data);
        // Auto-sélectionner le commerce si un seul disponible
        if (data.length === 1) {
          setFormData((prev) => ({ ...prev, commerceId: data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching commerces:', error);
    }
  };

  const fetchPrizePools = async (commerceId: string) => {
    try {
      const res = await fetch(`/api/prize-pools?commerceId=${commerceId}`);
      if (res.ok) {
        const data = await res.json();
        setPrizePools(data);
      }
    } catch (error) {
      console.error('Error fetching prize pools:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        commerceId: formData.commerceId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        prizePoolId: formData.prizePoolId,
        settings: {
          expirationDays: formData.expirationDays,
          maxParticipations: formData.maxParticipations
            ? parseInt(formData.maxParticipations)
            : undefined,
        },
      };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/dashboard/campaigns');
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la création de la campagne');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Erreur lors de la création de la campagne');
    } finally {
      setLoading(false);
    }
  };

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
          Créer une nouvelle campagne
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
              placeholder="Campagne Été 2024"
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
              placeholder="Description de la campagne"
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

          {formData.commerceId && (
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
                    {pool.name} ({pool.prizesCount} lot{pool.prizesCount > 1 ? 's' : ''} - {pool.totalProbability}%)
                    {!pool.isComplete && ' ⚠️ Incomplet'}
                  </option>
                ))}
              </select>
              {prizePools.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Aucun ensemble de lots disponible. <Link href="/dashboard/prize-pools" className="text-blue-600 hover:underline">Créez-en un d'abord</Link>.
                </p>
              )}
              {formData.prizePoolId && prizePools.find(p => p._id === formData.prizePoolId && !p.isComplete) && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Cet ensemble n'atteint pas 100%. Complétez-le avant de lancer la campagne.
                </p>
              )}
            </div>
          )}

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
              <p className="text-xs text-gray-500 mt-1">
                Nombre de jours pendant lesquels un lot gagné peut être réclamé
              </p>
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
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour illimité
              </p>
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Création...' : 'Créer la campagne'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
