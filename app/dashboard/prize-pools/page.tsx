'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Package, Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Prize {
  _id: string;
  name: string;
  description?: string;
  color: string;
  value?: number;
}

interface PrizePoolPrize {
  prizeId: string;
  probability: {
    mode: 'fixed' | 'star-based';
    fixedPercent?: number;
  };
}

interface PrizePool {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  prizes: PrizePoolPrize[];
  prizesCount: number;
  totalProbability: number;
  isComplete: boolean;
  createdAt: string;
}

interface Commerce {
  _id: string;
  name: string;
  slug: string;
}

export default function PrizePoolsPage() {
  const { data: session } = useSession();
  const [prizePools, setPrizePools] = useState<PrizePool[]>([]);
  const [availablePrizes, setAvailablePrizes] = useState<Prize[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [commerceId, setCommerceId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [selectedPrizes, setSelectedPrizes] = useState<{ [key: string]: { selected: boolean; percent: string } }>({});

  useEffect(() => {
    if (session?.user.commerceId) {
      setCommerceId(session.user.commerceId);
      fetchPrizePools(session.user.commerceId);
      fetchPrizes(session.user.commerceId);
    } else if (session?.user.role === 'super_admin') {
      fetchCommerces();
    }
  }, [session]);

  const fetchCommerces = async () => {
    try {
      const res = await fetch('/api/commerces');
      if (res.ok) {
        const data = await res.json();
        setCommerces(data);
        if (data.length > 0) {
          setCommerceId(data[0]._id);
          fetchPrizePools(data[0]._id);
          fetchPrizes(data[0]._id);
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error fetching commerce:', error);
      setLoading(false);
    }
  };

  const handleCommerceChange = (newCommerceId: string) => {
    setCommerceId(newCommerceId);
    fetchPrizePools(newCommerceId);
    fetchPrizes(newCommerceId);
  };

  const fetchPrizes = async (cId: string) => {
    try {
      const res = await fetch(`/api/prizes?commerceId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setAvailablePrizes(data);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
    }
  };

  const fetchPrizePools = async (cId: string) => {
    try {
      const res = await fetch(`/api/prize-pools?commerceId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setPrizePools(data);
      }
    } catch (error) {
      console.error('Error fetching prize pools:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pool: PrizePool) => {
    console.log('🟡 [EDIT] Opening pool for editing:', pool);
    console.log('🟡 [EDIT] pool.prizes:', pool.prizes);
    console.log('🟡 [EDIT] pool.prizes is array?', Array.isArray(pool.prizes));
    console.log('🟡 [EDIT] pool.prizes length:', pool.prizes?.length);

    setEditingId(pool._id);
    setFormData({
      name: pool.name,
      description: pool.description || '',
    });

    // Load pool's prizes into selectedPrizes state
    const poolPrizes: { [key: string]: { selected: boolean; percent: string } } = {};

    if (pool.prizes && Array.isArray(pool.prizes)) {
      pool.prizes.forEach((p: any) => {
        const prizeId = typeof p.prizeId === 'string' ? p.prizeId : p.prizeId.toString();
        console.log('🟡 [EDIT] Processing prize:', { original: p.prizeId, converted: prizeId, percent: p.probability.fixedPercent });
        poolPrizes[prizeId] = {
          selected: true,
          percent: p.probability.fixedPercent?.toString() || '0',
        };
      });
    }

    console.log('🟡 [EDIT] Final selectedPrizes state:', poolPrizes);
    setSelectedPrizes(poolPrizes);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Build prizes array from selectedPrizes
      const prizes = Object.entries(selectedPrizes)
        .filter(([_, data]) => data.selected)
        .map(([prizeId, data]) => ({
          prizeId,
          probability: {
            mode: 'fixed' as const,
            fixedPercent: parseFloat(data.percent) || 0,
          },
        }));

      const payload = {
        commerceId,
        name: formData.name,
        description: formData.description || undefined,
        prizes,
      };

      console.log('🔵 [SUBMIT] Payload being sent:', JSON.stringify(payload, null, 2));
      console.log('🔵 [SUBMIT] Editing ID:', editingId);
      console.log('🔵 [SUBMIT] Selected prizes state:', selectedPrizes);

      const url = editingId ? `/api/prize-pools/${editingId}` : '/api/prize-pools';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('🔵 [SUBMIT] Response status:', res.status);
      const responseData = await res.json();
      console.log('🔵 [SUBMIT] Response data:', responseData);

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          name: '',
          description: '',
        });
        setSelectedPrizes({});
        fetchPrizePools(commerceId);
      } else {
        alert(responseData.error || `Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
      }
    } catch (error) {
      console.error('Error saving prize pool:', error);
      alert(`Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
    }
  };

  const deletePool = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet ensemble de lots ?')) return;

    try {
      const res = await fetch(`/api/prize-pools/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPrizePools(commerceId);
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting prize pool:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const togglePrizeSelection = (prizeId: string) => {
    setSelectedPrizes((prev) => ({
      ...prev,
      [prizeId]: {
        selected: !prev[prizeId]?.selected,
        percent: prev[prizeId]?.percent || '0',
      },
    }));
  };

  const updatePrizePercent = (prizeId: string, percent: string) => {
    setSelectedPrizes((prev) => ({
      ...prev,
      [prizeId]: {
        selected: prev[prizeId]?.selected || false,
        percent,
      },
    }));
  };

  const calculateTotalPercent = () => {
    return Object.entries(selectedPrizes)
      .filter(([_, data]) => data.selected)
      .reduce((sum, [_, data]) => sum + (parseFloat(data.percent) || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (!commerceId) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun commerce trouvé
        </h3>
        <p className="text-gray-600">
          Veuillez d'abord créer un commerce avant de configurer les ensembles de lots
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ensembles de lots</h1>
          <p className="text-gray-600 mt-2">
            Créez des groupes de gains avec des probabilités qui totalisent 100%
          </p>
        </div>
        <div className="flex items-center gap-4">
          {session?.user.role === 'super_admin' && commerces.length > 1 && (
            <select
              value={commerceId}
              onChange={(e) => handleCommerceChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {commerces.map((commerce) => (
                <option key={commerce._id} value={commerce._id}>
                  {commerce.name}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvel ensemble
          </button>
        </div>
      </div>

      {prizePools.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun ensemble de lots
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre premier ensemble de lots pour organiser vos gains
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un ensemble
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizePools.map((pool) => (
            <div
              key={pool._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pool.name}
                    </h3>
                    {pool.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {pool.description}
                      </p>
                    )}
                  </div>
                  {pool.isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-500" aria-label="Complet (100%)" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" aria-label="Incomplet" />
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Nombre de lots:</span>
                    <span className="font-medium text-gray-900">
                      {pool.prizesCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Probabilité totale:</span>
                    <span
                      className={`font-medium ${
                        pool.isComplete
                          ? 'text-green-600'
                          : pool.totalProbability > 100
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {pool.totalProbability}%
                    </span>
                  </div>
                </div>

                {!pool.isComplete && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      {pool.totalProbability > 100
                        ? `⚠️ Dépasse de ${(pool.totalProbability - 100).toFixed(1)}%`
                        : pool.totalProbability === 0
                        ? '⚠️ Aucun lot configuré'
                        : `⚠️ Manque ${(100 - pool.totalProbability).toFixed(1)}%`}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(pool)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </button>
                  <button
                    onClick={() => deletePool(pool._id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-2">
          💡 Comment ça marche ?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Créez un ensemble de lots (ex: "Campagne Été 2024")</li>
          <li>2. Ajoutez des gains dans cet ensemble avec leurs probabilités</li>
          <li>3. Assurez-vous que le total atteint 100%</li>
          <li>4. Associez l'ensemble à une campagne</li>
        </ul>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? "Modifier l'ensemble" : 'Créer un nouvel ensemble'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'ensemble *
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
                    placeholder="Ensemble de lots pour la période estivale"
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Sélectionner les lots
                    </label>
                    <span className={`text-sm font-medium ${
                      Math.abs(calculateTotalPercent() - 100) < 0.1
                        ? 'text-green-600'
                        : calculateTotalPercent() > 100
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}>
                      Total: {calculateTotalPercent().toFixed(1)}%
                    </span>
                  </div>

                  {availablePrizes.length === 0 ? (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">
                        Aucun lot disponible. <Link href="/dashboard/prizes" className="text-blue-600 hover:underline">Créez des lots d'abord</Link>
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-2">
                      {availablePrizes.map((prize) => (
                        <div
                          key={prize._id}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPrizes[prize._id]?.selected || false}
                            onChange={() => togglePrizeSelection(prize._id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{prize.name}</p>
                            {prize.description && (
                              <p className="text-xs text-gray-500">{prize.description}</p>
                            )}
                          </div>
                          {selectedPrizes[prize._id]?.selected && (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={selectedPrizes[prize._id]?.percent || '0'}
                                onChange={(e) => updatePrizePercent(prize._id, e.target.value)}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                placeholder="0"
                              />
                              <span className="text-sm text-gray-600">%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {Math.abs(calculateTotalPercent() - 100) > 0.1 && (
                    <p className="text-xs text-yellow-600 mt-2">
                      ⚠️ Le total doit être égal à 100%
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setFormData({
                        name: '',
                        description: '',
                      });
                      setSelectedPrizes({});
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Modifier' : "Créer l'ensemble"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
