'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Key, LayoutDashboard } from 'lucide-react';

export default function DemandeEnvoyeePage() {
  const timeline = [
    { icon: <CheckCircle className="w-5 h-5" />, title: 'Demande envoyée', active: true, done: true },
    { icon: <Clock className="w-5 h-5" />, title: 'Vérification Retenza', active: true, done: false },
    { icon: <Key className="w-5 h-5" />, title: 'Activation du compte', active: false, done: false },
    { icon: <LayoutDashboard className="w-5 h-5" />, title: 'Accès au Dashboard', active: false, done: false },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex flex-col font-inter">
      <div className="flex items-center justify-between py-4 px-8 bg-white border-b border-[#EDE5DF]">
        <Link href="/" className="flex items-center gap-2">
          <img src="/retenza-icon.png" alt="Retenza" className="h-8 w-8 object-contain" />
          <span className="font-bricolage font-bold text-base text-[#1B100C]">Retenza Connect</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-10 shadow-xl shadow-red-900/5 text-center">
          <div className="w-20 h-20 bg-[#FCE7DD] text-[#D73E26] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <h1 className="font-bricolage text-[28px] font-extrabold text-[#0D1117] mb-4 leading-tight">
            Votre demande est en cours de vérification
          </h1>
          
          <p className="text-[#5D534F] text-[15px] mb-8 leading-relaxed">
            Merci ! Nous avons bien reçu votre demande de partenariat. 
            Notre équipe va examiner les informations de votre commerce sous 48 heures ouvrées.
          </p>

          <div className="bg-[#F5F0EB] rounded-2xl p-6 text-left mb-8">
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={i} className="flex items-center gap-4 relative">
                  {i < timeline.length - 1 && (
                    <div className="absolute top-8 left-4 w-0.5 h-10 bg-gray-200" />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${item.done ? 'bg-[#D73E26] text-white' : item.active ? 'bg-white border-2 border-[#D73E26] text-[#D73E26]' : 'bg-white border-2 border-gray-200 text-gray-300'}`}>
                    {item.icon}
                  </div>
                  <p className={`font-semibold text-[14px] ${item.active ? 'text-[#0D1117]' : 'text-gray-400'}`}>
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[#9C8B82] text-[13px] mb-6">
            Vous recevrez un email dès que votre demande sera approuvée pour créer votre mot de passe.
          </p>
          
          <Link href="/" className="inline-block px-8 py-3.5 rounded-2xl bg-[#0D1117] hover:bg-black text-white font-bold text-[14px] transition-all shadow-xl shadow-black/10">
            Retourner à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
