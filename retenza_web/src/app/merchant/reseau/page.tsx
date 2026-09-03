'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Users, TrendingDown, Flame, Loader2, Crown } from 'lucide-react';

interface Commerce { id: string; label: string; }
interface ClientData {
  commerce_id: string;
  churn_score?: number;
  score_global_sa?: number;
  monetary?: number;
  frequency?: number;
  influence_score?: number;
}
interface ShopMetrics {
  id: string;
  label: string;
  totalClients: number;
  avgChurn: number;
  avgRfm: number;
  avgMonetary: number;
  ambassadors: number;
}

export default function ReseauPage() {
  const [metrics, setMetrics] = useState<ShopMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const shopsRes = await fetch(`http://localhost:5000/api/commerces`);
        if (!shopsRes.ok) return;
        const shops: Commerce[] = await shopsRes.json();

        const results = await Promise.all(
          shops.map(async (shop) => {
            const dataRes = await fetch(`http://localhost:5000/api/data?commerce_id=${encodeURIComponent(shop.id)}`);
            const clients: ClientData[] = dataRes.ok ? await dataRes.json() : [];
            const n = clients.length;
            const avg = (fn: (c: ClientData) => number) => n > 0 ? clients.reduce((acc, c) => acc + fn(c), 0) / n : 0;
            const ambassadors = clients.filter((c) => {
              const infl = c.influence_score !== undefined
                ? c.influence_score
                : Math.round(((c.score_global_sa || 0) * 0.7 + (1 - (c.churn_score || 0)) * 0.3) * 100);
              return infl >= 80;
            }).length;
            return {
              id: shop.id,
              label: shop.label,
              totalClients: n,
              avgChurn: avg((c) => c.churn_score || 0) * 100,
              avgRfm: avg((c) => c.score_global_sa || 0) * 100,
              avgMonetary: avg((c) => c.monetary || 0),
              ambassadors,
            };
          })
        );
        setMetrics(results);
      } catch (err) {
        console.error('Erreur connexion backend IA:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 pt-2">
        <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Vue Globale — Réseau</h1>
        <p className="text-[13px] text-[#5D534F] mt-0.5">
          Comparatif des performances de l'ensemble de vos points de vente.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-[#D73E26]" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-200 shadow-sm text-center">
          <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#1B100C]">Aucune boutique trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {metrics.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden"
            >
              {/* Shop header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/40">
                <div className="w-9 h-9 rounded-xl bg-[#D73E26] flex items-center justify-center text-white font-bold text-[13px] shrink-0 shadow-sm">
                  {shop.label.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[#1B100C]">{shop.label}</p>
                  <p className="text-[11px] text-[#5D534F]">{shop.id}</p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y divide-gray-100">
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <Users className="w-3 h-3" />Clients
                  </div>
                  <p className="text-[18px] font-extrabold text-[#1B100C]">{shop.totalClients}</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <Flame className="w-3 h-3 text-red-400" />Churn moy.
                  </div>
                  <p className={`text-[18px] font-extrabold ${shop.avgChurn > 30 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {shop.avgChurn.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <TrendingDown className="w-3 h-3 text-blue-400" />Score RFM
                  </div>
                  <p className="text-[18px] font-extrabold text-[#1B100C]">{shop.avgRfm.toFixed(1)}</p>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <Crown className="w-3 h-3 text-amber-500" />Ambassadeurs
                  </div>
                  <p className="text-[18px] font-extrabold text-amber-600">{shop.ambassadors}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
