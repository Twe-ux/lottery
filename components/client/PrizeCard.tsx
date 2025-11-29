'use client';

import { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Mail,
  Download,
  Calendar,
  Gift,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface PrizeCardProps {
  winner: {
    claimCode: string;
    clientName: string;
    clientEmail: string;
    expiresAt: string;
    status: string;
    claimedAt?: string;
    claimedBy?: string;
    prizeSnapshot: {
      name: string;
      description?: string;
      value?: number;
    };
  };
  commerce: {
    name: string;
    slug: string;
  };
  isExpired: boolean;
  isClaimed: boolean;
}

export default function PrizeCard({ winner, commerce, isExpired, isClaimed }: PrizeCardProps) {
  const [copied, setCopied] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState(winner.clientEmail || '');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Copier le code
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(winner.claimCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Télécharger une capture d'écran
  const handleScreenshot = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `gain-${winner.claimCode}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Failed to capture:', err);
    }
  };

  // Envoyer par email
  const handleSendEmail = async () => {
    setEmailLoading(true);
    try {
      const response = await fetch('/api/send-prize-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          claimCode: winner.claimCode,
          prizeName: winner.prizeSnapshot.name,
          prizeDescription: winner.prizeSnapshot.description,
          prizeValue: winner.prizeSnapshot.value,
          expiresAt: winner.expiresAt,
          commerceName: commerce.name,
          prizeUrl: `${window.location.origin}/${commerce.slug}/prize/${winner.claimCode}`,
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        setTimeout(() => {
          setShowEmailModal(false);
          setEmailSent(false);
        }, 2000);
      } else {
        alert('Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      console.error('Failed to send email:', err);
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setEmailLoading(false);
    }
  };

  // Partager (Web Share API pour mobile)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mon gain: ${winner.prizeSnapshot.name}`,
          text: `J'ai gagné ${winner.prizeSnapshot.name} ! Code: ${winner.claimCode}`,
          url: `${window.location.origin}/${commerce.slug}/prize/${winner.claimCode}`,
        });
      } catch (err) {
        console.error('Failed to share:', err);
      }
    } else {
      // Fallback: copier le lien
      await navigator.clipboard.writeText(
        `${window.location.origin}/${commerce.slug}/prize/${winner.claimCode}`
      );
      alert('Lien copié dans le presse-papier !');
    }
  };

  // Ajouter au calendrier (format .ics)
  const handleAddToCalendar = () => {
    const event = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${new Date(winner.expiresAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${new Date(winner.expiresAt).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `SUMMARY:Utiliser mon gain: ${winner.prizeSnapshot.name}`,
      `DESCRIPTION:Code de réclamation: ${winner.claimCode}\\nCommerce: ${commerce.name}`,
      `LOCATION:${commerce.name}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:N\'oubliez pas d\'utiliser votre gain !',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const blob = new Blob([event], { type: 'text/calendar' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `gain-${winner.claimCode}.ics`;
    link.click();
  };

  return (
    <>
      <div className="max-w-2xl mx-auto">
        {/* Main Card */}
        <div ref={cardRef} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Status Banner */}
          <div
            className={`py-4 text-center text-white font-semibold ${
              isExpired
                ? 'bg-red-500'
                : isClaimed
                ? 'bg-green-500'
                : 'bg-gradient-to-r from-blue-600 to-purple-600'
            }`}
          >
            {isExpired ? (
              <span className="flex items-center justify-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Gain expiré
              </span>
            ) : isClaimed ? (
              <span className="flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Gain réclamé
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Clock className="w-5 h-5 mr-2" />
                Gain en attente
              </span>
            )}
          </div>

          {/* Prize Details */}
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {winner.prizeSnapshot.name}
              </h1>
              {winner.prizeSnapshot.description && (
                <p className="text-lg text-gray-600">
                  {winner.prizeSnapshot.description}
                </p>
              )}
              {winner.prizeSnapshot.value && (
                <p className="text-xl font-semibold text-green-600 mt-2">
                  Valeur: {winner.prizeSnapshot.value}€
                </p>
              )}
            </div>

            {/* Claim Code */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-600 text-center mb-3">
                Code de réclamation
              </p>
              <div className="text-4xl font-mono font-bold text-center text-blue-600 mb-4 select-all">
                {winner.claimCode}
              </div>

              {/* Action Buttons */}
              {!isExpired && !isClaimed && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5 mr-2" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 mr-2" />
                        Copier
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleScreenshot}
                    className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Image
                  </button>

                  <button
                    onClick={() => setShowEmailModal(true)}
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Email
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Partager
                  </button>
                </div>
              )}
            </div>

            {/* Winner Info */}
            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <Gift className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Gagnant</p>
                  <p className="font-medium text-gray-900">
                    {winner.clientName}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Date d'expiration</p>
                  <p
                    className={`font-medium ${
                      isExpired ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {new Date(winner.expiresAt).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {!isExpired && !isClaimed && (
                    <button
                      onClick={handleAddToCalendar}
                      className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Ajouter au calendrier
                    </button>
                  )}
                </div>
              </div>

              {isClaimed && winner.claimedAt && (
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">Réclamé le</p>
                    <p className="font-medium text-gray-900">
                      {new Date(winner.claimedAt).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {winner.claimedBy && (
                      <p className="text-sm text-gray-500">
                        Par: {winner.claimedBy}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {!isExpired && !isClaimed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Comment récupérer votre gain ?
                </h3>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Présentez ce code en magasin</li>
                  <li>Le personnel validera votre gain</li>
                  <li>Profitez de votre cadeau !</li>
                </ol>
              </div>
            )}

            {isExpired && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Gain expiré</h3>
                <p className="text-sm text-red-800">
                  Ce gain a expiré et ne peut plus être réclamé. Nous espérons
                  vous revoir bientôt !
                </p>
              </div>
            )}

            {isClaimed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  Gain déjà réclamé
                </h3>
                <p className="text-sm text-green-800">
                  Ce gain a déjà été réclamé. Merci de votre participation !
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 border-t">
            <p className="text-center text-sm text-gray-600">
              Géré par {commerce.name}
            </p>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Recevoir par email
            </h3>

            {emailSent ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Email envoyé !
                </p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  Recevez votre code de réclamation par email pour le conserver facilement.
                </p>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={emailLoading || !email}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {emailLoading ? 'Envoi...' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
