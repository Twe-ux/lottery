'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Gift, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react';

interface Prize {
  _id: string;
  name: string;
  description?: string;
  value?: number;
  stock?: number;
  isActive: boolean;
  color: string;
  displayOrder: number;
}

export default function PrizesPage() {
  const { data: session } = useSession();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);
  const [commerceId, setCommerceId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    stock: '',
    color: '#3B82F6',
    displayOrder: 0,
  });

  useEffect(() => {
    if (session?.user.commerceId) {
      setCommerceId(session.user.commerceId);
      fetchPrizes(session.user.commerceId);
    } else if (session?.user.role === 'super_admin') {
      fetchFirstCommerce();
    }
  }, [session]);

  const fetchFirstCommerce = async () => {
    try {
      const res = await fetch('/api/commerces');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCommerceId(data[0]._id);
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

  const fetchPrizes = async (cId: string) => {
    try {
      const res = await fetch(`/api/prizes?commerceId=${cId}`);
      if (res.ok) {
        const data = await res.json();
        setPrizes(data);
      }
    } catch (error) {
      console.error('Error fetching prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePrizeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/prizes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        fetchPrizes(commerceId);
      }
    } catch (error) {
      console.error('Error updating prize:', error);
    }
  };

  const handleEdit = (prize: Prize) => {
    setEditingId(prize._id);
    setFormData({
      name: prize.name,
      description: prize.description || '',
      value: prize.value?.toString() || '',
      stock: prize.stock?.toString() || '',
      color: prize.color,
      displayOrder: prize.displayOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        commerceId,
        name: formData.name,
        description: formData.description || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        stock: formData.stock ? parseInt(formData.stock) : null,
        color: formData.color,
        displayOrder: formData.displayOrder,
        isActive: true,
      };

      const url = editingId ? `/api/prizes/${editingId}` : '/api/prizes';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          name: '',
          description: '',
          value: '',
          stock: '',
          color: '#3B82F6',
          displayOrder: 0,
        });
        fetchPrizes(commerceId);
      } else {
        const error = await res.json();
        alert(error.error || `Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
      }
    } catch (error) {
      console.error('Error saving prize:', error);
      alert(`Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
    }
  };

  const deletePrize = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) return;

    try {
      const res = await fetch(`/api/prizes/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchPrizes(commerceId);
      }
    } catch (error) {
      console.error('Error deleting prize:', error);
    }
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
        <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun commerce trouvé
        </h3>
        <p className="text-gray-600">
          Veuillez d'abord créer un commerce avant de configurer les lots
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bibliothèque de lots</h1>
          <p className="text-gray-600 mt-2">
            Créez tous les lots disponibles. Vous pourrez ensuite les associer à des ensembles avec des probabilités.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouveau lot
        </button>
      </div>

      {prizes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun lot configuré
          </h3>
          <p className="text-gray-600 mb-6">
            Créez vos premiers lots pour la loterie
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Créer un lot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prizes.map((prize) => (
            <div
              key={prize._id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="h-32 flex items-center justify-center"
                style={{ backgroundColor: prize.color }}
              >
                <Gift className="w-16 h-16 text-white opacity-50" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {prize.name}
                    </h3>
                    {prize.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {prize.description}
                      </p>
                    )}
                    {prize.value && (
                      <p className="text-sm font-medium text-blue-600">
                        Valeur: {prize.value}€
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => togglePrizeStatus(prize._id, prize.isActive)}
                    className={`p-2 rounded-lg transition-colors ${
                      prize.isActive
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {prize.isActive ? (
                      <Power className="w-5 h-5" />
                    ) : (
                      <PowerOff className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <span className="font-medium text-gray-900">
                      {prize.stock === null || prize.stock === undefined
                        ? 'Illimité'
                        : prize.stock}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(prize)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </button>
                  <button
                    onClick={() => deletePrize(prize._id)}
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
        <p className="text-sm text-blue-800">
          Créez ici tous les lots que vous souhaitez pouvoir offrir. Vous pourrez ensuite les sélectionner et définir leurs probabilités dans les "Ensembles de lots".
        </p>
      </div>

      {/* Modal de création/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Modifier le lot' : 'Créer un nouveau lot'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du lot *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Café offert"
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
                    placeholder="Un café au choix offert"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valeur (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Illimité"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Laissez vide pour illimité
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Plus le nombre est petit, plus le lot apparaît en premier
                  </p>
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
                        value: '',
                        stock: '',
                        color: '#3B82F6',
                        probabilityMode: 'fixed',
                        fixedPercent: '25',
                        displayOrder: 0,
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Modifier' : 'Créer le lot'}
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
