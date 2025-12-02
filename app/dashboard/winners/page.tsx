'use client';

import { useEffect, useState } from 'react';
import { Gift, CheckCircle, Clock, XCircle, Search, Trash2 } from 'lucide-react';

interface Winner {
  _id: string;
  claimCode: string;
  clientName: string;
  clientEmail: string;
  prizeSnapshot: {
    name: string;
    value?: number;
  };
  status: 'pending' | 'claimed' | 'expired';
  expiresAt: string;
  claimedAt?: string;
  claimedBy?: string;
  createdAt: string;
}

interface Commerce {
  _id: string;
  name: string;
}

export default function WinnersPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCode, setSearchCode] = useState('');
  const [selectedCommerce, setSelectedCommerce] = useState<string>('all');
  const [validatingCode, setValidatingCode] = useState<string | null>(null);
  const [anonymizingId, setAnonymizingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCommerces();
  }, []);

  useEffect(() => {
    fetchWinners();
  }, [selectedCommerce]);

  const fetchCommerces = async () => {
    try {
      const response = await fetch('/api/commerces');
      const data = await response.json();
      setCommerces(data.commerces || []);
    } catch (error) {
      console.error('Error fetching commerces:', error);
    }
  };

  const fetchWinners = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCommerce !== 'all') params.append('commerceId', selectedCommerce);

      const url = `/api/winners${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setWinners(data.winners || []);
    } catch (error) {
      console.error('Error fetching winners:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateClaim = async (code: string) => {
    if (!confirm(`Valider le gain avec le code ${code} ?`)) return;

    setValidatingCode(code);

    try {
      const response = await fetch('/api/winners/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimCode: code }),
      });

      if (response.ok) {
        alert('Gain validé avec succès !');
        fetchWinners();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Error validating claim:', error);
      alert('Erreur lors de la validation');
    } finally {
      setValidatingCode(null);
    }
  };

  const searchByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      fetchWinners();
      return;
    }

    try {
      const response = await fetch(`/api/winners?code=${searchCode}`);
      const data = await response.json();
      setWinners(data.winners || []);
    } catch (error) {
      console.error('Error searching winner:', error);
    }
  };

  const anonymizeWinner = async (winnerId: string, clientName: string) => {
    if (!confirm(`Supprimer les coordonnées de ${clientName} ?\n\nLe code de gain sera conservé mais les informations personnelles (nom, email) seront définitivement supprimées.`)) {
      return;
    }

    setAnonymizingId(winnerId);

    try {
      const response = await fetch('/api/winners/anonymize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      });

      if (response.ok) {
        alert('Coordonnées supprimées avec succès !');
        fetchWinners();
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error anonymizing winner:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setAnonymizingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'claimed':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'claimed':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Gagnants</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Commerce Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par magasin
            </label>
            <select
              value={selectedCommerce}
              onChange={(e) => setSelectedCommerce(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les magasins</option>
              {commerces.map((commerce) => (
                <option key={commerce._id} value={commerce._id}>
                  {commerce.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Bar */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher par code
            </label>
            <form onSubmit={searchByCode} className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="RVW-XXXXXX"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {winners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun gagnant
          </h3>
          <p className="text-gray-600">
            Les gagnants apparaîtront ici une fois qu'ils auront participé
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gagnant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lot
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expire le
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
              {winners.map((winner) => (
                <tr key={winner._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono font-bold text-blue-600">
                      {winner.claimCode}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {winner.clientName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {winner.clientEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {winner.prizeSnapshot.name}
                    </div>
                    {winner.prizeSnapshot.value && (
                      <div className="text-sm text-green-600">
                        {winner.prizeSnapshot.value}€
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(winner.createdAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(winner.expiresAt).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        winner.status
                      )}`}
                    >
                      {getStatusIcon(winner.status)}
                      <span className="ml-1">
                        {winner.status === 'pending' && 'En attente'}
                        {winner.status === 'claimed' && 'Réclamé'}
                        {winner.status === 'expired' && 'Expiré'}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-3">
                      {winner.status === 'pending' && (
                        <button
                          onClick={() => validateClaim(winner.claimCode)}
                          disabled={validatingCode === winner.claimCode}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {validatingCode === winner.claimCode
                            ? 'Validation...'
                            : 'Valider'}
                        </button>
                      )}
                      {winner.status === 'claimed' && (
                        <>
                          <div className="text-xs text-gray-500">
                            Réclamé le{' '}
                            {new Date(winner.claimedAt!).toLocaleDateString('fr-FR')}
                          </div>
                          {winner.clientName !== '[SUPPRIMÉ]' && (
                            <button
                              onClick={() => anonymizeWinner(winner._id, winner.clientName)}
                              disabled={anonymizingId === winner._id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="Supprimer les coordonnées (RGPD)"
                            >
                              {anonymizingId === winner._id ? (
                                'Suppression...'
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          {winner.clientName === '[SUPPRIMÉ]' && (
                            <span className="text-xs text-gray-400 italic">
                              Données supprimées
                            </span>
                          )}
                        </>
                      )}
                    </div>
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
