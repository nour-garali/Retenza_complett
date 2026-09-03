"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Link2,
  Target,
  TrendingUp,
  Star,
  Tag,
  Lightbulb,
  Trophy,
  ShoppingCart,
  RefreshCw,
  AlertTriangle,
  Clock,
  Settings,
  CheckCircle,
  XCircle,
  SkipForward,
  Loader2,
  Search,
  BarChart2,
  Package,
  ArrowRight,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AssociationRule {
  _id: string;
  produitA: string;
  produitB: string;
  confiance: number;
  confiance_pct: string;
  lift: number;
  support: number;
  support_total: number;
  dateCalcul: string;
}

interface RulesResponse {
  status: string;
  total: number;
  page: number;
  pages: number;
  seuils: { min_confidence: number; min_support: number; min_lift: number };
  regles: AssociationRule[];
}

interface RecalcStats {
  totalCommandes?: number;
  totalBaskets?: number;
  totalProduits?: number;
  totalRegles?: number;
  inserted?: number;
  updated?: number;
}

// ─── Config ─────────────────────────────────────────────────────────────────────
const API = "/api";

// ─── Helper : badge de confiance ─────────────────────────────────────────────
function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "bg-rose-50/80 text-[#E8462F] border-[#E8462F]/30" :
    pct >= 60 ? "bg-slate-100 text-slate-700 border-slate-200/80" :
               "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${color}`}>
      {pct}%
    </span>
  );
}

// ─── Helper : badge de lift ──────────────────────────────────────────────────
function LiftBadge({ value }: { value: number }) {
  const color =
    value >= 2   ? "text-emerald-600 font-black" :
    value >= 1.5 ? "text-[#E8462F] font-bold"    :
    value >= 1   ? "text-amber-600 font-semibold" :
                   "text-slate-400 font-semibold";
  return <span className={`text-sm ${color}`}>×{value.toFixed(2)}</span>;
}

// ─── Helper : barre de progression ────────────────────────────────────────────
function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
        <div className="h-full rounded-full bg-[#E8462F]/70 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right shrink-0">{value}</span>
    </div>
  );
}

// ─── Rang badge neutre ────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  const badgeStyle =
    rank === 1 ? "bg-[#E8462F] text-white border-[#E8462F] shadow-xs font-black" :
    rank === 2 ? "bg-rose-100 text-[#E8462F] border-rose-200 font-extrabold" :
    rank === 3 ? "bg-rose-50 text-[#E8462F] border-rose-100 font-extrabold" :
                 "bg-slate-100 text-slate-500 border-slate-200 font-semibold";
  return (
    <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center shrink-0 border ${badgeStyle}`}>
      {rank}
    </span>
  );
}

// ─── Donut Chart SVG natif ────────────────────────────────────────────────────
const DONUT_PALETTE = [
  "#E8462F",   // rouge plein (1er)
  "#EF6B56",   // rouge moyen
  "#F5977F",   // saumon
  "#F9BDB0",   // rose pâle
  "#FDDFD9",   // rose très pâle
];

function DonutChart({ items }: { items: [string, number][] }) {
  const total = items.reduce((s, [, c]) => s + c, 0);
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 52;
  const innerRadius = 34;
  const gap = 0.015; // gap en radians entre les parts

  let angle = -Math.PI / 2;
  const slices = items.map(([label, count], i) => {
    const ratio = count / total;
    const startAngle = angle + gap / 2;
    const sweep = ratio * 2 * Math.PI - gap;
    angle += ratio * 2 * Math.PI;
    const endAngle = startAngle + sweep;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const ix1 = cx + innerRadius * Math.cos(endAngle);
    const iy1 = cy + innerRadius * Math.sin(endAngle);
    const ix2 = cx + innerRadius * Math.cos(startAngle);
    const iy2 = cy + innerRadius * Math.sin(startAngle);
    const largeArc = sweep > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");

    return { d, color: DONUT_PALETTE[i % DONUT_PALETTE.length], label, count, ratio };
  });

  return (
    <div className="flex items-center gap-6 px-6 py-6 flex-1">
      {/* SVG Donut — aggrandi pour mieux occuper l'espace */}
      <div className="shrink-0 relative">
        <svg width={160} height={160} viewBox="0 0 160 160">
          {slices.map((s, i) => (
            <path
              key={i}
              d={(() => {
                const sz = 160, c = 80, r = 62, ir = 42;
                // re-calcul local pour la taille 160
                return s.d;
              })()}
              fill={s.color}
              className="transition-all duration-300"
              style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.07))" }}
            />
          ))}
          <circle cx={cx} cy={cy} r={innerRadius - 1} fill="white" />
          <text x={cx} y={cy - 7} textAnchor="middle" style={{ fontFamily: "inherit", fontSize: 22, fontWeight: 900, fill: "#E8462F" }}>{total}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" style={{ fontFamily: "inherit", fontSize: 9, fontWeight: 600, fill: "#B0A49C", letterSpacing: 1 }}>RÈGLES</text>
        </svg>
      </div>

      {/* Légende */}
      <div className="flex-1 space-y-3.5 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs font-medium text-[#1A1A1A] truncate capitalize flex-1">{s.label}</span>
            <span className="text-[11px] text-slate-400 font-medium shrink-0">
              {s.count} règle{s.count > 1 ? "s" : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Onglet Règles actives ─────────────────────────────────────────────────────
function RulesTab() {
  const [data, setData] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [minConf, setMinConf] = useState(0);
  const [sortBy, setSortBy] = useState<"confiance" | "lift">("confiance");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "50",
        sort_by: sortBy,
        ...(minConf > 0 ? { min_confidence: String(minConf / 100) } : {}),
        ...(debouncedSearch ? { produit_a: debouncedSearch } : {}),
      });
      const r = await fetch(`${API}/recommendations/rules?${params}`);
      const d = await r.json();
      if (d.status === "success") setData(d);
    } catch {/* silencieux */}
    finally { setLoading(false); }
  }, [page, minConf, sortBy, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const maxSupport = data?.regles.reduce((m, r) => Math.max(m, r.support), 0) ?? 1;

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* Recherche produit */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Filtrer par produit A
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B0A49C]" />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nom du produit..."
                className="w-full border border-[#EEE5DF] bg-[#FAF3EE] rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E8462F] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Confiance min */}
          <div className="min-w-[180px]">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
              Confiance min : <span className="text-[#E8462F] font-bold">{minConf}%</span>
            </label>
            <input
              type="range" min={0} max={95} step={5}
              value={minConf}
              onChange={e => { setMinConf(Number(e.target.value)); setPage(1); }}
              className="w-full accent-[#E8462F]"
            />
          </div>

          {/* Tri */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Trier par</label>
            <div className="flex gap-2">
              {(["confiance", "lift"] as const).map(s => (
                <button key={s} onClick={() => { setSortBy(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${sortBy === s
                    ? "bg-[#E8462F] text-white border-[#E8462F] shadow-sm"
                    : "bg-[#FAF3EE] text-slate-600 border-[#EEE5DF] hover:border-slate-300"}`}>
                  {s === "confiance" ? "% Confiance" : "Lift ×"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tableau des règles */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEE5DF] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[#E8462F]" />
              Règles d&apos;association détectées
            </h2>
            {data && (
              <p className="text-xs text-slate-400 mt-0.5">
                {data.total} règle{data.total > 1 ? "s" : ""} — seuils actifs : confiance ≥ {Math.round((data.seuils.min_confidence ?? 0) * 100)}%, support ≥ {data.seuils.min_support}, lift ≥ {data.seuils.min_lift}
              </p>
            )}
          </div>
          {data && data.total > 0 && (
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
              {data.total} règle{data.total > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-7 h-7 text-[#E8462F] animate-spin mx-auto" />
            <p className="text-slate-400 text-sm mt-3">Chargement des règles...</p>
          </div>
        ) : !data || data.regles.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF3EE] flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-7 h-7 text-[#B0A49C]" />
            </div>
            <p className="text-slate-700 font-semibold text-sm">Aucune règle détectée</p>
            <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
              Lancez un recalcul depuis l&apos;onglet <strong>Recalcul</strong> ou attendez le cycle automatique de 6h.
              Il faut au minimum {data?.seuils.min_support ?? 3} paniers contenant la même paire de produits.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#FAF3EE] text-xs text-slate-500 uppercase tracking-wider border-b border-[#EEE5DF]">
                    <th className="px-5 py-3 text-left font-semibold">Produit A (acheté)</th>
                    <th className="px-3 py-3 text-center font-semibold w-8"></th>
                    <th className="px-5 py-3 text-left font-semibold">Produit B (suggéré)</th>
                    <th className="px-4 py-3 text-center font-semibold">Confiance</th>
                    <th className="px-4 py-3 text-center font-semibold">Lift</th>
                    <th className="px-5 py-3 font-semibold min-w-[140px]">Support</th>
                    <th className="px-4 py-3 text-right font-semibold">Calculé le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEE5DF]/60">
                  {data.regles.map((rule) => (
                    <tr key={rule._id} className="hover:bg-[#FAF3EE]/40 transition-colors">
                      {/* Produit A */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#FAF3EE] border border-[#EEE5DF] flex items-center justify-center shrink-0">
                            <Tag className="w-3 h-3 text-[#7A6E68]" />
                          </span>
                          <span className="font-semibold text-[#1A1A1A] capitalize text-xs">{rule.produitA}</span>
                        </div>
                      </td>
                      {/* Flèche */}
                      <td className="px-2 py-3.5 text-center">
                        <ArrowRight className="w-4 h-4 text-slate-300 mx-auto" />
                      </td>
                      {/* Produit B */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-3 h-3 text-emerald-500" />
                          </span>
                          <span className="font-semibold text-[#1A1A1A] capitalize text-xs">{rule.produitB}</span>
                        </div>
                      </td>
                      {/* Confiance */}
                      <td className="px-4 py-3.5 text-center">
                        <ConfidenceBadge value={rule.confiance} />
                      </td>
                      {/* Lift */}
                      <td className="px-4 py-3.5 text-center">
                        <LiftBadge value={rule.lift} />
                      </td>
                      {/* Support */}
                      <td className="px-5 py-3.5 min-w-[140px]">
                        <ProgressBar value={rule.support} max={maxSupport} />
                        <p className="text-[10px] text-slate-400 mt-0.5">/ {rule.support_total} paniers</p>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3.5 text-right text-xs text-slate-400 whitespace-nowrap">
                        {rule.dateCalcul
                          ? new Date(rule.dateCalcul).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="px-6 py-4 border-t border-[#EEE5DF] flex items-center justify-between">
                <p className="text-xs text-[#B0A49C]">Page {data.page} / {data.pages}</p>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EEE5DF] hover:border-[#E8462F] hover:text-[#E8462F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >← Précédent</button>
                  <button
                    disabled={page >= data.pages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EEE5DF] hover:border-[#E8462F] hover:text-[#E8462F] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >Suivant →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Statistiques ───────────────────────────────────────────────────────
function StatsTab() {
  const [data, setData] = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/recommendations/rules?limit=200`);
      const d = await r.json();
      if (d.status === "success") setData(d);
    } catch {/* silencieux */}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-12 text-center">
        <Loader2 className="w-7 h-7 text-[#E8462F] animate-spin mx-auto" />
        <p className="text-slate-400 text-sm mt-3">Calcul des statistiques...</p>
      </div>
    );
  }

  if (!data || data.regles.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF3EE] flex items-center justify-center mx-auto mb-4">
          <BarChart2 className="w-7 h-7 text-[#B0A49C]" />
        </div>
        <p className="text-slate-700 font-semibold text-sm">Aucune règle disponible</p>
        <p className="text-slate-400 text-xs mt-2">Les statistiques s&apos;afficheront après le premier recalcul.</p>
      </div>
    );
  }

  const regles = data.regles;
  const avgConfiance = regles.reduce((s, r) => s + r.confiance, 0) / regles.length;
  const avgLift      = regles.reduce((s, r) => s + r.lift, 0) / regles.length;
  const maxConfiance = Math.max(...regles.map(r => r.confiance));
  const top5 = [...regles].sort((a, b) => b.confiance * b.lift - a.confiance * a.lift).slice(0, 5);

  const produitACount: Record<string, number> = {};
  regles.forEach(r => { produitACount[r.produitA] = (produitACount[r.produitA] || 0) + 1; });
  const topTriggers = Object.entries(produitACount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxTriggerCount = topTriggers.length > 0 ? Math.max(...topTriggers.map(([_, c]) => c)) : 1;

  const kpis = [
    { label: "Règles actives",  value: String(data.total),                  icon: Link2,      isHighlight: false },
    { label: "Confiance moy.",  value: `${Math.round(avgConfiance * 100)}%`, icon: Target,     isHighlight: false },
    { label: "Lift moyen",      value: `×${avgLift.toFixed(2)}`,             icon: TrendingUp, isHighlight: false },
    { label: "Meilleure conf.", value: `${Math.round(maxConfiance * 100)}%`, icon: Star,       isHighlight: true  },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs — style sobre avec dégradé et profondeur subtile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-gradient-to-br from-white to-[#FAF3EE]/50 rounded-2xl shadow-sm hover:shadow-md border border-[#EEE5DF] p-5 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.isHighlight ? "text-[#E8462F]" : "text-slate-400"}`} />
              </div>
              <p className={`text-2xl font-black ${kpi.isHighlight ? "text-[#E8462F]" : "text-slate-800"}`}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Top 5 règles */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEE5DF] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-[#E8462F] flex items-center justify-center">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Top 5 règles (confiance × lift)</h3>
          </div>
          <div className="divide-y divide-[#EEE5DF]/60">
            {top5.map((r, i) => {
              const confPct = Math.round(r.confiance * 100);
              return (
                <div key={r._id} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-[#FAF3EE]/40 transition-colors">
                  <RankBadge rank={i + 1} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#1A1A1A] truncate capitalize">
                      {r.produitA} <span className="text-slate-400 font-normal">→</span> {r.produitB}
                    </p>
                  </div>

                  {/* Badge Confiance + Badge Lift */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <ConfidenceBadge value={r.confiance} />
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70">
                      <TrendingUp className="w-3 h-3 text-[#E8462F]" />
                      ×{r.lift.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top produits déclencheurs */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#EEE5DF] flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 text-[#E8462F] flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Produits déclencheurs (le plus souvent en A)</h3>
          </div>
          {/* Donut Chart — centré verticalement dans l'espace restant */}
          <div className="flex-1 flex items-center">
            <DonutChart items={topTriggers} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet Recalcul ───────────────────────────────────────────────────────────
function RecalcTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string; stats?: RecalcStats } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRecalculate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch(`${API}/recommendations/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur inconnue");
      setResult(d);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors du recalcul.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Panel déclenchement */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
        {/* En-tête sobre, couleur marque */}
        <div className="px-6 py-4 border-b border-[#EEE5DF] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#FAF3EE] flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-[#E8462F]" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Recalcul manuel</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Déclenche immédiatement l&apos;analyse Market Basket Analysis</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Algorithme */}
          <div className="bg-[#FAF3EE] rounded-xl border border-[#EEE5DF] p-4 space-y-2">
            <p className="text-[11px] font-bold text-[#7A6E68] uppercase tracking-wider flex items-center gap-1.5">
              <Settings className="w-3 h-3" /> Algorithme MBA
            </p>
            {[
              ["Support",   "Nb. de paniers contenant A et B ensemble"],
              ["Confiance", "P(B|A) — probabilité conditionnelle"],
              ["Lift",      "Corrélation nette (élimine les produits populaires)"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-2">
                <span className="text-[11px] font-bold text-[#E8462F] w-16 shrink-0">{k}</span>
                <span className="text-[11px] text-[#7A6E68]">{v}</span>
              </div>
            ))}
          </div>

          {/* Seuils */}
          <div className="bg-white border border-[#EEE5DF] rounded-xl p-4">
            <p className="text-[11px] font-bold text-[#7A6E68] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Target className="w-3 h-3" /> Seuils configurés (.env)
            </p>
            <div className="space-y-1.5">
              {[
                ["Confiance min.", `${Math.round(parseFloat("0.60") * 100)}%`],
                ["Support min.",   "3 paniers"],
                ["Lift min.",      "×1.0"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-bold text-[#1A1A1A]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info scheduler */}
          <p className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
            <span>
              Le recalcul automatique s&apos;exécute toutes les <strong className="font-semibold text-slate-700">6 heures</strong> via le scheduler. Ce bouton permet de le forcer manuellement à tout moment.
            </span>
          </p>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 flex gap-2 items-center">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Bouton — couleur marque */}
          <button
            id="btn-recalculate-cross-sell"
            onClick={handleRecalculate}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#E8462F] to-[#F06038] hover:from-[#C93A25] hover:to-[#E8462F] transition-all shadow-sm shadow-[#E8462F]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Lancer le recalcul MBA
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div>
        {!result && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-10 flex flex-col items-center justify-center text-center min-h-[380px]">
            <div className="w-14 h-14 rounded-2xl bg-[#FAF3EE] border border-[#EEE5DF] flex items-center justify-center mb-4">
              <ShoppingCart className="w-7 h-7 text-[#B0A49C]" />
            </div>
            <p className="text-[#1A1A1A] font-semibold text-sm">Prêt à analyser</p>
            <p className="text-slate-400 text-xs mt-2 max-w-xs">
              Cliquez sur &ldquo;Lancer le recalcul MBA&rdquo; pour calculer les associations produits depuis l&apos;historique des commandes.
            </p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-10 flex flex-col items-center justify-center min-h-[380px]">
            <div className="w-16 h-16 rounded-full border-2 border-[#EEE5DF] border-t-[#E8462F] animate-spin mb-6" />
            <p className="text-[#1A1A1A] font-semibold text-sm">Analyse Market Basket en cours...</p>
            <p className="text-slate-400 text-xs mt-1">Calcul des co-occurrences, support, confiance et lift</p>
          </div>
        )}

        {result && (
          <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden animate-fadeIn ${
            result.status === "success" ? "border-emerald-200" :
            result.status === "skip"    ? "border-amber-200"   : "border-rose-200"
          }`}>
            <div className={`px-5 py-4 border-b flex items-center gap-3 ${
              result.status === "success" ? "bg-emerald-50 border-emerald-200" :
              result.status === "skip"    ? "bg-amber-50   border-amber-200"   :
                                           "bg-rose-50     border-rose-200"
            }`}>
              {result.status === "success" ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> :
               result.status === "skip"    ? <SkipForward  className="w-5 h-5 text-amber-600  shrink-0" /> :
                                            <XCircle      className="w-5 h-5 text-rose-600   shrink-0" />}
              <div>
                <p className={`font-bold text-sm ${
                  result.status === "success" ? "text-emerald-700" :
                  result.status === "skip"    ? "text-amber-700"   : "text-rose-700"
                }`}>
                  {result.status === "success" ? "Recalcul terminé avec succès" :
                   result.status === "skip"    ? "Analyse ignorée" : "Erreur"}
                </p>
                <p className={`text-xs mt-0.5 ${
                  result.status === "success" ? "text-emerald-600" :
                  result.status === "skip"    ? "text-amber-600"   : "text-rose-600"
                }`}>{result.message}</p>
              </div>
            </div>
            {result.stats && Object.keys(result.stats).length > 0 && (
              <div className="p-5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Détail du recalcul</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Commandes analysées",   result.stats.totalCommandes],
                    ["Paniers multi-articles", result.stats.totalBaskets],
                    ["Produits distincts",     result.stats.totalProduits],
                    ["Règles calculées",       result.stats.totalRegles],
                    ["Nouvelles règles",       result.stats.inserted],
                    ["Règles mises à jour",    result.stats.updated],
                  ].map(([k, v]) => v !== undefined && (
                    <div key={String(k)} className="bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl px-4 py-3">
                      <p className="text-xl font-black text-[#1A1A1A]">{v ?? "—"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{k}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale avec onglets ──────────────────────────────────────────────
export default function RecommandationsPage() {
  const [activeTab, setActiveTab] = useState<"regles" | "stats" | "recalcul">("regles");
  const [totalRules, setTotalRules] = useState(0);

  useEffect(() => {
    fetch(`${API}/recommendations/rules?limit=1`)
      .then(r => r.json())
      .then(d => { if (d.status === "success") setTotalRules(d.total ?? 0); })
      .catch(() => {});
  }, []);

  const TABS = [
    { id: "regles"   as const, label: "Règles actives", badge: totalRules > 0 ? totalRules : null },
    { id: "stats"    as const, label: "Statistiques",   badge: null },
    { id: "recalcul" as const, label: "Recalcul",       badge: null },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Cross-Sell / Up-Sell — Recommandation Produit"
        subtitle="Market Basket Analysis · Support · Confiance · Lift · Push automatique post-caisse"
      />

      {/* Onglets */}
      <div className="px-8 mt-6">
        <div className="flex border-b border-[#EEE5DF] gap-6">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "border-[#E8462F] text-[#E8462F]"
                    : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
                }`}
              >
                {tab.label}
                {tab.badge !== null && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center transition-all ${
                    isActive ? "bg-[#E8462F]/90 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 py-8">
        {activeTab === "regles"   && <RulesTab />}
        {activeTab === "stats"    && <StatsTab />}
        {activeTab === "recalcul" && <RecalcTab />}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out both; }
      `}</style>
    </div>
  );
}
