'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Store, Plus, Edit, Trash2 } from 'lucide-react';

interface Commerce {
  _id: string;
  name: string;
  slug: string;
  googlePlaceId: string;
  subscription: {
    plan: string;
    validUntil: string;
  };
  createdAt: string;
}

export default function CommercesPage() {
  const { data: session } = useSession();
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    googlePlaceId: '',
    googleBusinessUrl: '',
    primaryColor: '#3B82F6',
  });

  useEffect(() => {
    fetchCommerces();
  }, []);

  const fetchCommerces = async () => {
    try {
      const res = await fetch('/api/commerces');
      if (res.ok) {
        const data = await res.json();
        setCommerces(data);
      }
    } catch (error) {
      console.error('Error fetching commerces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (commerce: Commerce) => {
    setEditingId(commerce._id);

    // Récupérer les détails complets du commerce
    try {
      const res = await fetch(`/api/commerces/${commerce._id}`);
      if (res.ok) {
        const fullCommerce = await res.json();
        setFormData({
          name: fullCommerce.name,
          slug: fullCommerce.slug,
          googlePlaceId: fullCommerce.googlePlaceId || '',
          googleBusinessUrl: fullCommerce.googleBusinessUrl || '',
          primaryColor: fullCommerce.primaryColor || '#3B82F6',
        });
      }
    } catch (error) {
      console.error('Error fetching commerce details:', error);
      setFormData({
        name: commerce.name,
        slug: commerce.slug,
        googlePlaceId: commerce.googlePlaceId || '',
        googleBusinessUrl: '',
        primaryColor: '#3B82F6',
      });
    }

    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/commerces/${editingId}` : '/api/commerces';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({
          name: '',
          slug: '',
          googlePlaceId: '',
          googleBusinessUrl: '',
          primaryColor: '#3B82F6',
        });
        fetchCommerces();
      } else {
        const error = await res.json();
        alert(error.error || `Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
      }
    } catch (error) {
      console.error('Error saving commerce:', error);
      alert(`Erreur lors de ${editingId ? 'la modification' : 'la création'}`);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const deleteCommerce = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce commerce ?')) return;

    try {
      const res = await fetch(`/api/commerces/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCommerces();
      }
    } catch (error) {
      console.error('Error deleting commerce:', error);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commerces</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos commerces et leurs paramètres
          </p>
        </div>
        {session?.user.role === 'super_admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouveau commerce
          </button>
        )}
      </div>

      {commerces.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun commerce
          </h3>
          <p className="text-gray-600 mb-6">
            Commencez par créer votre premier commerce
          </p>
          {session?.user.role === 'super_admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Créer un commerce
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commerce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date création
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {commerces.map((commerce) => (
                <tr key={commerce._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Store className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {commerce.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{commerce.slug}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        commerce.subscription.plan === 'pro'
                          ? 'bg-blue-100 text-blue-800'
                          : commerce.subscription.plan === 'enterprise'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {commerce.subscription.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(commerce.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(commerce)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {session?.user.role === 'super_admin' && (
                      <button
                        onClick={() => deleteCommerce(commerce._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingId ? 'Modifier le commerce' : 'Créer un nouveau commerce'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du commerce *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        name: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Café des Artistes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug (URL unique) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="cafe-des-artistes"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL: /{formData.slug}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Place ID
                  </label>
                  <input
                    type="text"
                    value={formData.googlePlaceId}
                    onChange={(e) =>
                      setFormData({ ...formData, googlePlaceId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ChIJDemo123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL Google Business (pour avis)
                  </label>
                  <input
                    type="url"
                    value={formData.googleBusinessUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        googleBusinessUrl: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://g.page/r/..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lien pour rediriger les clients avec avis positifs (4-5 étoiles) vers Google Reviews.
                    <br />
                    Trouvez-le sur votre profil Google Business ou sur Google Maps.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur principale
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="w-12 h-10 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) =>
                        setFormData({ ...formData, primaryColor: e.target.value })
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingId ? 'Modifier' : 'Créer le commerce'}
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
