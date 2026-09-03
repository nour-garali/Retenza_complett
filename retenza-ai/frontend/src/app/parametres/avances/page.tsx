"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import {
  Bot, Power, Clock, Calendar, DollarSign, ChevronUp, ChevronDown,
  Save, Check, Loader2, AlertTriangle, Crown, Cake, ShoppingCart,
  Zap, Star, UserX, TrendingDown, BarChart2, Activity, Users,
  Settings2, RefreshCw, Mail, GripVertical, Shield, TrendingUp,
  MapPin, MessageSquare, Percent, Tag, Sliders, Info, Sparkles, Store
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Commerce { id: string; label: string; }

interface AutomationRule {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  enabled: boolean;
  priority: number;
}

type TabType = "all" | "smart_automation" | "heures_creuses" | "anniversaire" | "absence" | "securite" | "cross_sell" | "costs";

// ─── Constantes règles SmartAutomation ────────────────────────────────────────

const RULE_META: Record<string, { label: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
  ambassador_invite: {
    label: " Ambassadeur",
    description: "Invite les clients avec score d'influence ≥ 80% au programme de parrainage",
    icon: Crown,
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  birthday_gift: {
    label: " Anniversaire Client",
    description: "Offre -20% la veille de l'anniversaire du client (anti-doublon 300 jours)",
    icon: Cake,
    color: "text-pink-700",
    bgColor: "bg-pink-50 border-pink-200",
  },
  absence_anormale: {
    label: " Absence Anormale",
    description: "Relance les clients réguliers absents au-delà de leur rythme habituel",
    icon: ShoppingCart,
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
  },
  vip_danger: {
    label: " VIP en Danger",
    description: "Rétention urgente -35% pour les clients VIP avec churn critique ≥ 75%",
    icon: Zap,
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  vip_fidelisation: {
    label: " VIP Fidélisation",
    description: "Offre exclusive -30% pour les VIP avec risque élevé de départ",
    icon: Star,
    color: "text-yellow-700",
    bgColor: "bg-yellow-50 border-yellow-200",
  },
  vip_pur: {
    label: " VIP Pur",
    description: "Message de fidélisation premium pour les clients VIP stables",
    icon: Star,
    color: "text-indigo-700",
    bgColor: "bg-indigo-50 border-indigo-200",
  },
  perdu_critique: {
    label: " Perdu Critique",
    description: "Reconquête urgente -30% pour les clients perdus avec churn ≥ 75%",
    icon: UserX,
    color: "text-rose-700",
    bgColor: "bg-rose-50 border-rose-200",
  },
  perdu_standard: {
    label: " Perdu Standard",
    description: "Offre de retour -25% pour les clients perdus sans urgence critique",
    icon: UserX,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-100",
  },
  at_risk_churn: {
    label: " À Risque Churn",
    description: "Remise préventive -20% pour les clients à risque avec churn ≥ 55%",
    icon: TrendingDown,
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-100",
  },
  at_risk_standard: {
    label: " À Risque Standard",
    description: "Sondage satisfaction + bon -10% pour les clients légèrement à risque",
    icon: BarChart2,
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  baisse_frequence: {
    label: " Baisse de Fréquence",
    description: "Encourage les clients réguliers dont les achats ont baissé de +25%",
    icon: Activity,
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  regular: {
    label: " Régulier",
    description: "Newsletter et nouveautés pour tous les clients fidèles non ciblés",
    icon: Users,
    color: "text-green-700",
    bgColor: "bg-green-50 border-green-200",
  },
};

const DEFAULT_RULES: AutomationRule[] = Object.entries(RULE_META).map(([id, meta], idx) => ({
  id,
  ...meta,
  enabled: true,
  priority: idx,
}));

// ─── Component Toggle Switch Unifié Retenza ──────────────────────────────────
function Toggle({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
}) {
  const w = size === "sm" ? "w-8 h-4.5" : "w-10 h-5.5";
  const thumb = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const translate = size === "sm" ? (checked ? "translate-x-3.5" : "translate-x-0.5") : (checked ? "translate-x-4.5" : "translate-x-0.5");

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex items-center rounded-full transition-colors duration-200 cursor-pointer shrink-0 ${w} ${
        checked ? "bg-[#E8462F]" : "bg-[#D5C8C0]"
      }`}
    >
      <span className={`inline-block bg-white rounded-full shadow-2xs transition-transform duration-200 ${thumb} ${translate}`} />
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function ParametresAvancesPage() {
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [selectedCommerce, setSelectedCommerce] = useState<string>("commerce_local_1");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // ── État Accordéon Repliable ──
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    smart_automation: false,
    heures_creuses: false,
    anniversaire: false,
    absence: false,
    securite: false,
    cross_sell: false,
    costs: false,
  });

  const toggleSectionOpen = (secId: string) => {
    setOpenSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
    if (tabId === "all") {
      setOpenSections({
        smart_automation: true,
        heures_creuses: true,
        anniversaire: true,
        absence: true,
        securite: true,
        cross_sell: true,
        costs: true,
      });
    } else {
      setOpenSections(prev => ({ ...prev, [tabId]: true }));
      setTimeout(() => {
        document.getElementById(`section-${tabId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  };

  // ── 1. SmartAutomation ──
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>(DEFAULT_RULES);
  const [sendHoursEnabled, setSendHoursEnabled] = useState(false);
  const [sendHourStart, setSendHourStart] = useState(8);
  const [sendHourEnd, setSendHourEnd] = useState(21);
  const [cooldownDays, setCooldownDays] = useState(30);
  const [dailyRunHour, setDailyRunHour] = useState(9);

  // ── 2. Heures Creuses (Low Traffic) ──
  const [lowTrafficEnabled, setLowTrafficEnabled] = useState(false);
  const [lowTrafficThresholdPercent, setLowTrafficThresholdPercent] = useState(40);
  const [lowTrafficOfferType, setLowTrafficOfferType] = useState<"percent" | "bogo">("percent");
  const [lowTrafficDiscountPercent, setLowTrafficDiscountPercent] = useState(15);
  const [lowTrafficBogoBuy, setLowTrafficBogoBuy] = useState(2);
  const [lowTrafficBogoGet, setLowTrafficBogoGet] = useState(1);
  const [lowTrafficPromoPrefix, setLowTrafficPromoPrefix] = useState("FLASH");
  const [lowTrafficValidityMinutes, setLowTrafficValidityMinutes] = useState(120);
  const [lowTrafficGeoRadiusKm, setLowTrafficGeoRadiusKm] = useState(5);
  const [lowTrafficStartHour, setLowTrafficStartHour] = useState(9);
  const [lowTrafficEndHour, setLowTrafficEndHour] = useState(18);

  // ── 3. Anniversaire Boutique ──
  const [shopAnniversaryEnabled, setShopAnniversaryEnabled] = useState(true);
  const [shopAnniversaryMode, setShopAnniversaryMode] = useState<"global" | "par_boutique">("global");
  const [shopAnniversaryDate, setShopAnniversaryDate] = useState("");
  const [shopAnniversaryDiscountPercent, setShopAnniversaryDiscountPercent] = useState(15);
  const [shopAnniversaryPromoCode, setShopAnniversaryPromoCode] = useState("ANNIVBOUTIQUE");

  // ── 4. Absence Anormale ──
  const [absenceEnabled, setAbsenceEnabled] = useState(true);
  const [absenceMultiplier, setAbsenceMultiplier] = useState(2.0);
  const [absenceReduction, setAbsenceReduction] = useState(20);
  const [absenceHeureLimite, setAbsenceHeureLimite] = useState("18h");
  const [absenceTemplate, setAbsenceTemplate] = useState("");

  // ── 5. Sécurité & Fraude ──
  const [fraudEnabled, setFraudEnabled] = useState(true);
  const [fraudMaxDailyPurchases, setFraudMaxDailyPurchases] = useState(5);
  const [fraudMaxBasketMultiplier, setFraudMaxBasketMultiplier] = useState(3.0);

  // ── 6. Cross-Sell / Up-Sell ──
  const [crossSellAutoRecommend, setCrossSellAutoRecommend] = useState(true);
  const [crossSellMinConfidence, setCrossSellMinConfidence] = useState(0.2);

  // ── 7. Coûts Marketing & Comptabilité ──
  const [marketingCostEmail, setMarketingCostEmail] = useState(0.02);
  const [marketingCostSms, setMarketingCostSms] = useState(0.12);
  const [marketingCostFcm, setMarketingCostFcm] = useState(0.00);
  const [marketingCostSetup, setMarketingCostSetup] = useState(0);
  const [monthlyExportEnabled, setMonthlyExportEnabled] = useState(true);
  const [accountantEmail, setAccountantEmail] = useState("");

  // ── Drag & Drop state ──
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Load commerces list, puis initialiser sur le 1er disponible
  useEffect(() => {
    fetch("/api/commerces")
      .then(r => r.json())
      .then(d => {
        const list: Commerce[] = Array.isArray(d) ? d : [];
        setCommerces(list);
        // Utiliser le 1er commerce réel plutôt que "__all__" (commerce_local peut être vide)
        if (list.length > 0) setSelectedCommerce(list[0].id);
      })
      .catch(() => setCommerces([]));
  }, []);

  // Load settings when selected commerce changes
  const loadSettings = useCallback(async () => {
    if (!selectedCommerce) return;
    setPageLoading(true);
    try {
      const activeCid = commerces.find(c => c.id === "commerce_local_1")?.id || (commerces.length > 0 ? commerces[0].id : "commerce_local_1");
      const cid = selectedCommerce === "__all__" ? activeCid : selectedCommerce;

      // 1. Load general settings
      const resGen = await fetch(`/api/commerces/settings?commerce_id=${encodeURIComponent(cid)}`, { cache: "no-store" });
      const jsonGen = await resGen.json();
      const d = jsonGen.data || {};

      setAutomationEnabled(d.smart_automation_enabled !== false);
      setSendHoursEnabled(Boolean(d.send_hours_enabled));
      setSendHourStart(d.send_hour_start ?? 8);
      setSendHourEnd(d.send_hour_end ?? 21);
      setCooldownDays(d.cooldown_days ?? 30);
      setDailyRunHour(d.daily_run_hour ?? 9);

      // Anniversaire Boutique
      setShopAnniversaryEnabled(d.shop_anniversary_enabled !== false);
      setShopAnniversaryMode(d.shop_anniversary_mode || "global");
      setShopAnniversaryDate(d.shop_anniversary_date || "");
      setShopAnniversaryDiscountPercent(Number(d.shop_anniversary_discount_percent) || 15);
      setShopAnniversaryPromoCode(d.shop_anniversary_promo_code || "ANNIVBOUTIQUE");

      // Absence Anormale
      setAbsenceEnabled(d.absence_enabled !== false);
      setAbsenceMultiplier(Number(d.absence_multiplier) || 2.0);
      setAbsenceReduction(Number(d.absence_reduction) || 20);
      setAbsenceHeureLimite(d.absence_heure_limite || "18h");
      setAbsenceTemplate(d.absence_template || "");

      // Sécurité & Fraude
      setFraudEnabled(d.fraud_enabled !== false);
      setFraudMaxDailyPurchases(Number(d.fraud_max_daily_purchases) || 5);
      setFraudMaxBasketMultiplier(Number(d.fraud_max_basket_multiplier) || 3.0);

      // Cross-Sell
      setCrossSellAutoRecommend(d.cross_sell_auto_recommend !== false);
      setCrossSellMinConfidence(Number(d.cross_sell_min_confidence) || 0.2);

      // Coûts Marketing & Comptabilité
      if (d.marketing_costs) {
        setMarketingCostEmail(Number(d.marketing_costs.email) || 0);
        setMarketingCostSms(Number(d.marketing_costs.sms) || 0);
        setMarketingCostFcm(Number(d.marketing_costs.fcm) || 0);
        setMarketingCostSetup(Number(d.marketing_costs.setup) || 0);
      }
      setMonthlyExportEnabled(d.monthly_export_enabled !== false);
      setAccountantEmail(d.accountant_email || "");

      // Rules Merge
      if (d.automation_rules && Array.isArray(d.automation_rules) && d.automation_rules.length > 0) {
        const sortedDb = [...d.automation_rules].sort((a, b) => a.priority - b.priority);
        const merged: AutomationRule[] = sortedDb
          .filter(r => RULE_META[r.id])
          .map((r, idx) => ({
            id: r.id,
            ...RULE_META[r.id],
            enabled: r.enabled !== false,
            priority: idx,
          }));
        DEFAULT_RULES.forEach(dr => {
          if (!merged.find(mr => mr.id === dr.id)) {
            merged.push({ ...dr, priority: merged.length });
          }
        });
        setRules(merged);
      } else {
        setRules(DEFAULT_RULES.map((r, idx) => ({ ...r, priority: idx, enabled: true })));
      }

      // 2. Load Heures Creuses settings
      const resLt = await fetch(`/api/low-traffic/settings?commerce_id=${encodeURIComponent(cid)}`, { cache: "no-store" });
      const jsonLt = await resLt.json();
      const ltData = jsonLt.data || {};
      setLowTrafficEnabled(Boolean(ltData.enabled));
      setLowTrafficThresholdPercent(Number(ltData.threshold_percent) || 40);
      setLowTrafficOfferType(ltData.offer?.type === "bogo" ? "bogo" : "percent");
      setLowTrafficDiscountPercent(Number(ltData.offer?.discount_percent) || 15);
      setLowTrafficBogoBuy(Number(ltData.offer?.bogo?.buy) || 2);
      setLowTrafficBogoGet(Number(ltData.offer?.bogo?.get) || 1);
      setLowTrafficPromoPrefix(ltData.offer?.promo_code_prefix || "FLASH");
      setLowTrafficValidityMinutes(Number(ltData.offer?.validity_minutes) || 120);
      setLowTrafficGeoRadiusKm(Number(ltData.geo_radius_km) || 5);
      setLowTrafficStartHour(Number(ltData.opening_hours?.start_hour) ?? 9);
      setLowTrafficEndHour(Number(ltData.opening_hours?.end_hour) ?? 18);

    } catch {
      setRules(DEFAULT_RULES);
    } finally {
      setPageLoading(false);
    }
  }, [selectedCommerce, commerces]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // Synchronisation dynamique inter-onglets et focus
  useEffect(() => {
    const handleSync = (e: any) => {
      const activeCid = commerces.find(c => c.id === "commerce_local_1")?.id || "commerce_local_1";
      const targetCid = selectedCommerce === "__all__" ? activeCid : selectedCommerce;
      if (!e.detail?.commerce_id || e.detail.commerce_id === targetCid) {
        loadSettings();
      }
    };
    window.addEventListener("ratenza_heures_creuses_updated", handleSync);
    window.addEventListener("focus", loadSettings);
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("ratenza_heures_creuses_sync");
      bc.onmessage = (msg) => {
        const activeCid = commerces.find(c => c.id === "commerce_local_1")?.id || "commerce_local_1";
        const targetCid = selectedCommerce === "__all__" ? activeCid : selectedCommerce;
        if (!msg.data?.commerce_id || msg.data.commerce_id === targetCid) {
          loadSettings();
        }
      };
    } catch {}

    return () => {
      window.removeEventListener("ratenza_heures_creuses_updated", handleSync);
      window.removeEventListener("focus", loadSettings);
      if (bc) bc.close();
    };
  }, [loadSettings, selectedCommerce, commerces]);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    setRules(prev => {
      const next = [...prev];
      const [movedItem] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, movedItem);
      return next.map((r, i) => ({ ...r, priority: i }));
    });
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const moveRule = (idx: number, dir: "up" | "down") => {
    setRules(prev => {
      const next = [...prev];
      const swap = dir === "up" ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next.map((r, i) => ({ ...r, priority: i }));
    });
  };

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  // Live preview for Absence Anormale
  const previewAbsenceMessage = () => {
    const nom = "Mohamed Sellami";
    const produit = "votre café habituel";
    const panier = "12 DT";
    if (absenceTemplate.trim()) {
      return absenceTemplate
        .replace(/\{nom_client\}/g, nom)
        .replace(/\{produit_habituel\}/g, produit)
        .replace(/\{reduction\}/g, String(absenceReduction))
        .replace(/\{heure_limite\}/g, absenceHeureLimite)
        .replace(/\{panier_moyen\}/g, panier);
    }
    return (
      `Bonjour ${nom},\n\nOn a gardé ${produit} au chaud pour vous ! 🛒\n\n` +
      `Nous avons remarqué que vous n'êtes pas passé(e) depuis 6 jours — c'est inhabituel pour vous !\n\n` +
      `Pour vous accueillir à nouveau, voici une remise de ${absenceReduction}% si vous passez avant ${absenceHeureLimite} aujourd'hui.\n\n` +
      `Utilisez le code : RETOUR${absenceReduction}\n\nNous avons hâte de vous revoir !\n\nL'équipe Retenza 💛`
    );
  };

  // Save all settings
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const activeCid = commerces.find(c => c.id === "commerce_local_1")?.id || (commerces.length > 0 ? commerces[0].id : "commerce_local_1");
      const cid = selectedCommerce === "__all__" ? activeCid : selectedCommerce;

      // 1. Save general commerce settings
      const bodyGen = {
        commerce_id: cid,
        smart_automation_enabled: automationEnabled,
        automation_rules: rules.map((r, idx) => ({ id: r.id, enabled: r.enabled, priority: idx })),
        send_hours_enabled: sendHoursEnabled,
        send_hour_start: sendHourStart,
        send_hour_end: sendHourEnd,
        cooldown_days: cooldownDays,
        daily_run_hour: dailyRunHour,

        shop_anniversary_enabled: shopAnniversaryEnabled,
        shop_anniversary_mode: shopAnniversaryMode,
        shop_anniversary_date: shopAnniversaryDate,
        shop_anniversary_discount_percent: shopAnniversaryDiscountPercent,
        shop_anniversary_promo_code: shopAnniversaryPromoCode,

        absence_enabled: absenceEnabled,
        absence_multiplier: absenceMultiplier,
        absence_reduction: absenceReduction,
        absence_heure_limite: absenceHeureLimite,
        absence_template: absenceTemplate,

        fraud_enabled: fraudEnabled,
        fraud_max_daily_purchases: fraudMaxDailyPurchases,
        fraud_max_basket_multiplier: fraudMaxBasketMultiplier,

        cross_sell_auto_recommend: crossSellAutoRecommend,
        cross_sell_min_confidence: crossSellMinConfidence,

        marketing_costs: {
          email: marketingCostEmail,
          sms: marketingCostSms,
          fcm: marketingCostFcm,
          setup: marketingCostSetup
        },

        monthly_export_enabled: monthlyExportEnabled,
        accountant_email: accountantEmail,
      };

      const resGen = await fetch("/api/commerces/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyGen),
        credentials: "include",
      });

      // 2. Save low traffic (heures creuses) settings
      const bodyLt = {
        commerce_id: cid,
        enabled: lowTrafficEnabled,
        threshold_percent: lowTrafficThresholdPercent,
        geo_radius_km: lowTrafficGeoRadiusKm,
        opening_hours: {
          start_hour: lowTrafficStartHour,
          end_hour: lowTrafficEndHour,
        },
        offer: {
          type: lowTrafficOfferType,
          discount_percent: lowTrafficDiscountPercent,
          bogo: { buy: lowTrafficBogoBuy, get: lowTrafficBogoGet },
          promo_code_prefix: lowTrafficPromoPrefix.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          validity_minutes: lowTrafficValidityMinutes,
        }
      };

      const resLt = await fetch("/api/low-traffic/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyLt),
        credentials: "include",
      });

      if (!resGen.ok || !resLt.ok) throw new Error("Erreur serveur");

      // Persist daily_run_hour in localStorage so other pages reflect it immediately
      localStorage.setItem(`ratenza_daily_run_hour_${cid}`, String(dailyRunHour));
      localStorage.setItem("ratenza_daily_run_hour", String(dailyRunHour));

      // Émission d'événements de synchronisation pour les autres composants/onglets
      window.dispatchEvent(new CustomEvent("ratenza_heures_creuses_updated", { detail: { commerce_id: cid } }));
      try {
        const bc = new BroadcastChannel("ratenza_heures_creuses_sync");
        bc.postMessage({ commerce_id: cid, timestamp: Date.now() });
        bc.close();
      } catch {}

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Erreur lors de la sauvegarde. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  const showSection = (tab: TabType) => activeTab === "all" || activeTab === tab;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF3EE]">
      {/* ─── HEADER + FILTRE BOUTIQUE INTÉGRÉ ─── */}
      <PageHeader
        title="Paramètres de l'Application"
        subtitle="Configuration complète de l'IA SmartAutomation, des offres flash, relances et sécurité"
      >
        <div className="flex items-center gap-1.5">
          <Store className="w-4 h-4 text-[#7A6E68]" />
          <select
            value={selectedCommerce}
            onChange={e => setSelectedCommerce(e.target.value)}
            className="bg-white border border-[#EEE5DF] px-3.5 py-2 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none hover:border-[#E8462F] focus:border-[#E8462F] transition-all cursor-pointer shadow-xs shrink-0"
          >
            <option value="__all__">Toutes les boutiques (Par défaut)</option>
            {commerces.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </PageHeader>

      {/* ─── ONGLETS DE NAVIGATION (Style identique à Modération & Audit) ─── */}
      <div className="px-6 md:px-8 mt-4">
        <div className="flex border-b border-[#EEE5DF] gap-6 max-w-7xl mx-auto overflow-x-auto scrollbar-none pb-0">
          {[
            { id: "all", label: "Tout afficher", icon: Settings2 },
            { id: "smart_automation", label: "SmartAutomation", icon: Bot },
            { id: "heures_creuses", label: "Heures Creuses", icon: Clock },
            { id: "anniversaire", label: "Anniversaire Boutique", icon: Cake },
            { id: "absence", label: "Absence Anormale", icon: ShoppingCart },
            { id: "securite", label: "Sécurité & Fraude", icon: Shield },
            { id: "cross_sell", label: "Cross-Sell", icon: TrendingUp },
            { id: "costs", label: "Coûts & Compta", icon: DollarSign },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id as TabType)}
                className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "border-[#E8462F] text-[#E8462F]"
                    : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        {pageLoading ? (
          <div className="flex items-center justify-center py-28">
            <Loader2 className="w-8 h-8 animate-spin text-[#E8462F]" />
          </div>
        ) : (
          <div className="space-y-4 md:space-y-5">

          {/* ── SECTION 1 : SmartAutomation & Règles IA (SECTION HÉRO PRINCIPALE) ── */}
          {showSection("smart_automation") && (
            <div id="section-smart_automation" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("smart_automation")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-extrabold text-[#1A1A1A]">SmartAutomation IA & Priorité des Règles</h2>
                      <span className="bg-[#FAF5F1] text-[#7A6E68] border border-[#EEE5DF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Moteur IA Principal
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Ordre d'exécution, interrupteur d'urgence et fréquence d'envoi</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={automationEnabled} onChange={setAutomationEnabled} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("smart_automation"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.smart_automation ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.smart_automation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.smart_automation && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  {!automationEnabled && (
                    <div className="px-4 py-3 bg-red-50/80 border border-red-200/80 rounded-xl flex items-center gap-3 text-red-700 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>SmartAutomation désactivé — l'IA n'enverra aucun e-mail automatique lors des prochains cycles du planificateur.</span>
                    </div>
                  )}

                  {/* Liste drag & drop des règles */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-[#5E524B] flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-[#E8462F]" />
                      Réorganisez l'ordre de priorité en glissant-déposant les cartes ou avec les boutons ↑↓ (1 seul mail par client par cycle).
                    </p>
                    <div className="space-y-2.5">
                      {rules.map((rule, idx) => {
                        const Icon = rule.icon;
                        const isDragging = draggedIndex === idx;
                        const isDragOver = dragOverIndex === idx && draggedIndex !== idx;

                        return (
                          <div
                            key={rule.id}
                            draggable
                            onDragStart={e => handleDragStart(e, idx)}
                            onDragOver={e => handleDragOver(e, idx)}
                            onDrop={e => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-150 cursor-grab active:cursor-grabbing ${
                              isDragging
                                ? "opacity-30 border-dashed border-[#E8462F]"
                                : isDragOver
                                ? "border-2 border-[#E8462F] bg-[#FAF5F1] scale-[1.01] shadow-md"
                                : rule.enabled
                                ? "bg-white border-[#EBE5DF] hover:border-slate-300 shadow-2xs"
                                : "bg-[#FAF5F1] border-[#EBE5DF] opacity-60"
                            }`}
                          >
                            <div className="text-slate-400 hover:text-[#E8462F] shrink-0 transition-colors" title="Glisser pour réordonner">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-[#5E524B] border border-slate-200 shrink-0">
                              {idx + 1}
                            </div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${rule.enabled ? rule.bgColor : "bg-slate-100"}`}>
                              <Icon className={`w-4 h-4 ${rule.enabled ? rule.color : "text-slate-400"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-bold truncate ${rule.enabled ? "text-[#1A1A1A]" : "text-slate-400"}`}>{rule.label}</p>
                              <p className="text-[11px] text-[#7A6E68] truncate">{rule.description}</p>
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button onClick={() => moveRule(idx, "up")} disabled={idx === 0} className="w-6 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-30">
                                <ChevronUp className="w-3 h-3 text-slate-600" />
                              </button>
                              <button onClick={() => moveRule(idx, "down")} disabled={idx === rules.length - 1} className="w-6 h-5 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-30">
                                <ChevronDown className="w-3 h-3 text-slate-600" />
                              </button>
                            </div>
                            <Toggle checked={rule.enabled} onChange={() => toggleRule(rule.id)} size="sm" showLabel={false} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cooldown + Plage Horaire + Heure IA */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-5 border-t border-[#EBE5DF]">
                    {/* Cooldown */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" /> Cooldown anti-spam (Jours)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={1} max={60}
                          value={cooldownDays}
                          onChange={e => setCooldownDays(parseInt(e.target.value))}
                          className="flex-1 accent-[#E8462F]"
                        />
                        <input
                          type="number"
                          min={1} max={60}
                          value={cooldownDays}
                          onChange={e => setCooldownDays(Math.min(60, Math.max(1, parseInt(e.target.value) || 30)))}
                          className="w-16 bg-[#FAF5F1] border border-[#EBE5DF] px-2 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                        />
                        <span className="text-xs font-bold text-[#7A6E68]">j</span>
                      </div>
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Délai d'attente minimal entre deux offres promotionnelles pour un même client.</p>
                    </div>

                    {/* Plage horaire autorisée */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600" /> Restriction horaire d'envoi
                        </label>
                        <Toggle checked={sendHoursEnabled} onChange={setSendHoursEnabled} size="sm" />
                      </div>
                      <div className={`flex items-center gap-3 ${sendHoursEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                        <input
                          type="number" min={0} max={23}
                          value={sendHourStart}
                          onChange={e => setSendHourStart(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-16 bg-[#FAF5F1] border border-[#EBE5DF] px-2 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                        />
                        <span className="text-xs text-[#7A6E68]">h à</span>
                        <input
                          type="number" min={0} max={23}
                          value={sendHourEnd}
                          onChange={e => setSendHourEnd(Math.min(23, Math.max(0, parseInt(e.target.value) || 23)))}
                          className="w-16 bg-[#FAF5F1] border border-[#EBE5DF] px-2 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                        />
                        <span className="text-xs text-[#7A6E68]">h</span>
                      </div>
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Empêche l'envoi de messages la nuit ou hors de ces horaires.</p>
                    </div>

                    {/* Heure d'exécution IA */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" /> Lancement Quotidien IA
                      </label>
                      <div className="flex items-center gap-3 mt-1.5">
                        <input
                          type="number" min={0} max={23}
                          value={dailyRunHour}
                          onChange={e => setDailyRunHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-16 bg-[#FAF5F1] border border-[#EBE5DF] px-2 py-2 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                        />
                        <span className="text-xs font-semibold text-[#7A6E68]">h00 chaque jour</span>
                      </div>
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Heure d'exécution des tâches d'automatisation planifiées.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 2 : Heures Creuses (Relance Flash) ── */}
          {showSection("heures_creuses") && (
            <div id="section-heures_creuses" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("heures_creuses")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-sm font-extrabold text-[#1A1A1A]">Heures Creuses & Offres Flash Automatiques</h2>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Détection automatique des baisses de trafic et relance géolocalisée</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={lowTrafficEnabled} onChange={setLowTrafficEnabled} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("heures_creuses"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.heures_creuses ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.heures_creuses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.heures_creuses && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  <div className={`space-y-6 ${lowTrafficEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {/* Seuil % */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Seuil de détection (%)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={5} max={95}
                            value={lowTrafficThresholdPercent}
                            onChange={e => setLowTrafficThresholdPercent(Math.min(95, Math.max(5, parseInt(e.target.value) || 40)))}
                            className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                          />
                          <span className="text-xs font-bold text-[#7A6E68]">%</span>
                        </div>
                      </div>

                      {/* Type d'offre */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Type d'Offre</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLowTrafficOfferType("percent")}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              lowTrafficOfferType === "percent"
                                ? "bg-[#E8462F] text-white border-[#E8462F] shadow-2xs"
                                : "bg-[#FAF5F1] text-[#5E524B] border-[#EEE5DF] hover:bg-[#F3ECE6]"
                            }`}
                          >
                            Remise %
                          </button>
                          <button
                            type="button"
                            onClick={() => setLowTrafficOfferType("bogo")}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              lowTrafficOfferType === "bogo"
                                ? "bg-[#E8462F] text-white border-[#E8462F] shadow-2xs"
                                : "bg-[#FAF5F1] text-[#5E524B] border-[#EEE5DF] hover:bg-[#F3ECE6]"
                            }`}
                          >
                            BOGO
                          </button>
                        </div>
                      </div>

                      {/* Valeur de l'offre */}
                      {lowTrafficOfferType === "percent" ? (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#4A403A]">Remise accordée (%)</label>
                          <input
                            type="number" min={1} max={99}
                            value={lowTrafficDiscountPercent}
                            onChange={e => setLowTrafficDiscountPercent(Math.min(99, Math.max(1, parseInt(e.target.value) || 15)))}
                            className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#4A403A]">Formule BOGO</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={1} max={10}
                              value={lowTrafficBogoBuy}
                              onChange={e => setLowTrafficBogoBuy(parseInt(e.target.value) || 2)}
                              className="w-16 bg-[#FAF5F1] border border-[#EEE5DF] px-2 py-2.5 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                            />
                            <span className="text-xs text-[#7A6E68]">ach. =</span>
                            <input
                              type="number" min={1} max={10}
                              value={lowTrafficBogoGet}
                              onChange={e => setLowTrafficBogoGet(parseInt(e.target.value) || 1)}
                              className="w-16 bg-[#FAF5F1] border border-[#EEE5DF] px-2 py-2.5 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                            />
                            <span className="text-xs text-[#7A6E68]">offert</span>
                          </div>
                        </div>
                      )}

                      {/* Code Promo Préfixe */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Préfixe Code Promo</label>
                        <input
                          type="text"
                          value={lowTrafficPromoPrefix}
                          onChange={e => setLowTrafficPromoPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                          className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                          placeholder="FLASH"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Durée de validité (Minutes)</label>
                        <input
                          type="number" min={15} max={1440}
                          value={lowTrafficValidityMinutes}
                          onChange={e => setLowTrafficValidityMinutes(parseInt(e.target.value) || 120)}
                          className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Rayon géolocalisé (km)</label>
                        <input
                          type="number" min={1} max={100}
                          value={lowTrafficGeoRadiusKm}
                          onChange={e => setLowTrafficGeoRadiusKm(parseInt(e.target.value) || 5)}
                          className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#4A403A]">Plage Horaires Boutique</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number" min={0} max={23}
                            value={lowTrafficStartHour}
                            onChange={e => setLowTrafficStartHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-2 py-2.5 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                          />
                          <span className="text-xs text-[#7A6E68]">h à</span>
                          <input
                            type="number" min={0} max={23}
                            value={lowTrafficEndHour}
                            onChange={e => setLowTrafficEndHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 23)))}
                            className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-2 py-2.5 rounded-xl text-xs font-bold text-center outline-none focus:border-[#E8462F]"
                          />
                          <span className="text-xs text-[#7A6E68]">h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 3 : Anniversaire Boutique ── */}
          {showSection("anniversaire") && (
            <div id="section-anniversaire" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("anniversaire")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <Cake className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-sm font-extrabold text-[#1A1A1A]">Anniversaire Boutique (J-7, J-3, J-1)</h2>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Campagne de célébration automatique auprès des clients actifs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={shopAnniversaryEnabled} onChange={setShopAnniversaryEnabled} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("anniversaire"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.anniversaire ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.anniversaire ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.anniversaire && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 ${shopAnniversaryEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Mode de date</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShopAnniversaryMode("global")}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            shopAnniversaryMode === "global"
                              ? "bg-[#E8462F] text-white border-[#E8462F] shadow-2xs"
                              : "bg-[#FAF5F1] text-[#5E524B] border-[#EEE5DF] hover:bg-[#F3ECE6]"
                          }`}
                        >
                          Globale
                        </button>
                        <button
                          type="button"
                          onClick={() => setShopAnniversaryMode("par_boutique")}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            shopAnniversaryMode === "par_boutique"
                              ? "bg-[#E8462F] text-white border-[#E8462F] shadow-2xs"
                              : "bg-[#FAF5F1] text-[#5E524B] border-[#EEE5DF] hover:bg-[#F3ECE6]"
                          }`}
                        >
                          Boutique
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Date d'anniversaire (MM-DD)</label>
                      <input
                        type="text"
                        value={shopAnniversaryDate}
                        onChange={e => setShopAnniversaryDate(e.target.value)}
                        placeholder="ex: 03-15 (15 Mars)"
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Remise accordée (%)</label>
                      <input
                        type="number" min={1} max={100}
                        value={shopAnniversaryDiscountPercent}
                        onChange={e => setShopAnniversaryDiscountPercent(Math.min(100, Math.max(1, parseInt(e.target.value) || 15)))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Code Promo Offert</label>
                      <input
                        type="text"
                        value={shopAnniversaryPromoCode}
                        onChange={e => setShopAnniversaryPromoCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ""))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 4 : Absence Anormale ── */}
          {showSection("absence") && (
            <div id="section-absence" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("absence")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-sm font-extrabold text-[#1A1A1A]">Absence Anormale (Panier Abandonné Physique)</h2>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Détection automatique d'absence physique pour relancer les clients réguliers</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={absenceEnabled} onChange={setAbsenceEnabled} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("absence"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.absence ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.absence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.absence && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 ${absenceEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Multiplicateur de rythme (1.5x - 3.0x)</label>
                      <input
                        type="number" step={0.1} min={1.5} max={3.0}
                        value={absenceMultiplier}
                        onChange={e => setAbsenceMultiplier(Math.min(3.0, Math.max(1.5, parseFloat(e.target.value) || 2.0)))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Remise de retour (%)</label>
                      <input
                        type="number" min={1} max={99}
                        value={absenceReduction}
                        onChange={e => setAbsenceReduction(Math.min(99, Math.max(1, parseInt(e.target.value) || 20)))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Heure limite d'utilisation</label>
                      <input
                        type="text"
                        value={absenceHeureLimite}
                        onChange={e => setAbsenceHeureLimite(e.target.value)}
                        placeholder="18h"
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                  </div>

                  <div className={`space-y-2 ${absenceEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <label className="text-xs font-bold text-[#4A403A]">Template de message personnalisé</label>
                    <textarea
                      rows={3}
                      value={absenceTemplate}
                      onChange={e => setAbsenceTemplate(e.target.value)}
                      placeholder="Laissez vide pour le message automatique par défaut avec le produit habituel..."
                      className="w-full bg-[#FAF5F1] border border-[#EEE5DF] p-3.5 rounded-xl text-xs text-[#1A1A1A] outline-none font-mono resize-y focus:border-[#E8462F]"
                    />
                  </div>

                  {/* Aperçu du message */}
                  <div className={`p-4 bg-[#FAF5F1] rounded-xl border border-[#EEE5DF] space-y-2 ${absenceEnabled ? "opacity-100" : "opacity-40"}`}>
                    <p className="text-xs font-bold text-[#5E524B] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E8462F]" /> Prévisualisation du message client :
                    </p>
                    <p className="text-xs text-[#1A1A1A] whitespace-pre-line font-medium leading-relaxed bg-white p-3.5 rounded-xl border border-[#EEE5DF]">
                      {previewAbsenceMessage()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 5 : Sécurité & Fraude ── */}
          {showSection("securite") && (
            <div id="section-securite" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("securite")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-sm font-extrabold text-[#1A1A1A]">Sécurité & Fraude (Seuils de Détection)</h2>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Détection des anomalies de fréquence d'achat et des paniers suspects</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={fraudEnabled} onChange={setFraudEnabled} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("securite"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.securite ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.securite ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.securite && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${fraudEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Nombre d'achats quotidiens maximal par client</label>
                      <input
                        type="number" min={1} max={100}
                        value={fraudMaxDailyPurchases}
                        onChange={e => setFraudMaxDailyPurchases(Math.max(1, parseInt(e.target.value) || 5))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Au-delà de ce nombre d'achats en 24h, une alerte de fraude est déclenchée.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Multiplicateur maximal du panier moyen (ex: 3.0x)</label>
                      <input
                        type="number" step={0.5} min={1.5} max={10.0}
                        value={fraudMaxBasketMultiplier}
                        onChange={e => setFraudMaxBasketMultiplier(Math.max(1.5, parseFloat(e.target.value) || 3.0))}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Alerte si une commande dépasse X fois le panier moyen historique du commerce.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 6 : Cross-Sell / Up-Sell ── */}
          {showSection("cross_sell") && (
            <div id="section-cross_sell" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("cross_sell")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FDECEA] border border-[#F9D5CE] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#E8462F]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h2 className="text-sm font-extrabold text-[#1A1A1A]">Cross-Sell & Up-Sell Automatique</h2>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Recommandations d'articles associés par l'algorithme MBA</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <Toggle checked={crossSellAutoRecommend} onChange={setCrossSellAutoRecommend} />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("cross_sell"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.cross_sell ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.cross_sell ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.cross_sell && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  <div className={`space-y-4 ${crossSellAutoRecommend ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                    <div className="space-y-2 max-w-xl">
                      <label className="text-xs font-bold text-[#4A403A]">Seuil de confiance minimal des règles MBA (%)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range" min={0.05} max={0.80} step={0.05}
                          value={crossSellMinConfidence}
                          onChange={e => setCrossSellMinConfidence(parseFloat(e.target.value))}
                          className="flex-1 accent-[#E8462F]"
                        />
                        <span className="text-xs font-black text-[#1A1A1A] bg-[#FAF5F1] border border-[#EEE5DF] px-3 py-1 rounded-lg w-16 text-center">
                          {Math.round(crossSellMinConfidence * 100)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7A6E68] leading-relaxed">Les paires de produits affichées en recommandation auront au moins ce taux de corrélation.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SECTION 7 : Coûts Marketing & Comptabilité (PURE CONFIG / DONNÉES DE RÉFÉRENCE) ── */}
          {showSection("costs") && (
            <div id="section-costs" className="bg-white rounded-2xl border border-[#EEE5DF] shadow-2xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => toggleSectionOpen("costs")}
                className="p-4 md:px-7 md:py-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-[#FAF5F1]/50 transition-colors select-none"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-[#7A6E68]" />
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-extrabold text-[#1A1A1A]">Coûts Marketing & Export Comptable</h2>
                      <span className="bg-[#FAF5F1] text-[#7A6E68] border border-[#EEE5DF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Données de Référence
                      </span>
                    </div>
                    <p className="text-xs text-[#7A6E68] mt-0.5 truncate">Calcul précis du ROI et envoi mensuel automatique du rapport au comptable</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 self-center">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSectionOpen("costs"); }}
                    className="w-8 h-8 rounded-xl bg-[#FAF5F1] border border-[#EEE5DF] flex items-center justify-center text-[#7A6E68] hover:bg-[#F3ECE6] hover:text-[#1A1A1A] transition-colors shrink-0"
                    title={openSections.costs ? "Fermer la section" : "Ouvrir la section"}
                  >
                    {openSections.costs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {openSections.costs && (
                <div className="p-6 md:p-7 space-y-6 border-t border-[#EEE5DF]">
                  {/* Grille des coûts */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Coût Email (DT)</label>
                      <input
                        type="number" step={0.005} min={0}
                        value={marketingCostEmail}
                        onChange={e => setMarketingCostEmail(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Coût SMS (DT)</label>
                      <input
                        type="number" step={0.01} min={0}
                        value={marketingCostSms}
                        onChange={e => setMarketingCostSms(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Coût Push (DT)</label>
                      <input
                        type="number" step={0.001} min={0}
                        value={marketingCostFcm}
                        onChange={e => setMarketingCostFcm(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4A403A]">Frais Fixes (DT)</label>
                      <input
                        type="number" step={1} min={0}
                        value={marketingCostSetup}
                        onChange={e => setMarketingCostSetup(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                  </div>

                  {/* Export Comptable */}
                  <div className="pt-5 border-t border-[#EEE5DF] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-extrabold text-[#1A1A1A]">Export Comptable Mensuel Automatique</h3>
                        <p className="text-xs text-[#7A6E68] mt-0.5">Envoi du rapport CSV/PDF le 1er du mois à 9h00</p>
                      </div>
                      <Toggle checked={monthlyExportEnabled} onChange={setMonthlyExportEnabled} />
                    </div>

                    <div className={`space-y-2 ${monthlyExportEnabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
                      <label className="text-xs font-bold text-[#4A403A] flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#7A6E68]" /> Email du comptable
                      </label>
                      <input
                        type="email"
                        value={accountantEmail}
                        onChange={e => setAccountantEmail(e.target.value)}
                        placeholder="comptable@example.com"
                        className="w-full sm:w-96 bg-[#FAF5F1] border border-[#EEE5DF] px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Footer Save Button ── */}
          <div className="flex justify-end pt-2 pb-8">
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#E8462F] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#C93D28] transition-all duration-200 shadow-lg shadow-[#E8462F]/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? "Modifications Enregistrées !" : saving ? "Enregistrement en cours..." : "Enregistrer tous les paramètres"}
            </button>
          </div>

          </div>
        )}
      </div>
    </div>
  );
}
