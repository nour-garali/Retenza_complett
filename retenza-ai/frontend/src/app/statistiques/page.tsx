"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Send,
  Eye,
  EyeOff,
  ShoppingCart,
  DollarSign,
  Sparkles,
  RefreshCw,
  Info,
  Calendar,
  Filter,
  CheckCircle,
  ArrowUpRight,
  Users,
  Bot,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Search,
  Award,
  Download,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  HelpCircle,
  Layers,
  ArrowRight,
  Clock,
  Crown,
  User,
  CheckCircle2,
  X
} from "lucide-react";

interface GlobalKPIs {
  total_sent: number;
  total_sent_tracked: number;
  total_opened: number;
  total_converted: number;
  total_converted_all: number;
  total_revenue: number;
  total_cost: number;
  roi_percent: number;
  open_rate: number;
  conversion_rate: number;
  tracked_batches_count: number;
  top_category: string;
  top_category_revenue_val?: number;
  top_category_efficiency?: string;
  top_category_efficiency_val?: number;
}

interface CategoryStat {
  category: string;
  total_sent: number;
  total_sent_tracked: number;
  total_opened: number;
  total_converted: number;
  revenue_generated: number;
  total_cost: number;
  roi_percent: number;
  open_rate: number;
  conversion_rate: number;
  revenue_per_recipient: number;
}

interface CampaignBatch {
  batch_id: string;
  subject: string;
  category: string;
  segment: string;
  sent_at: string;
  total_sent: number;
  total_opened: number;
  total_converted: number;
  open_rate: number;
  conversion_rate: number;
  revenue_generated: number;
  total_cost: number;
  roi_percent: number;
  revenue_per_recipient: number;
  is_tracked?: boolean;
}


type SortColumn =
  | "sent_at"
  | "subject"
  | "category"
  | "total_sent"
  | "open_rate"
  | "conversion_rate"
  | "revenue_generated"
  | "total_cost"
  | "roi_percent"
  | "revenue_per_recipient";

type SortDirection = "asc" | "desc";

export default function StatistiquesPage() {
  const [selectedCommerce, setSelectedCommerce] = useState<string>("__all__");
  const [windowDays, setWindowDays] = useState<number>(7);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [commerces, setCommerces] = useState<{ id: string; label: string }[]>([]);

  const [globalKPIs, setGlobalKPIs] = useState<GlobalKPIs | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [batches, setBatches] = useState<CampaignBatch[]>([]);

  // Table filters, sorting, pagination
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortColumn, setSortColumn] = useState<SortColumn>("sent_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Navigation Tabs State: "stats" (Indicateurs & Analyses) | "history" (Historique)
  const [activeTab, setActiveTab] = useState<"stats" | "history">("stats");

  // Category Section State (expanded by default)
  const [isCatTableExpanded, setIsCatTableExpanded] = useState<boolean>(true);
  const [catSearchTerm, setCatSearchTerm] = useState<string>("");
  const [catActivityFilter, setCatActivityFilter] = useState<"all" | "active" | "inactive">("all");
  const [catSortCol, setCatSortCol] = useState<"category" | "total_sent" | "total_sent_tracked" | "revenue_generated" | "conversion_rate">("revenue_generated");
  const [catSortDir, setCatSortDir] = useState<"asc" | "desc">("desc");

  // Collapsible info banner toggle
  const [showNotes, setShowNotes] = useState<boolean>(false);


  // Charger les boutiques depuis l'API
  useEffect(() => {
    fetch("/api/commerces")
      .then((r) => r.json())
      .then((d) => setCommerces(Array.isArray(d) ? d : []))
      .catch(() => setCommerces([]));
  }, []);

  // Load commerce preference
  useEffect(() => {
    const saved = localStorage.getItem("ratenza_commerce_id");
    if (saved) setSelectedCommerce(saved);
  }, []);

  // Fetch statistics & recommendations
  const fetchData = async (cId = selectedCommerce, wDays = windowDays, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const timestamp = Date.now();
      const statsRes = await fetch(
        `/api/campaigns/advanced-stats?commerce_id=${encodeURIComponent(cId)}&window_days=${wDays}&_t=${timestamp}`,
        { cache: "no-store", headers: { "Cache-Control": "no-cache" } }
      );
      const stats = await statsRes.json();

      if (stats && !stats.error) {
        setGlobalKPIs(stats.global_kpis || null);
        setCategoryStats(stats.category_stats || []);
        setBatches(stats.batches || []);
      }

    } catch (err) {
      console.error("Erreur chargement statistiques :", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData(selectedCommerce, windowDays);
    setCurrentPage(1); // Reset page on filter change
  }, [selectedCommerce, windowDays]);

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc"); // Default to desc for numeric/dates
    }
  };

  // CSV Export Handler
  const exportToCSV = () => {
    if (!globalKPIs) return;

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    const formattedDate = now.toLocaleDateString("fr-FR");

    const commerceSlug =
      selectedCommerce === "__all__"
        ? "toutes_boutiques"
        : selectedCommerce.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    const filename = `statistiques_${commerceSlug}_${windowDays}j_${dateStr}.csv`;

    let csv = "\uFEFF"; // UTF-8 BOM

    csv += `RÉSUMÉ STATISTIQUES AVANCÉES DES CAMPAGNES;Boutique: ${selectedCommerce === "__all__" ? "Toutes les boutiques" : selectedCommerce};Fenêtre d'attribution: ${windowDays} jours;Exporté le: ${formattedDate}\n\n`;

    csv += "INDICATEURS CLÉS (KPIS GLOBAUX)\n";
    csv += "Indicateur;Valeur;Description / Précision\n";
    csv += `Chiffre d'Affaires Total;${globalKPIs.total_revenue.toFixed(2)} DT;CA attribué via Last-Touch sur la période\n`;
    csv += `Coût Total des Campagnes;${(globalKPIs.total_cost || 0).toFixed(2)} DT;Coûts d'envoi et de setup\n`;
    csv += `ROI Marketing (Vrai);${(globalKPIs.roi_percent || 0).toFixed(1)}%;(CA - Coût) / Coût\n`;
    csv += `Taux d'Ouverture;${(globalKPIs.tracked_batches_count ?? 0) > 0 ? globalKPIs.open_rate.toFixed(1) + "%" : "N/A"};Sur ${globalKPIs.total_sent_tracked} envois trackés avec pixel\n`;
    csv += `Taux de Conversion;${(globalKPIs.tracked_batches_count ?? 0) > 0 ? globalKPIs.conversion_rate.toFixed(1) + "%" : "N/A"};Sur ${globalKPIs.total_sent_tracked} envois trackés avec pixel\n`;
    csv += `Top CA Total (Volume);${getCategoryBadge(globalKPIs.top_category).label};${(globalKPIs.top_category_revenue_val || 0).toFixed(2)} DT\n`;
    csv += `Top Rendement / Client;${getCategoryBadge(globalKPIs.top_category_efficiency || "N/A").label};${(globalKPIs.top_category_efficiency_val || 0).toFixed(2)} DT/client\n`;
    csv += `Total Envois Cumulés;${globalKPIs.total_sent};(dont ${globalKPIs.total_sent_tracked} envois avec tracking actif)\n\n`;

    csv += "FILTRES ACTIFS LORS DE L'EXPORT\n";
    csv += `Filtre Catégorie;${categoryFilter === "all" ? "Toutes catégories" : categoryFilter}\n`;
    csv += `Recherche Sujet;${searchTerm ? `"${searchTerm}"` : "Aucune"}\n`;
    csv += `Lignes exportées;${sortedAndFilteredBatches.length} sur ${batches.length} au total\n\n`;

    csv += "HISTORIQUE DES CAMPAGNES ENVOYÉES (DÉTAIL PAR ENVOI)\n";
    csv += "Date d'Envoi;Sujet de la Campagne;Catégorie / Segment;Destinataires;Ouverts;Convertis;Taux d'Ouverture (%);Taux de Conversion (%);CA Généré (DT);Coût (DT);ROI (%);CA par Client (DT)\n";

    sortedAndFilteredBatches.forEach((b) => {
      const sentDate = b.sent_at
        ? new Date(b.sent_at).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
        : "N/A";

      const badgeLabel = getCategoryBadge(b.category).label;
      const cleanSubject = `"${(b.subject || "").replace(/"/g, '""')}"`;

      csv += `${sentDate};${cleanSubject};${badgeLabel};${b.total_sent};${b.total_opened};${b.total_converted};${b.open_rate.toFixed(1)};${b.conversion_rate.toFixed(1)};${b.revenue_generated.toFixed(2)};${(b.total_cost || 0).toFixed(2)};${(b.roi_percent || 0).toFixed(1)};${b.revenue_per_recipient.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Category badges – neutral style, label only carries meaning (color on bars/values, not on tags)
  const NEUTRAL_BADGE = "bg-slate-100 text-slate-600 border-slate-200";
  const getCategoryBadge = (category: string) => {
    const key = (category || "").toString().toLowerCase().trim();
    switch (key) {
      case "birthday_gift":      return { label: "Anniversaire",           color: NEUTRAL_BADGE };
      case "vip_danger":         return { label: "Rétention VIP",          color: NEUTRAL_BADGE };
      case "ambassador_invite":  return { label: "Ambassadeurs",           color: NEUTRAL_BADGE };
      case "baisse_frequence":   return { label: "Baisse Fréquence",       color: NEUTRAL_BADGE };
      case "absence_anormale":   return { label: "Absence Anormale",       color: NEUTRAL_BADGE };
      case "lost":               return { label: "Reconquête",             color: NEUTRAL_BADGE };
      case "at_risk":            return { label: "À Risque",               color: NEUTRAL_BADGE };
      case "vip":                return { label: "Fidélité VIP",           color: NEUTRAL_BADGE };
      case "regular":            return { label: "Offre Régulière",        color: NEUTRAL_BADGE };
      case "group":              return { label: "Campagne de Groupe",     color: NEUTRAL_BADGE };
      case "low_traffic":        return { label: "Relance Heures Creuses", color: NEUTRAL_BADGE };
      case "referral":           return { label: "Programme Parrainage",   color: NEUTRAL_BADGE };
      case "shop_anniversary":   return { label: "Anniversaire Boutique",  color: NEUTRAL_BADGE };
      default: {
        const formatted = key
          .replace(/[_-]/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());
        return { label: formatted || "Général", color: NEUTRAL_BADGE };
      }
    }
  };

  // Filter Active vs Inactive Categories + build two independent Top-5 lists
  const { activeCategoryStats, inactiveCategoryStats, topByRevenue, topByConversion } = useMemo(() => {
    const active: CategoryStat[] = [];
    const inactive: CategoryStat[] = [];

    categoryStats.forEach((cat) => {
      const hasActivity =
        cat.total_sent > 0 ||
        cat.total_sent_tracked > 0 ||
        cat.revenue_generated > 0 ||
        cat.conversion_rate > 0;
      if (hasActivity) {
        active.push(cat);
      } else {
        inactive.push(cat);
      }
    });

    const topByRevenue = [...active]
      .sort((a, b) => b.revenue_generated - a.revenue_generated)
      .slice(0, 5);

    const topByConversion = [...active]
      .sort((a, b) => b.conversion_rate - a.conversion_rate)
      .slice(0, 5);

    return {
      activeCategoryStats: active,
      inactiveCategoryStats: inactive,
      topByRevenue,
      topByConversion,
    };
  }, [categoryStats]);

  // Sorted + Filtered Categories for compact table
  const sortedCategoriesForTable = useMemo(() => {
    // Start with all categories (active + inactive combined)
    let list = [...activeCategoryStats, ...inactiveCategoryStats];

    // Activity filter
    if (catActivityFilter === "active") {
      list = list.filter(
        (cat) => cat.total_sent > 0 || cat.revenue_generated > 0 || cat.conversion_rate > 0
      );
    } else if (catActivityFilter === "inactive") {
      list = list.filter(
        (cat) => cat.total_sent === 0 && cat.revenue_generated === 0 && cat.conversion_rate === 0
      );
    }

    // Text search on label
    if (catSearchTerm.trim()) {
      const q = catSearchTerm.toLowerCase().trim();
      list = list.filter((cat) =>
        getCategoryBadge(cat.category).label.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = a[catSortCol];
      let valB: any = b[catSortCol];

      if (catSortCol === "category") {
        valA = getCategoryBadge(a.category).label.toLowerCase();
        valB = getCategoryBadge(b.category).label.toLowerCase();
      }

      if (valA < valB) return catSortDir === "asc" ? -1 : 1;
      if (valA > valB) return catSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [activeCategoryStats, inactiveCategoryStats, catActivityFilter, catSearchTerm, catSortCol, catSortDir]);

  const handleCatSort = (col: typeof catSortCol) => {
    if (catSortCol === col) {
      setCatSortDir(catSortDir === "asc" ? "desc" : "asc");
    } else {
      setCatSortCol(col);
      setCatSortDir("desc");
    }
  };

  // Filtered and Sorted batches for table
  const sortedAndFilteredBatches = useMemo(() => {
    const list = batches.filter((b) => {
      if (categoryFilter !== "all" && b.category !== categoryFilter) return false;
      if (
        searchTerm &&
        !b.subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !b.batch_id.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    });

    list.sort((a, b) => {
      let valA: any = a[sortColumn];
      let valB: any = b[sortColumn];

      if (sortColumn === "sent_at") {
        valA = new Date(a.sent_at).getTime();
        valB = new Date(b.sent_at).getTime();
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [batches, categoryFilter, searchTerm, sortColumn, sortDirection]);

  // Paginated batches
  const totalPages = Math.ceil(sortedAndFilteredBatches.length / rowsPerPage) || 1;
  const paginatedBatches = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedAndFilteredBatches.slice(start, start + rowsPerPage);
  }, [sortedAndFilteredBatches, currentPage, rowsPerPage]);


  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Statistiques Avancées des Campagnes"
        subtitle="Mesure en temps réel du chiffre d'affaires généré, du taux d'ouverture et de conversion par campagne"
      >
        {/* Boutique Selector */}
        <select
          value={selectedCommerce}
          onChange={(e) => setSelectedCommerce(e.target.value)}
          className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-sm"
        >
          <option value="__all__">Toutes les boutiques</option>
          {commerces.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>

        {/* Window Selector */}
        <div className="flex items-center bg-[#FAF3EE] p-1 rounded-xl border border-[#EEE5DF]">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setWindowDays(days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${windowDays === days
                ? "bg-white text-[#E8462F] shadow-sm"
                : "text-[#7A6E68] hover:text-[#1A1A1A]"
                }`}
            >
              {days} Jours
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Tabs Navigation (Exact Dashboard Style) */}
      <div className="px-6 md:px-8 mt-4">
        <div className="flex border-b border-[#EEE5DF] gap-6 max-w-7xl mx-auto">
          <button
            onClick={() => setActiveTab("stats")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "stats"
              ? "border-[#E8462F] text-[#E8462F]"
              : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
              }`}
          >
            Indicateurs &amp; Analyses
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "history"
              ? "border-[#E8462F] text-[#E8462F]"
              : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
              }`}
          >
            Historique des Campagnes Envoyées
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-28">
            <Loader2 className="w-10 h-10 text-[#E8462F] animate-spin" />
            <p className="text-xs text-[#7A6E68] font-bold mt-3">Calcul de l'attribution et des statistiques...</p>
          </div>
        ) : activeTab === "stats" ? (
          /* ── Part 1: Indicateurs & Analyses ── */
          <>
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Card 1: CA Total */}
              <div className="bg-white border border-[#EEE5DF] hover:border-[#D5C8C0] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">CA Total Généré</p>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1A1A1A]">
                    {(globalKPIs?.total_revenue || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} <span className="text-sm font-bold text-[#7A6E68]">DT</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">Attribution Last-Touch · {windowDays}j</p>
                </div>
              </div>

              {/* Card 2: Taux d'Ouverture */}
              <div className="bg-white border border-[#EEE5DF] hover:border-[#D5C8C0] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">Taux d'Ouverture</p>
                  <div className="w-9 h-9 rounded-xl bg-[#FDECEA] flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-[#E8462F]" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1A1A1A]">
                    {(globalKPIs?.tracked_batches_count ?? 0) > 0 || (globalKPIs?.total_sent ?? 0) > 0
                      ? `${(globalKPIs?.open_rate || 0).toFixed(1)}%`
                      : <span className="text-xl font-bold text-[#B0A49C]">N/A</span>
                    }
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[11px] text-slate-400 leading-tight truncate">
                      {(globalKPIs?.total_sent_tracked || globalKPIs?.total_sent || 0) > 0
                        ? `${globalKPIs!.total_opened} / ${globalKPIs!.total_sent_tracked || globalKPIs!.total_sent} envois`
                        : "Historique non disponible"}
                    </p>
                    {globalKPIs && globalKPIs.total_sent_tracked > 0 && globalKPIs.total_sent_tracked < 30 && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full shrink-0">Test</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card 3: Taux de Conversion */}
              <div className="bg-white border border-[#EEE5DF] hover:border-[#D5C8C0] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">Taux de Conversion</p>
                  <div className="w-9 h-9 rounded-xl bg-[#FDECEA] flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-[#E8462F]" />
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1A1A1A]">
                    {(globalKPIs?.tracked_batches_count ?? 0) > 0 || (globalKPIs?.total_sent ?? 0) > 0
                      ? `${(globalKPIs?.conversion_rate || 0).toFixed(1)}%`
                      : <span className="text-xl font-bold text-[#B0A49C]">N/A</span>
                    }
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                    {(globalKPIs?.total_sent_tracked || globalKPIs?.total_sent || 0) > 0
                      ? `${globalKPIs?.total_converted || 0} / ${globalKPIs?.total_sent_tracked || globalKPIs?.total_sent || 0} clients`
                      : `${globalKPIs?.total_converted_all || 0} acheteurs`
                    }
                  </p>
                </div>
              </div>

              {/* Card 4: Top Campagnes */}
              <div className="bg-white border border-[#EEE5DF] hover:border-[#D5C8C0] rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between min-h-[110px]">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">Top Campagnes</p>
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase">Top CA Total</p>
                    <p className="text-sm font-black text-[#1A1A1A] truncate">
                      {getCategoryBadge(globalKPIs?.top_category || "N/A").label}
                      {globalKPIs?.top_category_revenue_val ? <span className="font-bold text-[#7A6E68] ml-1 text-xs">· {globalKPIs.top_category_revenue_val.toFixed(2)} DT</span> : ""}
                    </p>
                  </div>
                  {globalKPIs?.top_category_efficiency && (
                    <div className="pt-1.5 border-t border-[#EEE5DF]">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase">Top Rendement/Client</p>
                      <p className="text-xs font-extrabold text-[#1A1A1A] truncate">
                        {getCategoryBadge(globalKPIs.top_category_efficiency).label}
                        {globalKPIs?.top_category_efficiency_val ? <span className="font-bold text-[#7A6E68] ml-1">· {globalKPIs.top_category_efficiency_val.toFixed(2)} DT/cli</span> : ""}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Performance par Type de Campagne */}
            <div className="bg-white border border-[#EEE5DF] rounded-2xl p-6 shadow-xs space-y-5">

              {/* Header – no toggle anymore */}
              <div className="border-b border-[#EEE5DF] pb-4">
                <h3 className="font-extrabold text-[#1A1A1A] text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E8462F]" />
                  Comparaison des Performances par Type de Campagne
                </h3>
                <p className="text-xs text-[#7A6E68] mt-0.5">Top 5 catégories — CA généré et taux de conversion côte à côte</p>
              </div>

              {categoryStats.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs font-bold">
                  Aucune donnée de campagne enregistrée pour cette période.
                </div>
              ) : (
                <div className="space-y-5">

                  {/* ── 2-column Top-5 grid ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Left card – Top 5 CA Généré */}
                    <div className="border border-[#EEE5DF] rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#E8462F] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Top 5 · CA Généré
                        </span>
                        <span className="text-[10px] text-[#7A6E68] font-semibold">DT</span>
                      </div>
                      {topByRevenue.length === 0 ? (
                        <p className="text-xs text-[#7A6E68] font-semibold py-4 text-center">Aucune donnée</p>
                      ) : (
                        topByRevenue.map((cat, idx) => {
                          const badge = getCategoryBadge(cat.category);
                          const maxRev = topByRevenue[0]?.revenue_generated || 1;
                          const pct = (cat.revenue_generated / maxRev) * 100;
                          return (
                            <div key={idx} style={{ marginBottom: "14px" }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border truncate max-w-[60%] ${badge.color}`}>
                                  {badge.label}
                                </span>
                                <span className="text-xs font-black text-[#E8462F] shrink-0 ml-2">
                                  {cat.revenue_generated.toFixed(2)} DT
                                </span>
                              </div>
                              <div className="w-full bg-[#F3ECE6] rounded" style={{ height: "5px" }}>
                                <div
                                  className="h-full rounded transition-all duration-500"
                                  style={{ width: `${Math.max(pct, cat.revenue_generated > 0 ? 5 : 0)}%`, borderRadius: "4px", backgroundColor: "#E8462F", opacity: 0.7 }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Right card – Top 5 Taux de Conversion */}
                    <div className="border border-[#EEE5DF] rounded-xl p-4 space-y-3 bg-white">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#7A6E68] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Top 5 · Conversion
                        </span>
                        <span className="text-[10px] text-[#7A6E68] font-semibold">%</span>
                      </div>
                      {topByConversion.length === 0 ? (
                        <p className="text-xs text-[#7A6E68] font-semibold py-4 text-center">Aucune donnée</p>
                      ) : (
                        topByConversion.map((cat, idx) => {
                          const badge = getCategoryBadge(cat.category);
                          const maxConv = topByConversion[0]?.conversion_rate || 1;
                          const pct = (cat.conversion_rate / maxConv) * 100;
                          return (
                            <div key={idx} style={{ marginBottom: "14px" }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border truncate max-w-[60%] ${badge.color}`}>
                                  {badge.label}
                                </span>
                                <span className="text-xs font-black text-[#4A403A] shrink-0 ml-2">
                                  {cat.conversion_rate}%
                                </span>
                              </div>
                              <div className="w-full bg-[#F3ECE6] rounded" style={{ height: "5px" }}>
                                <div
                                  className="h-full rounded transition-all duration-500"
                                  style={{ width: `${Math.max(pct, cat.conversion_rate > 0 ? 5 : 0)}%`, borderRadius: "4px", backgroundColor: "#B0A49C", opacity: 0.85 }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ── Accordion: Tableau Récapitulatif ── */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">

                    {/* Accordion Header */}
                    <button
                      onClick={() => setIsCatTableExpanded((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#FAF3EE] hover:bg-[#F5EBE3] transition-colors cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                          Tableau récapitulatif par catégorie
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-black text-slate-500 shadow-xs">
                          {activeCategoryStats.length} actives
                          {inactiveCategoryStats.length > 0 && ` • ${inactiveCategoryStats.length} inactives`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-[#E8462F] transition-colors">
                        <span className="text-[10px] font-bold">
                          {isCatTableExpanded ? "Réduire" : "Voir le détail"}
                        </span>
                        {isCatTableExpanded
                          ? <ChevronUp className="w-3.5 h-3.5" />
                          : <ChevronDown className="w-3.5 h-3.5" />
                        }
                      </div>
                    </button>

                    {/* Accordion Body */}
                    {isCatTableExpanded && (
                      <div className="flex flex-col">

                        {/* Filter toolbar */}
                        <div className="flex items-center gap-2 flex-wrap px-3 py-2.5 border-b border-slate-100 bg-slate-50/60">
                          <div className="relative flex-1 min-w-[140px]">
                            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={catSearchTerm}
                              onChange={(e) => setCatSearchTerm(e.target.value)}
                              placeholder="Rechercher une catégorie…"
                              className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-[#1A1A1A] outline-none focus:border-[#E8462F] shadow-xs transition-colors"
                            />
                            {catSearchTerm && (
                              <button
                                onClick={() => setCatSearchTerm("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E8462F] transition-colors cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <select
                            value={catActivityFilter}
                            onChange={(e) => setCatActivityFilter(e.target.value as "all" | "active" | "inactive")}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-[#E8462F] shadow-xs cursor-pointer transition-colors appearance-none pr-7"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
                          >
                            <option value="all">Toutes</option>
                            <option value="active">Avec activité</option>
                            <option value="inactive">Sans activité</option>
                          </select>
                          <span className="text-[11px] font-bold text-slate-400 shrink-0">
                            {sortedCategoriesForTable.length} résultat{sortedCategoriesForTable.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {/* Table */}
                        <div className="max-h-[320px] overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-[#FAF3EE] sticky top-0 z-10 border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider select-none">
                              <tr>
                                <th onClick={() => handleCatSort("category")} className="px-4 py-3 cursor-pointer hover:bg-slate-200/50 transition-colors">
                                  <div className="flex items-center gap-1">
                                    <span>Catégorie</span>
                                    {catSortCol === "category" ? (catSortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#E8462F]" /> : <ChevronDown className="w-3 h-3 text-[#E8462F]" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                                  </div>
                                </th>
                                <th onClick={() => handleCatSort("total_sent")} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-200/50 transition-colors">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>Destinataires</span>
                                    {catSortCol === "total_sent" ? (catSortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#E8462F]" /> : <ChevronDown className="w-3 h-3 text-[#E8462F]" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                                  </div>
                                </th>
                                <th onClick={() => handleCatSort("total_sent_tracked")} className="px-4 py-3 text-center cursor-pointer hover:bg-slate-200/50 transition-colors">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>Trackés</span>
                                    {catSortCol === "total_sent_tracked" ? (catSortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#E8462F]" /> : <ChevronDown className="w-3 h-3 text-[#E8462F]" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                                  </div>
                                </th>
                                <th onClick={() => handleCatSort("revenue_generated")} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200/50 transition-colors">
                                  <div className="flex items-center justify-end gap-1">
                                    <span>CA Généré</span>
                                    {catSortCol === "revenue_generated" ? (catSortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#E8462F]" /> : <ChevronDown className="w-3 h-3 text-[#E8462F]" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                                  </div>
                                </th>
                                <th onClick={() => handleCatSort("conversion_rate")} className="px-4 py-3 text-right cursor-pointer hover:bg-slate-200/50 transition-colors">
                                  <div className="flex items-center justify-end gap-1">
                                    <span>Taux de Conversion</span>
                                    {catSortCol === "conversion_rate" ? (catSortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#E8462F]" /> : <ChevronDown className="w-3 h-3 text-[#E8462F]" />) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                                  </div>
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-semibold text-[#1A1A1A]">
                              {sortedCategoriesForTable.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-400 font-bold">
                                    Aucune catégorie ne correspond aux filtres sélectionnés.
                                  </td>
                                </tr>
                              ) : (
                                sortedCategoriesForTable.map((cat, idx) => {
                                  const badge = getCategoryBadge(cat.category);
                                  const isActive = cat.total_sent > 0 || cat.revenue_generated > 0 || cat.conversion_rate > 0;
                                  return (
                                    <tr key={idx} className={`transition-colors ${isActive ? "hover:bg-slate-50/80" : "opacity-55 bg-slate-50/30 text-slate-400"}`}>
                                      <td className="px-4 py-2.5 whitespace-nowrap">
                                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}>{badge.label}</span>
                                      </td>
                                      <td className="px-4 py-2.5 text-center font-bold">{cat.total_sent}</td>
                                      <td className="px-4 py-2.5 text-center text-slate-500 font-medium">{cat.total_sent_tracked}</td>
                                      <td className="px-4 py-2.5 text-right">
                                        <span className={cat.revenue_generated > 0 ? "font-black text-emerald-600" : "text-slate-400 font-normal"}>
                                          {cat.revenue_generated.toFixed(2)} DT
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-right">
                                        <span className={cat.conversion_rate > 0 ? "font-black text-[#E8462F]" : "text-slate-400 font-normal"}>
                                          {cat.conversion_rate}%
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* ── Part 2: Historique des Campagnes Envoyées ── */
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Historique des Campagnes Envoyées</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Consultez, triez et filtrait chaque envoi collectif ou automatique</p>
                </div>

                {/* Table search & category filter */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher sujet..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 pr-3 py-1.5 bg-white border border-[#EEE5DF] rounded-xl text-xs outline-none focus:border-[#E8462F] w-44 font-semibold text-[#1A1A1A] shadow-sm"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-[#EEE5DF] px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F] cursor-pointer shadow-sm"
                  >
                    <option value="all">Toutes catégories</option>
                    <option value="birthday_gift">Anniversaire</option>
                    <option value="vip_danger">Rétention VIP</option>
                    <option value="ambassador_invite">Ambassadeurs</option>
                    <option value="baisse_frequence">Baisse Fréquence</option>
                    <option value="lost">Reconquête</option>
                    <option value="at_risk">À Risque</option>
                    <option value="vip">Fidélité VIP</option>
                    <option value="regular">Offre Régulière</option>
                  </select>

                  <button
                    onClick={exportToCSV}
                    disabled={loading || !globalKPIs || sortedAndFilteredBatches.length === 0}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Exporter ce tableau filtré au format CSV"
                  >
                    <Download className="w-3.5 h-3.5 text-[#7A6E68]" />
                    Exporter
                  </button>
                  <button
                    onClick={() => {
                      const url = `/api/export/accounting?commerce_id=${encodeURIComponent(selectedCommerce)}`;
                      window.location.href = url;
                    }}
                    className="bg-[#E8462F] hover:bg-[#C93A25] text-white border border-[#C93A25] px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                    title="Générer le Grand Livre comptable des ventes (format CSV, mois en cours par défaut)"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-100" />
                    Export Comptable
                  </button>
                </div>
              </div>

              {sortedAndFilteredBatches.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold">
                  Aucun envoi de campagne ne correspond aux filtres.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-[#FAF3EE] border-b border-slate-200 font-extrabold text-slate-500 uppercase tracking-wider select-none">
                        <tr>
                          <th
                            onClick={() => handleSort("sent_at")}
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>Date d'Envoi</span>
                              {sortColumn === "sent_at" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("subject")}
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>Sujet de la Campagne</span>
                              {sortColumn === "subject" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("category")}
                            className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center gap-1">
                              <span>Catégorie</span>
                              {sortColumn === "category" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("total_sent")}
                            className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Destinataires</span>
                              {sortColumn === "total_sent" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("open_rate")}
                            className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Ouverture</span>
                              {sortColumn === "open_rate" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("conversion_rate")}
                            className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Conversion</span>
                              {sortColumn === "conversion_rate" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("revenue_generated")}
                            className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>CA Généré</span>
                              {sortColumn === "revenue_generated" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("total_cost")}
                            className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>Coût</span>
                              {sortColumn === "total_cost" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("roi_percent")}
                            className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>ROI</span>
                              {sortColumn === "roi_percent" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                          <th
                            onClick={() => handleSort("revenue_per_recipient")}
                            className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span>CA / Client</span>
                              {sortColumn === "revenue_per_recipient" ? (
                                sortDirection === "asc" ? <ChevronUp className="w-3.5 h-3.5 text-[#E8462F]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#E8462F]" />
                              ) : <ArrowUpDown className="w-3 h-3 text-slate-300" />}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-[#1A1A1A]">
                        {paginatedBatches.map((b) => {
                          const badge = getCategoryBadge(b.category);
                          const hasResults = b.revenue_generated > 0 || b.conversion_rate > 0;
                          const dateFormatted = b.sent_at
                            ? new Date(b.sent_at).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })
                            : "N/A";

                          return (
                            <tr
                              key={b.batch_id}
                              className={`transition-colors ${hasResults
                                ? "bg-emerald-50/30 border-l-4 border-l-emerald-500 hover:bg-emerald-50/60 font-bold"
                                : "hover:bg-[#FAF3EE]/80 text-[#7A6E68]"
                                }`}
                            >
                              <td className="px-6 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                                {dateFormatted}
                              </td>
                              <td className="px-6 py-3.5 max-w-xs truncate text-[#1A1A1A]" title={b.subject}>
                                {b.subject}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${badge.color}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-center font-bold text-[#1A1A1A]">
                                {b.total_sent}
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={b.open_rate > 0 ? "font-bold text-[#1A1A1A]" : "text-[#B0A49C]"}>
                                  {b.open_rate}%
                                </span>
                                <span className="text-[10px] text-slate-400 block font-normal">({b.total_opened} ouverts)</span>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <span className={`font-black ${b.conversion_rate > 0 ? "text-emerald-600 text-sm" : "text-[#B0A49C]"}`}>
                                  {b.conversion_rate}%
                                </span>
                                <span className="text-[10px] text-slate-400 block font-normal">({b.total_converted} ach.)</span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <span className={b.revenue_generated > 0 ? "font-black text-emerald-600 text-sm" : "text-slate-400 font-normal"}>
                                  {b.revenue_generated.toFixed(2)} DT
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right font-bold text-[#7A6E68]">
                                {(b.total_cost || 0) > 0 ? `${(b.total_cost || 0).toFixed(2)} DT` : "-"}
                              </td>
                              <td className="px-6 py-3.5 text-right font-bold">
                                <span className={b.roi_percent > 0 ? "text-emerald-600" : (b.roi_percent < 0 ? "text-red-500" : "text-[#7A6E68]")}>
                                  {(b.roi_percent || 0).toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right font-bold text-[#7A6E68]">
                                {b.revenue_per_recipient > 0 ? `${b.revenue_per_recipient.toFixed(2)} DT` : "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-[#7A6E68]">
                    <div className="flex items-center gap-2">
                      <span>
                        Affichage de <strong>{((currentPage - 1) * rowsPerPage) + 1}</strong> à <strong>{Math.min(currentPage * rowsPerPage, sortedAndFilteredBatches.length)}</strong> sur <strong>{sortedAndFilteredBatches.length}</strong> envois
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 disabled:opacity-40 hover:bg-[#FAF3EE] transition-all flex items-center gap-1 font-bold shadow-sm"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Précédent
                      </button>

                      <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-black text-[#1A1A1A]">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 disabled:opacity-40 hover:bg-[#FAF3EE] transition-all flex items-center gap-1 font-bold shadow-sm"
                      >
                        Suivant
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
