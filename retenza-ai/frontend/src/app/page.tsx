"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  Banknote,
  Users,
  Crown,
  TrendingDown,
  ShoppingBag,
  Gift,
  Award,
  Star,
  Flame,
  Undo2,
  Trophy,
  Loader2,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Download,
  BarChart3,
  TrendingUp,
  ChevronDown,
  Clock,
  Send,
  User,
  CheckCircle
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler
);

interface Commerce {
  id: string;
  label: string;
}

interface ClientData {
  client_db_id: string;
  nom: string;
  email: string;
  commerce_id: string;
  segment_gmm?: "vip" | "regular" | "at_risk" | "lost" | null;
  churn_score?: number;
  churn_risk_label?: string;
  recency: number;
  frequency: number;
  monetary: number;
  monetary_total?: number;
  recency_score?: number;
  frequency_score?: number;
  monetary_score?: number;
  score_r?: number;
  score_f?: number;
  score_m?: number;
  score_global_sa: number;
  influence_score?: number;
  baisse_frequence_detectee?: boolean;
}

interface Recommendation {
  id: string;
  type: "warning" | "alert" | "opportunity";
  priority: number;
  title: string;
  message: string;
  action: {
    label: string;
    filters: any;
  };
  target_clients?: { email: string; nom: string; segment?: string }[];
  prefilled_subject?: string;
  prefilled_body?: string;
}

interface CommerceMetrics {
  id: string;
  name: string;
  totalClients: number;
  avgRfm: number;
  avgChurn: number;
  churnCount: number;
  ambassadorCount: number;
  avgFrequency: number;
  avgRecency: number;
  avgMontant: number;
  totalCa: number;
  conversionRate: number;
  returnRate: number;
  topSegment: string;
}

interface RecommendationData {
  recommended_category: string;
  title: string;
  eligible_count: number;
  days_without_offer?: number;
  reasoning: string;
  sample_clients: { email: string; nom: string; segment?: string }[];
  target_clients?: { email: string; nom: string; segment?: string }[];
  conversion_rate_estimate: number;
  prefilled_subject?: string;
  prefilled_body?: string;
}

const METRIC_LABELS: Record<keyof Omit<CommerceMetrics, "id" | "name" | "topSegment">, string> = {
  totalClients: "Clients",
  avgRfm: "Score RFM moyen",
  avgChurn: "Risque Churn moyen",
  churnCount: "Nb Churn",
  ambassadorCount: "Ambassadeurs",
  avgFrequency: "Fréquence moy.",
  avgRecency: "Récence moy. (j)",
  avgMontant: "Panier moy. (DT)",
  totalCa: "CA Total (DT)",
  conversionRate: "Taux Conversion (%)",
  returnRate: "Taux Retour (Tr %)",
};

const METRIC_KEYS = Object.keys(METRIC_LABELS) as Array<keyof typeof METRIC_LABELS>;

// Primary columns displayed directly in the main table
const PRIMARY_TABLE_KEYS = ["totalClients", "totalCa", "avgRfm", "avgChurn", "conversionRate"] as const;

// Secondary metrics accessible inside the expandable detail row
const SECONDARY_TABLE_KEYS = [
  "ambassadorCount",
  "churnCount",
  "avgFrequency",
  "avgRecency",
  "avgMontant",
  "returnRate",
] as const;

const METRIC_ICONS: Record<string, React.ReactElement> = {
  totalClients: <Users className="w-3.5 h-3.5" />,
  avgRfm: <Star className="w-3.5 h-3.5" />,
  avgChurn: <Flame className="w-3.5 h-3.5 text-rose-500" />,
  churnCount: <Flame className="w-3.5 h-3.5 text-rose-500" />,
  ambassadorCount: <Award className="w-3.5 h-3.5 text-amber-500" />,
  avgFrequency: <TrendingUp className="w-3.5 h-3.5" />,
  avgRecency: <TrendingDown className="w-3.5 h-3.5" />,
  avgMontant: <BarChart3 className="w-3.5 h-3.5" />,
  totalCa: <Banknote className="w-3.5 h-3.5 text-emerald-600" />,
  conversionRate: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
  returnRate: <Undo2 className="w-3.5 h-3.5 text-rose-500" />,
};

const LOWER_IS_BETTER = new Set(["avgChurn", "churnCount", "avgRecency"]);

function computeLeaders(metrics: CommerceMetrics[]): Record<string, string> {
  const leaders: Record<string, string> = {};
  METRIC_KEYS.forEach((key) => {
    const sorted = [...metrics].sort((a, b) =>
      LOWER_IS_BETTER.has(key) ? a[key] - b[key] : b[key] - a[key]
    );
    if (sorted.length > 0) leaders[key] = sorted[0].id;
  });
  return leaders;
}

const CHART_COLORS = [
  "rgba(232, 70, 47, 0.85)",
  "rgba(240, 96, 56, 0.85)",
  "rgba(16, 185, 129, 0.85)",
  "rgba(245, 158, 11, 0.85)",
  "rgba(239, 68, 68, 0.85)",
  "rgba(20, 184, 166, 0.85)",
];

function formatValue(key: keyof typeof METRIC_LABELS, val: number): string {
  if (key === "avgChurn" || key === "conversionRate" || key === "returnRate") return `${val.toFixed(1)}%`;
  if (key === "avgRfm") return val.toFixed(2);
  if (key === "avgMontant" || key === "totalCa") return `${val.toLocaleString("fr-FR")} DT`;
  if (key === "avgRecency") return `${val.toFixed(1)} j`;
  return String(val);
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "global" || searchParams.get("tab") === "comparatif"
    ? "global"
    : searchParams.get("tab") === "ai"
    ? "ai"
    : "stats";

  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [selectedCommerce, setSelectedCommerce] = useState<string>("__all__");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"stats" | "global" | "ai">(initialTab);

  // Data states for Tab 1
  const [allClients, setAllClients] = useState<ClientData[]>([]);
  const [returnRate, setReturnRate] = useState<number>(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  // Track how many times recommendations have been force-refreshed (incremented after a campaign send)
  const [recRefreshKey, setRecRefreshKey] = useState<number>(0);

  // AI Tab 3 states
  const [aiRecommendation, setAiRecommendation] = useState<RecommendationData | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  // Multi-shop comparative states for Tab 2
  const [commercesMetrics, setCommercesMetrics] = useState<CommerceMetrics[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<keyof typeof METRIC_LABELS>("avgRfm");
  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [expandedShops, setExpandedShops] = useState<Record<string, boolean>>({});

  const toggleExpandShop = (id: string) => {
    setExpandedShops((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sync query params tab
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "global" || tabParam === "comparatif") {
      setActiveTab("global");
    } else if (tabParam === "stats") {
      setActiveTab("stats");
    } else if (tabParam === "ai") {
      setActiveTab("ai");
    }
  }, [searchParams]);

  // Fetch IA recommendation + rule-based recommendations for Tab 3
  // Triggered when: tab changes to "ai", boutique changes, OR recRefreshKey increments (post-send)
  useEffect(() => {
    if (activeTab !== "ai") return;
    if (selectedCommerce === "__all__") {
      setAiRecommendation(null);
      return;
    }
    // Refresh AI meilleur potentiel
    setLoadingAi(true);
    fetch(
      `/api/campaigns/recommendations-ai?commerce_id=${encodeURIComponent(selectedCommerce)}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
    )
      .then(r => r.json())
      .then(d => setAiRecommendation(!d.error ? d : null))
      .catch(() => setAiRecommendation(null))
      .finally(() => setLoadingAi(false));
    // Also refresh rule-based alerts so they reappear after returning from /campaigns
    fetch(
      `/api/recommendations?commerce_id=${encodeURIComponent(selectedCommerce)}`,
      { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
    )
      .then(r => r.json())
      .then(d => {
        if (d.status === "success" && d.data) setRecommendations(d.data);
      })
      .catch(() => {});
  }, [activeTab, selectedCommerce, recRefreshKey]);

  // Fetch initial boutique list
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/commerces");
        const data = await res.json();
        if (Array.isArray(data)) {
          setCommerces(data);
          const saved = localStorage.getItem("ratenza_commerce_id");
          if (saved && data.some((c: Commerce) => c.id === saved)) {
            setSelectedCommerce(saved);
          }
        } else {
          setCommerces([]);
        }
      } catch (err) {
        console.error("Failed to load commerces:", err);
        setCommerces([]);
      }
    }
    init();
  }, []);

  // Fetch dashboard data based on selected boutique (Tab 1)
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (selectedCommerce === "__all__") {
          const shopsRes = await fetch("/api/commerces");
          const shops = await shopsRes.json();
          if (Array.isArray(shops)) {
            const allPromises = shops.map((c: Commerce) =>
              fetch(`/api/data?commerce_id=${encodeURIComponent(c.id)}`).then((r) => r.json())
            );
            const results = await Promise.all(allPromises);
            const merged: ClientData[] = results.flat().filter((d: any) => d && !d.error);
            setAllClients(merged);
          } else {
            setAllClients([]);
          }
          setReturnRate(0);
          setRecommendations([]);
        } else {
          const res = await fetch(`/api/data?commerce_id=${encodeURIComponent(selectedCommerce)}`);
          const data = await res.json();
          setAllClients(Array.isArray(data) ? data : []);

          const trRes = await fetch(
            `/api/kpis/return-rate?commerce_id=${encodeURIComponent(selectedCommerce)}`
          );
          const trData = await trRes.json();
          if (trData.status === "success" && trData.data) {
            setReturnRate(trData.data.taux_retour_30j || 0);
          } else {
            setReturnRate(0);
          }

          const recRes = await fetch(
            `/api/recommendations?commerce_id=${encodeURIComponent(selectedCommerce)}`
          );
          const recData = await recRes.json();
          if (recData.status === "success" && recData.data) {
            setRecommendations(recData.data);
          } else {
            setRecommendations([]);
          }
        }
      } catch (err) {
        console.error("Failed to load data for dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedCommerce, recRefreshKey]);

  // Load multi-shop comparative metrics for Tab 2 (11 indicators)
  useEffect(() => {
    if (activeTab === "global" && commercesMetrics.length === 0) {
      async function loadMultiShopMetrics() {
        setLoadingMetrics(true);
        try {
          const shopsRes = await fetch("/api/commerces");
          const rawShops = await shopsRes.json();
          const shops: { id: string; name?: string; label?: string }[] = Array.isArray(rawShops) ? rawShops : [];

          const allPromises = shops.map(async (shop) => {
            const [dataRes, trRes, statsRes] = await Promise.all([
              fetch(`/api/data?commerce_id=${encodeURIComponent(shop.id)}`).then(r => r.json()).catch(() => []),
              fetch(`/api/kpis/return-rate?commerce_id=${encodeURIComponent(shop.id)}`).then(r => r.json()).catch(() => ({})),
              fetch(`/api/campaigns/advanced-stats?commerce_id=${encodeURIComponent(shop.id)}`).then(r => r.json()).catch(() => ({}))
            ]);

            const clients: any[] = Array.isArray(dataRes) ? dataRes : [];
            const shopName = shop.name || shop.label || shop.id;
            const returnRateVal = trRes?.status === "success" && trRes?.data ? (trRes.data.taux_retour_30j || 0) : 0;
            const conversionRateVal = statsRes?.global_kpis?.conversion_rate || 0;

            if (clients.length === 0) {
              return {
                id: shop.id,
                name: shopName,
                totalClients: 0,
                avgRfm: 0,
                avgChurn: 0,
                churnCount: 0,
                ambassadorCount: 0,
                avgFrequency: 0,
                avgRecency: 0,
                avgMontant: 0,
                totalCa: 0,
                conversionRate: 0,
                returnRate: 0,
                topSegment: "N/A",
              } as CommerceMetrics;
            }

            const avg = (field: string) =>
              clients.reduce((acc, c) => acc + (Number(c[field]) || 0), 0) / clients.length;

            const totalCaVal = clients.reduce(
              (acc, c) => acc + (Number(c.monetary_total) || (Number(c.monetary) * Number(c.frequency)) || 0),
              0
            );

            const segmentCounts: Record<string, number> = {};
            clients.forEach((c) => {
              const seg = c.segment_gmm || c.segment || getFallbackSegment(c);
              segmentCounts[seg] = (segmentCounts[seg] || 0) + 1;
            });
            const rawTop = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
            const segmentLabels: Record<string, string> = {
              vip: "VIP",
              regular: "Régulier",
              at_risk: "À risque",
              lost: "Perdu",
            };
            const topSegment = segmentLabels[rawTop] || rawTop;

            return {
              id: shop.id,
              name: shopName,
              totalClients: clients.length,
              avgRfm: Math.round(avg("score_global_sa") * 100) / 100,
              avgChurn: Math.round(avg("churn_score") * 100) / 100,
              churnCount: clients.filter((c) => (c.churn_score || 0) >= 0.55).length,
              ambassadorCount: clients.filter((c) => {
                const infl = c.influence_score !== undefined
                  ? c.influence_score
                  : Math.round(((c.score_global_sa || 0) * 0.7 + (1.0 - (c.churn_score || 0)) * 0.3) * 100);
                return infl >= 80;
              }).length,
              avgFrequency: Math.round(avg("frequency") * 10) / 10,
              avgRecency: Math.round(avg("recency") * 10) / 10,
              avgMontant: Math.round(avg("monetary") * 10) / 10,
              totalCa: Math.round(totalCaVal * 100) / 100,
              conversionRate: Math.round(conversionRateVal * 10) / 10,
              returnRate: Math.round(returnRateVal * 10) / 10,
              topSegment,
            } as CommerceMetrics;
          });

          const results = await Promise.all(allPromises);
          setCommercesMetrics(results);
        } catch (err) {
          console.error("Failed to load multi-shop metrics:", err);
        } finally {
          setLoadingMetrics(false);
        }
      }
      loadMultiShopMetrics();
    }
  }, [activeTab, commercesMetrics.length]);

  // Handle selector change
  const handleCommerceSelect = (id: string) => {
    setSelectedCommerce(id);
    if (id !== "__all__") {
      localStorage.setItem("ratenza_commerce_id", id);
    }
  };

  // Launch IA recommended campaign from Tab 3
  const handleLaunchAiCampaign = () => {
    if (!aiRecommendation) return;
    const payload = {
      category: aiRecommendation.recommended_category,
      title: aiRecommendation.title,
      subject: aiRecommendation.prefilled_subject || `Offre exclusive : ${aiRecommendation.title}`,
      body: aiRecommendation.prefilled_body || `Bonjour {nom},\n\nNous vous proposons une offre privilège.`,
      target_clients: aiRecommendation.target_clients || aiRecommendation.sample_clients || []
    };
    localStorage.setItem("ratenza_prefill_campaign", JSON.stringify(payload));
    router.push(
      `/campaigns?prefill_recommended=true&target_category=${encodeURIComponent(aiRecommendation.recommended_category)}`
    );
  };

  // --- KPI Computations ---
  const totalClients = allClients.length;
  const avgRecency   = totalClients > 0 ? allClients.reduce((acc, curr) => acc + (Number(curr.recency)   || 0), 0) / totalClients : 0;
  const avgFrequency = totalClients > 0 ? allClients.reduce((acc, curr) => acc + (Number(curr.frequency) || 0), 0) / totalClients : 0;
  const avgMonetary  = totalClients > 0 ? allClients.reduce((acc, curr) => acc + (Number(curr.monetary)  || 0), 0) / totalClients : 0;
  const avgChurn = totalClients > 0 ? (allClients.reduce((acc, curr) => acc + (curr.churn_score || 0), 0) / totalClients) * 100 : 0;
  const alertClientsCount = allClients.filter((c) => (c.churn_score || 0) >= 0.55).length;
  const ambassadorsCount = allClients.filter((c) => {
    const score = c.influence_score !== undefined
      ? c.influence_score
      : Math.round(((c.score_global_sa || 0) * 0.7 + (1.0 - (c.churn_score || 0)) * 0.3) * 100);
    return score >= 80;
  }).length;

  // --- Segment classification helper ---
  const getFallbackSegment = (c: ClientData): "vip" | "regular" | "at_risk" | "lost" => {
    const raw = (c.segment_gmm || "").toLowerCase().trim();
    if (raw.includes("vip")) return "vip";
    if (raw.includes("reg") || raw.includes("rég")) return "regular";
    if (raw.includes("risk") || raw.includes("risq")) return "at_risk";
    if (raw.includes("lost") || raw.includes("perd")) return "lost";

    const scoreSa = c.score_global_sa || 0;
    if (scoreSa >= 0.7) return "vip";
    if (scoreSa >= 0.4) return "regular";
    if (scoreSa >= 0.2) return "at_risk";
    return "lost";
  };

  // --- Doughnut Segment Chart Data ---
  const segments = { vip: 0, regular: 0, at_risk: 0, lost: 0 };
  const rfmScores = {
    vip: { r: 0, f: 0, m: 0, count: 0 },
    regular: { r: 0, f: 0, m: 0, count: 0 },
    at_risk: { r: 0, f: 0, m: 0, count: 0 },
    lost: { r: 0, f: 0, m: 0, count: 0 }
  };
  const churnDist = { low: 0, medium: 0, high: 0, critical: 0 };

  allClients.forEach((c) => {
    const seg = getFallbackSegment(c);
    segments[seg]++;

    rfmScores[seg].r += c.recency_score ?? c.score_r ?? 0;
    rfmScores[seg].f += c.frequency_score ?? c.score_f ?? 0;
    rfmScores[seg].m += c.monetary_score ?? c.score_m ?? 0;
    rfmScores[seg].count++;

    const churn = c.churn_score || 0;
    if (churn < 0.3) churnDist.low++;
    else if (churn < 0.55) churnDist.medium++;
    else if (churn < 0.75) churnDist.high++;
    else churnDist.critical++;
  });

  const segmentChartData = {
    labels: ["VIP", "Régulier", "À risque", "Perdu"],
    datasets: [
      {
        data: [segments.vip, segments.regular, segments.at_risk, segments.lost],
        backgroundColor: ["#059669", "#2563EB", "#D97706", "#E8462F"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }
    ]
  };

  const churnChartData = {
    labels: ["Faible (<30%)", "Moyen (30-55%)", "Élevé (55-75%)", "Critique (>=75%)"],
    datasets: [
      {
        data: [churnDist.low, churnDist.medium, churnDist.high, churnDist.critical],
        backgroundColor: ["#059669", "#D97706", "#E8462F", "#7C1B0E"],
        borderWidth: 2,
        borderColor: "#ffffff"
      }
    ]
  };

  const getAvg = (sum: number, count: number) => (count > 0 ? sum / count : 0);

  const rfmChartData = {
    labels: ["VIP", "Régulier", "À risque", "Perdu"],
    datasets: [
      {
        label: "Score Récence",
        data: [
          getAvg(rfmScores.vip.r, rfmScores.vip.count),
          getAvg(rfmScores.regular.r, rfmScores.regular.count),
          getAvg(rfmScores.at_risk.r, rfmScores.at_risk.count),
          getAvg(rfmScores.lost.r, rfmScores.lost.count)
        ],
        backgroundColor: "rgba(5, 150, 105, 0.85)",
        borderRadius: 6
      },
      {
        label: "Score Fréquence",
        data: [
          getAvg(rfmScores.vip.f, rfmScores.vip.count),
          getAvg(rfmScores.regular.f, rfmScores.regular.count),
          getAvg(rfmScores.at_risk.f, rfmScores.at_risk.count),
          getAvg(rfmScores.lost.f, rfmScores.lost.count)
        ],
        backgroundColor: "rgba(37, 99, 235, 0.85)",
        borderRadius: 6
      },
      {
        label: "Score Montant",
        data: [
          getAvg(rfmScores.vip.m, rfmScores.vip.count),
          getAvg(rfmScores.regular.m, rfmScores.regular.count),
          getAvg(rfmScores.at_risk.m, rfmScores.at_risk.count),
          getAvg(rfmScores.lost.m, rfmScores.lost.count)
        ],
        backgroundColor: "rgba(232, 70, 47, 0.85)",
        borderRadius: 6
      }
    ]
  };

  const leaders = computeLeaders(commercesMetrics);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Page Header */}
      <PageHeader
        title={activeTab === "stats" ? "Tableau de Bord RFM & IA" : activeTab === "ai" ? "Recommandations IA & Stratégie Marketing" : "Vue Globale & Performance Multi-Boutiques"}
        subtitle={activeTab === "stats" ? "Pilotage et analyses prédictives de la stratégie commerciale" : activeTab === "ai" ? "Analyse IA du meilleur potentiel de campagne pour votre boutique" : "Comparatif des performances en temps réel de tous vos points de vente"}
      >
        {(activeTab === "stats" || activeTab === "ai") && (
          <select
            value={selectedCommerce}
            onChange={(e) => handleCommerceSelect(e.target.value)}
            className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-sm shrink-0"
          >
            <option value="__all__">Toutes les boutiques</option>
            {commerces.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        )}

        {/* Export CSV link */}
        <a
          href={activeTab === "global" ? "/api/export/global" : `/api/export/dashboard?commerce_id=${selectedCommerce}`}
          download
          className="bg-white border border-[#EEE5DF] hover:bg-[#FAF3EE] text-[#7A6E68] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter CSV
        </a>
      </PageHeader>

      {/* Tabs navigation */}
      <div className="px-8 mt-6">
        <div className="flex border-b border-[#EEE5DF] gap-6">
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "stats"
              ? "border-[#E8462F] text-[#E8462F]"
              : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
              }`}
          >
            Indicateurs &amp; Analyses
          </button>
          <button
            onClick={() => setActiveTab("global")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "global"
              ? "border-[#E8462F] text-[#E8462F]"
              : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
              }`}
          >
            Comparatif Direct Boutiques
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === "ai"
              ? "border-[#E8462F] text-[#E8462F]"
              : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
              }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Recommandations IA &amp; Stratégie
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full animate-fade-in">
        {activeTab === "stats" ? (
          loading && allClients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-10 h-10 text-[#E8462F] animate-spin" />
              <p className="text-sm text-slate-500 font-semibold mt-4">
                Chargement des analyses et KPIs...
              </p>
            </div>
          ) : (
            <>
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-md hover:shadow-[#E8462F]/5 transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Clients Totaux
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FDECEA] text-[#E8462F] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">{totalClients}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Clients modélisés en base
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Panier Moyen
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">
                    {avgMonetary.toFixed(2)} DT
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Valeur monétaire moyenne
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Taux de Retour (Tr)
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FDECEA] text-[#E8462F] flex items-center justify-center">
                      <Undo2 className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">{returnRate.toFixed(1)}%</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Clients actifs revenus sous 30j
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Taux de Churn (IA)
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                      <Flame className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">{avgChurn.toFixed(1)}%</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Probabilité moyenne de départ
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Récence Moyenne
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FAF3EE] text-slate-600 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">{avgRecency.toFixed(1)} j</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Depuis le dernier achat
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Fréquence Moyenne
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#FAF3EE] text-slate-600 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-[#1A1A1A]">{avgFrequency.toFixed(1)} achats</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Transactions cumulées par client
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Alerte Churn (≥ 55%)
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-red-600">{alertClientsCount}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Clients en risque modéré/élevé
                  </p>
                </div>

                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 hover:translate-y-[-4px] hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ambassadeurs 👑
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                      <Crown className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-extrabold text-yellow-600">{ambassadorsCount}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Clients avec influence {`>=`} 80%
                  </p>
                </div>
              </div>


              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Doughnut 1: GMM Segments */}
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Répartition GMM
                    </h4>
                    <p className="text-sm font-bold text-[#1A1A1A]">Segments Clients</p>
                  </div>
                  <div className="h-[200px] relative flex items-center justify-center">
                    <Doughnut
                      data={segmentChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 10 } } } }
                      }}
                    />
                  </div>
                </div>

                {/* Doughnut 2: Churn Distribution */}
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Risques de Churn
                    </h4>
                    <p className="text-sm font-bold text-[#1A1A1A]">Prédictions XGBoost</p>
                  </div>
                  <div className="h-[200px] relative flex items-center justify-center">
                    <Doughnut
                      data={churnChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 10 } } } }
                      }}
                    />
                  </div>
                </div>

                {/* Bar 1: RFM Profiles */}
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Profils Moyens
                    </h4>
                    <p className="text-sm font-bold text-[#1A1A1A]">Indicateurs RFM par Segment</p>
                  </div>
                  <div className="h-[200px] relative">
                    <Bar
                      data={rfmChartData}
                      options={{
                        maintainAspectRatio: false,
                        scales: {
                          y: { min: 0, max: 1.0, ticks: { stepSize: 0.2, font: { family: "Outfit", size: 9 } } },
                          x: { ticks: { font: { family: "Outfit", size: 10 } } }
                        },
                        plugins: {
                          legend: { position: "bottom", labels: { boxWidth: 10, font: { family: "Outfit", size: 9 } } }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )
        ) : activeTab === "ai" ? (
          /* Tab 3: Recommandations IA & Stratégie (Design Harmonisé) */
          <div className="space-y-8 animate-fade-in">
            {selectedCommerce === "__all__" ? (
              <div className="bg-white border border-[#EEE5DF] rounded-3xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-[#FAF3EE] text-[#E8462F] flex items-center justify-center border border-[#EEE5DF]">
                  <Sparkles className="w-6 h-6" />
                </div>
                <p className="text-base font-extrabold text-[#1A1A1A]">Sélectionnez une boutique pour afficher les recommandations IA</p>
                <p className="text-xs text-[#7A6E68]">Le moteur d'analyse IA évalue les données comportementales boutique par boutique.</p>
              </div>
            ) : (
              <>
                {/* 1. SECTION IA — MEILLEURE OPPORTUNITÉ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-[#E8462F] text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-2xs uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        IA — MEILLEUR POTENTIEL
                      </span>
                      <h3 className="text-sm font-extrabold text-[#1A1A1A]">Opportunité Prioritaire du Moment</h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#7A6E68]">Attribution &amp; ciblage automatique ⚡</span>
                  </div>

                  {loadingAi ? (
                    <div className="bg-white border border-[#EEE5DF] rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-[#B0A49C] shadow-2xs">
                      <Loader2 className="w-6 h-6 animate-spin text-[#E8462F]" />
                      <span className="text-xs font-bold">Analyse IA des segments en cours...</span>
                    </div>
                  ) : aiRecommendation && aiRecommendation.recommended_category !== "none" && aiRecommendation.eligible_count > 0 ? (
                    <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-2xs space-y-4 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE5DF] pb-4">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-extrabold text-[#E8462F] uppercase tracking-wider block">
                            Campagne recommandée
                          </span>
                          <h3 className="text-base font-black text-[#1A1A1A] tracking-tight">
                            {aiRecommendation.title}
                          </h3>
                        </div>
                        <button
                          onClick={handleLaunchAiCampaign}
                          className="bg-[#E8462F] hover:bg-[#C93A25] text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Lancer cette campagne ({aiRecommendation.eligible_count} cibles)
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Compact KPI Stats Pills */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#FAF3EE]/60 border border-[#EEE5DF] rounded-xl px-3 py-2 flex items-center gap-2.5">
                          <Users className="w-4 h-4 text-[#E8462F] shrink-0" />
                          <div>
                            <span className="text-[9px] font-extrabold text-[#7A6E68] uppercase tracking-wider block leading-none">Audience</span>
                            <span className="text-xs font-black text-[#1A1A1A]">{aiRecommendation.eligible_count} clients</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF3EE]/60 border border-[#EEE5DF] rounded-xl px-3 py-2 flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <div>
                            <span className="text-[9px] font-extrabold text-[#7A6E68] uppercase tracking-wider block leading-none">Inactivité</span>
                            <span className="text-xs font-black text-[#1A1A1A]">{aiRecommendation.days_without_offer || 14} jours sans offre</span>
                          </div>
                        </div>

                        <div className="bg-[#FAF3EE]/60 border border-[#EEE5DF] rounded-xl px-3 py-2 flex items-center gap-2.5">
                          <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="text-[9px] font-extrabold text-[#7A6E68] uppercase tracking-wider block leading-none">Conversion est.</span>
                            <span className="text-xs font-black text-emerald-600">{aiRecommendation.conversion_rate_estimate}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Reasoning concise bar */}
                      <div className="text-xs text-[#7A6E68] font-medium bg-[#FAF3EE]/40 border border-[#EEE5DF] rounded-xl px-3.5 py-2 flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-wider shrink-0 bg-white border border-[#EEE5DF] px-2 py-0.5 rounded-md">
                          Analyse IA
                        </span>
                        <span className="truncate">{aiRecommendation.reasoning}</span>
                      </div>

                      {/* Compact Target Clients View */}
                      {((aiRecommendation.target_clients && aiRecommendation.target_clients.length > 0) ||
                        (aiRecommendation.sample_clients && aiRecommendation.sample_clients.length > 0)) && (() => {
                        const clients = aiRecommendation.target_clients || aiRecommendation.sample_clients;
                        const isSingle = clients.length === 1;
                        return (
                          <div className="pt-2 border-t border-[#EEE5DF] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3 text-[#E8462F]" />
                                Clients pré-sélectionnés ({clients.length})
                              </span>
                              <span className="text-[9px] font-extrabold text-[#E8462F] bg-[#FDECEA] px-2 py-0.5 rounded-full border border-[#FDECEA]">
                                Pré-sélection IA ⚡
                              </span>
                            </div>

                            {isSingle ? (
                              <div className="bg-white border border-[#EEE5DF] rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                  <span className="font-bold text-[#1A1A1A]">{clients[0].nom}</span>
                                  <span className="text-[#7A6E68] font-mono text-[11px]">({clients[0].email})</span>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${clients[0].segment === "vip" ? "bg-amber-100 text-amber-700" : "bg-[#FAF3EE] text-[#7A6E68]"}`}>
                                  {clients[0].segment === "vip" ? (<><Crown className="w-3 h-3 text-amber-600" /> VIP</>) : (<><User className="w-3 h-3 text-[#7A6E68]" /> Standard</>)}
                                </span>
                              </div>
                            ) : (
                              <div className="border border-[#EEE5DF] rounded-xl overflow-hidden bg-white shadow-2xs max-h-48 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#FAF3EE] text-[9px] font-extrabold text-[#7A6E68] uppercase tracking-wider border-b border-[#EEE5DF] sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2">Nom du client</th>
                                      <th className="px-3 py-2">Adresse Email</th>
                                      <th className="px-3 py-2 text-center">Achats Cumulés</th>
                                      <th className="px-3 py-2 text-center">Score Churn</th>
                                      <th className="px-3 py-2 text-right">Statut Segment</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#EEE5DF]/60">
                                    {clients.map((c: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-[#FAF3EE]/40 transition-colors">
                                        <td className="px-3 py-2 font-bold text-[#1A1A1A] flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                          {c.nom}
                                        </td>
                                        <td className="px-3 py-2 text-[#7A6E68] font-mono text-[10px]">{c.email}</td>
                                        <td className="px-3 py-2 text-center font-bold text-[#1A1A1A]">
                                          {c.monetary_total ? `${c.monetary_total.toFixed(2)} DT` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {c.churn_score !== undefined ? (
                                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${c.churn_score >= 0.55 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                              {(c.churn_score * 100).toFixed(0)}%
                                            </span>
                                          ) : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${c.segment === "vip" ? "bg-amber-100 text-amber-700" : "bg-[#FAF3EE] text-[#7A6E68]"}`}>
                                            {c.segment === "vip" ? (<><Crown className="w-2.5 h-2.5 text-amber-600" /> VIP</>) : (<><User className="w-2.5 h-2.5 text-[#7A6E68]" /> Standard</>)}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2 shadow-2xs">
                      <CheckCircle className="w-7 h-7 text-emerald-600" />
                      <h4 className="text-sm font-black text-emerald-950">Toutes les opportunités sont à jour ! ✨</h4>
                      <p className="text-xs font-medium text-emerald-700 max-w-md">
                        Tous vos clients éligibles ont déjà été contactés récemment. Aucune relance répété ne sera envoyée afin d'éviter la fatigue marketing.
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. SECTION IA — ALERTES & ACTIONS AUTOMATIQUES */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-[#FAF3EE] text-[#E8462F] border border-[#E8D9CF] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" />
                        IA — ALERTES STRATÉGIQUES
                      </span>
                      <h3 className="text-sm font-extrabold text-[#1A1A1A]">Actions &amp; Relances Recommandées</h3>
                    </div>
                    <span className="text-[11px] font-bold text-[#7A6E68]">{recommendations.length} alertes actives</span>
                  </div>

                  {recommendations.length > 0 ? (
                    <div className="bg-white border border-[#EEE5DF] rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        {recommendations.map((rec) => {
                          const isWarning = rec.type === "warning";
                          const isAlert = rec.type === "alert";

                          return (
                            <div
                              key={rec.id}
                              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all duration-200 ${
                                isAlert
                                  ? "border-rose-200 hover:border-rose-300"
                                  : isWarning
                                  ? "border-amber-200 hover:border-amber-300"
                                  : "border-[#EEE5DF] hover:border-[#E8D9CF]"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                      isAlert
                                        ? "bg-rose-100 text-rose-700"
                                        : isWarning
                                        ? "bg-amber-100 text-amber-800"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {isAlert ? "Alerte Churn" : isWarning ? "Attention" : "Opportunité"}
                                  </span>
                                  <span className="text-[10px] font-extrabold text-[#7A6E68] bg-[#FAF3EE] px-2 py-0.5 rounded-md border border-[#EEE5DF]">
                                    P{rec.priority}
                                  </span>
                                </div>
                                <h5 className="text-xs font-black text-[#1A1A1A] leading-snug mb-1.5">
                                  {rec.title}
                                </h5>
                                <p className="text-xs text-[#7A6E68] leading-relaxed font-medium">
                                  {rec.message}
                                </p>
                              </div>

                              <button
                                onClick={() => {
                                  const payload = {
                                    category: rec.id,
                                    title: rec.title,
                                    subject: rec.prefilled_subject || `Campagne : ${rec.title}`,
                                    body: rec.prefilled_body || `Bonjour {nom},\n\nVoici une offre exclusive adaptée à vos achats.`,
                                    target_clients: rec.target_clients || []
                                  };
                                  localStorage.setItem("ratenza_prefill_campaign", JSON.stringify(payload));
                                  const qParams = new URLSearchParams();
                                  qParams.set("prefill_recommended", "true");
                                  qParams.set("target_category", rec.id);
                                  router.push(`/campaigns?${qParams.toString()}`);
                                }}
                                className="mt-5 w-full bg-[#FAF3EE] hover:bg-[#E8462F] text-[#7A6E68] hover:text-white border border-[#EEE5DF] hover:border-[#E8462F] px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                              >
                                {rec.action.label}
                                <ArrowRight className="w-3.5 h-3.5 text-[#E8462F] group-hover:text-white transition-colors" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-1.5 shadow-2xs">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                      <h5 className="text-xs font-black text-[#1A1A1A]">Toutes les alertes sont traitées ! ✨</h5>
                      <p className="text-[11px] text-[#7A6E68] font-medium max-w-md">
                        Les clients ciblés par les récents signaux ont tous reçu leur relance. Aucune alerte active en attente d'envoi.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Tab 2: Comparatif Direct Boutiques (Refonte épurée & dépliable) */
          <div className="space-y-6 animate-fade-in">
            {loadingMetrics ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3 text-[#B0A49C]">
                <Loader2 className="w-8 h-8 animate-spin text-[#E8462F]" />
                <span className="text-sm font-bold">Chargement des données multi-boutiques...</span>
              </div>
            ) : (
              <>
                {/* Metric Selector for Dynamic Chart */}
                <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#E8462F]" />
                      <h2 className="font-extrabold text-[#1A1A1A] text-sm">Comparatif par indicateur</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {METRIC_KEYS.map((key) => (
                        <button
                          key={key}
                          onClick={() => setSelectedMetric(key)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${selectedMetric === key
                            ? "bg-[#E8462F] text-white border-[#E8462F] shadow-sm"
                            : "bg-[#FAF3EE] text-[#7A6E68] border-[#EEE5DF] hover:bg-[#FDECEA]"
                            }`}
                        >
                          {METRIC_LABELS[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="h-60">
                    {commercesMetrics.length > 0 ? (
                      <Bar
                        data={{
                          labels: commercesMetrics.map((c) => c.name),
                          datasets: [
                            {
                              label: METRIC_LABELS[selectedMetric],
                              data: commercesMetrics.map((c) => c[selectedMetric]),
                              backgroundColor: commercesMetrics.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                              borderRadius: 8,
                              borderSkipped: false,
                            },
                          ],
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: {
                              callbacks: {
                                label: (ctx: any) => ` ${ctx.raw}`,
                              },
                            },
                          },
                          scales: {
                            x: {
                              grid: { display: false },
                              ticks: { font: { size: 11 }, color: "#7A6E68" },
                            },
                            y: {
                              grid: { color: "#EEE5DF" },
                              ticks: { font: { size: 10 }, color: "#B0A49C" },
                            },
                          },
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#B0A49C] text-xs">Aucune donnée.</div>
                    )}
                  </div>
                </div>

                {/* Main Comparison Table (Cleaned 6 columns view + Click-to-expand details) */}
                <div className="bg-white border border-[#EEE5DF] rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-[#EEE5DF] flex items-center justify-between bg-[#FAF3EE] flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <h2 className="font-extrabold text-[#1A1A1A] text-sm">Tableau Comparatif Synthétique</h2>
                    </div>
                    <span className="text-[10px] text-[#7A6E68] font-bold bg-white border border-[#EEE5DF] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                      🏆 = Leader • Cliquez sur une boutique pour voir le détail complet (6 métriques secondaires)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#FAF3EE] border-b border-[#EEE5DF]">
                          <th className="text-left px-5 py-3.5 font-extrabold text-[#7A6E68] uppercase tracking-wider text-[10px] sticky left-0 bg-[#FAF3EE]">
                            Boutique
                          </th>
                          {PRIMARY_TABLE_KEYS.map((key) => (
                            <th key={key} className="text-center px-4 py-3.5 font-extrabold text-[#7A6E68] uppercase tracking-wider text-[10px] whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {METRIC_ICONS[key]}
                                {METRIC_LABELS[key]}
                              </div>
                            </th>
                          ))}
                          <th className="text-center px-4 py-3.5 font-extrabold text-[#7A6E68] uppercase tracking-wider text-[10px]">
                            Segment Dominant
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EEE5DF]/60">
                        {commercesMetrics.map((commerce) => {
                          const isExpanded = !!expandedShops[commerce.id];
                          return (
                            <React.Fragment key={commerce.id}>
                              {/* Main visible row */}
                              <tr
                                onClick={() => toggleExpandShop(commerce.id)}
                                className={`transition-colors cursor-pointer group ${isExpanded ? "bg-[#FAF3EE]/70" : "hover:bg-[#FAF3EE]/40"
                                  }`}
                              >
                                <td className="px-5 py-4 font-extrabold text-[#1A1A1A] sticky left-0 bg-white group-hover:bg-[#FAF3EE]/40 whitespace-nowrap">
                                  <div className="flex items-center gap-2.5">
                                    <div
                                      className={`p-1.5 rounded-lg transition-all ${isExpanded
                                        ? "bg-[#E8462F] text-white shadow-xs"
                                        : "bg-[#FAF3EE] text-[#7A6E68] group-hover:bg-[#FDECEA] group-hover:text-[#E8462F]"
                                        }`}
                                    >
                                      <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                                          }`}
                                      />
                                    </div>
                                    <span className="text-xs tracking-tight">{commerce.name}</span>
                                  </div>
                                </td>

                                {PRIMARY_TABLE_KEYS.map((key) => {
                                  const isLeader = leaders[key] === commerce.id;
                                  const val = commerce[key];
                                  return (
                                    <td key={key} className="px-4 py-4 text-center">
                                      <span
                                        className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg font-extrabold text-xs ${isLeader
                                          ? "bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
                                          : "text-[#1A1A1A]"
                                          }`}
                                      >
                                        {isLeader && <span className="text-amber-500">🏆</span>}
                                        {formatValue(key, val)}
                                      </span>
                                    </td>
                                  );
                                })}

                                <td className="px-4 py-4 text-center">
                                  <span className="px-3 py-1 bg-[#FDECEA] border border-[#E8D9CF] text-[#E8462F] rounded-lg font-black text-[10px] tracking-wide uppercase">
                                    {commerce.topSegment}
                                  </span>
                                </td>
                              </tr>

                              {/* Expandable Secondary Details Row */}
                              {isExpanded && (
                                <tr className="bg-[#FAF3EE]/30 border-b border-[#EEE5DF]">
                                  <td colSpan={7} className="px-6 py-4">
                                    <div className="bg-white border border-[#EEE5DF] rounded-2xl p-4 shadow-sm space-y-3">
                                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <span className="text-xs font-black text-[#1A1A1A] uppercase tracking-wider flex items-center gap-1.5">
                                          <BarChart3 className="w-3.5 h-3.5 text-[#E8462F]" />
                                          Détails &amp; Métriques Secondaires — {commerce.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#7A6E68]">
                                          6 indicateurs complémentaires
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                                        {SECONDARY_TABLE_KEYS.map((key) => {
                                          const isLeader = leaders[key] === commerce.id;
                                          const val = commerce[key];
                                          return (
                                            <div
                                              key={key}
                                              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${isLeader
                                                ? "bg-amber-50/70 border-amber-200 shadow-2xs"
                                                : "bg-[#FAF3EE]/50 border-[#EEE5DF]"
                                                }`}
                                            >
                                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                                <span className="text-[10px] font-extrabold text-[#7A6E68] flex items-center gap-1 truncate">
                                                  {METRIC_ICONS[key]}
                                                  {METRIC_LABELS[key]}
                                                </span>
                                                {isLeader && <span className="text-amber-500 text-xs shrink-0">🏆</span>}
                                              </div>
                                              <span className={`text-xs font-black ${isLeader ? "text-amber-800" : "text-[#1A1A1A]"}`}>
                                                {formatValue(key, val)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen text-[#B0A49C]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E8462F]" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
