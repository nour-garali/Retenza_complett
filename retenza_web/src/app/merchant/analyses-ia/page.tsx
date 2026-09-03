'use client';

import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, TrendingDown, Loader2, Crown, ShoppingBag } from 'lucide-react';

interface ClientData {
  _id: string;
  email: string;
  nom?: string;
  churn_score?: number;
  score_global_sa?: number;
  recency?: number;
  frequency?: number;
  monetary?: number;
  influence_score?: number;
}

export default function AnalysesIAPage() {
  const [data, setData] = useState<ClientData[]>([]);
  const [returnRate, setReturnRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dataRes, trRes] = await Promise.all([
          fetch(`http://localhost:5000/api/data`),
          fetch(`http://localhost:5000/api/kpis/return-rate`),
        ]);
        if (dataRes.ok) setData(await dataRes.json());
        if (trRes.ok) {
          const tr = await trRes.json();
          setReturnRate(tr.data?.taux_retour_30j || 0);
        }
      } catch (err) {
        console.error('Erreur connexion backend IA:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const avgChurn = data.length
    ? (data.reduce((acc, c) => acc + (c.churn_score || 0), 0) / data.length) * 100
    : 0;
  const avgMonetary = data.length
    ? data.reduce((acc, c) => acc + (c.monetary || 0), 0) / data.length
    : 0;
  const ambassadors = data.filter((c) => {
    const infl = c.influence_score !== undefined
      ? c.influence_score
      : Math.round(((c.score_global_sa || 0) * 0.7 + (1 - (c.churn_score || 0)) * 0.3) * 100);
    return infl >= 80;
  }).length;
  const atRisk = data.filter((c) => (c.churn_score || 0) >= 0.55).length;

  const kpis = [
    { label: 'Clients modélisés', value: data.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Churn moyen (IA)', value: `${avgChurn.toFixed(1)}%`, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Taux de retour (30j)', value: `${returnRate.toFixed(1)}%`, icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Panier moyen', value: `${avgMonetary.toFixed(2)} DT`, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Ambassadeurs', value: ambassadors, icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Alertes Churn (≥55%)', value: atRisk, icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50' },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 pt-2">
        <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Analyses IA</h1>
        <p className="text-[13px] text-[#5D534F] mt-0.5">Indicateurs RFM et prédictions XGBoost de votre base clients.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D73E26]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="bg-white p-5 rounded-2xl border border-gray-200/70 shadow-sm hover:-translate-y-1 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[#1B100C]">{kpi.value}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60">
              <h2 className="text-[13px] font-bold text-[#1B100C]">Top clients par score RFM</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data.slice(0, 10).map((c) => (
                <div key={c._id} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-gray-50 transition-colors">
                  <span className="col-span-5 text-[13px] font-semibold text-[#1B100C] truncate">{c.nom || c.email}</span>
                  <span className="col-span-4 text-[12px] text-[#5D534F] truncate">{c.email}</span>
                  <span className="col-span-2 text-[12px] font-bold text-right text-[#D73E26]">{((c.score_global_sa || 0) * 100).toFixed(0)} pts</span>
                  <span className={`col-span-1 text-[11px] font-bold text-right ${(c.churn_score || 0) >= 0.55 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {((c.churn_score || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            {data.length > 10 && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/40">
                <span className="text-[12px] text-gray-400">{data.length - 10} autres clients non affichés</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
