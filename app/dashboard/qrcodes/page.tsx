'use client';

import { useEffect, useState } from 'react';
import { QrCode, Download, ExternalLink } from 'lucide-react';
import QRCodeLib from 'qrcode';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  commerceId: {
    _id: string;
    name: string;
    slug: string;
  };
}

export default function QRCodesPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

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
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      const activeCampaigns = data.campaigns?.filter((c: Campaign) => c.isActive) || [];
      setCampaigns(activeCampaigns);

      // Générer les QR codes pour chaque campagne
      for (const campaign of activeCampaigns) {
        await generateQRCode(campaign);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (campaign: Campaign) => {
    try {
      const url = `${window.location.origin}/${campaign.commerceId.slug}/welcome?c=${campaign._id}`;
      const qrCodeDataUrl = await QRCodeLib.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      setQrCodes((prev) => ({
        ...prev,
        [campaign._id]: qrCodeDataUrl,
      }));
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = (campaign: Campaign) => {
    const qrCodeDataUrl = qrCodes[campaign._id];
    if (!qrCodeDataUrl) return;

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `qrcode-${campaign.commerceId.slug}-${campaign.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyURL = (campaign: Campaign) => {
    const url = `${window.location.origin}/${campaign.commerceId.slug}/welcome?c=${campaign._id}`;
    navigator.clipboard.writeText(url);
    alert('URL copiée dans le presse-papier !');
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">QR Codes</h1>
        <p className="text-gray-600">
          Générez et téléchargez les QR codes pour vos campagnes actives
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune campagne active
          </h3>
          <p className="text-gray-600">
            Créez et activez une campagne pour générer son QR code
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <div
              key={campaign._id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {campaign.name}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  {campaign.commerceId.name}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {campaign.description}
                </p>

                {/* QR Code */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 flex justify-center">
                  {qrCodes[campaign._id] ? (
                    <img
                      src={qrCodes[campaign._id]}
                      alt={`QR Code ${campaign.name}`}
                      className="w-48 h-48"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center">
                      <div className="text-gray-400">Génération...</div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => downloadQRCode(campaign)}
                    disabled={!qrCodes[campaign._id]}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger PNG
                  </button>

                  <button
                    onClick={() => copyURL(campaign)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Copier l'URL
                  </button>
                </div>

                {/* URL Preview */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">URL de la campagne:</p>
                  <p className="text-xs text-gray-700 font-mono break-all">
                    /{campaign.commerceId.slug}/welcome?c={campaign._id}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      {campaigns.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Comment utiliser vos QR codes ?
          </h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Téléchargez le QR code de votre campagne</li>
            <li>Imprimez-le et affichez-le dans votre établissement (comptoir, table, vitrine)</li>
            <li>Vos clients scannent le QR code avec leur smartphone</li>
            <li>Ils sont dirigés vers la page de participation</li>
            <li>Après avoir laissé un avis, ils peuvent tourner la roue et gagner un lot</li>
          </ol>
          <div className="mt-4 p-3 bg-white rounded border border-blue-300">
            <p className="text-sm text-blue-900">
              <strong>💡 Astuce:</strong> Vous pouvez aussi copier l'URL et la partager par email, SMS ou sur vos réseaux sociaux.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
