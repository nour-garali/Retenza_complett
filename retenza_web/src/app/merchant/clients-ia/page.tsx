"use client";

import PageHeader from "@/components/PageHeader";
import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Search,
  Sparkles,
  Loader2,
  Crown,
  TrendingDown,
  Gift,
  AlertTriangle,
  RefreshCw,
  X,
  CreditCard,
  History,
  Mail,
  ShieldAlert,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertCircle,
  Download,
  Link2
} from "lucide-react";
import { ToastContainer, useToast } from "@/components/Toast";

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
  recency_score?: number;
  frequency_score?: number;
  monetary_score?: number;
  score_r?: number;
  score_f?: number;
  score_m?: number;
  score_global_sa: number;
  influence_score?: number;
  baisse_frequence_detectee?: boolean;
  delta_frequence?: number;
  points_cumules?: number;
  rgpd_opt_out?: boolean;
  rgpd_opt_out_marketing?: boolean;
  rgpd_opt_out_profiling?: boolean;
  rgpd_opt_out_date?: string;
}

interface ClientDetails {
  loyaltyBalance?: {
    points_cumules: number;
    points_disponibles: number;
    points_utilises: number;
    paliers: Array<{ code: string; label: string; points_requis: number; debloque: boolean; notifie: boolean }>;
  };
  loyaltyHistory?: Array<{
    type: "credit" | "debit";
    points: number;
    description: string;
    code_promo: string | null;
    montant_transaction: number | null;
    solde_avant: number;
    solde_apres: number;
    date: string;
  }>;
  referralDetail?: {
    referral_code: string;
    influence_score: number;
    is_ambassador: boolean;
    sponsor: { nom: string; email: string } | null;
    referred_clients: Array<{
      filleul_nom: string;
      filleul_email: string;
      status: string;
      date_parrainage: string;
      amount_generated: number;
    }>;
    rewards: {
      completed_count: number;
      tiers: Array<{ level: number; name: string; code: string; required: number; unlocked: boolean }>;
    };
  };
  transactions?: Array<{
    id: string;
    date_transaction: string;
    montant: number;
  }>;
  campaignHistory?: Array<{
    _id: string;
    sent_at: string;
    subject: string;
    segment: string;
    status: string;
  }>;
}

function ClientsContent() {
  const [selectedCommerce, setSelectedCommerce] = useState<string>("__all__");
  const [loading, setLoading] = useState<boolean>(true);
  const [clients, setClients] = useState<ClientData[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedValueTier, setSelectedValueTier] = useState<string>("all");
  const [selectedSegment, setSelectedSegment] = useState<string>("all");
  const [selectedChurnRisk, setSelectedChurnRisk] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [onlyAmbassadors, setOnlyAmbassadors] = useState<boolean>(false);
  const [onlyFreqDrop, setOnlyFreqDrop] = useState<boolean>(false);
  const [onlyCloseToPalier, setOnlyCloseToPalier] = useState<boolean>(false);
  const [onlyRgpdOptOut, setOnlyRgpdOptOut] = useState<boolean>(false);

  // Group modal and automation states
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [groupSubject, setGroupSubject] = useState<string>("");
  const [groupBody, setGroupBody] = useState<string>("");
  const [groupSelectedTemplateIndex, setGroupSelectedTemplateIndex] = useState<number | null>(null);
  const [automationRunning, setAutomationRunning] = useState<boolean>(false);
  const [automationProgress, setAutomationProgress] = useState<string>("");

  // Drawer states
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [drawerTab, setDrawerTab] = useState<"profile" | "txs" | "loyalty" | "referrals" | "campaigns" | "actions">("profile");

  // Drawer list filters
  const [drawerTxPeriod, setDrawerTxPeriod] = useState<string>("all");
  const [drawerTxSort, setDrawerTxSort] = useState<string>("date_desc");
  const [drawerCampaignType, setDrawerCampaignType] = useState<string>("all");

  // Action form states
  const [creditAmount, setCreditAmount] = useState<string>("");
  const [debitCode, setDebitCode] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const [emailBody, setEmailBody] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Toast system
  const { toasts, addToast, removeToast } = useToast();

  const [commerces, setCommerces] = useState<{ id: string; label: string }[]>([]);

  // Load active commerce and fetch clients
  useEffect(() => {
    async function loadCommerces() {
      try {
        const res = await fetch("http://localhost:5000/api/commerces");
        const data = await res.json();
        setCommerces(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load commerces:", err);
        setCommerces([]);
      }
    }
    loadCommerces();

    const saved = localStorage.getItem("ratenza_commerce_id");
    if (saved) {
      setSelectedCommerce(saved);
    }
  }, []);

  const handleCommerceSelect = (id: string) => {
    setSelectedCommerce(id);
  };

  useEffect(() => {
    async function loadClients() {
      setLoading(true);
      try {
        let merged: ClientData[] = [];
        if (selectedCommerce === "__all__") {
          const shopsRes = await fetch("http://localhost:5000/api/commerces");
          const shops = await shopsRes.json();
          if (Array.isArray(shops)) {
            const allPromises = shops.map((c: any) =>
              fetch(`http://localhost:5000/api/data?commerce_id=${encodeURIComponent(c.id)}`).then((r) => r.json())
            );
            const results = await Promise.all(allPromises);
            merged = results.flat().filter((d: any) => d && !d.error);
          }
        } else {
          const res = await fetch(`http://localhost:5000/api/data?commerce_id=${encodeURIComponent(selectedCommerce)}`);
          const data = await res.json();
          merged = Array.isArray(data) ? data : [];
        }

        // Fetch opt-out settings for correct display on first load
        setClients(merged);
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, [selectedCommerce]);

  // Open client drawer automatically if openEmail is in URL query parameters
  const searchParams = useSearchParams();
  const router = useRouter();
  useEffect(() => {
    const emailToOpen = searchParams.get("openEmail");
    if (emailToOpen && clients.length > 0) {
      const client = clients.find(c => c.email.toLowerCase() === emailToOpen.toLowerCase());
      if (client) {
        handleRowClick(client);
        // Clean the query parameter from URL without reloading
        router.replace("/clients", { scroll: false });
      }
    }
  }, [searchParams, clients]);

  // Helper: segment fallback from score_global_sa (needed by useMemo below)
  const getFallbackSegment = (c: ClientData): string => {
    const score = c.score_global_sa || 0;
    if (score >= 0.7) return "vip";
    if (score >= 0.4) return "regular";
    if (score >= 0.2) return "at_risk";
    return "lost";
  };

  // Apply filters — computed synchronously via useMemo (no async timing issues)
  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) => c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }

    if (selectedValueTier !== "all") {
      result = result.filter((c) => {
        const m = c.monetary ?? 0;
        if (selectedValueTier === "low") return m < 50;
        if (selectedValueTier === "medium") return m >= 50 && m < 200;
        if (selectedValueTier === "high") return m >= 200 && m < 500;
        if (selectedValueTier === "premium") return m >= 500;
        return true;
      });
    }

    if (selectedSegment !== "all") {
      result = result.filter((c) => {
        const seg = c.segment_gmm || getFallbackSegment(c);
        return seg === selectedSegment;
      });
    }

    if (selectedChurnRisk !== "all") {
      result = result.filter((c) => c.churn_risk_label === selectedChurnRisk);
    }

    if (selectedPeriod !== "all") {
      const maxDays = parseInt(selectedPeriod, 10);
      result = result.filter((c) => c.recency <= maxDays);
    }

    if (onlyAmbassadors) {
      result = result.filter((c) => {
        const score = c.influence_score !== undefined && c.influence_score !== null
          ? Number(c.influence_score)
          : Math.round(((c.score_global_sa || 0) * 0.7 + (1.0 - (c.churn_score || 0)) * 0.3) * 100);
        return score >= 80;
      });
    }

    if (onlyFreqDrop) {
      result = result.filter((c) => c.baisse_frequence_detectee === true);
    }

    if (onlyCloseToPalier) {
      result = result.filter((c) => {
        const pts = c.points_cumules || 0;
        return (pts >= 80 && pts < 100) || (pts >= 180 && pts < 200);
      });
    }

    if (onlyRgpdOptOut) {
      result = result.filter((c) => c.rgpd_opt_out === true);
    }

    return result;
  }, [
    clients,
    searchQuery,
    selectedValueTier,
    selectedSegment,
    selectedChurnRisk,
    selectedPeriod,
    onlyAmbassadors,
    onlyFreqDrop,
    onlyCloseToPalier,
    onlyRgpdOptOut
  ]);

  // Load client details concurrently
  const loadClientDetails = async (email: string, commerceId: string) => {
    setDetailsLoading(true);
    setClientDetails(null);
    clearActionStates();
    try {
      const encEmail = encodeURIComponent(email);
      const comParam = `commerce_id=${encodeURIComponent(commerceId)}`;

      const [loyaltyBal, loyaltyHist, referrals, transactions, campaigns] = await Promise.all([
        fetch(`http://localhost:5000/api/loyalty/balance/${encEmail}?${comParam}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/loyalty/history/${encEmail}?${comParam}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/referrals/client/${encEmail}?${comParam}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/transactions/${encEmail}?${comParam}`).then(r => r.json()),
        fetch(`http://localhost:5000/api/campaigns/history/${encEmail}?${comParam}`).then(r => r.json())
      ]);

      // Format custom rewards array if needed
      let formattedRewards = referrals?.data?.rewards;
      if (Array.isArray(referrals?.data?.rewards?.tiers)) {
        // Safe check
      } else if (Array.isArray(referrals?.data?.rewards)) {
        // Fallback or parse string objects if sent as strings (e.g. '@{level=1...}')
        const parsedTiers = referrals.data.rewards.map((tStr: string) => {
          if (typeof tStr !== "string") return tStr;
          // Simple key-value parser for PowerShell formatting strings
          const levelMatch = tStr.match(/level=(\d+)/);
          const nameMatch = tStr.match(/name=([^;\}]+)/);
          const codeMatch = tStr.match(/code=([^;\}]+)/);
          const reqMatch = tStr.match(/required=(\d+)/);
          const unlMatch = tStr.match(/unlocked=([^;\}]+)/);
          return {
            level: levelMatch ? parseInt(levelMatch[1], 10) : 1,
            name: nameMatch ? nameMatch[1] : "Récompense",
            code: codeMatch ? codeMatch[1] : "",
            required: reqMatch ? parseInt(reqMatch[1], 10) : 1,
            unlocked: unlMatch ? unlMatch[1].toLowerCase() === "true" : false
          };
        });
        formattedRewards = {
          completed_count: referrals.data.rewards.length,
          tiers: parsedTiers
        };
      }

      setClientDetails({
        loyaltyBalance: loyaltyBal?.data || null,
        loyaltyHistory: loyaltyHist?.data?.transactions || [],
        referralDetail: referrals?.data ? { ...referrals.data, rewards: formattedRewards } : null,
        transactions: Array.isArray(transactions) ? transactions : [],
        campaignHistory: Array.isArray(campaigns) ? campaigns : []
      });
    } catch (err) {
      console.error("Failed to load client details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearActionStates = () => {
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    setCreditAmount("");
    setDebitCode("");
    setEmailSubject("");
    setEmailBody("");
  };

  const handleRowClick = (client: ClientData) => {
    setSelectedClient(client);
    setDrawerTab("profile");
    setIsDrawerOpen(true);
    loadClientDetails(client.email, client.commerce_id);
  };

  // Actions Rapid
  const handleCreditPoints = async () => {
    if (!selectedClient) return;
    const amountNum = parseFloat(creditAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setActionErrorMessage("Veuillez saisir un montant d'achat positif valide.");
      return;
    }

    setActionLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/loyalty/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commerce_id: selectedClient.commerce_id,
          client_email: selectedClient.email,
          client_nom: selectedClient.nom,
          montant: amountNum
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setActionSuccessMessage(data.message);
        setCreditAmount("");
        // Reload details & update parent state
        loadClientDetails(selectedClient.email, selectedClient.commerce_id);
        updateClientState(selectedClient.email, {
          points_cumules: data.points_cumules
        });
      } else {
        setActionErrorMessage(data.error || "Une erreur s'est produite lors du crédit.");
      }
    } catch (err: any) {
      setActionErrorMessage("Erreur de connexion : " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedeemPoints = async () => {
    if (!selectedClient || !debitCode) return;

    setActionLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commerce_id: selectedClient.commerce_id,
          client_email: selectedClient.email,
          code_promo: debitCode
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setActionSuccessMessage(data.message);
        addToast(data.message || "Points débités avec succès !", "success");
        setDebitCode("");
        // Reload details
        loadClientDetails(selectedClient.email, selectedClient.commerce_id);
      } else {
        setActionErrorMessage(data.error || "Une erreur s'est produite.");
        addToast(data.error || "Une erreur s'est produite.", "error");
      }
    } catch (err: any) {
      setActionErrorMessage("Erreur de connexion : " + err.message);
      addToast("Erreur de connexion : " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedClient) return;
    if (!emailSubject.trim() || !emailBody.trim()) {
      setActionErrorMessage("Veuillez saisir un objet et un message.");
      return;
    }

    setActionLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/campaigns/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commerce_id: selectedClient.commerce_id,
          email: selectedClient.email,
          nom: selectedClient.nom,
          subject: emailSubject,
          body: emailBody,
          segment: selectedClient.segment_gmm || getFallbackSegment(selectedClient)
        })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        setActionSuccessMessage("E-mail envoyé et archivé avec succès !");
        addToast("📧 E-mail envoyé et archivé avec succès !", "success");
        setEmailSubject("");
        setEmailBody("");
        loadClientDetails(selectedClient.email, selectedClient.commerce_id);
      } else {
        setActionErrorMessage(data.error || "Erreur lors de l'envoi de l'e-mail.");
        addToast(data.error || "Erreur lors de l'envoi de l'e-mail.", "error");
      }
    } catch (err: any) {
      setActionErrorMessage("Erreur de connexion : " + err.message);
      addToast("Erreur de connexion : " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptOut = async (target: 'marketing' | 'profiling' | 'both' = 'both') => {
    if (!selectedClient) return;

    if (!confirm(`Confirmez-vous la désactivation RGPD (${target === 'marketing' ? 'E-mails' : target === 'profiling' ? 'Recommandations IA' : 'Tout'}) pour ${selectedClient.nom} ?`)) {
      return;
    }

    setActionLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/rgpd/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commerce_id: selectedClient.commerce_id,
          email: selectedClient.email,
          target
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setActionSuccessMessage(data.message);
        addToast(`🛡️ Désactivation RGPD (${target === 'marketing' ? 'E-mails' : target === 'profiling' ? 'Recommandations IA' : 'Tout'}) confirmée.`, "info");
        const dateStr = new Date().toISOString();

        const updates: Partial<ClientData> = {
          rgpd_opt_out_date: dateStr
        };
        if (target === 'marketing' || target === 'both') {
          updates.rgpd_opt_out = true;
          updates.rgpd_opt_out_marketing = true;
        }
        if (target === 'profiling' || target === 'both') {
          updates.rgpd_opt_out_profiling = true;
        }

        setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
        updateClientState(selectedClient.email, updates);
      } else {
        setActionErrorMessage(data.error || "Erreur lors de la mise à jour RGPD.");
        addToast(data.error || "Erreur lors de la mise à jour RGPD.", "error");
      }
    } catch (err: any) {
      setActionErrorMessage("Erreur de connexion : " + err.message);
      addToast("Erreur de connexion : " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOptIn = async (target: 'marketing' | 'profiling' | 'both' = 'both') => {
    if (!selectedClient) return;
    if (!confirm(`Confirmez-vous la réactivation RGPD (${target === 'marketing' ? 'E-mails' : target === 'profiling' ? 'Recommandations IA' : 'Tout'}) pour ${selectedClient.nom} ?`)) {
      return;
    }

    setActionLoading(true);
    setActionSuccessMessage(null);
    setActionErrorMessage(null);

    try {
      const res = await fetch("http://localhost:5000/api/rgpd/opt-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commerce_id: selectedClient.commerce_id,
          email: selectedClient.email,
          target
        })
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setActionSuccessMessage(data.message);
        addToast(`🛡️ Réactivation RGPD (${target === 'marketing' ? 'E-mails' : target === 'profiling' ? 'Recommandations IA' : 'Tout'}) confirmée.`, "success");

        const updates: Partial<ClientData> = {};
        if (target === 'marketing' || target === 'both') {
          updates.rgpd_opt_out = false;
          updates.rgpd_opt_out_marketing = false;
        }
        if (target === 'profiling' || target === 'both') {
          updates.rgpd_opt_out_profiling = false;
        }

        setSelectedClient(prev => prev ? { ...prev, ...updates } : null);
        updateClientState(selectedClient.email, updates);
      } else {
        setActionErrorMessage(data.error || "Erreur lors de la réactivation RGPD.");
        addToast(data.error || "Erreur lors de la réactivation RGPD.", "error");
      }
    } catch (err: any) {
      setActionErrorMessage("Erreur de connexion : " + err.message);
      addToast("Erreur de connexion : " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to sync changes back to table list
  const updateClientState = (email: string, updatedFields: Partial<ClientData>) => {
    setClients(prev => prev.map(c => c.email.toLowerCase() === email.toLowerCase() ? { ...c, ...updatedFields } : c));
  };

  // Recalculate pipeline
  const handleRecalculate = async () => {
    setLoading(true);
    try {
      const targetId = selectedCommerce === "__all__" ? "commerce_local" : selectedCommerce;
      const res = await fetch("http://localhost:5000/api/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commerce_id: targetId })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert("Calcul RFM recalculé et sauvegardé avec succès !");
        setSelectedCommerce((prev) => prev);
      } else {
        alert(`Erreur: ${data.error || "Inconnue"}`);
      }
    } catch (err: any) {
      alert(`Erreur réseau: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Group Templates Computation
  const getGroupCampaignTemplates = () => {
    const stats = { vip: 0, regular: 0, at_risk: 0, lost: 0 };
    let highChurnCount = 0;
    let criticalChurnCount = 0;
    const total = filteredClients.length;

    filteredClients.forEach(c => {
      const seg = c.segment_gmm || getFallbackSegment(c);
      if (stats[seg as keyof typeof stats] !== undefined) stats[seg as keyof typeof stats]++;
      const score = c.churn_score || 0;
      if (score >= 0.55) highChurnCount++;
      if (score >= 0.75) criticalChurnCount++;
    });

    const dominantSeg = Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0];
    const highChurnRatio = total > 0 ? highChurnCount / total : 0;
    const criticalChurnRatio = total > 0 ? criticalChurnCount / total : 0;

    const templates = [];
    if (dominantSeg === "vip") {
      if (criticalChurnRatio >= 0.3) {
        templates.push({
          label: "🚨 Rétention VIP Urgente (-35%)",
          subject: "Nous ne voulons pas vous perdre ! Offre VIP exclusive 🚨",
          body: "Bonjour {nom},\n\nNous avons remarqué que vous vous faisiez rare, et cela nous préoccupe sincèrement.\n\nEn tant que client VIP, vous méritez une attention toute particulière. Voici une remise exceptionnelle de 35% sur votre prochain achat : VIPSAVE35.\n\nNous espérons vous revoir très bientôt !\n\nL'équipe Retenza"
        });
        templates.push({
          label: "🌟 Offre Rétention VIP (-30%)",
          subject: "Une offre exceptionnelle pour vous retenir, {nom}",
          body: "Bonjour {nom},\n\nVous êtes l'un de nos clients les plus précieux, mais nous avons remarqué que vous vous faisiez rare !\n\nPour vous remercier de votre fidélité historique, voici une remise exceptionnelle de 30% : VIPRETOUR30.\n\nÀ très vite !"
        });
      } else if (highChurnRatio >= 0.3) {
        templates.push({
          label: "🌟 Offre Rétention VIP (-30%)",
          subject: "Une offre spéciale pour vous retenir, {nom}",
          body: "Bonjour {nom},\n\nVous êtes l'un de nos clients les plus précieux, mais nous avons remarqué que vous vous faisiez rare !\n\nPour vous remercier de votre fidélité historique, voici une remise exceptionnelle de 30% : VIPRETOUR30.\n\nÀ très vite !"
        });
        templates.push({
          label: "🎁 Avantage Privilège VIP (-10%)",
          subject: "Votre privilège du mois, {nom}",
          body: "Bonjour {nom},\n\nPour célébrer votre statut VIP ce mois-ci, profitez d'une petite attention de 10% sur tous nos articles avec le code : VIPPRIVILEGE.\n\nL'équipe Retenza"
        });
      } else {
        templates.push({
          label: "🌟 Remerciement Fidélité VIP",
          subject: "Merci pour votre fidélité incroyable, {nom} !",
          body: "Bonjour {nom},\n\nEn tant que client VIP majeur, nous vous offrons un accès en avant-première à nos nouvelles collections. Merci pour votre confiance absolue !\n\nL'équipe Retenza"
        });
        templates.push({
          label: "🎁 Avantage Privilège VIP (-10%)",
          subject: "Votre privilège du mois, {nom}",
          body: "Bonjour {nom},\n\nPour célébrer votre statut VIP ce mois-ci, profitez d'une attention de 10% sur tous nos articles avec le code : VIPPRIVILEGE.\n\nL'équipe Retenza"
        });
      }
    } else if (dominantSeg === "at_risk") {
      if (highChurnRatio >= 0.4) {
        templates.push({
          label: "🔥 Réactivation Urgente (-20%)",
          subject: "{nom}, nous pensons à vous — une offre exclusive vous attend",
          body: "Bonjour {nom},\n\nNotre équipe a détecté que vous n'avez pas commandé depuis un moment. Pour vous remercier de votre confiance, voici une remise de 20% sur votre prochain achat : REACTIVATION20.\n\nNous comptons sur votre retour !"
        });
        templates.push({
          label: "🎯 Sondage Satisfaction (+10%)",
          subject: "Votre avis compte pour nous, {nom}",
          body: "Bonjour {nom},\n\nNous souhaitons améliorer notre service. Auriez-vous 2 minutes pour nous donner votre avis ?\n\nEn retour, recevez un bon de réduction de 10%."
        });
      } else {
        templates.push({
          label: "💡 Rappel Amical (-15%)",
          subject: "Vous nous manquez, {nom} !",
          body: "Bonjour {nom},\n\nCela fait un moment que nous ne vous avons pas vu ! Pour fêter votre retour, bénéficiez de 15% de réduction avec le code : REVIENS15.\n\nHâtez-vous, l'offre est limitée !"
        });
      }
    } else if (dominantSeg === "lost") {
      if (highChurnRatio >= 0.4) {
        templates.push({
          label: "💔 Reconquête Dernière Chance (-30%)",
          subject: "{nom}, une dernière offre pour votre retour 💔",
          body: "Bonjour {nom},\n\nCela fait longtemps que nous ne vous avons pas vu ! Nous avons préparé une offre spéciale de reconquête rien que pour vous : 30% de remise avec le code RETOUR30.\n\nCette offre est valable 7 jours. Ne la manquez pas !"
        });
      } else {
        templates.push({
          label: "❤️ Offre de Retour (-25%)",
          subject: "Une offre spéciale pour votre retour, {nom}",
          body: "Bonjour {nom},\n\nNous espérons que tout va bien ! Pour marquer votre retour parmi nous, bénéficiez d'une remise exceptionnelle de 25% avec le code : RETOUR25."
        });
      }
    } else {
      if (highChurnRatio >= 0.4) {
        templates.push({
          label: "⚡ Stimulation Proactive (-15%)",
          subject: "Nos meilleures offres vous attendent, {nom} !",
          body: "Bonjour {nom},\n\nNe laissez pas passer nos nouvelles promotions ! Profitez de 15% de réduction sur votre prochain achat avec le code : PROMO15.\n\nOffre valable cette semaine seulement."
        });
      } else {
        templates.push({
          label: "💡 Découverte Nouveautés",
          subject: "Nos nouveautés vous attendent, {nom} !",
          body: "Bonjour {nom},\n\nDe nouveaux produits viennent d'arriver ! Venez découvrir notre sélection qui pourrait vous plaire.\n\nÀ très bientôt !"
        });
        templates.push({
          label: "🔔 Rappel de Promotion (-10%)",
          subject: "Une promotion rien que pour vous, {nom}",
          body: "Bonjour {nom},\n\nProfitez de 10% de réduction sur votre prochain achat avec le code : MERCI10. Offre valable 7 jours."
        });
      }
    }
    return { dominantSeg, highChurnPct: Math.round(highChurnRatio * 100), templates };
  };

  const handleSendGroupCampaign = async () => {
    if (!groupSubject.trim() || !groupBody.trim()) {
      alert("Veuillez remplir le sujet et le corps de l'e-mail.");
      return;
    }
    setLoading(true);

    const clientsToSend = filteredClients.map(c => ({
      email: c.email || c.client_db_id,
      nom: c.nom || c.email || c.client_db_id,
      segment: c.segment_gmm || getFallbackSegment(c)
    }));

    const activeFilters = {
      onlyBaisse: onlyFreqDrop,
      onlyAmbassadors: onlyAmbassadors,
      segment_gmm: selectedSegment,
      close_to_palier: onlyCloseToPalier
    };

    try {
      const res = await fetch("http://localhost:5000/api/campaigns/send-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clients: clientsToSend,
          subject: groupSubject,
          body: groupBody,
          commerce_id: selectedCommerce,
          filters: activeFilters
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(data.message || "Campagne groupée envoyée avec succès !");
        setIsGroupModalOpen(false);
        setGroupSubject("");
        setGroupBody("");
        setGroupSelectedTemplateIndex(null);
      } else {
        alert(data.error || "Erreur lors de l'envoi groupé.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la campagne.");
    } finally {
      setLoading(false);
    }
  };

  const triggerSmartAutomation = async () => {
    if (!confirm("Voulez-vous lancer l'Automatisation Intelligente ? Le système va analyser tous les clients et leur envoyer un e-mail sur-mesure automatiquement.")) {
      return;
    }

    setAutomationRunning(true);
    setAutomationProgress("Démarrage...");

    try {
      const res = await fetch("http://localhost:5000/api/campaigns/trigger-automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commerce_id: selectedCommerce })
      });
      const data = await res.json();
      if (data.status === "busy") {
        alert("⏳ " + data.message);
        setAutomationRunning(false);
        return;
      }

      // Status 'started' -> start polling
      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed += 3;
        setAutomationProgress(`IA en cours... (${elapsed}s)`);
        try {
          const sr = await fetch("http://localhost:5000/api/campaigns/automation-status");
          const sd = await sr.json();
          if (!sd.running) {
            clearInterval(interval);
            setAutomationRunning(false);
            setAutomationProgress("");
            if (sd.result && sd.result.status === "success") {
              const s = sd.result.stats || {};
              alert(
                sd.result.message +
                '\n\nAnniversaires: ' + (s.birthday_gift || 0) +
                ' | VIP Sauvés: ' + (s.vip_danger || 0) +
                ' | VIP pur: ' + (s.vip || 0) +
                ' | Risque: ' + (s.at_risk || 0) +
                ' | Réguliers: ' + (s.regular || 0) +
                ' | Perdus: ' + (s.lost || 0) +
                ' | Cooldown ignorés: ' + (s.skipped_cooldown || 0)
              );
            } else if (sd.error) {
              alert("❌ Erreur automatisation : " + sd.error);
            }
          }
        } catch (e) {
          // Momentarily offline
        }
      }, 3000);

    } catch (err) {
      console.error(err);
      alert("Erreur lors du déclenchement de l'automatisation.");
      setAutomationRunning(false);
    }
  };

  // getFallbackSegment moved above useMemo — see line ~198

  const getFilteredTransactions = () => {
    if (!clientDetails?.transactions) return [];
    let txs = [...clientDetails.transactions];

    if (drawerTxPeriod !== "all") {
      const days = parseInt(drawerTxPeriod, 10);
      const limit = new Date();
      limit.setDate(limit.getDate() - days);
      txs = txs.filter(tx => new Date(tx.date_transaction) >= limit);
    }

    txs.sort((a, b) => {
      if (drawerTxSort === "date_desc") {
        return new Date(b.date_transaction).getTime() - new Date(a.date_transaction).getTime();
      } else if (drawerTxSort === "date_asc") {
        return new Date(a.date_transaction).getTime() - new Date(b.date_transaction).getTime();
      } else if (drawerTxSort === "amount_desc") {
        return b.montant - a.montant;
      } else if (drawerTxSort === "amount_asc") {
        return a.montant - b.montant;
      }
      return 0;
    });

    return txs;
  };

  const getFilteredCampaigns = () => {
    if (!clientDetails?.campaignHistory) return [];
    let camps = [...clientDetails.campaignHistory];

    if (drawerCampaignType === "individual") {
      camps = camps.filter(c => c.status === "simulated" || c.status === "sent" || c.status === "failed" || c.status === "sent_manual");
    } else if (drawerCampaignType === "group") {
      camps = camps.filter(c => c.status === "simulated_batch" || c.status === "sent_batch" || c.status === "failed_batch" || c.status === "sent_batch");
    } else if (drawerCampaignType === "ai") {
      camps = camps.filter(c => c.status === "simulated_auto" || c.status === "sent_auto" || c.status === "failed_auto");
    }

    return camps;
  };

  const getIndividualCampaignTemplates = (client: ClientData) => {
    const score = client.churn_score || 0;
    const gmmSeg = client.segment_gmm || getFallbackSegment(client);
    const completedCount = clientDetails?.referralDetail?.rewards?.completed_count || 0;
    const clientName = client.nom;
    const scoreInfluence = client.influence_score !== undefined
      ? client.influence_score
      : Math.round(((client.score_global_sa || 0) * 0.7 + (1.0 - (client.churn_score || 0)) * 0.3) * 100);

    const templates = [];

    // Ambassador templates according to parrainage count
    if (scoreInfluence >= 80) {
      const refCode = clientDetails?.referralDetail?.referral_code || `REF-${(clientName || 'CLIENT').toUpperCase().replace(/\s+/g, '-').substring(0, 10)}-PARRAIN`;
      if (completedCount >= 5) {
        templates.push({
          label: "👑 Ambassadeur VIP Félicitations",
          subject: `${clientName}, vous êtes notre Ambassadeur VIP ! 👑🏆`,
          body: `Bonjour ${clientName},\n\nFélicitations ! Vous avez atteint le niveau maximum de notre programme Ambassadeur avec ${completedCount} parrainages complétés !\n\n🏆 Votre récompense VIP : Statut Ambassadeur VIP + Cadeau exclusif\n📌 Code à utiliser : VIPAMBASSADEUR\n\nVous faites partie de notre cercle d'ambassadeurs les plus précieux. Merci infiniment pour votre confiance et votre rayonnement autour de vous.\n\nL'équipe Retenza 💛`
        });
      } else if (completedCount >= 3) {
        templates.push({
          label: `👑 VIP à portée — encore ${5 - completedCount} filleuls`,
          subject: `${clientName}, le statut VIP est à portée de main ! 🚀`,
          body: `Bonjour ${clientName},\n\nBravo ! Vous avez déjà complété ${completedCount} parrainages et débloqué votre réduction de -20% (code : PARRAIN20).\n\n🎯 Prochain objectif : encore ${5 - completedCount} filleul(s) pour décrocher le Statut Ambassadeur VIP + Cadeau exclusif (code : VIPAMBASSADEUR).\n\n🔗 Votre code de parrainage : ${refCode}\n\nContinuez à partager et à nous recommander — vous êtes presque au sommet !\n\nL'équipe Retenza 💛`
        });
      } else if (completedCount >= 1) {
        templates.push({
          label: `👑 -20% à débloquer — encore ${3 - completedCount} filleuls`,
          subject: `${clientName}, continuez sur votre lancée ! -20% vous attend 🎯`,
          body: `Bonjour ${clientName},\n\nExcellent départ ! Vous avez déjà complété ${completedCount} parrainage(s) et bénéficié de -10% sur votre prochain achat (code : PARRAIN10).\n\n🎯 Prochain objectif : encore ${3 - completedCount} filleul(s) pour débloquer -20% sur votre prochain achat (code : PARRAIN20).\n\n🔗 Votre code de parrainage : ${refCode}\n\nPartagez-le avec vos proches et profitez des récompenses qui vous attendent !\n\nL'équipe Retenza 💛`
        });
      } else {
        templates.push({
          label: "👑 Inviter comme Ambassadeur",
          subject: `${clientName}, devenez notre Ambassadeur officiel ! 👑`,
          body: `Bonjour ${clientName},\n\nNous sommes ravis de vous compter parmi nos meilleurs clients et nous souhaitons vous en remercier d'une façon toute particulière.\n\nGrâce à votre fidélité exceptionnelle, l'IA de Retenza vous a sélectionné(e) comme l'un de nos Ambassadeurs officiels !\n\n🎯 Votre code de parrainage exclusif : ${refCode}\n\nComment ça marche ?\n1. Partagez ce code à vos amis et votre entourage.\n2. Pour chaque ami qui vient acheter chez nous avec votre code, vous gagnez :\n   - 1 filleul  → -10% sur votre prochain achat (PARRAIN10)\n   - 3 filleuls → -20% sur votre prochain achat (PARRAIN20)\n   - 5 filleuls → Statut VIP + avantages exclusifs (VIPAMBASSADEUR)\n\nMerci pour votre confiance et votre fidélité.\n\nL'équipe Retenza 💛`
        });
      }
    }

    if (gmmSeg === "vip") {
      if (score >= 0.55) {
        templates.push({
          label: "🚨 Rétention VIP Urgente (-35%)",
          subject: "Nous ne voulons pas vous perdre, {nom} ! Offre VIP exclusive 🚨",
          body: "Bonjour {nom},\n\nNous avez remarqué que vous vous faisiez rare, et cela nous préoccupe sincèrement.\n\nEn tant que client VIP, vous méritez une attention toute particulière. Voici une remise exceptionnelle de 35% sur votre prochain achat : VIPSAVE35.\n\nNous espérons vous revoir très bientôt !\n\nL'équipe Retenza"
        });
      } else {
        templates.push({
          label: "🌟 Remerciement Fidélité VIP",
          subject: "Merci pour votre fidélité incroyable, {nom} !",
          body: "Bonjour {nom},\n\nEn tant que client VIP majeur, nous vous offrons un accès en avant-première à nos nouvelles collections. Merci pour votre confiance absolue !\n\nL'équipe Retenza"
        });
        templates.push({
          label: "🎁 Avantage Privilège VIP (-10%)",
          subject: "Votre privilège VIP du mois, {nom} ! 🎁",
          body: "Bonjour {nom},\n\nPour vous remercier de votre fidélité parmi nos clients VIP les plus précieux, nous avons le plaisir de vous offrir un code promo exclusif de -10% sur l'ensemble de notre catalogue.\n\n📌 Code avantage : VIPPRIVILEGE10\n\nÀ très bientôt pour vos prochains achats !\n\nL'équipe Retenza 💛"
        });
      }
    } else if (gmmSeg === "at_risk") {
      templates.push({
        label: "🔥 Réactivation Urgente (-20%)",
        subject: "{nom}, nous pensons à vous — une offre exclusive vous attend",
        body: "Bonjour {nom},\n\nNotre équipe a détecté que vous n'avez pas commandé depuis un moment. Pour vous remercier de votre confiance, voici une remise de 20% sur votre prochain achat : REACTIVATION20.\n\nNous comptons sur votre retour !"
      });
    } else if (gmmSeg === "lost") {
      templates.push({
        label: "💔 Reconquête Dernière Chance (-30%)",
        subject: "{nom}, une dernière offre pour votre retour 💔",
        body: "Bonjour {nom},\n\nCela fait longtemps que nous ne vous avons pas vu ! Nous avons préparé une offre spéciale de reconquête : 30% de remise avec le code RETOUR30.\n\nCette offre est valable 7 jours."
      });
    } else {
      templates.push({
        label: "💡 Découverte Nouveautés",
        subject: "Nos nouveautés vous attendent, {nom} !",
        body: "Bonjour {nom},\n\nDe nouveaux produits viennent d'arriver ! Venez découvrir notre sélection qui pourrait vous plaire.\n\nÀ très bientôt !"
      });
    }

    // 1. Proximity to Loyalty Tier Template
    const pts = client.points_cumules || 0;
    if ((pts >= 80 && pts < 100) || (pts >= 180 && pts < 200)) {
      const nextTierPoints = pts < 100 ? 100 : 200;
      const pointsNeeded = nextTierPoints - pts;
      const rewardCode = nextTierPoints === 100 ? "FID10" : "FID20";
      const rewardDesc = nextTierPoints === 100 ? "-10% de réduction" : "-20% de réduction";

      templates.push({
        label: "🎯 Objectif Palier Fidélité Proche",
        subject: `Plus que ${pointsNeeded} points pour votre réduction, {nom} ! 🎯`,
        body: `Bonjour {nom},\n\nVous êtes tout près du but ! Vous cumulez actuellement ${pts} points de fidélité.\n\nIl ne vous manque plus que ${pointsNeeded} points pour franchir le palier de ${nextTierPoints} points et débloquer automatiquement votre récompense :\n👉 ${rewardDesc} (Code promo : ${rewardCode})\n\nFaites un achat dès aujourd'hui pour valider votre code avantage !\n\nL'équipe Retenza 💛`
      });
    }

    // 2. Frequency Drop Template
    if (client.baisse_frequence_detectee) {
      templates.push({
        label: "📉 Relance Baisse Fréquence",
        subject: "Vous nous manquez, {nom} ! Une petite attention pour votre retour 💛",
        body: `Bonjour {nom},\n\nNous avons remarqué que vos visites se sont espacées ces derniers temps. Votre fidélité nous est précieuse !\n\nPour fêter votre retour, profitez d'une offre spéciale de -15% sur votre prochain achat :\n👉 Code promo : RETOUR15\n\nÀ très bientôt dans nos boutiques !\n\nL'équipe Retenza 💛`
      });
    }

    return templates.map(t => ({
      label: t.label,
      subject: t.subject.replace(/{nom}/g, clientName),
      body: t.body.replace(/{nom}/g, clientName)
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.7) return "bg-emerald-500 text-emerald-600";
    if (score >= 0.4) return "bg-amber-500 text-amber-600";
    return "bg-rose-500 text-rose-600";
  };

  const getSegmentBadge = (c: ClientData) => {
    const rawSeg = (c.segment_gmm || getFallbackSegment(c)).toLowerCase().trim();
    let normKey = "regular";
    if (rawSeg.includes("vip")) normKey = "vip";
    else if (rawSeg.includes("reg") || rawSeg.includes("rég")) normKey = "regular";
    else if (rawSeg.includes("risk") || rawSeg.includes("risq")) normKey = "at_risk";
    else if (rawSeg.includes("lost") || rawSeg.includes("perd")) normKey = "lost";

    const dots: Record<string, string> = {
      vip: "#3F9142",
      regular: "#736C72",
      at_risk: "#C0781F",
      lost: "#C31F3C"
    };

    const labels: Record<string, string> = {
      vip: "VIP",
      regular: "Régulier",
      at_risk: "À risque",
      lost: "Perdu"
    };

    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#17151A]">
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: dots[normKey] }} />
        {labels[normKey]}
      </span>
    );
  };

  const getChurnBadge = (c: ClientData) => {
    const score = c.churn_score || 0;
    const label = c.churn_risk_label || "Inconnu";
    const pct = (score * 100).toFixed(0);

    if (score === 0 && label === "Inconnu") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#A39C9F]">
          <span className="w-[7px] h-[7px] rounded-full bg-[#A39C9F] shrink-0" />
          Inconnu
        </span>
      );
    }

    let dotColor = "#3F9142";
    if (score >= 0.75) dotColor = "#C31F3C";
    else if (score >= 0.55) dotColor = "#C31F3C";
    else if (score >= 0.3) dotColor = "#C0781F";

    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#17151A]">
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
        {label} ({pct}%)
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Gestion des Clients"
        subtitle="Segmentation RFM et scores d'attrition."
      >
        {/* Boutique Selector */}
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

        <a
          href={`http://localhost:5000/api/export/clients?commerce_id=${selectedCommerce}`}
          download
          className="bg-white border border-[#EEE5DF] hover:bg-[#FAF3EE] text-[#7A6E68] px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Exporter CSV
        </a>

        <div className="text-xs font-bold bg-[#FDECEA] text-[#E8462F] px-4 py-2 rounded-xl border border-[#E8D9CF] shadow-sm shrink-0">
          Cibles : <span className="text-sm font-extrabold">{filteredClients.length}</span> / {clients.length}
        </div>
      </PageHeader>

      <div className="flex-1 pt-1 pb-6 px-6 md:pt-2 md:pb-8 md:px-8 max-w-7xl mx-auto w-full flex flex-col">

        {/* ── FILTER PANEL ── */}
        <div className="bg-white border border-[#E9E4DD] rounded-lg p-5 mb-6 shrink-0">
          {/* Row 1: flex layout — selects share equal space, Statut fills what's needed */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Tranche de Valeur — flex-1 */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736C72]">Tranche de Valeur</label>
              <select
                value={selectedValueTier}
                onChange={(e) => setSelectedValueTier(e.target.value)}
                className="w-full bg-white border border-[#E9E4DD] rounded-md px-3 py-2 text-[13px] text-[#17151A] outline-none focus:border-[#C31F3C] transition-colors cursor-pointer"
              >
                <option value="all">Tous</option>
                <option value="low">Petit client (&lt; 50 DT)</option>
                <option value="medium">Client moyen (50–200 DT)</option>
                <option value="high">Grand client (200–500 DT)</option>
                <option value="premium">Client premium (&gt; 500 DT)</option>
              </select>
            </div>

            {/* Risque de Churn — flex-1 */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736C72]">Risque de Churn</label>
              <select
                value={selectedChurnRisk}
                onChange={(e) => setSelectedChurnRisk(e.target.value)}
                className="w-full bg-white border border-[#E9E4DD] rounded-md px-3 py-2 text-[13px] text-[#17151A] outline-none focus:border-[#C31F3C] transition-colors cursor-pointer"
              >
                <option value="all">Tous</option>
                <option value="Faible">Faible (&lt; 30%)</option>
                <option value="Moyen">Moyen (30–55%)</option>
                <option value="Élevé">Élevé (55–75%)</option>
                <option value="Critique">Critique (≥ 75%)</option>
              </select>
            </div>

            {/* Historique — flex-1 */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736C72]">Historique</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-white border border-[#E9E4DD] rounded-md px-3 py-2 text-[13px] text-[#17151A] outline-none focus:border-[#C31F3C] transition-colors cursor-pointer"
              >
                <option value="all">Complet</option>
                <option value="180">6 derniers mois</option>
                <option value="90">90 derniers jours</option>
                <option value="30">30 derniers jours</option>
              </select>
            </div>

            {/* Statut — pills, auto width, no shrink */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[#736C72]">Statut</label>
              <div className="flex gap-1" style={{ flexWrap: "nowrap" }}>
                {[
                  { id: "all", label: "Tous" },
                  { id: "vip", label: "VIP" },
                  { id: "regular", label: "Régulier" },
                  { id: "at_risk", label: "À risque" },
                  { id: "lost", label: "Perdu" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setSelectedSegment(pill.id)}
                    className={`px-2.5 py-2 rounded-md text-[12px] font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      selectedSegment === pill.id
                        ? "bg-[#17151A] border-[#17151A] text-white"
                        : "bg-white border-[#E9E4DD] text-[#736C72] hover:border-[#736C72]"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#E9E4DD] my-4" />

          {/* Row 2: Quick chips + Reset */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setOnlyRgpdOptOut(!onlyRgpdOptOut); if (!onlyRgpdOptOut) setSelectedValueTier("all"); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                  onlyRgpdOptOut
                    ? "bg-[#17151A] border-[#17151A] text-white"
                    : "bg-white border-[#E9E4DD] text-[#736C72] hover:border-[#736C72]"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                RGPD
              </button>

              <button
                onClick={() => { setOnlyAmbassadors(!onlyAmbassadors); if (!onlyAmbassadors) setSelectedValueTier("all"); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                  onlyAmbassadors
                    ? "bg-[#17151A] border-[#17151A] text-white"
                    : "bg-white border-[#E9E4DD] text-[#736C72] hover:border-[#736C72]"
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                Potentiels Ambassadeurs
              </button>

              <button
                onClick={() => { setOnlyFreqDrop(!onlyFreqDrop); if (!onlyFreqDrop) setSelectedValueTier("all"); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                  onlyFreqDrop
                    ? "bg-[#17151A] border-[#17151A] text-white"
                    : "bg-white border-[#E9E4DD] text-[#736C72] hover:border-[#736C72]"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                Baisse Fréquence
              </button>

              <button
                onClick={() => { setOnlyCloseToPalier(!onlyCloseToPalier); if (!onlyCloseToPalier) setSelectedValueTier("all"); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors cursor-pointer ${
                  onlyCloseToPalier
                    ? "bg-[#17151A] border-[#17151A] text-white"
                    : "bg-white border-[#E9E4DD] text-[#736C72] hover:border-[#736C72]"
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                Proche Palier
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={() => {
                setSelectedValueTier("all");
                setSelectedSegment("all");
                setSelectedChurnRisk("all");
                setSelectedPeriod("all");
                setOnlyAmbassadors(false);
                setOnlyFreqDrop(false);
                setOnlyCloseToPalier(false);
                setOnlyRgpdOptOut(false);
                setSearchQuery("");
              }}
              className="inline-flex items-center gap-1.5 text-[12px] text-[#736C72] hover:text-[#C31F3C] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Main clients Table */}
        <div className="bg-white border border-[#EEE5DF] rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          {loading && filteredClients.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#E8462F] animate-spin" />
              <p className="text-xs text-slate-400 font-bold mt-3">Chargement des clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="w-10 h-10 text-slate-300" />
              <p className="text-sm text-slate-500 font-bold mt-3">Aucun client trouvé</p>
              <p className="text-xs text-slate-400 mt-1">
                Modifiez vos critères de recherche ou de filtrage.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-auto max-h-[60vh]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[#FAF3EE] sticky top-0 z-10 border-b border-[#EEE5DF] text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 min-w-[260px]">Client</th>
                    <th className="px-6 py-4">Segment GMM</th>
                    <th className="px-6 py-4 w-[130px] whitespace-nowrap">Risque Churn</th>
                    <th className="px-6 py-4">Récence</th>
                    <th className="px-6 py-4">Fréquence</th>
                    <th className="px-6 py-4">Montant</th>
                    <th className="px-6 py-4">Scores R·F·M</th>
                    <th className="px-6 py-4 text-right">Score Sa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const rVal = client.recency_score ?? client.score_r ?? 0;
                    const fVal = client.frequency_score ?? client.score_f ?? 0;
                    const mVal = client.monetary_score ?? client.score_m ?? 0;
                    const isAmbassador =
                      (client.influence_score !== undefined && client.influence_score !== null
                        ? Number(client.influence_score)
                        : Math.round(((client.score_global_sa || 0) * 0.7 + (1.0 - (client.churn_score || 0)) * 0.3) * 100)
                      ) >= 80;

                    const deltaVal = client.delta_frequence !== undefined && client.delta_frequence !== null ? Math.round(Math.abs(client.delta_frequence) * 100) : null;
                    // @ts-expect-error fixing types
                    const probGmm = client.probability_gmm || (client.probabilities_gmm && typeof client.probabilities_gmm === "object" ? Object.values(client.probabilities_gmm)[0] : null);

                    return (
                      <tr
                        key={client.client_db_id || client.email}
                        onClick={() => handleRowClick(client)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      >
                        {/* Name and Email */}
                        <td className="px-6 py-4 min-w-[260px]">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#1A1A1A]">{client.nom}</span>
                              {isAmbassador && (
                                <span
                                  title="Ambassadeur"
                                  className="inline-flex items-center justify-center bg-yellow-100 text-yellow-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                                >
                                  👑
                                </span>
                              )}
                              {client.baisse_frequence_detectee && (
                                <span
                                  title="Baisse de fréquence"
                                  className="inline-flex items-center justify-center bg-red-100 text-red-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
                                >
                                  📉 {deltaVal !== null ? `${deltaVal}%` : ""}
                                </span>
                              )}
                              {client.rgpd_opt_out && (
                                <span
                                  title="Désabonné du ciblage marketing (RGPD)"
                                  className="inline-flex items-center justify-center bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 shrink-0"
                                >
                                  <ShieldAlert className="w-3 h-3 text-[#7A6E68]" />
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 truncate">{client.email}</span>
                          </div>
                        </td>

                        {/* GMM Segment */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            {getSegmentBadge(client)}
                            {probGmm !== undefined && probGmm !== null && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                Confiance: {(parseFloat(probGmm) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Churn Risk */}
                        <td className="px-6 py-4 w-[130px] whitespace-nowrap">{getChurnBadge(client)}</td>

                        {/* Recency */}
                        <td className="px-6 py-4 whitespace-nowrap text-[#7A6E68]">
                          <strong className="text-slate-800 font-bold">{client.recency}</strong> jours
                        </td>

                        {/* Frequency */}
                        <td className="px-6 py-4 whitespace-nowrap text-[#7A6E68]">
                          <strong className="text-slate-800 font-bold">{client.frequency}</strong> achats
                        </td>

                        {/* Monetary */}
                        <td className="px-6 py-4 whitespace-nowrap text-[#7A6E68]">
                          <strong className="text-[#E8462F] font-bold">
                            {(client.monetary ?? 0).toFixed(2)} DT
                          </strong>
                        </td>

                        {/* Scores R·F·M stacked */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 min-w-[90px]">
                            {/* Score R */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="w-5 text-[#A39C9F] font-semibold shrink-0">R</span>
                              <div className="flex-1 h-1.5 bg-[#E9E4DD] rounded-full overflow-hidden">
                                <div className="h-full bg-[#17151A] rounded-full" style={{ width: `${rVal * 100}%` }} />
                              </div>
                              <span className="font-medium w-8 text-right text-[#736C72]">{rVal.toFixed(2)}</span>
                            </div>
                            {/* Score F */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="w-5 text-[#A39C9F] font-semibold shrink-0">F</span>
                              <div className="flex-1 h-1.5 bg-[#E9E4DD] rounded-full overflow-hidden">
                                <div className="h-full bg-[#17151A] rounded-full" style={{ width: `${fVal * 100}%` }} />
                              </div>
                              <span className="font-medium w-8 text-right text-[#736C72]">{fVal.toFixed(2)}</span>
                            </div>
                            {/* Score M */}
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="w-5 text-[#A39C9F] font-semibold shrink-0">M</span>
                              <div className="flex-1 h-1.5 bg-[#E9E4DD] rounded-full overflow-hidden">
                                <div className="h-full bg-[#17151A] rounded-full" style={{ width: `${mVal * 100}%` }} />
                              </div>
                              <span className="font-medium w-8 text-right text-[#736C72]">{mVal.toFixed(2)}</span>
                            </div>
                          </div>
                        </td>

                        {/* Global Sa Score */}
                        <td className="px-6 py-4 text-right">
                          <span
                            className="font-bold text-sm"
                            style={{
                              fontFamily: "'Fraunces', Georgia, serif",
                              color: (client.score_global_sa ?? 0) >= 0.7 ? "#C31F3C" : "#17151A"
                            }}
                          >
                            {(client.score_global_sa ?? 0).toFixed(3)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Dynamic Sliding Drawer connected to live APIs */}
        {isDrawerOpen && selectedClient && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            ></div>

            {/* Drawer Panel */}
            <div className="relative w-[600px] max-w-full bg-white h-full shadow-2xl flex flex-col border-l border-[#E9E4DD] animate-fade-in z-10">
              {/* Header */}
              <div className="p-6 border-b border-[#E9E4DD] flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-[#C31F3C] flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                    {selectedClient.nom.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-[#17151A] text-base">{selectedClient.nom}</h3>
                      {selectedClient.rgpd_opt_out && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F5D7CD] text-[#8A1329] border border-[#C31F3C]/20">
                          <ShieldAlert className="w-3 h-3" /> RGPD
                        </span>
                      )}
                      {clientDetails?.referralDetail?.is_ambassador && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          👑 Ambassadeur
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#A39C9F] font-medium mt-0.5 truncate">{selectedClient.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-[#F7F4EF] flex items-center justify-center text-[#A39C9F] hover:text-[#17151A] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab navigation bar */}
              <div className="flex border-b border-[#E9E4DD] shrink-0 bg-white px-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[
                  { id: "profile", label: "Profil & RFM", icon: Users },
                  { id: "txs", label: "Achats", icon: CreditCard },
                  { id: "loyalty", label: "Fidélité", icon: Gift },
                  { id: "referrals", label: "Parrainage", icon: Crown },
                  { id: "campaigns", label: "Campagnes", icon: Mail },
                  { id: "actions", label: "Actions", icon: Sparkles }
                ].map((tab) => {
                  const isActive = drawerTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDrawerTab(tab.id as any)}
                      className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer rounded-lg ${
                        isActive ? "text-[#C31F3C] bg-[#C31F3C]/5" : "text-[#736C72] hover:text-[#17151A] hover:bg-[#C31F3C]/5"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      {isActive && (
                        <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#C31F3C]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {detailsLoading ? (
                  <div className="h-full flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-[#E8462F] animate-spin" />
                    <p className="text-xs text-slate-400 font-bold mt-2">Chargement des données en parallèle...</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: Profile & RFM */}
                    {drawerTab === "profile" && (
                      <div className="space-y-5 animate-fade-in">
                        {/* GMM Segment Probability Distribution — Pie Chart */}
                        {(() => {
                          // @ts-expect-error fixing types
                          let probs = selectedClient.probabilities_gmm;
                          if (Array.isArray(probs)) probs = probs[0] || probs;

                          if (probs && typeof probs === "object" && Object.keys(probs).length > 0) {
                            // Exact color palette matching the user specifications
                            const probMap: Record<string, { label: string; color: string }> = {
                              at_risk: { label: "À risque", color: "#DD2C1F" }, // Rouge Retenza principal
                              regular: { label: "Régulier", color: "#E9685D" }, // Rouge corail clair
                              vip:     { label: "VIP",      color: "#F5B8B2" }, // Rose très clair
                              lost:    { label: "Perdu",    color: "#6B0F1A" },
                            };

                            const slices = Object.entries(probs)
                              .map(([k, v]) => ({
                                key: k,
                                val: parseFloat(v as string),
                                cfg: probMap[k] || { label: k, color: "#A39C9F" },
                              }))
                              .filter(s => s.val > 0.001)
                              .sort((a, b) => {
                                // Match visual order from the reference: À risque first, then Régulier, then VIP
                                const order = ["at_risk", "regular", "vip", "lost"];
                                return order.indexOf(a.key) - order.indexOf(b.key);
                              });

                            // Build SVG Donut arcs
                            const size = 160;
                            const cx = size / 2;
                            const cy = size / 2;
                            const strokeWidth = 24;
                            const r = 55; // Inner radius for the stroke

                            const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
                              const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
                              return {
                                x: cx + (r * Math.cos(angleInRadians)),
                                y: cy + (r * Math.sin(angleInRadians))
                              };
                            };

                            let startAngle = 0;
                            const paths = slices.map((slice) => {
                              const sweep = slice.val * 360;
                              const endAngle = startAngle + sweep;
                              
                              // Create a 2 degree visual gap if there are multiple slices
                              const visualSweep = slices.length > 1 ? Math.max(0.1, sweep - 2.5) : sweep;
                              const visualEndAngle = startAngle + visualSweep;
                              
                              const largeArcFlag = visualSweep <= 180 ? "0" : "1";
                              
                              const start = polarToCartesian(cx, cy, r, startAngle);
                              const end = polarToCartesian(cx, cy, r, visualEndAngle);
                              
                              const d = slices.length === 1
                                ? "" // Handled separately via <circle>
                                : [
                                    "M", start.x, start.y, 
                                    "A", r, r, 0, largeArcFlag, 1, end.x, end.y
                                  ].join(" ");
                              
                              startAngle = endAngle; // Next slice starts where this one SHOULD end (including gap)
                              return { ...slice, d };
                            });

                            return (
                              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-4">
                                <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Analyse Probabiliste GMM</h4>
                                <div className="flex items-center gap-10">
                                  {/* Donut Chart */}
                                  <div className="relative shrink-0">
                                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                                      {/* Decorators (Triangles outside the donut) */}
                                      <g fill="#F5B8B2">
                                        <polygon points={`${cx-4},4 ${cx+4},4 ${cx},10`} />
                                        <polygon points={`${cx-4},156 ${cx+4},156 ${cx},150`} />
                                        <polygon points={`4,${cy-4} 4,${cy+4} 10,${cy}`} />
                                        <polygon points={`156,${cy-4} 156,${cy+4} 150,${cy}`} />
                                      </g>

                                      {/* Donut slices */}
                                      {slices.length === 1 ? (
                                        <circle cx={cx} cy={cy} r={r} fill="none" stroke={slices[0].cfg.color} strokeWidth={strokeWidth} />
                                      ) : (
                                        paths.map((p) => (
                                          <path 
                                            key={p.key} 
                                            d={p.d} 
                                            fill="none" 
                                            stroke={p.cfg.color} 
                                            strokeWidth={strokeWidth} 
                                            strokeLinecap="butt" 
                                          />
                                        ))
                                      )}

                                      {/* Center Text (Largest Slice) */}
                                      {slices.length > 0 && (
                                        <text 
                                          x={cx} 
                                          y={cy} 
                                          textAnchor="middle" 
                                          dominantBaseline="central" 
                                          fontSize="22" 
                                          fontWeight="800" 
                                          fill="#8A1329" 
                                        >
                                          {(slices[0].val * 100).toFixed(1)}%
                                        </text>
                                      )}
                                    </svg>
                                  </div>
                                  
                                  {/* Legend & Info */}
                                  <div className="flex-1 flex flex-col justify-center">
                                    <div className="space-y-4">
                                      {slices.map((slice) => (
                                        <div key={slice.key} className="flex items-center gap-3 text-[13px]">
                                          <span
                                            className="w-4 h-4 rounded-[4px] shrink-0"
                                            style={{ backgroundColor: slice.cfg.color }}
                                          />
                                          <span className="flex-1 text-[#17151A] font-semibold">{slice.cfg.label}</span>
                                          <span className="font-bold tabular-nums" style={{ color: slice.cfg.color }}>
                                            {(slice.val * 100).toFixed(1)}%
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* XGBoost Churn Jauge & Diagnostic */}
                        {(() => {
                          const score = selectedClient.churn_score || 0;
                          const label = selectedClient.churn_risk_label || "Indéterminé";
                          const percent = (score * 100).toFixed(1);
                          const gmmSeg = selectedClient.segment_gmm || getFallbackSegment(selectedClient);

                          // Colors matching the design for "Faible" green
                          let dotColor = "#5A9367";
                          let labelBg = "bg-[#EDF2EE]";
                          let labelText = "text-[#4B7355]";

                          if (score >= 0.75) { dotColor = "#C31F3C"; labelBg = "bg-[#F5D7CD]"; labelText = "text-[#8A1329]"; }
                          else if (score >= 0.55) { dotColor = "#C31F3C"; labelBg = "bg-[#F5D7CD]"; labelText = "text-[#C31F3C]"; }
                          else if (score >= 0.3) { dotColor = "#C0781F"; labelBg = "bg-amber-50"; labelText = "text-amber-700"; }

                          let diagnostic = "";
                          if (gmmSeg === "vip") {
                            if (score >= 0.75) diagnostic = "Alerte Critique : client VIP avec un risque de départ très élevé. Une action de rétention sur-mesure est urgente.";
                            else if (score >= 0.3) diagnostic = "Attention : client VIP montrant des signes de ralentissement (risque modéré). Proposez une offre de fidélité.";
                            else diagnostic = "Client VIP Fidèle : continuez à le choyer pour maintenir son engagement exceptionnel.";
                          } else if (gmmSeg === "lost") {
                            if (score >= 0.55) diagnostic = "Reconquête Difficile : client déjà Perdu avec une probabilité de non-retour élevée. Tentez une offre de la dernière chance.";
                            else diagnostic = "Opportunité : client classé Perdu mais avec un score d'attrition modéré. Bon candidat à la réactivation.";
                          } else if (gmmSeg === "at_risk") {
                            if (score >= 0.55) diagnostic = "Risque Élevé : client À Risque confirmé par XGBoost. Envoyez une offre promotionnelle incitative.";
                            else diagnostic = "Régularisation : client À Risque mais avec un score de churn sous contrôle. Suivi recommandé.";
                          } else {
                            if (score >= 0.55) diagnostic = "Alerte Churn : client Régulier qui commence à s'éloigner. Offre promotionnelle recommandée.";
                            else diagnostic = "Client Régulier Standard : comportement stable. Maintenez le contact via la newsletter.";
                          }

                          return (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-4">
                              <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Risque d'Attrition (XGBoost)</h4>
                              
                              <div className="flex items-center">
                                <div className="flex-1 flex flex-col items-center justify-center border-r border-[#E9E4DD] py-2">
                                  <span className="text-[11px] font-bold text-[#17151A] uppercase tracking-widest mb-1.5">Indicateur de Risque</span>
                                  <span className="text-3xl font-bold text-[#17151A] leading-none">{percent}%</span>
                                </div>
                                <div className="flex-1 flex items-center justify-center py-2">
                                  <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-[13px] font-semibold ${labelBg} ${labelText}`}>
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                                    {label}
                                  </span>
                                </div>
                              </div>

                              {(() => {
                                let diagType = "neutral";
                                if (diagnostic.includes("Alerte Critique") || diagnostic.includes("Reconquête Difficile") || diagnostic.includes("Risque Élevé")) diagType = "critical";
                                else if (diagnostic.includes("Attention") || diagnostic.includes("Alerte Churn") || diagnostic.includes("Fréquence en baisse")) diagType = "warning";
                                else if (diagnostic.includes("Fidèle") || diagnostic.includes("Opportunité") || diagnostic.includes("Standard")) diagType = "positive";
                                
                                const diagBg = diagType === "critical" ? "bg-[#F5D7CD]" : diagType === "warning" ? "bg-amber-50" : diagType === "positive" ? "bg-[#EDF2EE]" : "bg-[#F9F6F5]";
                                const diagIconColor = diagType === "critical" ? "text-[#C31F3C]" : diagType === "warning" ? "text-amber-600" : diagType === "positive" ? "text-[#5A9367]" : "text-[#6B7280]";
                                const diagIconBorder = diagType === "critical" ? "border-[#C31F3C]" : diagType === "warning" ? "border-amber-500" : diagType === "positive" ? "border-[#5A9367]" : "border-[#9CA3AF]";
                                
                                const parts = diagnostic.split(" : ");
                                const content = parts.length > 1 ? <><span className="font-bold text-[#17151A]">{parts[0]} :</span> {parts.slice(1).join(" : ")}</> : diagnostic;
                                
                                return (
                                  <div className={`p-4 rounded-xl text-[13px] text-[#4B5563] flex items-start gap-3 mt-4 ${diagBg}`}>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${diagIconBorder}`}>
                                      <span className={`text-[10px] font-bold ${diagIconColor}`}>i</span>
                                    </div>
                                    <div className="leading-relaxed">
                                      {content}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}

                        {/* RFM Details */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-4">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Statistiques RFM Réelles</h4>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-3 bg-[#F7F4EF] rounded-xl">
                              <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Récence</span>
                              <p className="text-2xl font-bold text-[#17151A] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{selectedClient.recency}</p>
                              <span className="text-[10px] text-[#A39C9F]">jours</span>
                            </div>
                            <div className="p-3 bg-[#F7F4EF] rounded-xl">
                              <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Fréquence</span>
                              <p className="text-2xl font-bold text-[#17151A] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{selectedClient.frequency}</p>
                              <span className="text-[10px] text-[#A39C9F]">achats</span>
                            </div>
                            <div className="p-3 bg-[#F7F4EF] rounded-xl">
                              <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Montant</span>
                              <p className="text-xl font-bold text-[#C31F3C] mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{(selectedClient.monetary ?? 0).toFixed(2)}</p>
                              <span className="text-[10px] text-[#A39C9F]">DT</span>
                            </div>
                          </div>
                        </div>

                        {/* Scores Detail */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Scores de Priorisation IA</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-[#736C72]">Score Global SmartAutomation (Sa)</span>
                              <span className="font-bold text-[#17151A] bg-[#F7F4EF] px-2 py-0.5 rounded border border-[#E9E4DD]">{(selectedClient.score_global_sa ?? 0).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-medium text-[#736C72]">Score d'Influence (Parrainage)</span>
                              <span className="font-bold text-[#17151A] bg-[#F7F4EF] px-2 py-0.5 rounded border border-[#E9E4DD]">
                                {clientDetails?.referralDetail?.influence_score ?? "—"} / 100
                              </span>
                            </div>
                            {selectedClient.baisse_frequence_detectee && (
                              <div className="p-2.5 bg-amber-50 rounded-lg text-xs text-[#736C72] flex items-start gap-2 mt-2">
                                <div className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-[8px] font-bold text-amber-600">i</span>
                                </div>
                                <span><span className="font-bold text-[#17151A]">Fréquence en baisse :</span> une diminution a été détectée ce mois-ci.</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: Transactions */}
                    {drawerTab === "txs" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Historique d'Achats ({clientDetails?.transactions?.length || 0})</h4>
                          <span className="text-xs text-[#C31F3C] font-bold">Total dépensé : {(selectedClient.monetary ?? 0).toFixed(2)} DT</span>
                        </div>

                        {/* Filters / Sort */}
                        {clientDetails?.transactions && clientDetails.transactions.length > 0 && (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={drawerTxPeriod}
                              onChange={(e) => setDrawerTxPeriod(e.target.value)}
                              className="bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] cursor-pointer"
                            >
                              <option value="all">Toute la période</option>
                              <option value="30">30 derniers jours</option>
                              <option value="90">90 derniers jours</option>
                              <option value="365">Cette année</option>
                            </select>
                            <select
                              value={drawerTxSort}
                              onChange={(e) => setDrawerTxSort(e.target.value)}
                              className="bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] cursor-pointer"
                            >
                              <option value="date_desc">⇅ Plus récentes</option>
                              <option value="date_asc">⇅ Plus anciennes</option>
                              <option value="amount_desc">💰 Montants élevés</option>
                              <option value="amount_asc">💰 Montants faibles</option>
                            </select>
                          </div>
                        )}

                        {(!clientDetails?.transactions || clientDetails.transactions.length === 0) ? (
                          <div className="text-center py-10 bg-[#F7F4EF] rounded-2xl border border-dashed border-[#E9E4DD]">
                            <p className="text-xs text-[#736C72] font-semibold">Aucune transaction enregistrée.</p>
                          </div>
                        ) : getFilteredTransactions().length === 0 ? (
                          <div className="text-center py-10 bg-[#F7F4EF] rounded-2xl border border-dashed border-[#E9E4DD]">
                            <p className="text-xs text-[#736C72] font-semibold">Aucune transaction pour ce filtre.</p>
                          </div>
                        ) : (
                          <div className="border border-[#E9E4DD] rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse bg-white">
                              <thead className="bg-[#F7F4EF] border-b border-[#E9E4DD] font-semibold text-[#736C72] text-[10px] uppercase tracking-wider">
                                <tr>
                                  <th className="p-3">ID Transaction</th>
                                  <th className="p-3">Date</th>
                                  <th className="p-3 text-right">Montant</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E9E4DD] text-[#736C72]">
                                {getFilteredTransactions().map((tx) => (
                                  <tr key={tx.id} className="hover:bg-[#F7F4EF]">
                                    <td className="p-3 font-mono text-[10px] text-[#A39C9F]">
                                      <div className="flex flex-col">
                                        <span className="text-[#17151A] font-medium">{tx.id || "tx_auto"}</span>
                                        <span className="text-[9px]">Réf: {tx.id || "N/A"}</span>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <span className="flex items-center gap-1.5 font-medium">
                                        <Calendar className="w-3.5 h-3.5 text-[#A39C9F]" />
                                        {new Date(tx.date_transaction).toLocaleDateString("fr-FR", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric"
                                        })}
                                      </span>
                                    </td>
                                    <td className="p-3 text-right font-bold text-[#17151A]">{(tx.montant ?? 0).toFixed(2)} DT</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: Loyalty */}
                    {drawerTab === "loyalty" && (
                      <div className="space-y-5 animate-fade-in">
                        {/* Loyalty KPI Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E9E4DD]">
                            <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Disponibles</span>
                            <strong className="text-2xl font-bold text-[#C31F3C] block mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                              {clientDetails?.loyaltyBalance?.points_disponibles ?? 0}
                            </strong>
                            <span className="text-[10px] text-[#A39C9F]">points</span>
                          </div>
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E9E4DD]">
                            <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Cumulés</span>
                            <strong className="text-2xl font-bold text-[#17151A] block mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                              {clientDetails?.loyaltyBalance?.points_cumules ?? 0}
                            </strong>
                            <span className="text-[10px] text-[#A39C9F]">depuis inscription</span>
                          </div>
                          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E9E4DD]">
                            <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wide block">Utilisés</span>
                            <strong className="text-2xl font-bold text-[#A39C9F] block mt-1" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                              {clientDetails?.loyaltyBalance?.points_utilises ?? 0}
                            </strong>
                            <span className="text-[10px] text-[#A39C9F]">de réduction</span>
                          </div>
                        </div>

                        {/* Tier progress */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">État des Paliers Fidélité</h4>
                          <div className="space-y-2">
                            {clientDetails?.loyaltyBalance?.paliers.map((palier) => (
                              <div key={palier.code} className="flex justify-between items-center text-xs p-2.5 bg-[#F7F4EF] rounded-xl border border-[#E9E4DD]">
                                <div>
                                  <span className="font-semibold text-[#17151A] block">{palier.code} ({palier.points_requis} pts)</span>
                                  <span className="text-[10px] text-[#A39C9F]">{palier.label}</span>
                                </div>
                                {palier.debloque ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#4C8C6B]/10 text-[#4C8C6B] border border-[#4C8C6B]/20">
                                    <span className="w-[6px] h-[6px] rounded-full bg-[#4C8C6B] shrink-0" />
                                    Débloqué
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F4EF] text-[#A39C9F] border border-[#E9E4DD]">
                                    <span className="w-[6px] h-[6px] rounded-full bg-[#A39C9F] shrink-0" />
                                    Verrouillé
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Points Transactions History */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Journal d'Audit des Points ({clientDetails?.loyaltyHistory?.length || 0})</h4>
                          {(!clientDetails?.loyaltyHistory || clientDetails.loyaltyHistory.length === 0) ? (
                            <div className="text-center py-6 bg-[#F7F4EF] rounded-xl border border-dashed border-[#E9E4DD]">
                              <p className="text-xs text-[#736C72] font-semibold">Aucun mouvement de points.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {clientDetails.loyaltyHistory.map((history, idx) => (
                                <div key={idx} className="bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl p-3 flex justify-between items-center text-xs">
                                  <div>
                                    <span className="font-semibold text-[#17151A] block">{history.description}</span>
                                    <span className="text-[10px] text-[#A39C9F]">
                                      {new Date(history.date).toLocaleDateString("fr-FR")} à {new Date(history.date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`font-bold text-sm block ${history.type === 'credit' ? 'text-[#4C8C6B]' : 'text-[#C31F3C]'}`}>
                                      {history.points > 0 ? `+${history.points}` : history.points} pts
                                    </span>
                                    <span className="text-[9px] text-[#A39C9F]">Solde : {history.solde_apres} pts</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 4: Referrals */}
                    {drawerTab === "referrals" && (
                      <div className="space-y-4 animate-fade-in">
                        {/* Dynamic Ambassador Status Alert */}
                        {(() => {
                          const scoreInfluence = selectedClient.influence_score !== undefined && selectedClient.influence_score !== null
                            ? Number(selectedClient.influence_score)
                            : Math.round(((selectedClient.score_global_sa || 0) * 0.7 + (1.0 - (selectedClient.churn_score || 0)) * 0.3) * 100);
                          const isAmbassadorClient = scoreInfluence >= 80;
                          const completedCount = clientDetails?.referralDetail?.rewards?.completed_count || 0;

                          if (!isAmbassadorClient) {
                            return (
                              <div className="p-3.5 bg-neutral-50 rounded-xl text-xs flex gap-2.5 items-start text-neutral-600 border border-neutral-200">
                                <div className="w-4 h-4 rounded-full border border-neutral-400 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-[8px] font-bold text-neutral-500">i</span>
                                </div>
                                <div>
                                  <span className="font-bold text-[#17151A] block mb-0.5">Programme Inactif</span>
                                  Ce client n'est pas qualifié comme <span className="font-bold">Ambassadeur Officiel</span> (score d'influence de {scoreInfluence}% inférieur au seuil requis de 80%). Le programme de parrainage lui est inaccessible.
                                </div>
                              </div>
                            );
                          } else {
                            if (completedCount === 0) {
                              return (
                                <div className="p-3.5 bg-amber-50 rounded-xl text-xs flex gap-2.5 items-start text-amber-900 border border-amber-200">
                                  <div className="w-4 h-4 rounded-full border border-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[8px] font-bold text-amber-600">i</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#17151A] block mb-0.5">Ambassadeur Inactif</span>
                                    Ce client est un <span className="font-bold">Ambassadeur Officiel qualifié (score : {scoreInfluence}%)</span>, mais il n'a encore converti aucun parrainage pour activer ses offres de réduction.
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="p-3.5 bg-[#EDF2EE] rounded-xl text-xs flex gap-2.5 items-start text-[#736C72] border border-[#C4DACC]">
                                  <div className="w-4 h-4 rounded-full border border-[#4C8C6B] flex items-center justify-center shrink-0 mt-0.5">
                                    <span className="text-[8px] font-bold text-[#4C8C6B]">✓</span>
                                  </div>
                                  <div>
                                    <span className="font-bold text-[#17151A] block mb-0.5">Ambassadeur Actif</span>
                                    Ce client est un <span className="font-bold">Ambassadeur Actif</span> avec {completedCount} parrainage(s) réussi(s). Son code est partagé et performant auprès de son réseau.
                                  </div>
                                </div>
                              );
                            }
                          }
                        })()}

                        {/* Global Referral Card */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-widest block">Code Parrainage Personnel</span>
                            <strong className="text-base font-bold text-[#17151A] block mt-0.5" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                              {clientDetails?.referralDetail?.referral_code || "Non généré"}
                            </strong>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-widest block">Parrain</span>
                            <p className="text-xs font-semibold text-[#17151A] mt-0.5">
                              {clientDetails?.referralDetail?.sponsor ? clientDetails.referralDetail.sponsor.nom : "Aucun"}
                            </p>
                          </div>
                        </div>

                        {/* Milestone Reward progression */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Récompenses Parrainage</h4>
                          <div className="space-y-2">
                            {clientDetails?.referralDetail?.rewards?.tiers.map((tier) => (
                              <div key={tier.level} className="flex justify-between items-center text-xs p-2.5 bg-[#F7F4EF] rounded-xl border border-[#E9E4DD]">
                                <div>
                                  <span className="font-semibold text-[#17151A] block">Palier {tier.level} ({tier.required} parrainages)</span>
                                  <span className="text-[10px] text-[#A39C9F]">{tier.name} (Code: {tier.code})</span>
                                </div>
                                {tier.unlocked ? (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#4C8C6B]/10 text-[#4C8C6B] border border-[#4C8C6B]/20">
                                    <span className="w-[6px] h-[6px] rounded-full bg-[#4C8C6B] shrink-0" />
                                    Débloqué
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-[#F7F4EF] text-[#A39C9F] border border-[#E9E4DD]">
                                    <span className="w-[6px] h-[6px] rounded-full bg-[#A39C9F] shrink-0" />
                                    En attente
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Referred Clients List */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Filleuls Parrainés ({clientDetails?.referralDetail?.referred_clients?.length || 0})</h4>
                          {(!clientDetails?.referralDetail?.referred_clients || clientDetails.referralDetail.referred_clients.length === 0) ? (
                            <div className="text-center py-6 bg-[#F7F4EF] rounded-xl border border-dashed border-[#E9E4DD]">
                              <p className="text-xs text-[#736C72] font-semibold">Aucun client parrainé pour le moment.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {clientDetails.referralDetail.referred_clients.map((filleul, idx) => (
                                <div key={idx} className="bg-[#F7F4EF] border border-[#E9E4DD] rounded-xl p-3 flex justify-between items-center text-xs">
                                  <div>
                                    <strong className="text-[#17151A] font-semibold block">{filleul.filleul_nom}</strong>
                                    <span className="text-[10px] text-[#A39C9F]">{filleul.filleul_email}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${filleul.status === 'completed' ? 'bg-[#4C8C6B]/10 text-[#4C8C6B] border-[#4C8C6B]/20' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                      <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: filleul.status === 'completed' ? '#4C8C6B' : '#C0781F' }} />
                                      {filleul.status === 'completed' ? 'Achat Validé' : 'Invité'}
                                    </span>
                                    {filleul.amount_generated > 0 && (
                                      <span className="text-[10px] text-[#C31F3C] font-bold block mt-0.5">ROI: {filleul.amount_generated} DT</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* TAB 5: Campaigns */}
                    {drawerTab === "campaigns" && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">Historique de Ciblage ({clientDetails?.campaignHistory?.length || 0})</h4>
                          {clientDetails?.campaignHistory && clientDetails.campaignHistory.length > 0 && (
                            <select
                              value={drawerCampaignType}
                              onChange={(e) => setDrawerCampaignType(e.target.value)}
                              className="bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-1.5 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] cursor-pointer"
                            >
                              <option value="all">📨 Toutes les actions</option>
                              <option value="individual">👤 Fidélisation Individuelle</option>
                              <option value="group">👥 Campagnes Groupées</option>
                              <option value="ai">🤖 Automatisations IA</option>
                            </select>
                          )}
                        </div>

                        {(!clientDetails?.campaignHistory || clientDetails.campaignHistory.length === 0) ? (
                          <div className="text-center py-10 bg-[#F7F4EF] rounded-2xl border border-dashed border-[#E9E4DD]">
                            <p className="text-xs text-[#736C72] font-semibold">Aucune campagne envoyée pour l'instant.</p>
                          </div>
                        ) : getFilteredCampaigns().length === 0 ? (
                          <div className="text-center py-10 bg-[#F7F4EF] rounded-2xl border border-dashed border-[#E9E4DD]">
                            <p className="text-xs text-[#736C72] font-semibold">Aucune campagne pour ce filtre.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {getFilteredCampaigns().map((camp) => {
                              const isSuccess = camp.status && (camp.status.startsWith('sent') || camp.status === 'sent_manual');
                              const isFailed = camp.status && camp.status.startsWith('failed');
                              
                              const statusBg = isSuccess ? "bg-[#4C8C6B]/10 text-[#4C8C6B] border-[#4C8C6B]/20" : isFailed ? "bg-[#F5D7CD] text-[#8A1329] border-[#C31F3C]/20" : "bg-amber-50 text-amber-700 border-amber-200";
                              const statusDot = isSuccess ? "#4C8C6B" : isFailed ? "#C31F3C" : "#C0781F";

                              return (
                                <div key={camp._id} className="bg-white border border-[#E9E4DD] rounded-xl p-4 shadow-sm space-y-2">
                                  <div className="flex justify-between items-start">
                                    <span className="text-[10px] text-[#A39C9F] font-semibold flex items-center gap-1.5">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {new Date(camp.sent_at).toLocaleDateString("fr-FR")} à {new Date(camp.sent_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusBg}`}>
                                      <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ backgroundColor: statusDot }} />
                                      {camp.status}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-[#17151A]">{camp.subject}</h5>
                                  {/* @ts-expect-error fixing types */}
                                  {camp.body && (
                                    <div
                                      className="text-[11px] text-[#736C72] bg-[#F7F4EF] p-2.5 rounded-lg border border-[#E9E4DD] mt-2 font-medium leading-relaxed"
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      {/* @ts-expect-error fixing types */}
                                      {camp.body}
                                    </div>
                                  )}
                                  <div className="flex gap-2">
                                    <span className="bg-[#F7F4EF] text-[#736C72] font-semibold text-[10px] px-2 py-0.5 rounded-full border border-[#E9E4DD]">Segment: {camp.segment}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 6: Actions */}
                    {drawerTab === "actions" && (
                      <div className="space-y-6 animate-fade-in">
                        {/* Success / Error notification */}
                        {actionSuccessMessage && (
                          <div className="p-3.5 bg-[#4C8C6B]/10 border border-[#4C8C6B]/20 rounded-xl text-xs font-semibold text-[#4C8C6B] flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-[#4C8C6B]" />
                            <span>{actionSuccessMessage}</span>
                          </div>
                        )}
                        {actionErrorMessage && (
                          <div className="p-3.5 bg-[#F5D7CD] border border-[#C31F3C]/20 rounded-xl text-xs font-semibold text-[#8A1329] flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[#C31F3C]" />
                            <span>{actionErrorMessage}</span>
                          </div>
                        )}

                        {/* 1. Credit Points */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">
                            <CreditCard className="w-4 h-4 text-[#C31F3C]" />
                            <span>Créditer des points fidélité</span>
                          </div>
                          <p className="text-[11px] text-[#A39C9F]">Calcule automatiquement 1 point de fidélité par tranche de 10 DT dépensés (ex: 50 DT = +5 pts).</p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#A39C9F]">DT</span>
                              <input
                                type="number"
                                placeholder="Montant de la transaction"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                                className="w-full bg-[#F7F4EF] border border-[#E9E4DD] pl-9 pr-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] focus:border-[#C31F3C] focus:bg-white transition-all"
                              />
                            </div>
                            <button
                              onClick={handleCreditPoints}
                              disabled={actionLoading || !creditAmount}
                              className="bg-[#C31F3C] hover:bg-[#8A1329] text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0"
                            >
                              Créditer
                            </button>
                          </div>
                        </div>

                        {/* 2. Redeem Reward */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">
                            <Gift className="w-4 h-4 text-[#C31F3C]" />
                            <span>Débiter / Utiliser un Code</span>
                          </div>
                          <p className="text-[11px] text-[#A39C9F]">Utilise et déduit les points d'un palier fidélité disponible.</p>
                          <div className="flex gap-2">
                            <select
                              value={debitCode}
                              onChange={(e) => setDebitCode(e.target.value)}
                              className="flex-1 bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] focus:border-[#C31F3C] focus:bg-white transition-all cursor-pointer"
                            >
                              <option value="">Sélectionnez un palier</option>
                              {clientDetails?.loyaltyBalance?.paliers
                                .filter(p => p.debloque)
                                .map(p => (
                                  <option key={p.code} value={p.code}>{p.code} - {p.label}</option>
                                ))
                              }
                            </select>
                            <button
                              onClick={handleRedeemPoints}
                              disabled={actionLoading || !debitCode}
                              className="bg-white border border-[#C31F3C] text-[#C31F3C] hover:bg-[#F5D7CD] font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0"
                            >
                              Utiliser Code
                            </button>
                          </div>
                        </div>

                        {/* 3. Send Individual Email */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">
                            <Mail className="w-4 h-4 text-[#C31F3C]" />
                            <span>Actions de Fidélisation</span>
                          </div>

                          {/* Suggested templates */}
                          {(() => {
                            const templates = getIndividualCampaignTemplates(selectedClient);
                            if (templates.length === 0) return null;
                            return (
                              <div className="space-y-2">
                                <span className="text-[10px] font-semibold text-[#A39C9F] uppercase tracking-wider block">Modèles suggérés par l'IA</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {templates.map((tpl, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setEmailSubject(tpl.subject);
                                        setEmailBody(tpl.body);
                                      }}
                                      className="text-[10px] font-semibold px-2.5 py-1.5 bg-[#F7F4EF] border border-[#E9E4DD] hover:border-[#C31F3C] text-[#736C72] hover:text-[#C31F3C] rounded-lg transition-all cursor-pointer"
                                    >
                                      {tpl.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Sujet de l'e-mail"
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              className="w-full bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] focus:border-[#C31F3C] focus:bg-white transition-all"
                            />
                            <textarea
                              rows={4}
                              placeholder="Corps du message..."
                              value={emailBody}
                              onChange={(e) => setEmailBody(e.target.value)}
                              className="w-full bg-[#F7F4EF] border border-[#E9E4DD] px-3 py-2 rounded-lg text-xs font-semibold text-[#17151A] outline-none hover:border-[#C31F3C] focus:border-[#C31F3C] focus:bg-white transition-all resize-none"
                            />
                            <button
                              onClick={handleSendEmail}
                              disabled={actionLoading || !emailSubject.trim() || !emailBody.trim()}
                              className="w-full bg-[#C31F3C] hover:bg-[#8A1329] text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                            >
                              Envoyer l'E-mail de Campagne
                            </button>
                          </div>
                        </div>

                        {/* 4. RGPD Options Center */}
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E9E4DD] space-y-4">
                          <div className="flex items-center justify-between border-b border-[#E9E4DD] pb-3">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#736C72] uppercase tracking-widest">
                              <ShieldAlert className="w-4 h-4 text-[#C31F3C]" />
                              <span>Préférences RGPD</span>
                            </div>
                            {selectedClient.rgpd_opt_out_date && (
                              <span className="text-[10px] text-[#A39C9F] font-semibold">
                                MàJ : {new Date(selectedClient.rgpd_opt_out_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* marketing preferences toggle */}
                          <div className="flex items-center justify-between gap-4 bg-[#F7F4EF] border border-[#E9E4DD] p-3 rounded-xl shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-[#17151A]">E-mails Marketing</p>
                              <p className="text-[10px] text-[#A39C9F]">Newsletter, offres et relances anniversaire</p>
                            </div>
                            {selectedClient.rgpd_opt_out_marketing ?? selectedClient.rgpd_opt_out ? (
                              <button
                                onClick={() => handleOptIn('marketing')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-[#F5D7CD] text-[#8A1329] border border-[#C31F3C]/20 cursor-pointer"
                              >
                                <span className="w-[6px] h-[6px] rounded-full bg-[#C31F3C] shrink-0" />
                                Désactivé (Activer)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOptOut('marketing')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-[#3F9142]/10 text-[#3F9142] border border-[#3F9142]/20 cursor-pointer"
                              >
                                <span className="w-[6px] h-[6px] rounded-full bg-[#3F9142] shrink-0" />
                                Actif (Désactiver)
                              </button>
                            )}
                          </div>

                          {/* profiling preferences toggle */}
                          <div className="flex items-center justify-between gap-4 bg-[#F7F4EF] border border-[#E9E4DD] p-3 rounded-xl shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-[#17151A]">Recommandations IA & Profilage</p>
                              <p className="text-[10px] text-[#A39C9F]">Suggestions de produits personnalisées</p>
                            </div>
                            {selectedClient.rgpd_opt_out_profiling ?? selectedClient.rgpd_opt_out ? (
                              <button
                                onClick={() => handleOptIn('profiling')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-[#F5D7CD] text-[#8A1329] border border-[#C31F3C]/20 cursor-pointer"
                              >
                                <span className="w-[6px] h-[6px] rounded-full bg-[#C31F3C] shrink-0" />
                                Désactivé (Activer)
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOptOut('profiling')}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold bg-[#3F9142]/10 text-[#3F9142] border border-[#3F9142]/20 cursor-pointer"
                              >
                                <span className="w-[6px] h-[6px] rounded-full bg-[#3F9142] shrink-0" />
                                Actif (Désactiver)
                              </button>
                            )}
                          </div>

                          {/* Copy secure share link */}
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`http://localhost:5000/api/rgpd/portal-token?email=${encodeURIComponent(selectedClient.email)}`);
                                const json = await res.json();
                                if (json.status === 'success') {
                                  const fullUrl = `${window.location.origin}${json.link}`;
                                  navigator.clipboard.writeText(fullUrl);
                                  addToast("🔗 Lien sécurisé copié dans le presse-papier !", "success");
                                }
                              } catch {
                                addToast("Erreur lors de la génération du lien.", "error");
                              }
                            }}
                            className="w-full bg-white border border-[#E9E4DD] hover:border-[#C31F3C] hover:bg-[#F7F4EF] text-[#736C72] hover:text-[#C31F3C] py-2 rounded-lg text-[11px] font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            <span>Copier le lien libre-service sécurisé</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Group Campaign Modal */}
        {isGroupModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-[#EEE5DF] rounded-2xl w-[500px] max-w-full p-6 shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-[#EEE5DF]">
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Envoi de Campagne Groupée</h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">{filteredClients.length} clients ciblés</p>
                </div>
                <button
                  onClick={() => {
                    setIsGroupModalOpen(false);
                    setGroupSubject("");
                    setGroupBody("");
                    setGroupSelectedTemplateIndex(null);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Diagnostic */}
              {(() => {
                const diag = getGroupCampaignTemplates();
                return (
                  <div className="bg-[#FDECEA] border border-blue-100 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
                    📊 Groupe dominé par le segment <strong className="text-[#E8462F]">{diag.dominantSeg.toUpperCase()}</strong>.
                    <br />
                    ⚡ Taux de risque churn élevé/critique : <strong className="text-rose-600">{diag.highChurnPct}%</strong>.
                  </div>
                );
              })()}

              {/* Templates list */}
              {(() => {
                const diag = getGroupCampaignTemplates();
                return (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Templates suggérés</span>
                    <div className="flex flex-wrap gap-1.5">
                      {diag.templates.map((tpl, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setGroupSelectedTemplateIndex(idx);
                            setGroupSubject(tpl.subject);
                            setGroupBody(tpl.body);
                          }}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${groupSelectedTemplateIndex === idx
                            ? "bg-[#E8462F] border-[#E8462F] text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-[#FAF3EE]"
                            }`}
                        >
                          {tpl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Subject & Body */}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Sujet de l'e-mail (utilisez {nom} pour personnaliser)"
                  value={groupSubject}
                  onChange={(e) => setGroupSubject(e.target.value)}
                  className="w-full bg-[#FAF3EE] border border-[#EEE5DF] px-3 py-2 rounded-lg text-xs font-semibold outline-none hover:border-slate-300 focus:border-[#E8462F] focus:bg-white transition-all"
                />
                <textarea
                  rows={5}
                  placeholder="Corps du message..."
                  value={groupBody}
                  onChange={(e) => setGroupBody(e.target.value)}
                  className="w-full bg-[#FAF3EE] border border-[#EEE5DF] px-3 py-2 rounded-lg text-xs font-semibold outline-none hover:border-slate-300 focus:border-[#E8462F] focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                onClick={handleSendGroupCampaign}
                disabled={loading || !groupSubject.trim() || !groupBody.trim()}
                className="w-full bg-gradient-to-r from-[#E8462F] to-[#F06038] hover:from-blue-700 hover:to-blue-800 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                Envoyer à tout le groupe
              </button>
            </div>
          </div>
        )}

        {/* Toast notifications overlay */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#E8462F] animate-spin" />
      </div>
    }>
      <ClientsContent />
    </Suspense>
  );
}
