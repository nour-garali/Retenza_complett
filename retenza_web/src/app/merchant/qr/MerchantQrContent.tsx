'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Copy, QrCode } from 'lucide-react';

export default function MerchantQrContent({ qrUrl, merchantCode, commerceName }: { qrUrl: string, merchantCode: string, commerceName: string }) {
  
  const handleCopy = () => {
    navigator.clipboard.writeText(qrUrl || 'https://retenza.app');
    alert('Lien copié !');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bricolage font-bold text-[#18100B] mb-2">Mon QR Code</h1>
        <p className="text-[#6B5B52]">{commerceName || 'Commerce'}</p>
      </div>

      <div className="bg-white rounded-[32px] border border-[#EDE5DF] p-8 sm:p-12 shadow-sm flex flex-col items-center">
        
        {/* QR Code Area */}
        <div className="bg-white p-6 rounded-3xl border border-[#EDE5DF] shadow-[0_8px_24px_rgba(24,16,11,0.04)] mb-8 inline-block">
          <QRCode 
            value={qrUrl || 'https://retenza.app'} 
            size={240}
            fgColor="#18100B"
            bgColor="#FFFFFF"
            level="H"
          />
        </div>

        <div className="bg-[#FBE9E7] px-6 py-3 rounded-full mb-6">
          <p className="text-[#D0392A] font-space font-bold tracking-[0.2em] text-xl">
            {merchantCode || 'CODE'}
          </p>
        </div>

        <p className="text-[#6B5B52] text-sm text-center max-w-sm mb-10">
          Demandez à vos clients de scanner ce QR Code avec leur application Retenza pour s'inscrire à votre programme et cumuler des avantages.
        </p>

        <button 
          onClick={handleCopy}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-br from-[#E04030] to-[#9E2B1E] text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(208,57,42,0.25)] hover:scale-[1.02] transition-transform"
        >
          <Copy className="w-5 h-5" />
          Copier le lien
        </button>
      </div>
    </div>
  );
}
