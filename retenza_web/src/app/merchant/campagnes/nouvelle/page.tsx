'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function NouvelleCampagnePage() {
  const [title, setTitle] = useState('Relance clients absents');
  const [cibles, setCibles] = useState<string[]>(['À risque', 'Perdu']);
  const [declencheur, setDeclencheur] = useState('Absent 7 jours');
  const [message, setMessage] = useState('On ne vous a pas vu depuis 7 jours ☕ Revenez cette semaine : -10 % sur votre commande.');
  const [iaOptimized, setIaOptimized] = useState(true);

  const toggleCible = (cible: string) => {
    setCibles(prev => 
      prev.includes(cible) 
        ? prev.filter(c => c !== cible)
        : [...prev, cible]
    );
  };

  const ciblesOptions = ['VIP', 'À risque', 'Régulier', 'Perdu'];
  const declencheursOptions = ['Absent 7 jours', 'Anniversaire', 'Après 1 visite', 'Solde de points'];

  return (
    <div className="max-w-[1200px] mx-auto py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[32px] font-bricolage font-bold text-[#1B100C]">Nouvelle campagne</h1>
          <p className="text-[14px] text-[#5D534F] mt-1">Configurez une fois, Retenza relance tout seul.</p>
        </div>
        <button className="px-6 py-3 rounded-xl bg-[#D73E26] hover:bg-[#C0321C] text-white text-[15px] font-semibold transition-all shadow-lg shadow-[#D73E26]/30">
          Activer la campagne
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column - Form */}
        <div className="flex-1 bg-white rounded-3xl p-8 shadow-sm border border-gray-100/50">
          
          <div className="space-y-8">
            
            {/* Nom */}
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-[#5D534F]">Nom de la campagne</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-[#1B100C] focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all"
              />
            </div>

            {/* Cible */}
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-[#5D534F]">Cible</label>
              <div className="flex flex-wrap gap-3">
                {ciblesOptions.map(opt => {
                  const isSelected = cibles.includes(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleCible(opt)}
                      className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all border ${
                        isSelected 
                          ? 'border-[#D73E26] bg-[#FFF5F2] text-[#D73E26]' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Déclencheur */}
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-[#5D534F]">Déclencheur</label>
              <div className="flex flex-wrap gap-3">
                {declencheursOptions.map(opt => {
                  const isSelected = declencheur === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setDeclencheur(opt)}
                      className={`px-5 py-2.5 rounded-full text-[14px] font-medium transition-all border ${
                        isSelected 
                          ? 'border-[#D73E26] bg-[#FFF5F2] text-[#D73E26]' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-3">
              <label className="text-[14px] font-medium text-[#5D534F]">Message (push gratuit & illimité)</label>
              <textarea 
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[15px] text-[#1B100C] focus:border-[#D73E26] focus:ring-4 focus:ring-[#D73E26]/10 outline-none transition-all resize-none"
              />
            </div>

            {/* IA Toggle */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[14px] font-medium text-[#5D534F]">Optimisation automatique par l'IA</span>
              <button 
                onClick={() => setIaOptimized(!iaOptimized)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${iaOptimized ? 'bg-[#D73E26]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${iaOptimized ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

          </div>

        </div>

        {/* Right Column - Preview */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
          
          {/* Phone Preview */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100/50">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-6 text-center">Aperçu sur le téléphone client</h3>
            
            <div className="bg-[#F0EDE8]/50 rounded-2xl p-4 border border-white shadow-inner relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bricolage font-bold text-[14px] shrink-0 shadow-sm">
                  R
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-[14px] font-bold text-[#1B100C]">Café Lumière</h4>
                    <span className="text-[11px] text-gray-400 font-medium">maintenant</span>
                  </div>
                  <p className="text-[13px] text-[#1B100C] leading-snug">
                    {message || "Tapez votre message pour voir l'aperçu."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestion */}
          <div className="bg-[#1A0F0A] rounded-3xl p-6 shadow-lg relative overflow-hidden">
            {/* Sparkles decorative */}
            <div className="absolute -top-4 -right-4 text-[#D73E26]/20">
              <Sparkles className="w-24 h-24" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-full bg-[#D73E26]/20 flex items-center justify-center text-[#D73E26]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-[15px] font-bold text-white">Suggestion IA</h3>
              </div>
              <p className="text-[14px] text-white/90 leading-relaxed font-medium">
                Vos clients « à risque » répondent <span className="text-[#D73E26] font-bold">2x mieux</span> le jeudi à 17 h. Retenza enverra automatiquement à ce créneau.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
