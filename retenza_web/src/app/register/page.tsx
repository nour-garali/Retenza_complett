'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Store, ArrowLeft } from 'lucide-react';

export default function RegisterChoiceScreen() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FBF8F6] relative flex flex-col items-center justify-center p-6">
      <button 
        onClick={() => router.push('/login')} 
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 transition-colors flex items-center gap-2 text-[#18110C] font-medium text-sm"
      >
        <ArrowLeft className="w-5 h-5" />
        Retour à la connexion
      </button>

      <div className="w-full max-w-[500px]">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <img src="/retenza-icon.png" alt="Retenza" className="h-16 w-16 object-contain drop-shadow-xl" />
          </div>
          <h1 className="font-bricolage text-[24px] font-bold text-[#1B100C] mb-2">
            Créer un compte
          </h1>
          <p className="text-[#6E5B52]">Choisissez le type de compte que vous souhaitez créer.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/register/client')}
            className="bg-white border-2 border-[#EDE5DF] rounded-2xl p-6 flex flex-col items-center text-center hover:border-[#D73E26] hover:bg-[#FCE7DD]/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-[#FCE7DD] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8 text-[#D73E26]" />
            </div>
            <h2 className="font-bricolage font-bold text-lg text-[#1B100C] mb-2">Client</h2>
            <p className="text-sm text-[#6E5B52]">Je veux découvrir des commerces et gagner des points.</p>
          </button>

          <button
            onClick={() => router.push('/register/merchant')}
            className="bg-white border-2 border-[#EDE5DF] rounded-2xl p-6 flex flex-col items-center text-center hover:border-[#D73E26] hover:bg-[#FCE7DD]/30 transition-all group"
          >
            <div className="w-16 h-16 rounded-full bg-[#F4EFEB] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Store className="w-8 h-8 text-[#E8902A]" />
            </div>
            <h2 className="font-bricolage font-bold text-lg text-[#1B100C] mb-2">Commerçant</h2>
            <p className="text-sm text-[#6E5B52]">Je veux fidéliser mes clients avec un programme.</p>
          </button>
        </div>
      </div>
    </div>
  );
}
