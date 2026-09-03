"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  MessageSquare,
  Unlock,
  CheckCircle,
  Eye,
  Loader2,
} from "lucide-react";

const API = "http://localhost:5000/api";

interface ClientData {
  client_db_id: string;
  nom: string;
  email: string;
  commerce_id: string;
  churn_score?: number;
  influence_score?: number;
  score_global_sa?: number;
}

interface BlockedClient {
  nom: string;
  email: string;
  commerce_id: string;
  block_reason: string;
  blocked_at: string;
}

interface SupportTicketAlert {
  _id: string;
  email: string;
  commerce_id: string;
  commerce_name?: string;
  status: string;
  summary?: string;
  unread_by_admin?: boolean;
  unread_count?: number;
}

interface ChatbotMessage {
  sender: "user" | "bot" | "agent";
  text: string;
  timestamp: string;
}

export default function AINotificationBell() {
  const router = useRouter();

  const [churnAlerts, setChurnAlerts] = useState<ClientData[]>([]);
  const [ambassadorAlerts, setAmbassadorAlerts] = useState<ClientData[]>([]);
  const [blockedAlerts, setBlockedAlerts] = useState<BlockedClient[]>([]);
  const [supportTicketsAlerts, setSupportTicketsAlerts] = useState<SupportTicketAlert[]>([]);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState<number>(0);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"churn" | "ambassador" | "chatbot">("churn");
  const [chatbotSubTab, setChatbotSubTab] = useState<"messages" | "blocked">("messages");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [viewedChurnIds, setViewedChurnIds] = useState<string[]>([]);
  const [viewedAmbassadorIds, setViewedAmbassadorIds] = useState<string[]>([]);

  const [isChatbotModalOpen, setIsChatbotModalOpen] = useState(false);
  const [activeChatbotClient, setActiveChatbotClient] = useState<{ email: string; nom: string; commerce_id: string; reason: string } | null>(null);
  const [chatbotConversation, setChatbotConversation] = useState<ChatbotMessage[]>([]);
  const [chatbotLoading, setChatbotLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedChurn = localStorage.getItem("viewedAlertIds");
      const savedAmb = localStorage.getItem("viewedAmbassadorIds");
      if (savedChurn) setViewedChurnIds(JSON.parse(savedChurn));
      if (savedAmb) setViewedAmbassadorIds(JSON.parse(savedAmb));
    }
  }, []);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const commerceId = localStorage.getItem("ratenza_commerce_id") || "commerce_local";
        const targetId = commerceId === "__all__" ? "commerce_local" : commerceId;

        try {
          const botRes = await fetch(`${API}/chatbot/blocks?commerce_id=${encodeURIComponent(targetId)}`);
          if (botRes.ok) {
            const botJson = await botRes.json();
            if (botJson?.status === "success") setBlockedAlerts(botJson.data || []);
          }
        } catch { /* silent */ }

        try {
          const ticketRes = await fetch(`${API}/chatbot/support-tickets?limit=100`);
          if (ticketRes.ok) {
            const ticketJson = await ticketRes.json();
            if (ticketJson?.status === "success") {
              const list: SupportTicketAlert[] = ticketJson.data || [];
              const unread = list.filter((t) => t.unread_by_admin && t.status !== "CLOSED");
              setSupportTicketsAlerts(unread);
              setUnreadTicketsCount(unread.length);
            }
          }
        } catch { /* silent */ }

        let merged: ClientData[] = [];
        try {
          const res = await fetch(`${API}/data?commerce_id=${encodeURIComponent(targetId)}`);
          if (res.ok) {
            const data = await res.json();
            merged = Array.isArray(data) ? data : [];
          }
        } catch { /* silent */ }

        const churns = merged.filter((c) => (c.churn_score || 0) >= 0.55);
        churns.sort((a, b) => (b.churn_score || 0) - (a.churn_score || 0));
        setChurnAlerts(churns);

        const ambassadors = merged.filter((c) => {
          const score =
            c.influence_score !== undefined
              ? c.influence_score
              : Math.round(((c.score_global_sa || 0) * 0.7 + (1.0 - (c.churn_score || 0)) * 0.3) * 100);
          return score >= 80;
        });
        setAmbassadorAlerts(ambassadors);
      } catch (err) {
        console.warn("AI notifications error:", err);
      }
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadChurnCount = churnAlerts.filter((a) => !viewedChurnIds.includes(a.client_db_id || a.email)).length;
  const unreadAmbCount = ambassadorAlerts.filter((a) => !viewedAmbassadorIds.includes(a.client_db_id || a.email)).length;
  const blockedCount = blockedAlerts.length;
  const chatbotTotalCount = unreadTicketsCount + blockedCount;
  const totalBadge = unreadChurnCount + unreadAmbCount + chatbotTotalCount;

  const markChurnAsRead = (id: string) => {
    if (!viewedChurnIds.includes(id)) {
      const updated = [...viewedChurnIds, id];
      setViewedChurnIds(updated);
      localStorage.setItem("viewedAlertIds", JSON.stringify(updated));
    }
  };

  const markAmbAsRead = (id: string) => {
    if (!viewedAmbassadorIds.includes(id)) {
      const updated = [...viewedAmbassadorIds, id];
      setViewedAmbassadorIds(updated);
      localStorage.setItem("viewedAmbassadorIds", JSON.stringify(updated));
    }
  };

  const handleAlertClick = (client: ClientData, type: "churn" | "ambassador") => {
    const id = client.client_db_id || client.email;
    if (type === "churn") markChurnAsRead(id);
    else markAmbAsRead(id);
    setIsOpen(false);
    router.push(`/merchant/clients-ia?openEmail=${encodeURIComponent(client.email)}`);
  };

  const handleUnblock = async (email: string, commerceId: string) => {
    if (!confirm(`Voulez-vous vraiment débloquer l'accès pour ${email} ?`)) return;
    try {
      const res = await fetch(`${API}/chatbot/unblock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, commerce_id: commerceId }),
      });
      const data = await res.json();
      if (data.status === "success") {
        alert(data.message || "Client débloqué avec succès !");
        setBlockedAlerts((prev) => prev.filter((c) => c.email !== email));
        setIsChatbotModalOpen(false);
      } else {
        alert(data.error || "Erreur de déblocage.");
      }
    } catch {
      alert("Erreur de connexion.");
    }
  };

  const handleViewConversation = async (email: string, nom: string, commerceId: string, reason: string) => {
    setIsChatbotModalOpen(true);
    setActiveChatbotClient({ email, nom, commerce_id: commerceId, reason });
    setChatbotLoading(true);
    setChatbotConversation([]);
    try {
      const res = await fetch(`${API}/chatbot/conversation/${encodeURIComponent(email)}?commerce_id=${encodeURIComponent(commerceId)}`);
      const data = await res.json();
      if (data.status === "success") setChatbotConversation(data.data?.history || []);
    } catch { /* silent */ } finally {
      setChatbotLoading(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200/80 text-gray-500 hover:text-[#1B100C] transition-colors"
        >
          <Bell className="w-4 h-4" />
          {totalBadge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-[#D73E26] text-white text-[9px] font-black rounded-full flex items-center justify-center border border-[#1A0F0A] px-0.5 animate-pulse">
              {totalBadge > 9 ? "9+" : totalBadge}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 top-12 w-[380px] bg-white border border-[#EEE5DF] rounded-2xl shadow-2xl p-4 flex flex-col gap-3 max-h-[500px] z-[100]">
            <div className="space-y-2 border-b border-[#EEE5DF] pb-3">
              <div className="flex gap-1.5">
                {([
                  { key: "churn", label: "🔴 Churn", count: unreadChurnCount, active: "bg-rose-500 text-white", inactive: "bg-rose-50 text-rose-600 hover:bg-rose-100" },
                  { key: "ambassador", label: "👑 Ambass.", count: unreadAmbCount, active: "bg-amber-500 text-white", inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                  { key: "chatbot", label: "🤖 Chatbot", count: chatbotTotalCount, active: "bg-purple-600 text-white", inactive: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${activeTab === tab.key ? tab.active : tab.inactive}`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && <span className="bg-white/30 px-1.5 rounded-full text-[9px]">{tab.count}</span>}
                  </button>
                ))}
              </div>

              {activeTab === "chatbot" && (
                <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
                  {([
                    { key: "messages", label: `💬 Messages (${unreadTicketsCount})` },
                    { key: "blocked", label: `🚨 Bloqués (${blockedCount})` },
                  ] as const).map((sub) => (
                    <button
                      key={sub.key}
                      onClick={() => setChatbotSubTab(sub.key)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer border ${chatbotSubTab === sub.key ? "bg-white text-amber-900 border-amber-300 shadow-sm" : "bg-transparent text-slate-500 border-transparent hover:text-slate-800"}`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] space-y-2">
              {activeTab === "churn" && (
                churnAlerts.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">Aucune alerte churn active.</div>
                ) : churnAlerts.map((client) => {
                  const id = client.client_db_id || client.email;
                  const isRead = viewedChurnIds.includes(id);
                  const isCritical = (client.churn_score || 0) >= 0.75;
                  return (
                    <div key={id} onClick={() => handleAlertClick(client, "churn")}
                      className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${isRead ? "bg-white border-[#EEE5DF] opacity-60" : isCritical ? "bg-rose-50/50 border-rose-200 hover:bg-rose-50" : "bg-[#FAF3EE] border-[#EEE5DF] hover:bg-[#FDECEA]/30"}`}>
                      <div className="flex flex-col gap-0.5 max-w-[70%]">
                        <span className="font-bold text-[#1A1A1A] truncate">{client.nom}</span>
                        <span className="text-[10px] text-[#7A6E68] truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-black px-2 py-0.5 rounded-full text-[9px] ${isCritical ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {((client.churn_score || 0) * 100).toFixed(0)}%
                        </span>
                        <div className="w-6 h-6 rounded bg-white border border-[#EEE5DF] flex items-center justify-center">
                          {isRead ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Eye className="w-3.5 h-3.5 text-[#B0A49C]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {activeTab === "ambassador" && (
                ambassadorAlerts.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-[#B0A49C]">Aucun ambassadeur détecté.</div>
                ) : ambassadorAlerts.map((client) => {
                  const id = client.client_db_id || client.email;
                  const isRead = viewedAmbassadorIds.includes(id);
                  const influence = client.influence_score !== undefined ? client.influence_score : Math.round(((client.score_global_sa || 0) * 0.7 + (1.0 - (client.churn_score || 0)) * 0.3) * 100);
                  return (
                    <div key={id} onClick={() => handleAlertClick(client, "ambassador")}
                      className={`p-2.5 rounded-xl border text-xs flex justify-between items-center transition-all cursor-pointer ${isRead ? "bg-white border-[#EEE5DF] opacity-60" : "bg-amber-50/30 border-amber-200 hover:bg-amber-50"}`}>
                      <div className="flex flex-col gap-0.5 max-w-[70%]">
                        <span className="font-bold text-[#1A1A1A] truncate">👑 {client.nom}</span>
                        <span className="text-[10px] text-[#7A6E68] truncate">{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-700 font-black px-2 py-0.5 rounded-full text-[9px]">{influence}%</span>
                        <div className="w-6 h-6 rounded bg-white border border-[#EEE5DF] flex items-center justify-center">
                          {isRead ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Eye className="w-3.5 h-3.5 text-[#B0A49C]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {activeTab === "chatbot" && chatbotSubTab === "messages" && (
                supportTicketsAlerts.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-slate-400">Aucun nouveau message support en attente.</div>
                ) : supportTicketsAlerts.map((ticket) => (
                  <div key={ticket._id}
                    onClick={() => { setIsOpen(false); router.push(`/merchant/parametres/audit-moderation?tab=tickets&ticket_id=${encodeURIComponent(ticket._id)}`); }}
                    className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex flex-col gap-1.5 shadow-sm hover:bg-amber-50 transition cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <span className="font-extrabold text-[#1A1A1A] truncate block">{ticket.email}</span>
                        <span className="text-[10px] text-amber-800 font-bold block">🏪 {ticket.commerce_name || ticket.commerce_id}</span>
                      </div>
                      <span className="bg-amber-100 border border-amber-300 text-amber-900 font-extrabold px-2 py-0.5 rounded-full text-[9px] flex-shrink-0 animate-pulse">
                        🔴 {ticket.unread_count || 1} non lu{(ticket.unread_count || 1) > 1 ? "s" : ""}
                      </span>
                    </div>
                    {ticket.summary && <p className="text-[10.5px] text-slate-600 line-clamp-1 font-medium bg-white/70 p-1.5 rounded-lg border border-amber-100">{ticket.summary}</p>}
                  </div>
                ))
              )}

              {activeTab === "chatbot" && chatbotSubTab === "blocked" && (
                blockedAlerts.length === 0 ? (
                  <div className="text-center py-8 text-xs font-bold text-[#B0A49C]">Aucun client bloqué.</div>
                ) : blockedAlerts.map((client) => (
                  <div key={client.email} className="p-3 bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl text-xs flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <span className="font-extrabold text-[#1A1A1A] truncate block">👤 {client.nom || "Client"}</span>
                        <span className="text-[10px] text-[#7A6E68] font-medium truncate block">{client.email}</span>
                      </div>
                      <span className="bg-rose-100 border border-rose-200 text-rose-700 font-extrabold px-1.5 py-0.5 rounded text-[8px] flex-shrink-0 animate-pulse">🚨 BLOQUÉ</span>
                    </div>
                    <div className="bg-white border border-[#EEE5DF] p-2 rounded text-[10px] text-[#7A6E68] leading-normal font-semibold">
                      <strong>Motif:</strong> {client.block_reason || "Warnings multiples"}
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <button onClick={() => handleViewConversation(client.email, client.nom, client.commerce_id, client.block_reason)}
                        className="flex-1 py-1.5 rounded-lg bg-[#FDECEA] border border-[#E8D9CF] text-[#E8462F] text-[10px] font-bold hover:bg-[#FAF3EE] transition-all flex items-center justify-center gap-1 cursor-pointer">
                        <MessageSquare className="w-3 h-3" /> Discuss.
                      </button>
                      <button onClick={() => handleUnblock(client.email, client.commerce_id)}
                        className="py-1.5 px-2.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 cursor-pointer">
                        <Unlock className="w-3 h-3" /> Débloquer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isChatbotModalOpen && activeChatbotClient && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-[#EEE5DF] rounded-2xl w-[500px] max-w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex justify-between items-center pb-3 border-b border-[#EEE5DF]">
              <div>
                <h3 className="font-extrabold text-[#1A1A1A] text-base">Discussion de {activeChatbotClient.nom}</h3>
                <p className="text-[10px] text-[#7A6E68] font-bold mt-0.5">{activeChatbotClient.email} | {activeChatbotClient.commerce_id}</p>
              </div>
              <button onClick={() => setIsChatbotModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-[#FAF3EE] flex items-center justify-center text-[#B0A49C] hover:text-[#7A6E68] transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-800 font-semibold">
              ⚠️ <strong>Raison du blocage :</strong> {activeChatbotClient.reason}
            </div>
            <div className="flex-1 overflow-y-auto bg-[#FAF3EE] border border-[#EEE5DF] rounded-xl p-4 space-y-3 min-h-[250px] max-h-[400px]">
              {chatbotLoading ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-[#B0A49C]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#E8462F]" />
                  <span className="text-[10px] font-bold mt-2">Chargement...</span>
                </div>
              ) : chatbotConversation.length === 0 ? (
                <div className="text-center py-20 text-xs font-bold text-slate-400">Aucun message dans l'historique.</div>
              ) : chatbotConversation.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={idx} className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 shadow-sm border ${isUser ? "bg-blue-100 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-700"}`}>
                      {isUser ? "👤" : "🤖"}
                    </div>
                    <div className={`p-3 rounded-2xl max-w-[80%] text-xs shadow-sm font-medium ${isUser ? "bg-[#2563eb] text-white rounded-br-none" : "bg-white text-[#1A1A1A] border border-[#EEE5DF] rounded-bl-none"}`}>
                      <p className="leading-relaxed">{msg.text}</p>
                      <span className={`text-[8px] font-bold block text-right mt-1.5 ${isUser ? "text-blue-100" : "text-[#B0A49C]"}`}>
                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-3 border-t border-[#EEE5DF] shrink-0">
              <button onClick={() => setIsChatbotModalOpen(false)} className="flex-1 border border-[#EEE5DF] hover:bg-[#FAF3EE] text-[#7A6E68] font-extrabold text-xs py-2.5 rounded-lg transition-all cursor-pointer">Fermer</button>
              <button onClick={() => handleUnblock(activeChatbotClient.email, activeChatbotClient.commerce_id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-sm transition-all cursor-pointer">🔓 Débloquer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
