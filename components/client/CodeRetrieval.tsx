'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Search, Gift, CheckCircle, XCircle, Clock, LogIn } from 'lucide-react';
import Link from 'next/link';

interface Winner {
  claimCode: string;
  prizeName: string;
  status: string;
  expiresAt: string;
  isExpired: boolean;
}

interface CodeRetrievalProps {
  commerceId: string;
  commerceSlug: string;
}

export default function CodeRetrieval({ commerceId, commerceSlug }: CodeRetrievalProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleRetrieve = async () => {
    setLoading(true);
    setError('');
    setWinners([]);
    setSearched(true);

    try {
      const res = await fetch('/api/winners/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commerceId }),
      });

      const data = await res.json();

      if (res.ok) {
        setWinners(data.winners);
      } else {
        setError(data.error || 'Aucun gain trouvé');
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Search className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Retrouver mon code
        </h3>
        <p className="text-gray-600">
          Connectez-vous pour accéder à vos codes de gain
        </p>
      </div>

      {/* Not authenticated */}
      {!session && (
        <div className="text-center">
          <button
            onClick={() => signIn('google')}
            disabled={status === 'loading'}
            className="inline-flex items-center px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Se connecter avec Google
          </button>
          <p className="text-xs text-gray-500 mt-4">
            🔒 Sécurisé - Vos gains sont protégés par votre compte Google
          </p>
        </div>
      )}

      {/* Authenticated */}
      {session && (
        <>
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Connecté en tant que: <strong>{session.user?.email}</strong>
              </p>
            </div>
            <button
              onClick={handleRetrieve}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Recherche...' : 'Voir mes gains'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Results */}
          {searched && winners.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">
                Vos gains ({winners.length})
              </h4>
              {winners.map((winner) => (
                <Link
                  key={winner.claimCode}
                  href={`/${commerceSlug}/prize/${winner.claimCode}`}
                  className="block border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {winner.prizeName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Code: {winner.claimCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {winner.isExpired ? (
                        <div className="flex items-center text-red-600 text-sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Expiré
                        </div>
                      ) : winner.status === 'claimed' ? (
                        <div className="flex items-center text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Réclamé
                        </div>
                      ) : (
                        <div className="flex items-center text-blue-600 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          Disponible
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Expire le {new Date(winner.expiresAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {searched && winners.length === 0 && !error && !loading && (
            <div className="text-center py-8 text-gray-500">
              Aucun gain trouvé pour votre compte
            </div>
          )}
        </>
      )}
    </div>
  );
}
