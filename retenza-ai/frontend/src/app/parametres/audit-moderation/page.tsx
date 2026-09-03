"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  Filter,
  AlertTriangle,
  Ban,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Inbox,
  ArrowUpCircle,
  MessageSquare,
  HeadphonesIcon,
  Headset,
  HeartHandshake,
  UserX,
  Activity,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Smile,
  Store,
  Eye,
  Mail,
  X,
  Bot,
  Building2,
  Unlock,
  Send
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ─── Interfaces ─────────────────────────────────────────────────────────────────
interface AuditEntry {
  _id: string;
  timestamp: string;
  type: "WARNING" | "BLOCK" | "SUPPORT_ESCALATION" | "RATE_LIMIT" | string;
  email: string;
  commerce_id: string;
  commerce_name?: string;
  details: string;
}

interface SupportTicket {
  _id: string;
  created_at: string;
  last_message_at?: string;
  email: string;
  commerce_id: string;
  commerce_name?: string;
  session_id: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  reason: string;
  summary: string;
  messages_count: number;
  unread_by_admin?: boolean;
  unread_count?: number;
}

interface MessageFeedback {
  _id: string;
  timestamp: string;
  email: string;
  commerce_id: string;
  commerce_name?: string;
  session_id: string;
  message_idx: number;
  feedback: "like" | "dislike";
  text: string;
}

interface BlockedClient {
  _id: string;
  email: string;
  commerce_id: string;
  commerce_name?: string;
  warnings: number;
  is_blocked: boolean;
  blocked_at?: string;
  block_reason?: string;
}

interface FeedbackMetrics {
  total: number;
  likes: number;
  dislikes: number;
  satisfaction_rate: number;
}

interface TimeSeriesItem {
  date: string;
  likes: number;
  dislikes: number;
  total: number;
}

type TabKey = "overview" | "satisfaction" | "audit" | "tickets" | "blocked";

const API = "/api";

// ─── Helper : supprime le Markdown brut pour un affichage texte propre ────────────
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')   // **gras** → gras
    .replace(/\*(.+?)\*/g, '$1')       // *italique* → italique
    .replace(/__(.+?)__/g, '$1')       // __gras__ → gras
    .replace(/_(.+?)_/g, '$1')         // _italique_ → italique
    .replace(/^#{1,6}\s+/gm, '')       // # Titre → Titre
    .replace(/`(.+?)`/g, '$1');        // `code` → code
}

// ─── Helper de formattage de date & boutique ─────────────────────────────────────
function formatDate(ts?: string) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShopDisplayName(cid: string, rawName?: string): string {
  if (rawName && rawName !== "unknown" && !rawName.startsWith("commerce_")) {
    return rawName;
  }
  if (!cid || cid === "__all__") return "Toutes les boutiques";
  if (cid === "commerce_local" || cid === "commerce_local_1") return "Boutique Tunis";
  const clean = cid.replace(/^commerce_/, "Boutique ").replace(/_/g, " ");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// ─── Health Metrics Header Component (Style Blanc Épuré Dashboard) ────────────────
function ChatbotHealthMetricsHeader({ selectedCommerce, period }: { selectedCommerce: string; period: string }) {
  const [metrics, setMetrics] = useState<any>(null);

  const fetchMetrics = useCallback(() => {
    const params = new URLSearchParams();
    if (selectedCommerce !== "__all__") params.set("commerce_id", selectedCommerce);
    if (period && period !== "all") params.set("period", period);
    const qs = params.toString();
    const url = `${API}/chatbot/metrics${qs ? `?${qs}` : ""}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.metrics) {
          setMetrics(data.metrics);
        }
      })
      .catch(() => { });
  }, [selectedCommerce, period]);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  if (!metrics) return null;

  const kpiCards = [
    {
      label: "CONVERSATIONS",
      value: metrics.total_conversations || 0,
      sub: "Sessions chatbot",
      icon: MessageSquare,
      iconBg: "bg-blue-50",
      iconColor: "text-[#2563EB]",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
    {
      label: "TICKETS OUVERTS",
      value: metrics.open_tickets || 0,
      sub: "En attente de traitement",
      icon: Headset,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
    {
      label: "CLIENTS BLOQUÉS",
      value: metrics.total_blocked || 0,
      sub: "Bloqués par le système IA",
      icon: UserX,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
    {
      label: "ESCALADES TOTALES",
      value: metrics.total_tickets || 0,
      sub: "Transferts vers support",
      icon: ArrowUpCircle,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
    {
      label: "SATISFACTION CLIENT",
      value: metrics.total_feedbacks || 0,
      sub: "Avis reçus (utiles + insatisfaisants)",
      icon: HeartHandshake,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
    {
      label: "ÉVÉNEMENTS AUDIT",
      value: metrics.total_audit_logs || 0,
      sub: "Logs de modération IA",
      icon: ShieldCheck,
      iconBg: "bg-[#FDECEA]",
      iconColor: "text-[#E8462F]",
      valueColor: "text-[#1A1A1A]",
      border: "border-[#EEE5DF]",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Titre section */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-[#E8462F]" />
        <h3 className="font-extrabold text-sm text-[#1A1A1A]">Monitoring IA &amp; Santé du Chatbot</h3>
      </div>

      {/* 6 KPI cards — grille 4 colonnes max (4+2) comme la page RFM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor, border }) => (
          <div key={label} className={`bg-white rounded-2xl p-5 border ${border} shadow-xs flex flex-col justify-between min-h-[110px]`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider leading-tight">{label}</p>
              <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
            </div>
            <div>
              <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
              <p className="text-[11px] text-slate-400 mt-1 leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VUE D'ENSEMBLE TAB ────────────────────────────────────────────────────────────────────────
function VueEnsembleTab({
  selectedCommerce,
  period,
}: {
  selectedCommerce: string;
  period: string;
}) {
  // Donut : Répartition des types d'audit
  const [auditTypeCounts, setAuditTypeCounts] = useState<Record<string, number>>({});
  // Bar : Évolution des avis
  const [feedbackSeries, setFeedbackSeries] = useState<{ date: string; likes: number; dislikes: number }[]>([]);

  useEffect(() => {
    // Fetch audit logs et agrège par type
    const auditParams = new URLSearchParams({ limit: "500" });
    if (selectedCommerce !== "__all__") auditParams.set("commerce_id", selectedCommerce);
    if (period && period !== "all") auditParams.set("period", period);
    fetch(`${API}/chatbot/audit-logs?${auditParams}`)
      .then((r) => r.json())
      .then((res) => {
        const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res?.logs) ? res.logs : [];
        if (rawList.length > 0) {
          const counts: Record<string, number> = {};
          rawList.forEach((e: any) => {
            let t = e.type || e.action || e.category || "MESSAGE_FEEDBACK";
            if (typeof t === "string") {
              if (t.startsWith("auth")) t = "AUTH";
              else if (t.startsWith("super_admin")) t = "ADMIN";
              else if (t.startsWith("commerce")) t = "COMMERCE";
            } else {
              t = "AUTRE";
            }
            counts[t] = (counts[t] || 0) + 1;
          });
          setAuditTypeCounts(counts);
        } else {
          setAuditTypeCounts({});
        }
      })
      .catch(() => { });

    // Fetch série temporelle de satisfaction
    const fbParams = new URLSearchParams({ limit: "100" });
    if (selectedCommerce !== "__all__") fbParams.set("commerce_id", selectedCommerce);
    if (period && period !== "all") fbParams.set("period", period);
    fetch(`${API}/chatbot/message-feedbacks?${fbParams}`)
      .then((r) => r.json())
      .then((res) => {
        if (Array.isArray(res?.time_series)) {
          setFeedbackSeries(res.time_series);
        }
      })
      .catch(() => { });
  }, [selectedCommerce, period]);

  // Générer une timeline complète de dates (ex: 7 à 14 jours) pour un graphique d'évolution riche
  const daysToShow = period === "7d" ? 7 : period === "90d" ? 14 : 7;
  const timeMap = new Map<string, { likes: number; dislikes: number }>();
  feedbackSeries.forEach((s) => timeMap.set(s.date, { likes: s.likes, dislikes: s.dislikes }));

  const now = new Date();
  const timelineData: { date: string; likes: number; dislikes: number }[] = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().substring(0, 10);
    const existing = timeMap.get(dateStr) || { likes: 0, dislikes: 0 };
    timelineData.push({ date: dateStr, ...existing });
  }

  // Config Donut (Palette distinctive, élégante & harmonieuse)
  const TYPE_LABELS: Record<string, string> = {
    MESSAGE_FEEDBACK: "Avis Clients",
    ADMIN: "Actions Administration",
    AUTH: "Connexions / Auth",
    SUPPORT_ESCALATION: "Escalades Support",
    COMMERCE: "Gestion Boutique",
    WARNING: "Avertissements IA",
    BLOCK: "Blocages Clients",
    RATE_LIMIT: "Rate Limit (Spam)",
    AUTRE: "Autres Événements",
  };
  const TYPE_COLORS: Record<string, string> = {
    MESSAGE_FEEDBACK: "#10B981",     // Vert (même vert que "VIP" / "Faible" sur RFM)
    ADMIN: "#3f6bb1e5",                // Bleu (même bleu que "Régulier" sur RFM)
    AUTH: "#d41b1bea",                 // Violet (distinct, pas de doublon avec bleu)
    SUPPORT_ESCALATION: "#F59E0B",   // Orange/Ambre (même que "À risque" / "Moyen" sur RFM)
    COMMERCE: "#96601aea",             // Rose (nouvelle teinte distincte)
    WARNING: "#F97316",              // Orange vif (distinct de l'ambre COMMERCE)
    BLOCK: "#E8462F",                // Rouge Retenza (même que "Perdu" / couleur de marque)
    RATE_LIMIT: "#7C2D12",           // Brun/rouge foncé (même famille que "Critique" sur RFM)
    AUTRE: "#94A3B8",                // Gris slate (neutre, inchangé)
  };
  const auditKeys = Object.keys(auditTypeCounts);
  const donutData = {
    labels: auditKeys.map((k) => TYPE_LABELS[k] || k),
    datasets: [
      {
        data: auditKeys.map((k) => auditTypeCounts[k]),
        backgroundColor: auditKeys.map((k) => TYPE_COLORS[k] || "#94A3B8"),
        borderWidth: 2,
        borderColor: "#FAF3EE",
      },
    ],
  };
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "65%",
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { font: { size: 11, family: "Inter, sans-serif" }, padding: 12 },
      },
      tooltip: { backgroundColor: "#0F172A", padding: 10, cornerRadius: 8 },
    },
  };

  // Config Bar Timeline
  const barData = {
    labels: timelineData.map((s) => s.date.substring(5)), // MM-DD
    datasets: [
      {
        label: "Avis Utiles",
        data: timelineData.map((s) => s.likes),
        backgroundColor: "rgba(16, 185, 129, 0.85)", // Vert Émeraude (#10B981)
        borderRadius: 6,
      },
      {
        label: "Insatisfaisants",
        data: timelineData.map((s) => s.dislikes),
        backgroundColor: "rgba(232, 70, 47, 0.85)", // Rouge Retenza (#E8462F)
        borderRadius: 6,
      },
    ],
  };
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const, labels: { font: { size: 11, family: "Inter, sans-serif" } } },
      tooltip: { backgroundColor: "#0F172A", padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { ticks: { stepSize: 1, precision: 0 }, grid: { color: "#F1F5F9" } },
    },
  };

  return (
    <div className="space-y-6">
      {/* 6 KPI Cards sur 4 colonnes max (4 sur ligne 1, 2 sur ligne 2) */}
      <ChatbotHealthMetricsHeader selectedCommerce={selectedCommerce} period={period} />

      {/* Visuels complémentaires sous le bloc Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut : Répartition des événements d'audit */}
        <div className="bg-white rounded-2xl p-6 border border-[#EEE5DF] shadow-xs">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-[#E8462F]" />
            <h3 className="font-extrabold text-sm text-[#1A1A1A]">Répartition des Événements d'Audit</h3>
          </div>
          {auditKeys.length > 0 ? (
            <div className="h-64">
              <Doughnut data={donutData} options={donutOptions as any} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-xs text-slate-400">Aucun événement d'audit répertorié</p>
            </div>
          )}
        </div>

        {/* Bar : Évolution de la satisfaction */}
        <div className="bg-white rounded-2xl p-6 border border-[#EEE5DF] shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E8462F]" />
              <h3 className="font-extrabold text-sm text-[#1A1A1A]">Évolution de la Satisfaction</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Utiles vs Insatisfaisants</span>
          </div>
          <div className="h-64">
            <Bar data={barData} options={barOptions as any} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State Helper ─────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3">
        <Inbox className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-[#1A1A1A] font-bold text-sm">Aucune donnée trouvée</p>
      <p className="text-slate-400 text-xs mt-1">{message}</p>
    </div>
  );
}

// ─── ONGLET 1 : SATISFACTION (👍 / 👎) ──────────────────────────────────────────
function SatisfactionTab({
  selectedCommerce,
  period,
}: {
  selectedCommerce: string;
  period: string;
}) {
  const [metrics, setMetrics] = useState<FeedbackMetrics>({
    total: 0,
    likes: 0,
    dislikes: 0,
    satisfaction_rate: 100,
  });
  const [timeSeries, setTimeSeries] = useState<TimeSeriesItem[]>([]);
  const [feedbacks, setFeedbacks] = useState<MessageFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<"ALL" | "like" | "dislike">("ALL");
  const [selectedMessage, setSelectedMessage] = useState<MessageFeedback | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCommerce !== "__all__") params.append("commerce_id", selectedCommerce);
      if (period !== "all") params.append("period", period);
      params.append("limit", "100");

      const res = await fetch(`${API}/chatbot/message-feedbacks?${params.toString()}`);
      const data = await res.json();

      if (data.status === "success") {
        setMetrics(data.metrics || { total: 0, likes: 0, dislikes: 0, satisfaction_rate: 100 });
        setTimeSeries(data.time_series || []);
        setFeedbacks(data.data || []);
      }
    } catch (e) {
      // Fallback local vide
    } finally {
      setLoading(false);
    }
  }, [selectedCommerce, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrage local pour la recherche
  const filteredFeedbacks = feedbacks.filter((fb) => {
    const matchesSearch =
      !searchQuery ||
      fb.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (fb.commerce_name && fb.commerce_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = feedbackFilter === "ALL" || fb.feedback === feedbackFilter;
    return matchesSearch && matchesFilter;
  });

  // ChartJS configuration
  const chartData = {
    labels: timeSeries.length > 0 ? timeSeries.map((ts) => ts.date) : ["Aujourd'hui"],
    datasets: [
      {
        label: "Avis Utiles",
        data: timeSeries.length > 0 ? timeSeries.map((ts) => ts.likes) : [metrics.likes],
        backgroundColor: "rgba(5, 150, 105, 0.85)", // Vert Émeraude RFM
        borderRadius: 8,
      },
      {
        label: "Avis Insatisfaisants",
        data: timeSeries.length > 0 ? timeSeries.map((ts) => ts.dislikes) : [metrics.dislikes],
        backgroundColor: "rgba(232, 70, 47, 0.85)", // Rouge Retenza RFM
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { font: { family: "Inter, sans-serif", size: 12, weight: "bold" as any } },
      },
      tooltip: {
        backgroundColor: "#0F172A",
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: { grid: { display: false } },
      y: { ticks: { stepSize: 1 }, grid: { color: "#F1F5F9" } },
    },
  };

  const likesPercent = metrics.total > 0 ? ((metrics.likes / metrics.total) * 100).toFixed(1) : "100";
  const dislikesPercent = metrics.total > 0 ? ((metrics.dislikes / metrics.total) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* 4 KPI Cards — Harmonisées avec la plateforme + barre de progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Feedbacks */}
        <div className="bg-white rounded-2xl p-5 border border-[#EEE5DF] shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Avis Reçus</p>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{metrics.total}</p>
            <p className="text-[11px] text-slate-400 mt-1">Évaluations enregistrées</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EEE5DF] shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avis Utiles</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{metrics.likes}</p>
            <p className="text-[11px] text-slate-400 mt-1">Réponses satisfaisantes</p>
          </div>
        </div>

        {/* Avis Insatisfaisants */}
        <div className="bg-white rounded-2xl p-5 border border-[#EEE5DF] shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Avis Insatisfaisants</p>
            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{metrics.dislikes}</p>
            <p className="text-[11px] text-slate-400 mt-1">Réponses insatisfaisantes</p>
          </div>
        </div>

        {/* Satisfaction Globale */}
        <div className="bg-white rounded-2xl p-5 border border-[#EEE5DF] shadow-xs flex flex-col justify-between min-h-[110px]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Satisfaction Globale</p>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Smile className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-[#1A1A1A]">{metrics.satisfaction_rate}%</p>
            <p className="text-[11px] text-slate-400 mt-1">Score moyen de satisfaction</p>
          </div>
        </div>
      </div>



      {/* TABLEAU DÉTAILLÉ DES FEEDBACKS REÇUS */}
      <div className="bg-white rounded-2xl border border-[#EEE5DF] shadow-sm overflow-hidden">
        {/* En-tête barre de filtre */}
        <div className="px-5 py-3.5 border-b border-[#EEE5DF] flex flex-wrap items-center justify-between gap-3">
          {/* Titre section */}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#E8462F]" />
            <span className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Détail des Avis</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredFeedbacks.length}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Client, message, boutique..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] outline-none focus:border-[#E8462F] focus:bg-white transition-all w-52"
              />
            </div>

            {/* Filtres type avis */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl gap-0.5">
              <button
                onClick={() => setFeedbackFilter("ALL")}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${feedbackFilter === "ALL" ? "bg-white text-[#E8462F] shadow-sm" : "text-slate-500 hover:text-[#1A1A1A]"
                  }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFeedbackFilter("like")}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${feedbackFilter === "like" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-emerald-600"
                  }`}
              >
                <CheckCircle2 className="w-3 h-3" /> Utiles
              </button>
              <button
                onClick={() => setFeedbackFilter("dislike")}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${feedbackFilter === "dislike" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-rose-500"
                  }`}
              >
                <ThumbsDown className="w-3 h-3" /> Insatisfaisants
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[#2563EB] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Chargement des avis réels...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <EmptyState message="Aucun avis enregistré pour les critères sélectionnés." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#EEE5DF] bg-[#FAF3EE] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="px-5 py-3.5 text-left whitespace-nowrap">Date &amp; Heure</th>
                  <th className="px-5 py-3.5 text-left">Client</th>
                  <th className="px-5 py-3.5 text-left">Boutique</th>
                  <th className="px-5 py-3.5 text-left">Message Évalué</th>
                  <th className="px-5 py-3.5 text-center whitespace-nowrap">Type Avis</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE5DF]/50">
                {filteredFeedbacks.map((fb) => (
                  <tr key={fb._id} className="hover:bg-[#FAF3EE]/40 transition-colors group">
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="font-medium">{formatDate(fb.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[160px]">{fb.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A1A1A] bg-[#FAF3EE] px-2.5 py-1 rounded-lg border border-[#EEE5DF]">
                        <Store className="w-3 h-3 text-[#E8462F]" />
                        {getShopDisplayName(fb.commerce_id, fb.commerce_name)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs truncate font-medium">
                      {fb.text || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {fb.feedback === "like" ? (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-32">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Utile
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 w-32">
                          <XCircle className="w-3.5 h-3.5 shrink-0" /> Insatisfaisant
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedMessage(fb)}
                        className="p-1.5 rounded-lg bg-[#FAF3EE] border border-[#EEE5DF] hover:border-[#E8462F] hover:text-[#E8462F] text-slate-400 transition-all cursor-pointer"
                        title="Consulter le message complet"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CONSULTATION DU MESSAGE COMPLET */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedMessage.feedback === "like"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                    }`}
                >
                  {selectedMessage.feedback === "like" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Détail du Feedback</h4>
                  <p className="text-xs text-slate-400">{formatDate(selectedMessage.timestamp)}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="text-xs space-y-1">
                <p className="text-slate-400 font-medium">Boutique :</p>
                <p className="font-semibold text-slate-800">
                  {getShopDisplayName(selectedMessage.commerce_id, selectedMessage.commerce_name)}
                </p>
              </div>

              <div className="text-xs space-y-1">
                <p className="text-slate-400 font-medium">Client :</p>
                <p className="font-semibold text-slate-800">{selectedMessage.email}</p>
              </div>

              <div className="text-xs space-y-1 pt-2">
                <p className="text-slate-400 font-medium">Contenu du message généré :</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {stripMarkdown(selectedMessage.text || '')}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-[#2563EB] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ONGLET 2 : JOURNAL D'AUDIT & MODÉRATION ────────────────────────────────────
function AuditTab({ selectedCommerce }: { selectedCommerce: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API}/chatbot/audit-logs?limit=100${selectedCommerce !== "__all__" ? `&commerce_id=${selectedCommerce}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      setEntries(d.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCommerce]);

  useEffect(() => {
    load();
  }, [load]);

  // Types d'audit strictement surveillés — on n'affiche jamais les échanges normaux
  const AUDIT_TYPES = ["WARNING", "BLOCK", "RATE_LIMIT"];

  const filtered = entries.filter((e) => {
    // Pré-filtre : uniquement les événements d'audit réels (pas les échanges normaux)
    const isAuditEvent = AUDIT_TYPES.includes(e.type);
    const matchesSearch =
      !search ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.details?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "ALL" || e.type === filter;
    return isAuditEvent && matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Tableau Journal d'Audit */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">

        {/* En-tête : titre + recherche + filtres */}
        <div className="px-5 py-3.5 border-b border-[#EEE5DF] flex flex-wrap items-center justify-between gap-3">
          {/* Titre */}
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#E8462F]" />
            <span className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Événements de Modération</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Email, détail d'infraction..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] outline-none focus:border-[#E8462F] focus:bg-white transition-all w-52"
              />
            </div>

            {/* Filtres en segmented control */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl gap-0.5">
              {[
                { id: "ALL", label: "Tous" },
                { id: "WARNING", label: "Avertissements" },
                { id: "BLOCK", label: "Blocages" },
                { id: "RATE_LIMIT", label: "Rate Limit" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === f.id
                    ? "bg-white text-[#E8462F] shadow-sm"
                    : "text-slate-500 hover:text-[#1A1A1A]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>


          </div>
        </div>

        {/* Contenu du tableau */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[#E8462F] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Chargement du journal d'audit...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun événement de modération enregistré pour ces critères." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#EEE5DF] bg-[#FAF3EE] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="text-left px-5 py-3.5 whitespace-nowrap">Date &amp; Heure</th>
                  <th className="text-left px-5 py-3.5">Type d'Événement</th>
                  <th className="text-left px-5 py-3.5">Client</th>
                  <th className="text-left px-5 py-3.5">Boutique</th>
                  <th className="text-left px-5 py-3.5">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE5DF]/50">
                {filtered.map((e) => (
                  <tr key={e._id} className="hover:bg-[#FAF3EE]/40 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="font-medium">{formatDate(e.timestamp)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${e.type === "BLOCK"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : e.type === "WARNING"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-violet-50 text-violet-700 border-violet-200"
                          }`}
                      >
                        {e.type === "BLOCK" ? (
                          <Ban className="w-3 h-3" />
                        ) : e.type === "WARNING" ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {e.type === "BLOCK" ? "Blocage" : e.type === "WARNING" ? "Avertissement" : "Rate Limit"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[160px]">{e.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1A1A1A] bg-[#FAF3EE] px-2.5 py-1 rounded-lg border border-[#EEE5DF]">
                        <Store className="w-3 h-3 text-[#E8462F]" />
                        {getShopDisplayName(e.commerce_id, e.commerce_name)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-sm">
                      <span className="line-clamp-2 font-medium">{e.details}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ONGLET 3 : TICKETS D'ESCALADE HUMAINE ──────────────────────────────────────
function TicketsTab({ selectedCommerce, initialTicketId }: { selectedCommerce: string; initialTicketId?: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [loadingConv, setLoadingConv] = useState<boolean>(false);
  const [adminReplyText, setAdminReplyText] = useState<string>("");
  const [sendingReply, setSendingReply] = useState<boolean>(false);
  const [newMsgToast, setNewMsgToast] = useState<string | null>(null);
  const prevUnreadIdsRef = useRef<Set<string>>(new Set());
  const adminConvEndRef = useRef<HTMLDivElement>(null);
  const adminBotSectionRef = useRef<HTMLDivElement>(null);
  const adminSupportSectionRef = useRef<HTMLDivElement>(null);
  const adminModalTopRef = useRef<HTMLDivElement>(null);
  const [adminSectionFilter, setAdminSectionFilter] = useState<"all" | "bot" | "support">("all");

  // Auto-scroll vers le bas (section Support) quand les messages sont chargés
  useEffect(() => {
    if (convMessages.length === 0) return;
    // Priorité 1 : si la section support existe, scroll jusqu'à son bas
    const supportSection = adminSupportSectionRef.current;
    if (supportSection) {
      const scrollableArea = supportSection.querySelector<HTMLDivElement>('.overflow-y-auto');
      if (scrollableArea) {
        scrollableArea.scrollTop = scrollableArea.scrollHeight;
        return;
      }
    }
    // Priorité 2 : scroll jusqu'à la fin globale de la conv
    adminConvEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages, selectedTicket]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const url = `${API}/chatbot/support-tickets?limit=50${selectedCommerce !== "__all__" ? `&commerce_id=${selectedCommerce}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      const newTickets: SupportTicket[] = d.data || [];
      setTickets(newTickets);

      // Détecter les nouveaux tickets non lus (pas déjà connus)
      const newUnreadIds = new Set(
        newTickets
          .filter((t) => t.unread_by_admin && t.status !== "CLOSED")
          .map((t) => t._id)
      );
      const prevIds = prevUnreadIdsRef.current;
      const brandNew = [...newUnreadIds].filter((id) => !prevIds.has(id));
      if (brandNew.length > 0) {
        const ticket = newTickets.find((t) => t._id === brandNew[0]);
        if (ticket) {
          setNewMsgToast(`💬 Nouveau message de ${ticket.email}`);
          setTimeout(() => setNewMsgToast(null), 5000);
        }
      }
      prevUnreadIdsRef.current = newUnreadIds;
    } catch {
      setTickets([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [selectedCommerce]);

  // Auto-ouvrir le modal si initialTicketId est fourni (depuis la notif Topbar)
  const autoOpenDoneRef = useRef(false);
  useEffect(() => {
    if (!initialTicketId || autoOpenDoneRef.current || tickets.length === 0) return;
    const target = tickets.find((t) => t._id === initialTicketId);
    if (target) {
      autoOpenDoneRef.current = true;
      openConvModal(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, initialTicketId]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), 10000);
    return () => clearInterval(interval);
  }, [load]);

  const openConvModal = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setLoadingConv(true);
    setAdminReplyText("");

    // Marquer le ticket comme lu côté admin
    if (ticket.unread_by_admin) {
      try {
        await fetch(`${API}/chatbot/support-tickets/${ticket._id}/read`, { method: "PATCH" });
        // Mise à jour locale immédiate
        setTickets((prev) =>
          prev.map((t) =>
            t._id === ticket._id ? { ...t, unread_by_admin: false, unread_count: 0 } : t
          )
        );
        prevUnreadIdsRef.current.delete(ticket._id);
      } catch { /* silent */ }
    }

    try {
      const url = ticket.session_id
        ? `${API}/chatbot/support-sessions/${encodeURIComponent(ticket.session_id)}`
        : `${API}/chatbot/conversation/${encodeURIComponent(ticket.email)}?commerce_id=${encodeURIComponent(ticket.commerce_id)}`;
      const r = await fetch(url);
      const d = await r.json();
      setConvMessages(d.data || []);
    } catch {
      setConvMessages([]);
    } finally {
      setLoadingConv(false);
    }
  };

  // Scroll automatique vers le bas lors de l'ouverture et de la mise à jour des messages
  useEffect(() => {
    if (selectedTicket && convMessages.length > 0) {
      adminConvEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [convMessages, selectedTicket]);

  // Polling temps réel (s'arrête automatiquement si le modal est fermé ou ticket CLOSED)
  useEffect(() => {
    if (!selectedTicket || selectedTicket.status === "CLOSED") return;

    const pollAdminConv = async () => {
      try {
        const url = selectedTicket.session_id
          ? `${API}/chatbot/support-sessions/${encodeURIComponent(selectedTicket.session_id)}`
          : `${API}/chatbot/conversation/${encodeURIComponent(selectedTicket.email)}?commerce_id=${encodeURIComponent(selectedTicket.commerce_id)}`;

        const r = await fetch(url);
        const d = await r.json();
        if (d.status === "success" && Array.isArray(d.data)) {
          setConvMessages((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(d.data)) {
              return d.data;
            }
            return prev;
          });
        }
      } catch {
        /* silent */
      }
    };

    const interval = setInterval(pollAdminConv, 3000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicket || sendingReply) return;
    const text = adminReplyText.trim();
    setAdminReplyText("");
    setSendingReply(true);

    try {
      const r = await fetch(`${API}/chatbot/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: selectedTicket.email,
          commerce_id: selectedTicket.commerce_id,
          session_id: selectedTicket.session_id || null,
          message: text
        })
      });
      const data = await r.json();
      if (data.status === "success" && data.newMessage) {
        setConvMessages((prev) => [...prev, data.newMessage]);
        if (selectedTicket.status === "OPEN") {
          updateStatus(selectedTicket._id, "IN_PROGRESS");
          setSelectedTicket({ ...selectedTicket, status: "IN_PROGRESS" });
        }
      }
    } catch {
      /* silent */
    } finally {
      setSendingReply(false);
    }
  };

  async function updateStatus(id: string, newStatus: string) {
    try {
      await fetch(`${API}/chatbot/support-tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await load();
    } catch {
      /* silent */
    }
  }

  const filtered = tickets.filter((t) => filter === "ALL" || t.status === filter);

  return (
    <div className="space-y-6">
      {/* Toast nouveau message */}
      {newMsgToast && (
        <div className="fixed top-4 right-4 z-[999] flex items-center gap-3 bg-[#1A1A1A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-300">
          <span className="text-base">🔔</span>
          <span className="text-sm font-semibold">{newMsgToast}</span>
          <button onClick={() => setNewMsgToast(null)} className="ml-2 text-white/60 hover:text-white transition text-lg leading-none cursor-pointer">×</button>
        </div>
      )}

      {/* Tableau Tickets Escalades */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">

        {/* En-tête : titre + filtres */}
        <div className="px-5 py-3.5 border-b border-[#EEE5DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <HeadphonesIcon className="w-4 h-4 text-[#E8462F]" />
            <span className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Tickets d'Escalade Support</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filtres segmented */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl gap-0.5">
              {[
                { id: "ALL", label: "Tous" },
                { id: "OPEN", label: "Ouverts" },
                { id: "IN_PROGRESS", label: "En cours" },
                { id: "CLOSED", label: "Résolus" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${filter === f.id
                    ? "bg-white text-[#E8462F] shadow-sm"
                    : "text-slate-500 hover:text-[#1A1A1A]"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>


          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[#E8462F] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Chargement des tickets d'escalade...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="Aucun ticket d'escalade correspondant aux filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#EEE5DF] bg-[#FAF3EE] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="text-left px-5 py-3.5 whitespace-nowrap">Date</th>
                  <th className="text-left px-5 py-3.5">Statut</th>
                  <th className="text-left px-5 py-3.5">Client</th>
                  <th className="text-left px-5 py-3.5">Boutique</th>
                  <th className="text-left px-5 py-3.5">Résumé</th>
                  <th className="text-left px-5 py-3.5">Messages</th>
                  <th className="text-right px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE5DF]/50">
                {filtered.map((t) => (
                  <tr
                    key={t._id}
                    className={`transition-colors ${
                      t.unread_by_admin
                        ? "bg-amber-50/60 border-l-4 border-l-amber-400 hover:bg-amber-50"
                        : "hover:bg-[#FAF3EE]/40"
                    }`}
                  >
                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="font-medium">{formatDate(t.last_message_at || t.created_at)}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${t.status === "OPEN"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : t.status === "IN_PROGRESS"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}>
                        {t.status === "OPEN" ? <XCircle className="w-3 h-3" /> : t.status === "IN_PROGRESS" ? <RefreshCw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {t.status === "OPEN" ? "Ouvert" : t.status === "IN_PROGRESS" ? "En cours" : "Résolu"}
                      </span>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[150px]">{t.email}</span>
                      </div>
                    </td>

                    {/* Boutique */}
                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1A1A1A] bg-[#FAF3EE] px-2.5 py-1 rounded-lg border border-[#EEE5DF]">
                        <Store className="w-3 h-3 text-[#E8462F]" />
                        {getShopDisplayName(t.commerce_id, t.commerce_name)}
                      </span>
                    </td>

                    {/* Résumé */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 max-w-xs">
                      <span className="line-clamp-2 font-medium">{t.summary || t.reason || "Demande transmise au support humain."}</span>
                    </td>

                    {/* Nb messages (Cliquable pour ouvrir la discussion) */}
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => openConvModal(t)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-[#E8462F]/10 hover:text-[#E8462F] border border-slate-200 px-3 py-1 rounded-xl transition-all cursor-pointer shadow-2xs"
                        title="Cliquer pour voir la discussion complète"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#E8462F]" />
                        <span>{t.messages_count ?? "—"}</span>
                      </button>
                      {t.unread_by_admin && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full animate-pulse">
                          🔴 {t.unread_count ?? 1} non lu{(t.unread_count ?? 1) > 1 ? "s" : ""}
                        </div>
                      )}
                    </td>

                    {/* Action (Alignement parfait à niveau constant) */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Bouton Contacter par e-mail */}
                        <a
                          href={`mailto:${t.email}?subject=Support Retenza AI - ${encodeURIComponent(getShopDisplayName(t.commerce_id, t.commerce_name))}&body=Bonjour,\n\nSuite à votre demande auprès du support virtuel de ${encodeURIComponent(getShopDisplayName(t.commerce_id, t.commerce_name))}, nous prenons en charge votre dossier.\n\nCordialement,`}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 transition cursor-pointer shrink-0"
                          title="Envoyer un e-mail au client"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>

                        {/* Statut & Action avec largeur uniforme w-[145px] pour alignement parfait */}
                        <div className="w-[145px] flex justify-end shrink-0">
                          {t.status === "OPEN" && (
                            <button
                              onClick={() => updateStatus(t._id, "IN_PROGRESS")}
                              className="w-full justify-center text-xs font-bold px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Prendre en charge
                            </button>
                          )}
                          {t.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => updateStatus(t._id, "CLOSED")}
                              className="w-full justify-center text-xs font-bold px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Marquer résolu
                            </button>
                          )}
                          {t.status === "CLOSED" && (
                            <span className="w-full justify-center text-xs text-emerald-600 font-bold flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Résolu
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 💬 MODAL CONSULTATION DISCUSSION & CONTACT CLIENT */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EEE5DF] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-[#EEE5DF] flex items-center justify-between bg-[#FAF3EE]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#E8462F] to-[#F06038] text-white flex items-center justify-center shadow-md">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1A1A1A] flex items-center gap-2">
                    {selectedTicket.email}
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {getShopDisplayName(selectedTicket.commerce_id, selectedTicket.commerce_name)}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    Ticket #{selectedTicket._id.substring(0, 8)} • Crée le {formatDate(selectedTicket.created_at)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── BARRE FILTRES HEADER ── */}
            {!loadingConv && convMessages.length > 0 && (
              <div className="px-6 py-2.5 bg-white border-b border-[#EEE5DF] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtrer :</span>
                  {(() => {
                    const botCount = convMessages.filter((m: any) => {
                      const ch = m.channel || (m.role === "assistant" ? "bot" : m.role === "support" ? "support" : "bot");
                      return ch === "bot" || ch === "bot_context";
                    }).length;
                    const supportCount = convMessages.filter((m: any) => {
                      const ch = m.channel || (m.role === "assistant" ? "bot" : m.role === "support" ? "support" : "bot");
                      return ch === "support";
                    }).length;
                    return (
                      <>
                        <button
                          onClick={() => setAdminSectionFilter("all")}
                          className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                            adminSectionFilter === "all"
                              ? "bg-slate-700 text-white border-slate-700"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <span>Tout</span>
                        </button>
                        {botCount > 0 && (
                          <button
                            onClick={() => setAdminSectionFilter(adminSectionFilter === "bot" ? "all" : "bot")}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                              adminSectionFilter === "bot"
                                ? "bg-[#E8462F] text-white border-[#E8462F]"
                                : "bg-white text-[#E8462F] border-[#EEE5DF] hover:border-[#E8462F] hover:shadow-2xs"
                            }`}
                          >
                            <span>🤖 Bot ({botCount})</span>
                          </button>
                        )}
                        {supportCount > 0 && (
                          <button
                            onClick={() => setAdminSectionFilter(adminSectionFilter === "support" ? "all" : "support")}
                            className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border ${
                              adminSectionFilter === "support"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-400 hover:shadow-2xs"
                            }`}
                          >
                            <span>🎧 Conseiller ({supportCount})</span>
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
                <button
                  onClick={() => adminModalTopRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>↑ Haut</span>
                </button>
              </div>
            )}

            {/* Contenu Messages structuré en 2 sections fixes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF3EE]/20">
              <div ref={adminModalTopRef} />
              {loadingConv ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-6 h-6 text-[#E8462F] animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-xs">Chargement de la discussion...</p>
                </div>
              ) : convMessages.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#EEE5DF]">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">Aucun historique de message sauvegardé pour cette session.</p>
                </div>
              ) : (
                (() => {
                  const botMsgs = convMessages.filter((m: any) => {
                    const ch = m.channel || (m.role === "assistant" ? "bot" : m.role === "support" ? "support" : "bot");
                    return ch === "bot" || ch === "bot_context";
                  });

                  const supportMsgs = convMessages.filter((m: any) => {
                    const ch = m.channel || (m.role === "assistant" ? "bot" : m.role === "support" ? "support" : "bot");
                    return ch === "support";
                  });

                  const renderMsgBubble = (m: any, idx: number) => {
                    const isUser = m.role === "user" || m.role === "client_support";
                    const isSupport = m.role === "support";
                    const isBotContext = m.channel === "bot_context";

                    let textContent = m.text || m.content || m.message || "";
                    if (typeof textContent === "string") {
                      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(textContent)) {
                        textContent = m.text || m.message || "[Message]";
                      }
                      textContent = textContent.replace(/^🎧\s*\[Conseiller Support\]\s*:\s*/i, "").trim();
                      textContent = stripMarkdown(textContent);
                    }

                    let senderBadgeText = "Assistant Retenza IA 🤖";
                    if (isSupport) {
                      senderBadgeText = "🎧 Conseiller Support";
                    } else if (isBotContext) {
                      senderBadgeText = "🤖 Contexte conversation bot";
                    }

                    return (
                      <div key={idx} className={`flex items-start gap-2.5 w-full ${isUser ? "justify-end" : "justify-start"}`}>
                        {!isUser && (
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs text-xs font-bold ${
                            isSupport ? "bg-amber-500" : isBotContext ? "bg-slate-400" : "bg-[#E8462F]"
                          }`}>
                            {isSupport ? <span className="text-[10px]">🎧</span> : <Bot className="w-3.5 h-3.5" />}
                          </div>
                        )}
                        <div className={`max-w-[80%] p-3.5 rounded-2xl text-xs font-medium space-y-1 ${
                          isUser
                            ? "bg-[#6B7280] text-white shadow-2xs"
                            : isSupport
                            ? "bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs"
                            : isBotContext
                            ? "bg-slate-100/90 border border-slate-200 text-slate-700 shadow-2xs"
                            : "bg-white border border-[#EEE5DF] text-[#1A1A1A] shadow-2xs"
                        }`}>
                          {!isUser && (
                            <div className={`flex items-center gap-1.5 text-[10px] font-extrabold ${
                              isSupport ? "text-amber-800" : isBotContext ? "text-slate-500" : "text-[#E8462F]"
                            }`}>
                              <span>{senderBadgeText}</span>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap leading-relaxed">{textContent}</p>
                          {m.timestamp && <span className="text-[9px] opacity-60 block mt-1 text-right">{m.timestamp}</span>}
                        </div>
                        {isUser && (
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs bg-[#6B7280]">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      {/* Section 1 : Bot IA & Contexte */}
                      {botMsgs.length > 0 && (adminSectionFilter === "all" || adminSectionFilter === "bot") && (
                        <div ref={adminBotSectionRef} className="space-y-3 bg-white/60 border border-[#EEE5DF] rounded-2xl p-4 shadow-xs">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-[#EEE5DF] shrink-0">
                            <div className="w-6 h-6 rounded-lg bg-[#E8462F]/10 text-[#E8462F] flex items-center justify-center font-bold">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-xs font-extrabold text-[#1A1A1A]">Échanges & Contexte Bot IA</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8462F]/10 text-[#E8462F] ml-auto">
                              {botMsgs.length} message{botMsgs.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="max-h-[280px] overflow-y-auto space-y-3 pt-1 pr-1">
                            {botMsgs.map((m: any, idx: number) => renderMsgBubble(m, idx))}
                          </div>
                        </div>
                      )}

                      {/* Separateur entre Contexte Bot et Session Support */}
                      {botMsgs.length > 0 && supportMsgs.length > 0 && adminSectionFilter === "all" && (
                        <div className="my-3 flex items-center justify-center gap-3 text-[10px] font-extrabold text-amber-700/80 uppercase tracking-widest">
                          <span className="h-px bg-amber-200/80 flex-1" />
                          <span>── Début de la session support ──</span>
                          <span className="h-px bg-amber-200/80 flex-1" />
                        </div>
                      )}

                      {/* Section 2 : Conseiller Support */}
                      {supportMsgs.length > 0 && (adminSectionFilter === "all" || adminSectionFilter === "support") && (
                        <div ref={adminSupportSectionRef} className="space-y-3 bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
                          <div className="flex items-center gap-2 pb-2.5 border-b border-amber-200 shrink-0">
                            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px]">
                              🎧
                            </div>
                            <h4 className="text-xs font-extrabold text-amber-900">Échanges avec le Conseiller Support</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ml-auto">
                              {supportMsgs.length} message{supportMsgs.length > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="max-h-[280px] overflow-y-auto space-y-3 pt-1 pr-1">
                            {supportMsgs.map((m: any, idx: number) => renderMsgBubble(m, idx))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
              <div ref={adminConvEndRef} />
            </div>

            {/* Bannière "Message Client non répondu" */}
            {selectedTicket.status !== "CLOSED" &&
              convMessages.length > 0 &&
              (convMessages[convMessages.length - 1].role === "user" || convMessages[convMessages.length - 1].role === "client_support") && (
                <div className="px-6 py-2.5 bg-amber-50 border-t border-amber-200 text-amber-900 text-xs font-black flex items-center justify-between shrink-0">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    🔴 Le client a envoyé un message en attente de votre réponse
                  </span>
                </div>
              )}

            {/* Chat Input & Direct Response Bar */}
            {selectedTicket.status === "CLOSED" ? (
              <div className="px-6 py-3.5 border-t border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>🔒 Ce ticket est marqué comme résolu. L'envoi de messages est désactivé.</span>
              </div>
            ) : (
              <form onSubmit={handleSendAdminReply} className="px-6 py-3 border-t border-[#EEE5DF] bg-[#FAF3EE]/40 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Répondre au client directement dans la conversation (Conseiller Support)..."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  className="flex-1 bg-white border border-[#EEE5DF] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1A1A1A] placeholder-slate-400 outline-none focus:border-[#E8462F] transition-all"
                />
                <button
                  type="submit"
                  disabled={!adminReplyText.trim() || sendingReply}
                  className="px-4 py-2.5 rounded-2xl bg-[#E8462F] hover:bg-[#C93A25] text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
                >
                  <span>Envoyer</span>
                  {sendingReply ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            )}

            {/* Actions Rapides Admin Footer */}
            <div className="px-6 py-3 border-t border-[#EEE5DF] bg-white flex flex-wrap items-center justify-between gap-3">
              <a
                href={`mailto:${selectedTicket.email}?subject=Support Retenza AI - ${encodeURIComponent(getShopDisplayName(selectedTicket.commerce_id, selectedTicket.commerce_name))}&body=Bonjour,\n\nSuite à votre demande auprès du support virtuel de ${encodeURIComponent(getShopDisplayName(selectedTicket.commerce_id, selectedTicket.commerce_name))}, nous prenons en charge votre dossier.\n\nCordialement,`}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer border border-slate-200"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Envoyer e-mail</span>
              </a>

              <div className="flex items-center gap-2">
                {selectedTicket.status !== "CLOSED" && (
                  <button
                    onClick={() => {
                      updateStatus(selectedTicket._id, "CLOSED");
                      setSelectedTicket(null);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Marquer résolu</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition cursor-pointer border border-slate-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ONGLET 4 : CLIENTS BLOQUÉS ───────────────────────────────────────────────────
function BlockedClientsTab({ selectedCommerce }: { selectedCommerce: string }) {
  const [blocked, setBlocked] = useState<BlockedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${API}/chatbot/blocks${selectedCommerce !== "__all__" ? `?commerce_id=${selectedCommerce}` : ""}`;
      const r = await fetch(url);
      const d = await r.json();
      setBlocked(d.data || []);
    } catch {
      setBlocked([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCommerce]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnblock(email: string, commerceId: string) {
    try {
      await fetch(`${API}/chatbot/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, commerce_id: commerceId }),
      });
      await load();
    } catch {
      /* silent */
    }
  }

  const filteredBlocked = blocked.filter(
    (c) =>
      !search ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      (c.commerce_name && c.commerce_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Tableau Clients Bloqués */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
        {/* En-tête : titre + recherche + rafraîchir */}
        <div className="px-5 py-3.5 border-b border-[#EEE5DF] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ban className="w-4 h-4 text-[#E8462F]" />
            <span className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Clients Actuellement Bloqués</span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredBlocked.length}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#0F172A] outline-none focus:border-[#E8462F] focus:bg-white transition-all w-52"
              />
            </div>
          </div>
        </div>

        {/* Contenu du tableau */}
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-[#E8462F] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-xs">Chargement de la liste des clients bloqués...</p>
          </div>
        ) : filteredBlocked.length === 0 ? (
          <EmptyState message="Aucun client bloqué pour la boutique sélectionnée." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-[#EEE5DF] bg-[#FAF3EE] text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="text-left px-5 py-3.5 whitespace-nowrap">Date de Blocage</th>
                  <th className="text-left px-5 py-3.5">Client</th>
                  <th className="text-left px-5 py-3.5">Boutique</th>
                  <th className="text-center px-5 py-3.5">Infractions</th>
                  <th className="text-right px-5 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEE5DF]/50">
                {filteredBlocked.map((c) => (
                  <tr key={c._id} className="hover:bg-[#FAF3EE]/40 transition-colors">
                    {/* Date */}
                    <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span className="font-medium">{formatDate(c.blocked_at)}</span>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-rose-500" />
                        </div>
                        <span className="text-xs font-semibold text-[#0F172A] truncate max-w-[180px]">{c.email}</span>
                      </div>
                    </td>

                    {/* Boutique */}
                    <td className="px-5 py-3.5 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#1A1A1A] bg-[#FAF3EE] px-2.5 py-1 rounded-lg border border-[#EEE5DF]">
                        <Store className="w-3 h-3 text-[#E8462F]" />
                        {getShopDisplayName(c.commerce_id, c.commerce_name)}
                      </span>
                    </td>

                    {/* Infractions */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        {c.warnings || 3} avertissements
                      </span>
                    </td>

                    {/* Action Débloquer */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleUnblock(c.email, c.commerce_id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Unlock className="w-3.5 h-3.5" /> Débloquer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGE PRINCIPALE MODÉRATION & AUDIT CHATBOT ──────────────────────────────────
function AuditModerationContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [selectedCommerce, setSelectedCommerce] = useState<string>("__all__");
  const [period, setPeriod] = useState<string>("all");
  const [commercesList, setCommercesList] = useState<{ id: string; name: string }[]>([]);

  // Lire les query params pour auto-navigation + auto-ouverture modal
  const initialTab = searchParams?.get("tab") as TabKey | null;
  const initialTicketId = searchParams?.get("ticket_id") || undefined;
  useEffect(() => {
    if (initialTab && ["overview", "satisfaction", "audit", "tickets", "blocked"].includes(initialTab)) {
      setActiveTab(initialTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger la liste réelle des commerces
  useEffect(() => {
    fetch("/api/commerces")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const formatted = data.map((c) => ({
            id: c.id,
            name: getShopDisplayName(c.id, c.name),
          }));
          setCommercesList(formatted);
        }
      })
      .catch(() => { });
  }, []);

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "satisfaction", label: "Satisfaction Client" },
    { key: "audit", label: "Journal d'audit & Modération" },
    { key: "tickets", label: "Escalades Support" },
    { key: "blocked", label: "Clients Bloqués" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF3EE]">
      {/* ─── HEADER + FILTRES INTÉGRÉS (comme les autres pages) ─── */}
      <PageHeader
        title="Modération & Audit Chatbot"
        subtitle="Supervision de la satisfaction client, de la modération IA et des escalades support"
      >
        {/* Filtre Boutique */}
        <div className="flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#7A6E68]" />
          <select
            value={selectedCommerce}
            onChange={(e) => setSelectedCommerce(e.target.value)}
            className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-sm shrink-0"
          >
            <option value="__all__">Toutes les boutiques</option>
            {commercesList.length > 0 ? (
              commercesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))
            ) : (
              <option value="commerce_local_1">Boutique Tunis</option>
            )}
          </select>
        </div>

        {/* Filtre Période */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#7A6E68]" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-sm shrink-0"
          >
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
            <option value="all">Toutes les périodes</option>
          </select>
        </div>

        {/* Indicateur Live */}

      </PageHeader>

      {/* ─── ONGLETS (même style que Indicateurs & Analyses / RFM) ─── */}
      <div className="px-6 md:px-8 mt-4">
        <div className="flex border-b border-[#EEE5DF] gap-6 max-w-7xl mx-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === key
                ? "border-[#E8462F] text-[#E8462F]"
                : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* ─── ONGLET VUE D'ENSEMBLE ─── */}
        {activeTab === "overview" && (
          <VueEnsembleTab
            selectedCommerce={selectedCommerce}
            period={period}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {/* ─── CONTENU SELON L'ONGLET ACTIF ─── */}
        {activeTab === "satisfaction" && (
          <SatisfactionTab selectedCommerce={selectedCommerce} period={period} />
        )}
        {activeTab === "audit" && <AuditTab selectedCommerce={selectedCommerce} />}
        {activeTab === "tickets" && <TicketsTab selectedCommerce={selectedCommerce} initialTicketId={initialTicketId} />}
        {activeTab === "blocked" && <BlockedClientsTab selectedCommerce={selectedCommerce} />}
      </div>
    </div>
  );
}

// ─── EXPORT avec Suspense (requis pour useSearchParams dans Next.js App Router) ──
export default function AuditModerationPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-screen bg-[#FAF3EE]"><div className="w-8 h-8 border-4 border-[#E8462F] border-t-transparent rounded-full animate-spin" /></div>}>
      <AuditModerationContent />
    </Suspense>
  );
}

