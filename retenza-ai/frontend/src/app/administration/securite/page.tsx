"use client";

import PageHeader from "@/components/PageHeader";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield,
  AlertTriangle,
  UserX,
  ShoppingBag,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Download,
  ShieldAlert,
  Search,
  Filter,
  X,
  RotateCcw,
  Smartphone,
  Globe,
  ShoppingCart,
  Package,
  Bot,
  Layers,
  ArrowRight
} from "lucide-react";

interface FraudAlertsData {
  status: string;
  commerce_id: string;
  settings: {
    fraud_max_daily_purchases: number;
    fraud_max_basket_multiplier: number;
    avg_basket_calculated: number;
  };
  summary: {
    total_blocked_chatbot: number;
    total_suspicious_frequency: number;
    total_suspicious_baskets: number;
    total_alerts: number;
  };
  alerts: {
    chatbot_blocked: Array<{
      email: string;
      warnings: number;
      block_reason?: string;
      blocked_at?: string;
    }>;
    suspicious_frequency: Array<{
      email: string;
      date: string;
      count: number;
      threshold: number;
      reason: string;
    }>;
    suspicious_baskets: Array<{
      email: string;
      commande_id: string;
      amount: number;
      date: string;
      threshold: number;
      reason: string;
    }>;
  };
}

interface TrustScoreClient {
  email: string;
  nom?: string;
  commerce_id: string;
  trust_score: number;
  is_fraud_blocked: boolean;
  fraud_block_reason?: string | null;
  trust_score_updated_at?: string | null;
}

export default function SecurityAdminPage() {
  const [commerceId] = useState<string>("commerce_local_1");
  const [data, setData] = useState<FraudAlertsData | null>(null);
  const [trustScores, setTrustScores] = useState<TrustScoreClient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unblockingFraudEmail, setUnblockingFraudEmail] = useState<string | null>(null);
  // Toast d'erreur non-bloquant (remplace les alert())
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Recherche & Filtrage par catégorie/section d'alerte
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filtres spécifiques par section (cartes)
  const [trustSignalFilter, setTrustSignalFilter] = useState<string>("all"); // all, empreinte, ip, panier
  const [transSignalFilter, setTransSignalFilter] = useState<string>("all"); // all, frequence, panier

  // Modal de confirmation de déblocage anti-fraude
  const [confirmModal, setConfirmModal] = useState<{ email: string; nom?: string; score: number } | null>(null);

  // Settings thresholds for display
  const [maxDaily, setMaxDaily] = useState<number>(5);
  const [basketMultiplier, setBasketMultiplier] = useState<number>(3.0);

  const fetchAlerts = async (targetId: string = commerceId) => {
    try {
      const res = await fetch(`/api/security/fraud-alerts?commerce_id=${targetId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.status === "success") {
        setData(json);
        if (json.settings) {
          setMaxDaily(json.settings.fraud_max_daily_purchases || 5);
          setBasketMultiplier(json.settings.fraud_max_basket_multiplier || 3.0);
        }
      }
    } catch {
      /* ignore */
    }
  };

  const fetchTrustScores = async (targetId: string = commerceId) => {
    try {
      const res = await fetch(`/api/security/trust-scores?commerce_id=${targetId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json.status === "success" && Array.isArray(json.scores)) {
        setTrustScores(json.scores);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchAllData = async (targetId: string = commerceId) => {
    setLoading(true);
    await Promise.all([fetchAlerts(targetId), fetchTrustScores(targetId)]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData(commerceId);
  }, [commerceId]);

  // Ouvre la modale de confirmation (sans débloquer encore)
  const openUnblockConfirm = (client: TrustScoreClient) => {
    setConfirmModal({ email: client.email, nom: client.nom, score: client.trust_score });
  };

  // Exécuté seulement après confirmation dans la modale
  const handleUnblockFraud = async () => {
    if (!confirmModal) return;
    const email = confirmModal.email;
    setConfirmModal(null);
    setUnblockingFraudEmail(email);
    try {
      const res = await fetch("/api/security/unblock-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commerce_id: commerceId, client_email: email }),
      });
      const json = await res.json();
      if (json.status === "success") {
        // Temporairement re-bloquer côté UI pour maintenir le client visible dans la liste de test
        setTrustScores((prev) =>
          prev.map((c) =>
            c.email === email
              ? { ...c, is_fraud_blocked: true, trust_score_updated_at: new Date().toISOString() }
              : c
          )
        );
        // Puis rafraîchir les données réelles depuis le backend
        setTimeout(() => fetchAllData(commerceId), 1500);
      } else {
        const msg = json.error || "Erreur de déblocage anti-fraude.";
        setErrorToast(msg);
        setTimeout(() => setErrorToast(null), 5000);
      }
    } catch {
      setErrorToast("Erreur réseau.");
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setUnblockingFraudEmail(null);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    let csv = '\uFEFF';
    csv += `RAPPORT SÉCURITÉ & FRAUDE;Date: ${new Date().toLocaleDateString('fr-FR')}\n\n`;
    csv += `RÉSUMÉ;Valeur\n`;
    csv += `Total Alertes;${data.summary.total_alerts}\n`;
    csv += `Comptes Chatbot Bloqués;${data.summary.total_blocked_chatbot}\n`;
    csv += `Clients Bloqués Anti-Fraude;${blockedFraudClients.length}\n`;
    csv += `Volume Suspect (achats > ${data.settings.fraud_max_daily_purchases}/jour);${data.summary.total_suspicious_frequency}\n`;
    csv += `Paniers Hors-Normes (> ${data.settings.fraud_max_basket_multiplier}x panier moyen);${data.summary.total_suspicious_baskets}\n`;
    csv += `Panier Moyen Calculé;${data.settings.avg_basket_calculated} DT\n\n`;

    if (blockedFraudClients.length > 0) {
      csv += `CLIENTS BLOQUÉS ANTI-FRAUDE (TRUST SCORE < 0.3)\n`;
      csv += `Email;Nom;Score de Confiance;Motif du Blocage\n`;
      blockedFraudClients.forEach(c => {
        csv += `${c.email};${c.nom || '-'};${c.trust_score.toFixed(2)};${c.fraud_block_reason || '-'}\n`;
      });
      csv += '\n';
    }

    if (data.alerts.chatbot_blocked.length > 0) {
      csv += `COMPTES CHATBOT BLOQUÉS\n`;
      csv += `Email;Avertissements;Raison du Blocage;Date Blocage\n`;
      data.alerts.chatbot_blocked.forEach(c => {
        csv += `${c.email};${c.warnings};${c.block_reason || '-'};${c.blocked_at ? c.blocked_at.substring(0, 10) : '-'}\n`;
      });
      csv += '\n';
    }

    if (data.alerts.suspicious_frequency.length > 0) {
      csv += `VOLUMES D'ACHAT SUSPECTS\n`;
      csv += `Email;Date;Nombre d'achats;Seuil;Raison\n`;
      data.alerts.suspicious_frequency.forEach(f => {
        csv += `${f.email};${f.date};${f.count};${f.threshold};${f.reason}\n`;
      });
      csv += '\n';
    }

    if (data.alerts.suspicious_baskets.length > 0) {
      csv += `PANIERS HORS-NORMES\n`;
      csv += `Email;ID Commande;Montant (DT);Date;Seuil (DT);Raison\n`;
      data.alerts.suspicious_baskets.forEach(b => {
        csv += `${b.email};${b.commande_id};${b.amount};${b.date};${b.threshold};${b.reason}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securite_fraude_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const blockedFraudClients = trustScores.filter((c) => c.is_fraud_blocked);

  // Filtres par recherche textuelle & motifs/styles de signaux
  const matchQuery = (text: string) => text.toLowerCase().includes(searchTerm.trim().toLowerCase());

  // 1. Filtrage Clients Score de Confiance (Anti-Fraude)
  const filteredTrustClients = blockedFraudClients.filter((c) => {
    if (categoryFilter !== "all" && categoryFilter !== "trust") return false;
    if (searchTerm && !(matchQuery(c.email) || matchQuery(c.nom || "") || matchQuery(c.fraud_block_reason || ""))) {
      return false;
    }
    const reason = (c.fraud_block_reason || "").toLowerCase();

    // Filtre spécifique de la carte Score
    if (trustSignalFilter === "empreinte" && !reason.includes("empreinte")) return false;
    if (trustSignalFilter === "ip" && !reason.includes("ip")) return false;
    if (trustSignalFilter === "panier" && !reason.includes("panier") && !reason.includes("montant")) return false;

    return true;
  });

  // 2. Filtrage Chatbot
  const filteredChatbotAlerts = (data?.alerts.chatbot_blocked || []).filter((c) => {
    if (categoryFilter !== "all" && categoryFilter !== "chatbot") return false;
    if (searchTerm && !(matchQuery(c.email) || matchQuery(c.block_reason || ""))) {
      return false;
    }
    return true;
  });

  // 3. Filtrage Transactions - Fréquence
  const filteredFrequencyAlerts = (data?.alerts.suspicious_frequency || []).filter((f) => {
    if (categoryFilter !== "all" && categoryFilter !== "suspicious") return false;
    if (searchTerm && !(matchQuery(f.email) || matchQuery(f.reason || ""))) {
      return false;
    }
    if (transSignalFilter === "panier") return false;
    return true;
  });

  // 4. Filtrage Transactions - Paniers Hors-Normes
  const filteredBasketAlerts = (data?.alerts.suspicious_baskets || []).filter((b) => {
    if (categoryFilter !== "all" && categoryFilter !== "suspicious") return false;
    if (searchTerm && !(matchQuery(b.email) || matchQuery(b.reason || "") || matchQuery(b.commande_id || ""))) {
      return false;
    }
    if (transSignalFilter === "frequence") return false;
    return true;
  });

  const totalFilteredCount = filteredTrustClients.length + filteredChatbotAlerts.length + filteredFrequencyAlerts.length + filteredBasketAlerts.length;

  // Découper les raisons en tags/badges courts et lisibles
  const parseSignalBadges = (reason?: string | null) => {
    if (!reason) return [{ label: "Score sous le seuil (< 0.30)", color: "bg-rose-100/80 text-rose-700 border-rose-200" }];
    const r = reason.toLowerCase();
    const badges: { label: string; color: string }[] = [];
    if (r.includes("empreinte")) badges.push({ label: "Empreinte partagée", color: "bg-rose-100/80 text-rose-700 border-rose-200" });
    if (r.includes("ip")) badges.push({ label: "IP partagée", color: "bg-amber-100/80 text-amber-800 border-amber-200" });
    if (r.includes("panier") || r.includes("montant")) badges.push({ label: "Panier hors-normes", color: "bg-purple-100/80 text-purple-700 border-purple-200" });
    if (r.includes("fréquence") || r.includes("frequence") || r.includes("achats")) badges.push({ label: "Achats fréquents", color: "bg-amber-100/80 text-amber-800 border-amber-200" });
    if (badges.length === 0) badges.push({ label: reason, color: "bg-[#FAF3EE] text-[#7A6E68] border-[#EEE5DF]" });
    return badges;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Administration & Sécurité — Détection de Fraude"
        subtitle="Surveillance des comportements suspects, score de confiance, blocages Chatbot et transactions anormales"
      >
        <button
          onClick={handleExportCSV}
          disabled={!data}
          className="bg-white border border-[#EEE5DF] hover:bg-[#FAF3EE] text-[#7A6E68] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter CSV
        </button>
      </PageHeader>

      {/* Main Content */}
      <div className="flex-1 px-8 py-8 w-full max-w-7xl mx-auto flex flex-col gap-6">

        {loading && !data ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#B0A49C]" />
          </div>
        ) : (
          <>
            {/* Toast d'erreur non-bloquant */}
            {errorToast && (
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-300 rounded-xl px-4 py-3 text-xs font-semibold text-rose-700 shadow-sm animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="flex-1">{errorToast}</span>
                <button onClick={() => setErrorToast(null)} className="text-rose-400 hover:text-rose-700 transition-colors cursor-pointer">✕</button>
              </div>
            )}

            {/* KPI Summary Cards (5 Cards Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Total Alertes
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black text-[#1A1A1A]">{data?.summary.total_alerts || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Comportements signalés</p>
              </div>

              <Link
                href="/parametres/audit-moderation?tab=blocked"
                className="bg-white border border-[#EEE5DF] hover:border-[#D5C8C0] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer block"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider group-hover:text-[#E8462F] transition-colors">
                    Chatbot Bloqués
                  </span>
                  <UserX className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-black text-rose-600">
                  {data?.summary.total_blocked_chatbot || 0}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-slate-400">Insultes / Spam répétitif</p>
                  <ArrowRight className="w-3 h-3 text-[#E8462F] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>

              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Bloqués Anti-Fraude
                  </span>
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <p className="text-2xl font-black text-rose-600">
                  {blockedFraudClients.length}
                </p>
                <p className="text-xs text-slate-400 mt-1">Score de confiance &lt; 0.3</p>
              </div>

              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Volume Suspect
                  </span>
                  <ShoppingBag className="w-4 h-4 text-[#FDECEA]0" />
                </div>
                <p className="text-2xl font-black text-[#1A1A1A]">
                  {data?.summary.total_suspicious_frequency || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">Achats &gt; {maxDaily}/jour</p>
              </div>

              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Paniers Hors-Normes
                  </span>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-black text-[#1A1A1A]">
                  {data?.summary.total_suspicious_baskets || 0}
                </p>
                <p className="text-xs text-slate-400 mt-1">Achats &gt; {basketMultiplier}x Panier Moyen</p>
              </div>
            </div>



            {/* Search & Category Filter Toolbar */}
            <div className="bg-white border border-[#EEE5DF] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search Input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par email client, nom ou motif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAF3EE] border border-[#EEE5DF] hover:border-slate-300 focus:border-[#E8462F] focus:bg-white text-xs font-semibold text-slate-800 pl-10 pr-9 py-2.5 rounded-xl outline-none transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Filtre par Section */}
              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <div className="flex items-center gap-2 bg-[#FAF3EE] border border-[#EEE5DF] hover:border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-[#E8462F] shrink-0" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer w-full"
                  >
                    <option value="all">Toutes les alertes</option>
                    <option value="trust">Clients Bloqués — Score</option>
                    <option value="suspicious">Transactions &amp; Volumes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Alert Lists Grid (2 Colonnes) */}
            <div className={`grid grid-cols-1 ${categoryFilter === 'all' ? 'lg:grid-cols-2' : 'w-full'} gap-6 items-stretch`}>

              {/* 1. Anti-Fraud Blocked Clients (Score < 0.3) */}
              {(categoryFilter === "all" || categoryFilter === "trust") && (
              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 h-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Clients Bloqués — Score
                    </h3>
                    <span className="bg-rose-100 text-rose-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      {filteredTrustClients.length}
                    </span>
                  </div>

                  {/* Sous-filtres par signal */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setTrustSignalFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        trustSignalFilter === "all" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setTrustSignalFilter("empreinte")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        trustSignalFilter === "empreinte" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      Empreinte
                    </button>
                    <button
                      onClick={() => setTrustSignalFilter("ip")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        trustSignalFilter === "ip" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      IP
                    </button>
                    <button
                      onClick={() => setTrustSignalFilter("panier")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        trustSignalFilter === "panier" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Panier
                    </button>
                  </div>
                </div>

                {filteredTrustClients.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-8 text-center my-auto">
                    {searchTerm || categoryFilter !== "all" || trustSignalFilter !== "all"
                      ? "Aucun client ne correspond à ce filtre."
                      : "Aucun client bloqué par le système anti-fraude."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 flex-1">
                    {filteredTrustClients.map((c) => {
                      const displayName = c.nom && c.nom.trim().length > 0 ? c.nom : c.email;
                      const hasDistinctName = c.nom && c.nom.trim().length > 0;
                      const badges = parseSignalBadges(c.fraud_block_reason);

                      return (
                        <div
                          key={c.email}
                          className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col gap-2"
                        >
                          {/* Ligne 1 : Nom/Email + Score (unique accent rouge) */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-[#1A1A1A] block truncate">{displayName}</span>
                              {hasDistinctName && (
                                <span className="text-[11px] text-slate-400 block truncate">{c.email}</span>
                              )}
                            </div>
                            <span className="bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
                              Score {c.trust_score.toFixed(2)}
                            </span>
                          </div>

                          {/* Ligne 2 : Signaux en gris neutre */}
                          <div className="flex flex-wrap gap-1">
                            {badges.map((b, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                {b.label}
                              </span>
                            ))}
                          </div>

                          {/* Ligne 3 : Bouton neutre */}
                          <div className="flex justify-end pt-1.5 border-t border-slate-100">
                            <button
                              onClick={() => openUnblockConfirm(c)}
                              disabled={unblockingFraudEmail === c.email}
                              className="border border-slate-200 hover:bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 shrink-0 cursor-pointer flex items-center gap-1.5"
                            >
                              {unblockingFraudEmail === c.email ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                "Débloquer"
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

              {/* 2. Suspicious Purchases & Baskets */}
              {(categoryFilter === "all" || categoryFilter === "suspicious") && (
              <div className="bg-white border border-[#EEE5DF] rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4 h-full">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Transactions &amp; Volumes
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {filteredFrequencyAlerts.length + filteredBasketAlerts.length}
                    </span>
                  </div>

                  {/* Sous-filtres par signal */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setTransSignalFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                        transSignalFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Tous
                    </button>
                    <button
                      onClick={() => setTransSignalFilter("frequence")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        transSignalFilter === "frequence" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      Achats Fréquents
                    </button>
                    <button
                      onClick={() => setTransSignalFilter("panier")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                        transSignalFilter === "panier" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Paniers Hors-Normes
                    </button>
                  </div>
                </div>

                {filteredFrequencyAlerts.length + filteredBasketAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-8 text-center my-auto">
                    {searchTerm || categoryFilter !== "all" || transSignalFilter !== "all"
                      ? "Aucune transaction ne correspond à ce filtre."
                      : "Aucune transaction ou fréquence anormale détectée."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1 flex-1">
                    {filteredFrequencyAlerts.map((f, idx) => (
                      <div
                        key={`freq_${idx}`}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col gap-2"
                      >
                        {/* Ligne 1 : Email + Date en gris */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-[#1A1A1A] truncate">{f.email}</span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">{f.date}</span>
                        </div>

                        {/* Ligne 2 : Signal en gris neutre */}
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Achats fréquents · {f.count} cmd/jour
                          </span>
                        </div>

                        {/* Ligne 3 : Valeur clé en accent orange */}
                        <div className="flex justify-end pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] font-bold text-[#E8462F] bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                            Seuil dépassé (&gt;{f.threshold})
                          </span>
                        </div>
                      </div>
                    ))}

                    {filteredBasketAlerts.map((b, idx) => (
                      <div
                        key={`basket_${idx}`}
                        className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all flex flex-col gap-2"
                      >
                        {/* Ligne 1 : Email + Montant (unique accent orange) */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-[#1A1A1A] truncate">{b.email}</span>
                          <span className="bg-orange-50 text-[#E8462F] border border-orange-200 text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0">
                            {b.amount} DT
                          </span>
                        </div>

                        {/* Ligne 2 : Signal en gris neutre */}
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Panier hors-normes · seuil {b.threshold} DT
                          </span>
                        </div>

                        {/* Ligne 3 : ID commande discret */}
                        <div className="flex justify-end pt-1.5 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-medium">
                            Cmd. {b.commande_id}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              )}

            </div>

          </>
        )}

      </div>

      {/* ── Modal de confirmation de déblocage anti-fraude ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EEE5DF] w-[420px] max-w-[90vw] p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#1A1A1A]">Confirmer le déblocage anti-fraude</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cette action annule temporairement le blocage anti-fraude.</p>
              </div>
            </div>

            {/* Client info */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1A1A]">Client</span>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  Score : {confirmModal.score.toFixed(2)}
                </span>
              </div>
              <p className="text-xs font-bold text-rose-700 break-all">{confirmModal.email}</p>
              {confirmModal.nom && (
                <p className="text-[11px] text-[#7A6E68]">{confirmModal.nom}</p>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Voulez-vous vraiment débloquer ce client ? Son score de confiance reste bas.
              Le système peut le re-bloquer automatiquement lors du prochain recalcul (toutes les 6h)
              si les signaux de risque persistent.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleUnblockFraud}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Oui, Débloquer
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
