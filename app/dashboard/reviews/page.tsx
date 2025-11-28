'use client';

import { useEffect, useState } from 'react';
import { Star, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Review {
  _id: string;
  clientName: string;
  clientEmail: string;
  rating: number;
  reviewText: string;
  status: 'pending' | 'published' | 'rejected';
  source: 'internal' | 'google';
  googleReviewUrl?: string;
  createdAt: string;
  commerceId: {
    _id: string;
    name: string;
  };
}

interface Commerce {
  _id: string;
  name: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all');
  const [selectedCommerce, setSelectedCommerce] = useState<string>('all');

  useEffect(() => {
    fetchCommerces();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [filter, selectedCommerce]);

  const fetchCommerces = async () => {
    try {
      const response = await fetch('/api/commerces');
      const data = await response.json();
      setCommerces(data.commerces || []);
    } catch (error) {
      console.error('Error fetching commerces:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (selectedCommerce !== 'all') params.append('commerceId', selectedCommerce);

      const url = `/api/reviews${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: 'published' | 'rejected') => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchReviews();
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Avis clients</h1>

        <div className="flex flex-col sm:flex-row gap-4">
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

          {/* Status Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par statut
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                En attente
              </button>
              <button
                onClick={() => setFilter('published')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  filter === 'published'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Publiés
              </button>
            </div>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun avis</h3>
          <p className="text-gray-600">
            Les avis apparaîtront ici une fois que vos clients auront participé
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {review.clientName}
                    </h3>
                    {renderStars(review.rating)}
                    <span
                      className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        review.status
                      )}`}
                    >
                      {getStatusIcon(review.status)}
                      <span className="ml-1">
                        {review.status === 'pending' && 'En attente'}
                        {review.status === 'published' && 'Publié'}
                        {review.status === 'rejected' && 'Rejeté'}
                      </span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {review.clientEmail}
                  </p>
                  <p className="text-sm text-gray-500">
                    {review.commerceId.name} •{' '}
                    {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>

                {review.googleReviewUrl && (
                  <a
                    href={review.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                )}
              </div>

              <p className="text-gray-700 mb-4">{review.reviewText}</p>

              {review.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStatus(review._id, 'published')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => updateStatus(review._id, 'rejected')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
