"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import {
  BrainCircuit,
  Sparkles,
  Bell,
  History,
  Star,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Smile,
  Meh,
  Frown,
  Search,
  Globe,
  User,
  Crown,
  UserCheck,
  UserX,
  Edit3,
  RefreshCw,
  Download,
  X,
  HelpCircle,
  Inbox,
  AlertCircle,
  Zap,
  Filter
} from "lucide-react";

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface SentimentResult {
  sentiment: "positif" | "neutre" | "négatif";
  score_confiance: number;
  risque_churn: number;
  motifs: string[];
  alerte_requise: boolean;
  niveau_alerte: "aucune" | "standard" | "prioritaire";
  suggestion_action: string | null;
  extrait_pertinent: string;
}

interface HistoryEntry {
  _id: string;
  created_at: string;
  client_email: string | null;
  client_status: string;
  review_text: string;
  source: string;
  result: SentimentResult;
}

interface HistoryStats {
  total: number;
  avg_churn: number;
  positifs: number;
  neutres: number;
  negatifs: number;
  alertes_prioritaires: number;
}

interface QueueItem {
  _id: string;
  created_at: string;
  source: "google" | "facebook";
  review_text: string;
  author_name: string;
  rating: number | null;
  review_date: string;
  client_suggere: { email: string; nom: string; segment: string; score_confiance: number } | null;
  statut: "en_attente" | "valide" | "rejete";
}

interface ClientResult {
  _id: string;
  email?: string;
  nom?: string;
  client_db_id?: string;
  segment_gmm?: string;
}

interface ClientSuggestion {
  email: string;
  nom: string;
  segment_gmm: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────
const API = "/api";

const SENTIMENT_CONFIG = {
  positif: {
    icon: Smile,
    label: "Positif",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
    text: "text-emerald-600"
  },
  neutre: {
    icon: Meh,
    label: "Neutre",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    bar: "bg-amber-400",
    text: "text-amber-600"
  },
  négatif: {
    icon: Frown,
    label: "Négatif",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-500",
    text: "text-rose-600"
  },
};

const ALERTE_CONFIG = {
  aucune: {
    label: "Aucune alerte",
    bg: "bg-slate-100",
    text: "text-[#7A6E68]",
    icon: CheckCircle2
  },
  standard: {
    label: "Alerte standard",
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-700",
    icon: AlertTriangle
  },
  prioritaire: {
    label: "PRIORITAIRE",
    bg: "bg-rose-50 border border-rose-200 animate-pulse",
    text: "text-rose-700 font-black",
    icon: ShieldAlert
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────
function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span className="text-slate-300 text-xs">N/A</span>;
  return (
    <span className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= value ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"
            }`}
        />
      ))}
    </span>
  );
}

function ChurnGauge({ value }: { value: number }) {
  const color = value >= 70 ? "#ef4444" : value >= 40 ? "#f59e0b" : "#10b981";
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const step = value / 40;
    let cur = 0;
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplayed(Math.round(cur));
      if (cur >= value) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [value]);

  const angle = (displayed / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const nx = 60 + 45 * Math.cos(rad);
  const ny = 60 + 45 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="65" viewBox="0 0 120 70">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e2e8f0" strokeWidth="10" strokeLinecap="round" />
        {displayed > 0 && (
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(displayed / 100) * 157} 157`}
          />
        )}
        <line x1="60" y1="60" x2={nx} y2={ny} stroke={color} strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="60" r="4" fill={color} />
        <text x="10" y="68" fontSize="8" fill="#94a3b8">0</text>
        <text x="105" y="68" fontSize="8" fill="#94a3b8">100</text>
      </svg>
      <div className="text-center">
        <span className="text-2xl font-black" style={{ color }}>{displayed}</span>
        <span className="text-slate-400 text-xs font-medium">/100</span>
        <p className="text-xs text-[#7A6E68] font-medium">Risque Churn</p>
      </div>
    </div>
  );
}

function ConfidenceStars({ score }: { score: number }) {
  const stars = Math.round(score * 5);
  return (
    <div className="flex gap-1 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= stars ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"
            }`}
        />
      ))}
      <span className="text-xs font-bold text-slate-600 ml-1">{(score * 100).toFixed(0)}%</span>
    </div>
  );
}

// ─── Modale de sélection manuelle d'un client ─────────────────────────────────
function ClientSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (c: ClientResult) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ClientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API}/sentiment/clients-search?q=${encodeURIComponent(q)}`);
        const d = await r.json();
        setResults(d.clients || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md mx-4 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#E8462F] to-[#F06038] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-white" />
            <h3 className="text-white font-bold text-sm">Sélectionner un client</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8462F]/30 focus:border-[#E8462F] transition"
            />
          </div>
          {loading && (
            <p className="text-xs text-[#E8462F] text-center font-medium animate-pulse py-2 flex items-center justify-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Recherche en cours...
            </p>
          )}
          {!loading && q.length >= 2 && results.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">
              Aucun client trouvé pour &ldquo;{q}&rdquo;
            </p>
          )}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {results.map((c) => (
              <button
                key={c._id}
                onClick={() => onSelect(c)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#FDECEA] hover:border-[#FDECEA] border border-transparent transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-[#E8462F]">
                      {c.nom || c.client_db_id || "—"}
                    </p>
                    <p className="text-xs text-[#B0A49C]">{c.email || c.client_db_id}</p>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${c.segment_gmm === "vip"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-[#7A6E68]"
                      }`}
                  >
                    {c.segment_gmm === "vip" ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-600" /> VIP
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 text-slate-500" /> Std
                      </>
                    )}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onglet File d'attente ────────────────────────────────────────────────────
function QueueTab() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [counts, setCounts] = useState({ en_attente: 0, valide: 0, rejete: 0 });
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [resultMap, setResultMap] = useState<Record<string, SentimentResult>>({});
  const [showModal, setShowModal] = useState<string | null>(null);
  const [collectLoading, setCollectLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sentiment/queue?statut=en_attente&limit=50`);
      const d = await r.json();
      if (d.success) {
        setItems(d.data);
        setCounts(d.counts);
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleValider(item: QueueItem, clientEmail: string | null, clientStatus: string) {
    setProcessingId(item._id);
    try {
      const r = await fetch(`${API}/sentiment/queue/${item._id}/valider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_email: clientEmail, client_status: clientStatus }),
      });
      const d = await r.json();
      if (d.success && d.result) {
        setResultMap((prev) => ({ ...prev, [item._id]: d.result }));
        await load();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleRejeter(id: string) {
    setProcessingId(id);
    try {
      const r = await fetch(`${API}/sentiment/queue/${id}/rejeter`, { method: "POST" });
      const d = await r.json();
      if (d.success && d.result) {
        setResultMap((prev) => ({ ...prev, [id]: d.result }));
        await load();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleCollectNow() {
    setCollectLoading(true);
    try {
      const r = await fetch(`${API}/sentiment/collect-now`, { method: "POST" });
      const d = await r.json();
      if (d.success) await load();
    } catch {
      /* silencieux */
    } finally {
      setCollectLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E8462F] border border-rose-100 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">
              File d&apos;attente de validation
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Les avis collectés automatiquement attendent une validation humaine avant analyse
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {[
            { k: "en_attente", label: "En attente" },
            { k: "valide", label: "Validés" },
            { k: "rejete", label: "Inconnus" },
          ].map(({ k, label }, idx) => (
            <div key={k} className="flex items-center gap-1.5 text-slate-500">
              {idx > 0 && <span className="text-slate-300 mr-2">·</span>}
              <span className="font-extrabold text-[#1A1A1A]">{counts[k as keyof typeof counts]}</span>
              <span className="text-slate-500 font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-7 h-7 text-[#E8462F] animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Chargement de la file...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-[#1A1A1A] font-bold text-sm">File d&apos;attente vide</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
              Aucun avis en attente de validation. Le prochain passage du collecteur tournera dans les 6 prochaines heures.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE5DF]/60">
            {items.map((item) => {
              const isProcessing = processingId === item._id;
              const prevResult = resultMap[item._id];
              const suggere = item.client_suggere;

              return (
                <div
                  key={item._id}
                  className={`p-4 transition-all ${isProcessing ? "opacity-50 pointer-events-none" : "hover:bg-[#FAF3EE]/40"
                    }`}
                >
                  <div className="flex flex-col lg:flex-row gap-4 items-center">
                    {/* Source + texte */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {item.source === "google" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                            <Globe className="w-3 h-3" /> Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <FacebookIcon className="w-3 h-3" /> Facebook
                          </span>
                        )}
                        <StarRating value={item.rating} />
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-700 font-bold">{item.author_name}</span>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.review_date || item.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 italic bg-[#FAF3EE] p-2.5 rounded-xl border border-[#EEE5DF]">
                        &ldquo;{item.review_text}&rdquo;
                      </p>
                    </div>

                    {/* Client suggéré (Minimaliste & Pro) */}
                    <div className="lg:w-48 shrink-0">
                      {suggere ? (
                        <div className="flex flex-col gap-0.5 py-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-[#1A1A1A] truncate">{suggere.nom || suggere.email}</span>
                            {suggere.segment === "vip" && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                VIP
                              </span>
                            )}
                          </div>
                          {suggere.nom && (
                            <p className="text-[11px] text-slate-400 truncate pl-5">{suggere.email}</p>
                          )}
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pl-5 mt-0.5 font-medium">
                            <span className="text-emerald-600 font-bold">{(suggere.score_confiance * 100).toFixed(0)}%</span>
                            <span>correspondance</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1">
                          <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5 text-slate-300" /> Non identifié
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="lg:w-40 shrink-0 flex flex-col gap-1.5 justify-center">
                      {isProcessing ? (
                        <div className="text-center py-3">
                          <RefreshCw className="w-4 h-4 text-[#E8462F] animate-spin mx-auto mb-1" />
                          <p className="text-xs text-slate-400 font-medium">Analyse...</p>
                        </div>
                      ) : prevResult ? (
                        <div
                          className={`rounded-xl p-2.5 text-center border ${ALERTE_CONFIG[prevResult.niveau_alerte].bg
                            }`}
                        >
                          <p className={`text-xs font-bold flex items-center justify-center gap-1 ${ALERTE_CONFIG[prevResult.niveau_alerte].text}`}>
                            {prevResult.sentiment}
                          </p>
                          <p className={`text-[11px] ${ALERTE_CONFIG[prevResult.niveau_alerte].text}`}>
                            Churn {prevResult.risque_churn}/100
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Confirmer */}
                          <button
                            onClick={() =>
                              handleValider(
                                item,
                                suggere?.email ?? null,
                                suggere?.segment === "vip" ? "vip" : "standard"
                              )
                            }
                            disabled={!suggere}
                            title={
                              suggere
                                ? `Confirmer : ${suggere.nom || suggere.email}`
                                : "Aucun client à confirmer"
                            }
                            className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer
                          </button>

                          {/* Corriger */}
                          <button
                            onClick={() => setShowModal(item._id)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-[#EEE5DF] transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" /> Corriger
                          </button>

                          {/* Inconnu */}
                          <button
                            onClick={() => handleRejeter(item._id)}
                            className="w-full py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <UserX className="w-3 h-3" /> Inconnu
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale correction client */}
      {showModal && (
        <ClientSearchModal
          onClose={() => setShowModal(null)}
          onSelect={async (client) => {
            const itemId = showModal;
            setShowModal(null);

            const newSuggere = {
              email: client.email || client.client_db_id || "",
              nom: client.nom || client.client_db_id || "",
              segment: (client.segment_gmm || "standard").toLowerCase(),
              score_confiance: 1.0,
            };

            setItems((prev) =>
              prev.map((item) => (item._id === itemId ? { ...item, client_suggere: newSuggere } : item))
            );

            try {
              await fetch(`${API}/sentiment/queue/${itemId}/corriger`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSuggere),
              });
            } catch (err) {
              console.error("Erreur sauvegarde correction client:", err);
            }
          }}
        />
      )}
    </div>
  );
}

// ─── Onglet Analyser ──────────────────────────────────────────────────────────
function AnalyzeTab() {
  const [reviewText, setReviewText] = useState("");
  const [clientStatus, setClientStatus] = useState<"vip" | "standard">("standard");
  const [clientEmail, setClientEmail] = useState("");
  const [clientHistory, setClientHistory] = useState("");
  const [source, setSource] = useState<"google" | "facebook">("google");
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyFetching, setHistoryFetching] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [suggestions, setSuggestions] = useState<ClientSuggestion[]>([]);
  const [detectedClient, setDetectedClient] = useState<ClientSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (emailRef.current && !emailRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  // Autocomplete: search clients as user types
  useEffect(() => {
    const query = clientEmail.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/sentiment/clients-search?q=${encodeURIComponent(query)}&limit=6`);
        const d = await r.json();
        if (d.success && d.clients?.length > 0) {
          setSuggestions(d.clients);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [clientEmail]);

  // Auto-fetch history when valid email is fully entered or suggestion selected
  useEffect(() => {
    if (!clientEmail.includes("@")) {
      setClientHistory("");
      return;
    }
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(async () => {
      setHistoryFetching(true);
      try {
        const r = await fetch(`${API}/sentiment/prefill-history?client_email=${encodeURIComponent(clientEmail)}`);
        const d = await r.json();
        setClientHistory(d.success && d.history ? d.history : "");
      } catch {
        /* silencieux */
      } finally {
        setHistoryFetching(false);
      }
    }, 700);
  }, [clientEmail]);

  function selectClient(c: ClientSuggestion) {
    setClientEmail(c.email);
    setDetectedClient(c);
    setClientStatus((c.segment_gmm || "standard").toLowerCase() === "vip" ? "vip" : "standard");
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleAnalyze() {
    if (!reviewText.trim()) {
      setError("Le texte de l'avis est obligatoire.");
      return;
    }
    setError(null);
    setLoading(true);
    setShowResult(false);
    setResult(null);
    try {
      const r = await fetch(`${API}/sentiment/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_text: reviewText,
          client_status: clientStatus,
          client_email: clientEmail || undefined,
          client_history_override: clientHistory || undefined,
          source,
        }),
      });
      const d = await r.json();
      if (!d.success) throw new Error(d.error || "Erreur inconnue");
      setResult(d.result);
      setAnalysisId(d.analysis_id?.toString() || null);
      setShowResult(true);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'analyse.");
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? SENTIMENT_CONFIG[result.sentiment] : null;
  const alertCfg = result ? ALERTE_CONFIG[result.niveau_alerte] : null;
  const SentimentIcon = cfg ? cfg.icon : Smile;
  const AlertIcon = alertCfg ? alertCfg.icon : CheckCircle2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Formulaire */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EEE5DF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-[#E8462F]" />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Analyser un avis client</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Analyse de sentiment IA &amp; détection churn</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
            IA NLP
          </span>
        </div>

        <div className="p-6 space-y-4">
          {/* Source */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Source de l'avis
            </label>
            <div className="flex gap-2">
              {(["google", "facebook"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${source === s
                    ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                    : "bg-[#FAF3EE] text-slate-600 border-[#EEE5DF] hover:border-slate-300"
                    }`}
                >
                  {s === "google" ? (
                    <>
                      <Globe className="w-3.5 h-3.5 text-blue-500" /> Google
                    </>
                  ) : (
                    <>
                      <FacebookIcon className="w-3.5 h-3.5 text-indigo-500" /> Facebook
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Email avec autocomplete */}
          <div ref={emailRef} className="relative">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Email du client (optionnel)
              </label>
              {historyFetching && (
                <span className="text-[11px] text-[#E8462F] font-semibold animate-pulse flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Recherche...
                </span>
              )}
              {clientHistory && !historyFetching && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Historique chargé
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  setDetectedClient(null);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="Tapez l'email ou le nom du client..."
                className="w-full bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#E8462F] focus:bg-white transition-all pr-9"
              />
              {clientEmail && (
                <button
                  onClick={() => {
                    setClientEmail("");
                    setDetectedClient(null);
                    setClientStatus("standard");
                    setSuggestions([]);
                    setClientHistory("");
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-[#EEE5DF] rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((c) => (
                  <button
                    key={c.email}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectClient(c);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-[#FAF3EE] transition border-b border-slate-50 last:border-0 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">
                        {c.nom || c.email}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{c.email}</p>
                    </div>
                    <span
                      className={`ml-2 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${(c.segment_gmm || "").toLowerCase() === "vip"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                    >
                      {(c.segment_gmm || "").toLowerCase() === "vip" ? (
                        <>
                          <Crown className="w-3 h-3 text-amber-600" /> VIP
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3 text-slate-400" /> Std
                        </>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Badge client détecté */}
            {detectedClient && (
              <div
                className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${clientStatus === "vip"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
              >
                {clientStatus === "vip" ? (
                  <Crown className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="font-bold">{detectedClient.nom || detectedClient.email}</span>
                <span className="font-normal text-slate-400">
                  ({clientStatus === "vip" ? "Client VIP" : "Standard"})
                </span>
              </div>
            )}
          </div>

          {/* Texte avis */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Texte de l&apos;avis <span className="text-[#E8462F]">*</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Collez le commentaire ou l'avis reçu de votre client..."
              className="w-full bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#E8462F] focus:bg-white transition-all resize-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              {reviewText.length} caractères · Supporte Français, Arabe dialectal et Anglais
            </p>
          </div>

          {/* Historique */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
              Historique client (Optionnel)
            </label>
            <textarea
              value={clientHistory}
              onChange={(e) => setClientHistory(e.target.value)}
              rows={2}
              placeholder="S'auto-remplit automatiquement après sélection du client..."
              className="w-full bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl px-3.5 py-2 text-xs text-slate-600 focus:outline-none focus:border-[#E8462F] transition-all resize-none font-mono"
            />
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !reviewText.trim()}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#E8462F] hover:bg-[#C93A25] transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyse IA en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Lancer l&apos;analyse sentiment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résultat */}
      <div ref={resultRef}>
        {!showResult && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3EE] border border-[#EEE5DF] flex items-center justify-center text-slate-400 mb-3">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <p className="text-[#1A1A1A] font-bold text-sm">Prêt à analyser</p>
            <p className="text-slate-400 text-xs mt-1 max-w-xs leading-relaxed">
              Saisissez l&apos;avis à gauche pour calculer le sentiment, les motifs clés et le risque de churn.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-1.5 text-[10px] font-bold">
              {["Sentiment NLP", "Risque Churn", "Motifs clés", "Recommandations"].map((t) => (
                <span key={t} className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md border border-slate-200">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 flex flex-col items-center justify-center text-center min-h-[440px]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#FDECEA] border-t-[#E8462F] animate-spin flex items-center justify-center" />
              <BrainCircuit className="w-7 h-7 text-[#E8462F] absolute inset-0 m-auto" />
            </div>
            <p className="text-slate-800 font-bold text-base mt-6">Analyse IA en cours...</p>
            <p className="text-slate-400 text-xs mt-1">Évaluation du sentiment et calcul du risque churn</p>
          </div>
        )}

        {showResult && result && cfg && alertCfg && (
          <div
            className={`rounded-2xl shadow-sm border overflow-hidden animate-fadeIn ${result.sentiment === "positif"
              ? "border-emerald-200 bg-emerald-50/50"
              : result.sentiment === "neutre"
                ? "border-amber-200 bg-amber-50/50"
                : "border-rose-200 bg-rose-50/50"
              }`}
          >
            <div
              className={`px-6 py-4 flex items-center justify-between border-b ${result.sentiment === "positif"
                ? "border-emerald-200"
                : result.sentiment === "neutre"
                  ? "border-amber-200"
                  : "border-rose-200"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${cfg.badge}`}>
                  <SentimentIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {analysisId && (
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      ID: {analysisId.slice(-8)}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${alertCfg.bg} ${alertCfg.text}`}>
                <AlertIcon className="w-4 h-4 shrink-0" />
                <span>{alertCfg.label}</span>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-around gap-4 bg-white/80 rounded-xl p-4 border border-slate-200/60 shadow-sm">
                <ChurnGauge value={result.risque_churn} />
                <div className="h-16 w-px bg-slate-200" />
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-wider">Confiance IA</p>
                  <ConfidenceStars score={result.score_confiance} />
                </div>
              </div>

              {result.motifs.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Motifs clés détectés
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.motifs.map((m, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.extrait_pertinent && (
                <div className="bg-white/90 border-l-4 border-[#E8462F] rounded-r-xl px-4 py-3 shadow-sm">
                  <p className="text-[10px] text-[#E8462F] font-bold uppercase tracking-wider mb-1">
                    Extrait pertinent
                  </p>
                  <blockquote className="text-xs text-slate-700 italic">
                    &ldquo;{result.extrait_pertinent}&rdquo;
                  </blockquote>
                </div>
              )}

              {result.suggestion_action && (
                <div
                  className={`rounded-xl px-4 py-3.5 border ${result.niveau_alerte === "prioritaire"
                    ? "bg-rose-100/80 border-rose-300"
                    : "bg-amber-100/80 border-amber-300"
                    }`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-wider mb-1 flex items-center gap-1.5 ${result.niveau_alerte === "prioritaire" ? "text-rose-700" : "text-amber-800"
                      }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {result.niveau_alerte === "prioritaire" ? "Action prioritaire requise" : "Action recommandée"}
                  </p>
                  <p
                    className={`text-xs font-medium leading-relaxed ${result.niveau_alerte === "prioritaire" ? "text-rose-900" : "text-amber-950"
                      }`}
                  >
                    {result.suggestion_action}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  const b = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(b);
                  a.download = `sentiment-${analysisId || "result"}.json`;
                  a.click();
                }}
                className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" /> Exporter le rapport JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Onglet Historique ─────────────────────────────────────────────────────────
function HistoryTab() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | "positif" | "neutre" | "negatif">("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "google" | "facebook">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/sentiment/history?limit=100`);
      const d = await r.json();
      if (d.success) {
        setHistory(d.data);
        setStats(d.stats);
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredHistory = history.filter((entry) => {
    // Filtre par sentiment
    if (sentimentFilter !== "all" && entry.result.sentiment !== sentimentFilter) {
      return false;
    }
    // Filtre par source
    if (sourceFilter !== "all" && entry.source !== sourceFilter) {
      return false;
    }
    // Recherche textuelle (email, extrait ou texte de l'avis)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchEmail = entry.client_email?.toLowerCase().includes(q);
      const matchText = entry.review_text?.toLowerCase().includes(q);
      const matchExtrait = entry.result.extrait_pertinent?.toLowerCase().includes(q);
      if (!matchEmail && !matchText && !matchExtrait) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EEE5DF] overflow-hidden space-y-0">
      {/* Header + barre de recherche et filtres */}
      <div className="p-4 border-b border-[#EEE5DF] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#E8462F] border border-rose-100 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider">Historique des analyses</h2>
            {stats && (
              <p className="text-[11px] text-slate-400 mt-0.5">
                {stats.total} avis analysés · Churn moy. : <span className="font-bold text-slate-700">{stats.avg_churn?.toFixed(0)}/100</span>
              </p>
            )}
          </div>
        </div>

        {/* Barre de filtre et recherche */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher email, extrait..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF3EE] border border-[#EEE5DF] hover:border-slate-300 focus:border-[#E8462F] focus:bg-white text-xs font-medium text-slate-800 pl-8 pr-7 py-1.5 rounded-lg outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtre par Sentiment */}
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value as any)}
            className="bg-[#FAF3EE] border border-[#EEE5DF] text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer hover:border-slate-300 transition-all"
          >
            <option value="all">Tous sentiments</option>
            <option value="positif">Positif</option>
            <option value="neutre">Neutre</option>
            <option value="negatif">Négatif</option>
          </select>

          {/* Filtre par Source */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="bg-[#FAF3EE] border border-[#EEE5DF] text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer hover:border-slate-300 transition-all"
          >
            <option value="all">Toutes sources</option>
            <option value="google">Google</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-7 h-7 text-[#E8462F] animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-medium">Chargement de l'historique...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-12 text-center">
          <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
          <p className="text-[#1A1A1A] font-bold text-xs">
            {searchTerm || sentimentFilter !== "all" || sourceFilter !== "all"
              ? "Aucun résultat pour cette recherche"
              : "Aucun avis analysé pour le moment"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#FAF3EE] text-[10px] text-slate-400 uppercase tracking-wider border-b border-[#EEE5DF]">
                {["Date", "Client", "Source", "Sentiment", "Churn", "Alerte", "Extrait"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEE5DF]/60">
              {filteredHistory.map((entry) => {
                const isNegatif = entry.result.sentiment === "négatif";
                const isPositif = entry.result.sentiment === "positif";

                return (
                  <tr key={entry._id} className="hover:bg-[#FAF3EE]/40 transition-colors">
                    <td className="px-4 py-2.5 text-slate-400 text-[11px] whitespace-nowrap font-medium">
                      {new Date(entry.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${entry.client_status === "VIP" ? "bg-rose-50/70 text-[#E8462F] border-[#E8462F]/30" : "bg-slate-100 text-slate-700 border-slate-200/80"}`}>
                          {entry.client_status === "VIP" ? "VIP" : "Std"}
                        </span>
                        <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">
                          {entry.client_email || "Client anonyme"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[11px] font-semibold capitalize text-slate-600">
                      {entry.source === "google" ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> Google
                        </span>
                      ) : (
                        <span className="text-indigo-600 flex items-center gap-1">
                          <FacebookIcon className="w-3 h-3" /> Facebook
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-semibold">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${isPositif ? "bg-emerald-50/70 text-emerald-800 border-emerald-200/60" : isNegatif ? "bg-rose-50/70 text-rose-800 border-rose-200/60" : "bg-slate-100 text-slate-700 border-slate-200/80"}`}>
                        {isPositif ? "Positif" : isNegatif ? "Négatif" : "Neutre"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs ${entry.result.risque_churn >= 70 ? "font-bold text-[#E8462F]" : entry.result.risque_churn >= 60 ? "font-semibold text-amber-600" : "font-medium text-slate-600"}`}>
                        {entry.result.risque_churn}/100
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[11px]">
                      {entry.result.niveau_alerte === "prioritaire" ? (
                        <span className="text-[#E8462F] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> Prioritaire
                        </span>
                      ) : entry.result.niveau_alerte === "standard" ? (
                        <span className="text-slate-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-slate-400 shrink-0" /> Standard
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Aucune</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-[220px]">
                      <p className="text-[11px] text-slate-500 italic truncate">
                        &ldquo;{entry.result.extrait_pertinent || entry.review_text}&rdquo;
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Page principale avec onglets ─────────────────────────────────────────────
export default function AvisClientsPage() {
  const [activeTab, setActiveTab] = useState<"analyser" | "queue" | "historique">("analyser");
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/sentiment/queue?statut=en_attente&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQueueCount(d.counts?.en_attente ?? 0);
      })
      .catch(() => { });
  }, []);

  const TABS = [
    { id: "analyser", label: "Analyser un avis", badge: null },
    { id: "queue", label: "File d'attente", badge: queueCount > 0 ? queueCount : null },
    { id: "historique", label: "Historique", badge: null },
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <PageHeader
        title="Avis Clients — Analyse Sentiment IA"
        subtitle="Détection automatique du sentiment et prédiction du churn sur les avis Google & Facebook"
      />

      {/* Onglets */}
      <div className="px-8 mt-6">
        <div className="flex border-b border-[#EEE5DF] gap-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${isActive
                  ? "border-[#E8462F] text-[#E8462F]"
                  : "border-transparent text-[#B0A49C] hover:text-[#7A6E68]"
                  }`}
              >
                {tab.label}
                {tab.badge !== null && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center transition-all ${isActive ? "bg-[#E8462F]/90 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 w-full">
        {activeTab === "analyser" && <AnalyzeTab />}
        {activeTab === "queue" && <QueueTab />}
        {activeTab === "historique" && <HistoryTab />}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out both; }
      `}</style>
    </div>
  );
}
