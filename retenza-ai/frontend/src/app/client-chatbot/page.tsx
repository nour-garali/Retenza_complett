"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
  Store,
  User,
  Send,
  Bot,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  LogOut,
  Headphones,
  Info,
  RotateCcw,
  AlertCircle,
  Package,
  Award,
  ShieldCheck,
  TriangleAlert,
  Bell,
  CheckCircle2,
  X
} from "lucide-react";

interface CommerceOption {
  id: string;
  name: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "alert" | "support";
  channel?: "bot" | "support";
  content: string;
  timestamp: string;
  feedback?: "like" | "dislike" | null;
}

const DEFAULT_COMMERCES: CommerceOption[] = [
  { id: "commerce_local_1", name: "Boutique Tunis" },
  { id: "commerce_local_2", name: "Boutique Sousse" },
  { id: "commerce_local", name: "Boutique Nabeul" },
  { id: "commerce_sfax", name: "Boutique Sfax" },
];

export default function ClientChatbotPage() {
  // ─── ÉTATS DE SESSION ────────────────────────────────────────────────────────
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("ghofrane.khadhar@gmail.com");
  const [selectedCommerceId, setSelectedCommerceId] = useState<string>("commerce_local_1");
  const [selectedCommerceName, setSelectedCommerceName] = useState<string>("Boutique Tunis");
  const [commercesList, setCommercesList] = useState<CommerceOption[]>(DEFAULT_COMMERCES);
  const [loginError, setLoginError] = useState<string>("");
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(false);

  // ─── ÉTATS DU CHAT ───────────────────────────────────────────────────────────
  const [sessionId, setSessionId] = useState<string>(() => `session_${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [escalatingSupport, setEscalatingSupport] = useState<boolean>(false);
  const [hasEscalated, setHasEscalated] = useState<boolean>(false);
  const [isSessionClosed, setIsSessionClosed] = useState<boolean>(false);

  // ─── PANNEAU LIVE SUPPORT ────────────────────────────────────────────────────
  const [supportChatOpen, setSupportChatOpen] = useState<boolean>(false);
  const [hasUnreadSupportMsg, setHasUnreadSupportMsg] = useState<boolean>(false);
  const [supportMessages, setSupportMessages] = useState<Message[]>([]);
  const [supportInput, setSupportInput] = useState<string>("");
  const [sendingSupportMsg, setSendingSupportMsg] = useState<boolean>(false);
  const [supportTicketId, setSupportTicketId] = useState<string | null>(null);
  const supportMsgEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientBotSectionRef = useRef<HTMLDivElement>(null);
  const clientSupportSectionRef = useRef<HTMLDivElement>(null);
  const [supportSectionFilter, setSupportSectionFilter] = useState<"all" | "bot" | "support">("all");

  // ─── ÉTAT AVERTISSEMENTS CLIENT ──────────────────────────────────
  const [clientWarnings, setClientWarnings] = useState<number>(0);
  const [clientIsBlocked, setClientIsBlocked] = useState<boolean>(false);
  const [warningDropdownOpen, setWarningDropdownOpen] = useState<boolean>(false);
  const warningBellRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic en dehors
  useEffect(() => {
    if (!warningDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (warningBellRef.current && !warningBellRef.current.contains(e.target as Node)) {
        setWarningDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [warningDropdownOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // 1. Charger la liste réelle des commerces depuis /api/commerces au démarrage
  useEffect(() => {
    fetch("/api/commerces")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((c) => {
            const rawLabel = c.label || c.name || c.id;
            let displayName = rawLabel;
            if (displayName.startsWith("commerce_")) {
              displayName = displayName.replace(/^commerce_/, "Boutique ").replace(/_/g, " ");
              displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
            }
            return { id: c.id, name: displayName };
          });
          setCommercesList(formatted);
          if (formatted[0]) {
            setSelectedCommerceId(formatted[0].id);
            setSelectedCommerceName(formatted[0].name);
          }
        }
      })
      .catch(() => {
        // Fallback sur DEFAULT_COMMERCES
      });
  }, []);

  // 2. Détecter la session enregistrée dans localStorage + Vérification Backend
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("client_user_email");
      const savedCommerceId = localStorage.getItem("client_commerce_id");
      const savedCommerceName = localStorage.getItem("client_commerce_name");

      if (savedEmail && savedCommerceId && savedCommerceName) {
        setEmail(savedEmail);
        setSelectedCommerceId(savedCommerceId);
        setSelectedCommerceName(savedCommerceName);
        setIsAuthenticated(true);
      }
    } catch (e) {
      // LocalStorage non disponible
    }
  }, []);

  const getFirstName = (emailStr: string) => {
    if (!emailStr) return "Client";
    const namePart = emailStr.split("@")[0] || "";
    const firstWord = namePart.split(".")[0] || namePart;
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  };

  // Helper pour formater le gras sans afficher d'astérisques brutes **..**
  const renderFormattedContent = (content: string, isUser: boolean = false) => {
    if (!content) return null;
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={i} className={`font-extrabold ${isUser ? "text-white" : "text-[#1A1A1A]"}`}>
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </>
    );
  };

  // 3. Réinitialiser le message d'accueil à l'authentification
  const resetToWelcomeMessage = (shopName: string = selectedCommerceName, userEmail: string = email) => {
    const firstName = getFirstName(userEmail);
    const newSid = `session_${Date.now()}`;
    setSessionId(newSid);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: `Bonjour **${firstName}** ! 👋 Je suis l'assistant virtuel de **${shopName}**, propulsé par Retenza.\nJ'ai déjà accès à votre profil, donc n'hésitez pas à me poser votre question directement — je suis là pour vous aider. 😊\nComment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  useEffect(() => {
    if (isAuthenticated) {
      resetToWelcomeMessage(selectedCommerceName, email);
    }
  }, [isAuthenticated, selectedCommerceName, email]);

  // 4. Charger le statut avertissements du client après auth
  useEffect(() => {
    if (!isAuthenticated || !email || !selectedCommerceId) return;
    fetch(`/api/chatbot/client-status?email=${encodeURIComponent(email)}&commerce_id=${encodeURIComponent(selectedCommerceId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          setClientWarnings(data.warnings || 0);
          setClientIsBlocked(data.is_blocked || false);
        }
      })
      .catch(() => { });
  }, [isAuthenticated, email, selectedCommerceId]);

  // 5. Au login : charger le ticket actif et la conversation complète sans forcer l'ouverture du panneau
  useEffect(() => {
    if (!isAuthenticated || !email || !selectedCommerceId) return;

    const loadExistingConversation = async () => {
      try {
        const ticketRes = await fetch(
          `/api/chatbot/support-tickets?email=${encodeURIComponent(email)}&commerce_id=${encodeURIComponent(selectedCommerceId)}`
        );
        const ticketData = await ticketRes.json();
        const tickets: any[] = ticketData.data || [];

        const activeTicket = tickets
          .filter((t: any) => (t.status === "OPEN" || t.status === "IN_PROGRESS") && t.session_id)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        if (!activeTicket) return;

        const sid = activeTicket.session_id;
        setSessionId(sid);
        setHasEscalated(true);

        const convRes = await fetch(
          `/api/chatbot/conversation/${encodeURIComponent(email)}?commerce_id=${encodeURIComponent(selectedCommerceId)}&session_id=${encodeURIComponent(sid)}`
        );
        const convData = await convRes.json();
        const allMsgs: any[] = convData.data || [];

        if (allMsgs.length > 0) {
          const formatted: Message[] = allMsgs.map((m: any, idx: number) => ({
            id: `conv-${idx}-${m.role}-${Date.now()}`,
            role: (m.role === "client_support" ? "user" : m.role) as "user" | "assistant" | "support",
            channel: m.channel || (m.role === "support" || m.role === "client_support" ? "support" : "bot"),
            content: (m.text || m.content || m.message || "").replace(/^🎧\s*\[Conseiller Support\]\s*:\s*/i, "").trim(),
            timestamp: (() => {
              try {
                const ts = m.timestamp;
                if (!ts) return "";
                if (/^\d{4}-\d{2}-\d{2}T/.test(ts)) return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return ts;
              } catch { return ""; }
            })()
          }));
          setSupportMessages(formatted);

          // Si le dernier message est du conseiller support et le panneau est fermé, allumer le badge non lu
          const hasSupportReply = formatted.some((m) => m.role === "support");
          if (hasSupportReply) {
            setHasUnreadSupportMsg(true);
          }
        }
      } catch {
        // silent
      }
    };

    loadExistingConversation();
  }, [isAuthenticated, email, selectedCommerceId]);

  // 6. Polling en temps réel pour synchroniser la conversation et badger les réponses non lues sans intrusion
  // + Détecte si le conseiller ferme (CLOSED) la session pour réinitialiser l'état et permettre une nouvelle escalade
  useEffect(() => {
    if (!isAuthenticated || !email || !selectedCommerceId || !hasEscalated || !sessionId) return;

    const pollForSupportMessages = async () => {
      try {
        // 1. Vérifier le statut du ticket actif
        const ticketRes = await fetch(
          `/api/chatbot/support-tickets?email=${encodeURIComponent(email)}&commerce_id=${encodeURIComponent(selectedCommerceId)}`
        );
        const ticketData = await ticketRes.json();
        const tickets: any[] = ticketData.data || [];
        const currentTicket = tickets.find((t: any) => t.session_id === sessionId);

        // Si le ticket est CLOSED ou introuvable, passer la session en lecture seule (NE PAS fermer le panneau !)
        if (!currentTicket || currentTicket.status === "CLOSED") {
          setIsSessionClosed(true);
          return;
        }

        // 2. Polling des messages de la conversation
        const r = await fetch(
          `/api/chatbot/conversation/${encodeURIComponent(email)}?commerce_id=${encodeURIComponent(selectedCommerceId)}&session_id=${encodeURIComponent(sessionId)}`
        );
        const data = await r.json();
        if (data.status === "success" && Array.isArray(data.data)) {
          const allMsgs = data.data;
          const formatted: Message[] = allMsgs.map((m: any, idx: number) => ({
            id: `conv-poll-${idx}-${m.role}-${m.timestamp || Date.now()}`,
            role: (m.role === "client_support" ? "user" : m.role) as "user" | "assistant" | "support",
            channel: m.channel || (m.role === "support" || m.role === "client_support" ? "support" : "bot"),
            content: (m.text || m.content || m.message || "").replace(/^🎧\s*\[Conseiller Support\]\s*:\s*/i, "").trim(),
            timestamp: (() => {
              try {
                const ts = m.timestamp;
                if (!ts) return "";
                if (/^\d{4}-\d{2}-\d{2}T/.test(ts)) return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return ts;
              } catch { return ""; }
            })()
          }));

          setSupportMessages((prev) => {
            const prevSupportCount = prev.filter((m) => m.role === "support").length;
            const newSupportCount = formatted.filter((m) => m.role === "support").length;

            if (newSupportCount > prevSupportCount) {
              setSupportChatOpen((isOpen) => {
                if (!isOpen) {
                  setHasUnreadSupportMsg(true);
                }
                return isOpen;
              });
            }
            return formatted;
          });
        }
      } catch {
        // silent
      }
    };

    const interval = setInterval(pollForSupportMessages, 3000);
    return () => clearInterval(interval);
  }, [isAuthenticated, email, selectedCommerceId, hasEscalated, sessionId]);

  // Choix de boutique dans le sélecteur
  const handleCommerceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const commId = e.target.value;
    setSelectedCommerceId(commId);
    const found = commercesList.find((c) => c.id === commId);
    if (found) {
      setSelectedCommerceName(found.name);
    }
  };

  // ─── POINT 2 : SOUMISSION ET VÉRIFICATION D'ACCÈS BACKEND EMAIL <-> BOUTIQUE ─
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setLoginError("Veuillez saisir une adresse email valide.");
      return;
    }

    setIsVerifyingSession(true);

    try {
      const res = await fetch("/api/chatbot/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          commerce_id: selectedCommerceId
        })
      });

      const data = await res.json();

      if (!res.ok || data.status !== "success") {
        setLoginError(data.error || "Cet email n'est pas associé à cette boutique.");
        setIsVerifyingSession(false);
        return;
      }

      // Session valide et rattachée !
      try {
        localStorage.setItem("client_user_email", cleanEmail);
        localStorage.setItem("client_commerce_id", selectedCommerceId);
        localStorage.setItem("client_commerce_name", selectedCommerceName);
      } catch (err) {
        // silent
      }

      setEmail(cleanEmail);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError("Erreur de connexion au serveur. Veuillez réinstaller votre réseau.");
    } finally {
      setIsVerifyingSession(false);
    }
  };

  // Déconnexion explicitement déclenchée par l'utilisateur
  const handleLogout = () => {
    try {
      localStorage.removeItem("client_user_email");
      localStorage.removeItem("client_commerce_id");
      localStorage.removeItem("client_commerce_name");
    } catch (e) {
      // silent
    }
    setIsAuthenticated(false);
    setMessages([]);
  };

  // ─── POINT 3 : ENVOI DE MESSAGE ET STREAMING ──────────────────────────────────
  const handleSend = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText !== undefined ? overrideText : inputMessage;
    if (!textToSend.trim() || isStreaming) return;

    const userText = textToSend.trim();
    setInputMessage("");

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const botMsgId = `bot-${Date.now()}`;
    const botMsg: Message = {
      id: botMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userText,
          email: email,
          commerce_id: selectedCommerceId,
          commerce_name: selectedCommerceName,
          session_id: sessionId,
          history: messages.map((m) => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Erreur de connexion au serveur chatbot.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let streamedText = "";
      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\r?\n\r?\n/);
          buffer = parts.pop() || "";

          for (const part of parts) {
            const lines = part.split(/\r?\n/);
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ")) {
                try {
                  const jsonStr = trimmed.substring(6).trim();
                  const data = JSON.parse(jsonStr);
                  if (data.type === "token" && data.content) {
                    streamedText += data.content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === botMsgId ? { ...m, content: streamedText } : m
                      )
                    );
                  } else if (data.type === "moderation" && data.is_inappropriate) {
                    setMessages((prev) => [
                      ...prev.filter((m) => m.id !== botMsgId),
                      {
                        id: `alert-${Date.now()}`,
                        role: "alert",
                        content: `⚠️ ${data.reason || "Message inapproprié détecté."}`,
                        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      }
                    ]);
                    // ─── Enregistrement de l'avertissement dans audit_logs ───────────
                    fetch("/api/chatbot/save-warning", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email,
                        commerce_id: selectedCommerceId,
                        commerce_name: selectedCommerceName,
                        user_message: userText,
                        reason: data.reason || "Message inapproprié détecté.",
                        warning_count: data.warning_count || null
                      })
                    })
                      .then((r) => r.json())
                      .then((wd) => {
                        if (wd.warnings !== undefined) {
                          setClientWarnings(wd.warnings);
                          setClientIsBlocked(wd.is_blocked || false);
                        }
                      })
                      .catch(() => { });
                  }
                } catch (e) {
                  // JSON incomplet
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, content: "⚠️ Erreur lors de la communication avec le serveur. Veuillez réessayez." }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  // ─── ACTION : PARLER À UN HUMAIN (ESCALADE SUPPORT) ───────────────────────────
  const handleEscalateSupport = async () => {
    if (escalatingSupport) return;
    setEscalateTrigger();
  };

  const setEscalateTrigger = async () => {
    // Si la session est active (non fermée) et le panneau déjà ouvert, juste le rouvrir
    if (supportChatOpen && !isSessionClosed) {
      setSupportChatOpen(true);
      return;
    }
    // Si session active (non fermée) et hasEscalated est déjà vrai, rouvrir le panneau
    if (hasEscalated && !isSessionClosed) {
      setSupportChatOpen(true);
      return;
    }

    // Cas normal ou ré-escalade après session fermée : générer un nouveau session_id
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setIsSessionClosed(false);
    setSupportMessages([]);
    setEscalatingSupport(true);

    // Récupérer les 15 derniers messages de la conversation bot comme contexte
    const botOnlyMsgs = messages.filter((m) => m.role === "user" || m.role === "assistant");
    const maxContext = 15;
    const totalBotMsgs = botOnlyMsgs.length;
    const truncatedCount = totalBotMsgs > maxContext ? totalBotMsgs - maxContext : 0;
    const contextMsgs = botOnlyMsgs.slice(-maxContext).map((m) => ({
      role: m.role,
      content: m.content,
      text: m.content,
      timestamp: m.timestamp
    }));

    try {
      const res = await fetch("/api/chatbot/support-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          commerce_id: selectedCommerceId,
          commerce_name: selectedCommerceName,
          session_id: newSessionId,
          reason: "Demande directe de conseiller humain",
          summary: `Demande transmise depuis l'interface client autonome.`,
          messages_count: messages.length,
          bot_context_messages: contextMsgs,
          truncated_bot_messages_count: truncatedCount
        })
      });
      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      if (data.ticket_id) {
        setSupportTicketId(String(data.ticket_id));
      }
    } catch (e) {
      // silent
    } finally {
      setEscalatingSupport(false);
      setHasEscalated(true);
      // Ouvrir le panneau support avec message d'attente
      setSupportMessages([{
        id: `support-waiting-${Date.now()}`,
        role: "alert",
        content: `🎧 Votre demande a été transmise à un conseiller de **${selectedCommerceName}**.\n\nVous pouvez nous laisser un message, il vous répondra dès que possible.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }]);
      setSupportChatOpen(true);
    }
  };

  // Auto-scroll support panel
  useEffect(() => {
    supportMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [supportMessages]);

  // ─── ACTION : ENVOYER UN MESSAGE DANS LE CHAT SUPPORT ─────────────────────────
  const handleSendSupportMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!supportInput.trim() || sendingSupportMsg || isSessionClosed) return;
    const text = supportInput.trim();
    setSupportInput("");
    setSendingSupportMsg(true);

    // Ajouter localement immédiatement
    const optimisticMsg: Message = {
      id: `client_support-${Date.now()}`,
      role: "user",
      channel: "support",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setSupportMessages((prev) => [...prev, optimisticMsg]);

    try {
      await fetch("/api/chatbot/support-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          commerce_id: selectedCommerceId,
          session_id: sessionId,
          message: text
        })
      });
    } catch {
      // silent
    } finally {
      setSendingSupportMsg(false);
    }
  };

  // ─── ACTION : FEEDBACKS MESSAGE (👍 / 👎 / COPIER) ────────────────────────────
  const handleFeedback = async (msgId: string, text: string, type: "like" | "dislike") => {
    const targetMsg = messages.find((m) => m.id === msgId);
    const currentFeedback = targetMsg?.feedback ?? null;
    const nextFeedback: "like" | "dislike" | null = currentFeedback === type ? null : type;

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: nextFeedback } : m))
    );

    try {
      await fetch("/api/chatbot/message-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          commerce_id: selectedCommerceId,
          session_id: sessionId,
          message_id: msgId,
          text: text,
          feedback: nextFeedback
        })
      });
    } catch (e) {
      // silent
    }
  };

  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // ─── ÉCRAN 1 : FORMULAIRE DE CONNEXION CLIENT ───────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#FAF3EE] flex items-center justify-center p-4 sm:p-6 font-sans">
        <div className="bg-white border border-[#EEE5DF] rounded-3xl shadow-xl max-w-md w-full p-8 space-y-6 animate-in fade-in duration-300">

          {/* Header & Logo Brand */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8462F] to-[#F06038] flex items-center justify-center shadow-lg shadow-[#E8462F]/25 mx-auto">
              <RefreshCw className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                Retenza <span className="text-[#E8462F]">AI</span>
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
                Assistant Client Autonome
              </p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100" />

          {/* Formulaire Login Client */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-2">
                Votre Adresse E-mail Client
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="nom.prenom@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FAF3EE] border border-[#EEE5DF] pl-10 pr-4 py-3 rounded-xl text-xs font-semibold text-[#1A1A1A] placeholder-slate-400 outline-none focus:border-[#E8462F] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#1A1A1A] uppercase tracking-wider mb-2">
                Sélectionnez Votre Boutique
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCommerceId}
                  onChange={handleCommerceChange}
                  className="w-full bg-[#FAF3EE] border border-[#EEE5DF] pl-10 pr-8 py-3 rounded-xl text-xs font-bold text-[#1A1A1A] outline-none focus:border-[#E8462F] focus:bg-white transition-all cursor-pointer appearance-none"
                >
                  {commercesList.map((comm) => (
                    <option key={comm.id} value={comm.id}>
                      {comm.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Message d'erreur de contrôle d'accès */}
            {loginError && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2 text-rose-700 text-xs font-semibold animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifyingSession}
              className="w-full bg-gradient-to-r from-[#E8462F] to-[#F06038] hover:from-[#C93A25] hover:to-[#E8462F] text-white py-3.5 rounded-xl text-xs font-extrabold shadow-md shadow-[#E8462F]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isVerifyingSession ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Vérification de votre compte...</span>
                </>
              ) : (
                <>
                  <span>Accéder à l'Assistant Chatbot</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Note explicative */}
          <div className="bg-[#FAF3EE] p-3.5 rounded-2xl border border-[#EEE5DF] flex items-start gap-2.5 text-[11px] text-slate-500">
            <Info className="w-4 h-4 text-[#E8462F] shrink-0 mt-0.5" />
            <p>
              Votre conversation sera automatiquement rattachée à votre profil client et à votre boutique pour un suivi personnalisé.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // ─── ÉCRAN 2 : INTERFACE DE CHAT AUTONOME CLIENT ────────────────────────────────
  return (
    <div className="h-screen w-full bg-[#FAF3EE] flex flex-col overflow-hidden font-sans">

      {/* Header Client Supérieur */}
      <header className="bg-white border-b border-[#EEE5DF] px-6 py-3.5 flex items-center justify-between shrink-0 shadow-xs relative">
        {/* Branding Client (Gauche) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E8462F] to-[#F06038] flex items-center justify-center shadow-md shadow-[#E8462F]/20">
            <RefreshCw className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-[#1A1A1A] leading-none">
                Retenza <span className="text-[#E8462F]">AI</span>
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Assistant en ligne
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Assistant virtuel de <strong className="text-slate-700 font-extrabold">{selectedCommerceName}</strong>
            </p>
          </div>
        </div>

        {/* Droite du Header : Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Bouton "Parler à un humain" / "Session support" */}
          <button
            onClick={() => {
              if (hasEscalated) {
                setSupportChatOpen((prev) => !prev);
                setHasUnreadSupportMsg(false);
              } else {
                handleEscalateSupport();
              }
            }}
            disabled={escalatingSupport}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 relative ${
              hasUnreadSupportMsg
                ? "bg-rose-600 text-white border border-rose-700 shadow-md animate-pulse"
                : hasEscalated
                ? "bg-amber-500 text-white border border-amber-600 hover:bg-amber-600 shadow-sm"
                : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            }`}
            title={hasUnreadSupportMsg ? "Nouveau message du conseiller support !" : hasEscalated ? "Ouvrir la session support" : "Demander de l'aide à un conseiller humain"}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasUnreadSupportMsg ? "Nouveau message !" : hasEscalated ? "Session support" : "Parler à un humain"}
            </span>
            {hasUnreadSupportMsg ? (
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            ) : hasEscalated ? (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            ) : null}
          </button>

          {/* 🔔 Bouton Cloche Avertissements (Positionné à droite, entre Parler à un humain et Déconnexion) */}
          {clientWarnings > 0 && (
            <div ref={warningBellRef} className="relative flex items-center justify-center">
              <button
                onClick={() => setWarningDropdownOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
                  clientIsBlocked
                    ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    : clientWarnings >= 2
                    ? "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100"
                    : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                }`}
                title="Avertissements reçus du chatbot"
              >
                <Bell className="w-4 h-4" />
                <span className={`absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black text-white flex items-center justify-center ${
                  clientIsBlocked ? "bg-red-500" : clientWarnings >= 2 ? "bg-orange-500" : "bg-amber-500"
                }`}>
                  {clientWarnings}
                </span>
              </button>

              {/* Dropdown épuré et ultra-simplifié */}
              {warningDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#EEE5DF] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#EEE5DF]">
                    <span className="text-xs font-black text-[#1A1A1A]">Historique de modération</span>
                    <button onClick={() => setWarningDropdownOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-600 font-semibold mb-3">
                    <span>Avertissements reçus :</span>
                    <span className="font-extrabold text-[#1A1A1A]">{clientWarnings} / 3</span>
                  </div>

                  <p className="pt-2 border-t border-[#EEE5DF] text-[11px] text-slate-400 leading-snug">
                    {clientIsBlocked
                      ? "Ce compte est bloqué suite à 3 avertissements."
                      : "3 avertissements entraînent un blocage automatique du compte."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bouton Déconnexion / Changer de profil */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-white border border-[#EEE5DF] hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
            title="Changer de compte / Boutique"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Zone Principale de Chat Client */}
      <main className="flex-1 p-4 sm:p-6 max-w-4xl w-full mx-auto flex flex-col overflow-hidden">

        {/* Cadre Unique Fusionné (Messages + Barre de Saisie Sans Trou) */}
        <div className="bg-white border border-[#EEE5DF] rounded-3xl shadow-sm flex-1 flex flex-col overflow-hidden">

          {/* Zone des Messages de Discussion */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {messages.map((msg) => {
              if (msg.role === "alert") {
                return (
                  <div key={msg.id} className="flex justify-center my-2 animate-in fade-in">
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold px-4 py-2.5 rounded-2xl flex items-center gap-2 max-w-md shadow-2xs">
                      <Headphones className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{renderFormattedContent(msg.content)}</span>
                    </div>
                  </div>
                );
              }

              const isUser = msg.role === "user";
              const isSupport = msg.role === "support";

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in duration-200`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm mt-1 ${
                      isUser
                        ? "bg-[#6B7280]"
                        : isSupport
                        ? "bg-amber-500"
                        : "bg-gradient-to-br from-[#E8462F] to-[#F06038]"
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : isSupport ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Bulle de Message */}
                  <div className={`space-y-1.5 max-w-[85%] ${isUser ? "text-right" : "text-left"}`}>
                    <div className={`flex items-center gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <span className="text-xs font-extrabold text-[#1A1A1A]">
                          {isSupport ? "🎧 Conseiller Support" : "Assistant Retenza"}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed font-medium whitespace-pre-wrap ${
                        isUser
                          ? "bg-[#6B7280] text-white rounded-tr-sm shadow-sm"
                          : isSupport
                          ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm"
                          : "bg-[#FAF3EE] border border-[#EEE5DF] text-[#1A1A1A] rounded-tl-sm"
                      }`}
                    >
                      {msg.content ? (
                        renderFormattedContent(msg.content, isUser)
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Rédaction de la réponse...</span>
                        </div>
                      )}
                    </div>

                    {/* Actions sur message Assistant (Copier, Like, Dislike) - masqué sur l'accueil initial */}
                    {!isUser && !isSupport && msg.content && !msg.id.startsWith("welcome") && (
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                          title="Copier le message"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleFeedback(msg.id, msg.content, "like")}
                          className={`p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer ${msg.feedback === "like" ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-slate-600"
                            }`}
                          title="Réponse utile"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleFeedback(msg.id, msg.content, "dislike")}
                          className={`p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer ${msg.feedback === "dislike" ? "text-rose-600 bg-rose-50" : "text-slate-400 hover:text-slate-600"
                            }`}
                          title="Réponse insatisfaisante"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Suggestions Rapides de démarrage */}
            {messages.length <= 1 && (
              <div className="pl-11 flex flex-wrap gap-2 -mt-3">
                {[
                  { label: "Suivi de ma commande", icon: Package },
                  { label: "Mon solde de points fidélité", icon: Award },
                  { label: "Politique de retour & réclamation", icon: ShieldCheck },
                ].map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setInputMessage("");
                        handleSend(undefined, item.label);
                      }}
                      className="bg-white border border-[#EEE5DF] hover:border-[#E8462F] text-slate-600 hover:text-[#E8462F] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-2"
                    >
                      <IconComp className="w-3.5 h-3.5 text-[#E8462F]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Ligne de séparation subtile */}
          <div className="h-[1px] bg-[#EEE5DF]/60 w-full" />

          {/* Zone de Saisie Fusionnée au Cadre (Interception submit & Entrée) */}
          <form onSubmit={handleSend} className="p-4 bg-[#FAF3EE]/40 flex items-center gap-2">

            {/* Bouton Nouveau Chat - icône discrète à gauche */}
            <button
              type="button"
              onClick={() => resetToWelcomeMessage(selectedCommerceName, email)}
              className="w-9 h-9 rounded-xl bg-white border border-[#EEE5DF] hover:border-[#E8462F] hover:text-[#E8462F] text-slate-400 flex items-center justify-center transition-all shrink-0 cursor-pointer"
              title="Nouveau chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <input
              type="text"
              placeholder={`Posez votre question à l'assistant de ${selectedCommerceName}...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isStreaming && inputMessage.trim()) {
                    handleSend();
                  }
                }
              }}
              className="flex-1 bg-white border border-[#EEE5DF] rounded-2xl px-4 py-3 text-xs font-medium text-[#1A1A1A] placeholder-slate-400 outline-none focus:border-[#E8462F] shadow-2xs transition-all"
            />

            <button
              type="submit"
              onClick={handleSend}
              disabled={!inputMessage.trim() || isStreaming}
              className="w-10 h-10 rounded-2xl bg-gradient-to-r from-[#E8462F] to-[#F06038] hover:from-[#C93A25] hover:to-[#E8462F] text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md shrink-0 cursor-pointer"
            >
              {isStreaming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>

        </div>

      </main>

      {/* ═══ PANNEAU LIVE SUPPORT (SLIDE FROM RIGHT) ═══ */}
      {supportChatOpen && (
        <div className="fixed inset-0 z-50 flex items-stretch pointer-events-none">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm pointer-events-auto"
            onClick={() => setSupportChatOpen(false)}
          />

          {/* Panneau */}
          <div className="w-full max-w-[420px] bg-[#FAFAF9] flex flex-col shadow-2xl pointer-events-auto border-l border-stone-200 animate-in slide-in-from-right duration-300">

            {/* ── HEADER PREMIUM ── */}
            <div className="bg-white border-b border-stone-100 px-5 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Avatar conseiller avec indicateur en ligne */}
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight">Support Retenza</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] text-emerald-600 font-semibold">● En ligne</span>
                      <span className="text-[11px] text-stone-400">·</span>
                      <span className="text-[11px] text-stone-500">{selectedCommerceName}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSupportChatOpen(false)}
                  className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Bandeau session active + Accès rapide */}
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <p className="text-[11px] text-amber-800 font-medium">
                    Session support active · Ticket #{supportTicketId?.slice(0, 8) ?? "—"}
                  </p>
                </div>

                {/* Chips de filtre */}
                {supportMessages.filter((m) => m.role !== "alert").length > 0 && (
                  <div className="pt-1.5 border-t border-amber-200/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9.5px] font-bold text-amber-700/70 uppercase tracking-widest">Filtrer :</span>
                    {(() => {
                      const botCount = supportMessages.filter((m) => {
                        if (m.role === "alert") return false;
                        const ch = m.channel || (m.role === "support" ? "support" : "bot");
                        return ch === "bot" || ch === "bot_context";
                      }).length;
                      const supportCount = supportMessages.filter((m) => {
                        if (m.role === "alert") return false;
                        const ch = m.channel || (m.role === "support" ? "support" : "bot");
                        return ch === "support";
                      }).length;
                      return (
                        <>
                          <button
                            onClick={() => setSupportSectionFilter("all")}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                              supportSectionFilter === "all"
                                ? "bg-stone-700 text-white border-stone-700"
                                : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            <span>Tout</span>
                          </button>
                          {botCount > 0 && (
                            <button
                              onClick={() => setSupportSectionFilter(supportSectionFilter === "bot" ? "all" : "bot")}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                                supportSectionFilter === "bot"
                                  ? "bg-[#E8462F] text-white border-[#E8462F]"
                                  : "bg-white text-[#E8462F] border-amber-200/80 hover:border-[#E8462F]"
                              }`}
                            >
                              <span>🤖 Bot ({botCount})</span>
                            </button>
                          )}
                          {supportCount > 0 && (
                            <button
                              onClick={() => setSupportSectionFilter(supportSectionFilter === "support" ? "all" : "support")}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs border ${
                                supportSectionFilter === "support"
                                  ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-white text-amber-700 border-amber-200 hover:border-amber-500"
                              }`}
                            >
                              <span>🎧 Conseiller ({supportCount})</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* ── ZONE MESSAGES STRUCTURÉE EN 2 SECTIONS FIXES ── */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 bg-[#F5F4F2]">
              {(() => {
                const alertMsgs = supportMessages.filter((m) => m.role === "alert");
                const botMsgs = supportMessages.filter((m) => {
                  if (m.role === "alert") return false;
                  const ch = m.channel || (m.role === "support" ? "support" : "bot");
                  return ch === "bot" || ch === "bot_context";
                });
                const supportMsgs = supportMessages.filter((m) => {
                  if (m.role === "alert") return false;
                  const ch = m.channel || (m.role === "support" ? "support" : "bot");
                  return ch === "support";
                });

                const renderSingleMessage = (msg: Message) => {
                  const isUser = msg.role === "user" || msg.role === "client_support";
                  const isSupport = msg.role === "support";
                  const isBotContext = msg.channel === "bot_context";

                  return (
                    <div key={msg.id} className={`flex items-end gap-2.5 w-full ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          isSupport
                            ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : isBotContext
                            ? "bg-stone-400"
                            : "bg-gradient-to-br from-[#E8462F] to-[#F06038]"
                        }`}>
                          {isSupport ? <Headphones className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                        </div>
                      )}

                      <div className={`max-w-[76%] flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                        {!isUser && (
                          <span className={`text-[10px] font-bold mb-1 px-1 ${
                            isSupport ? "text-amber-700" : isBotContext ? "text-stone-500" : "text-[#E8462F]"
                          }`}>
                            {isSupport ? "🎧 Conseiller Support" : isBotContext ? "🤖 Contexte Bot" : "Retenza IA"}
                          </span>
                        )}

                        <div className={`px-4 py-3 rounded-2xl text-[12.5px] leading-relaxed font-medium shadow-xs ${
                          isUser
                            ? "bg-[#6B7280] text-white rounded-br-md"
                            : isSupport
                            ? "bg-white border border-amber-200 text-[#1A1A1A] rounded-bl-md"
                            : isBotContext
                            ? "bg-stone-100 border border-stone-200 text-stone-700 rounded-bl-md"
                            : "bg-white border border-stone-200 text-[#1A1A1A] rounded-bl-md"
                        }`}>
                          <p className="whitespace-pre-wrap">{renderFormattedContent(msg.content, isUser)}</p>
                        </div>

                        {msg.timestamp && (
                          <span className="text-[9.5px] text-stone-400 mt-1 px-1">{msg.timestamp}</span>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-2xl bg-[#6B7280] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div className="space-y-5">
                    {/* Bannières d'alerte système */}
                    {alertMsgs.map((msg) => (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-medium px-4 py-2.5 rounded-2xl max-w-[90%] text-center leading-relaxed whitespace-pre-wrap">
                          {renderFormattedContent(msg.content)}
                        </div>
                      </div>
                    ))}

                    {/* Section 1 : Bot IA & Contexte */}
                    {botMsgs.length > 0 && (supportSectionFilter === "all" || supportSectionFilter === "bot") && (
                      <div ref={clientBotSectionRef} className="space-y-3 bg-white border border-stone-200/80 rounded-2xl p-3.5 shadow-2xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-stone-100 shrink-0">
                          <div className="w-5 h-5 rounded-lg bg-[#E8462F]/10 text-[#E8462F] flex items-center justify-center">
                            <Bot className="w-3 h-3" />
                          </div>
                          <h4 className="text-[11px] font-bold text-[#1A1A1A]">Échanges & Contexte Bot IA</h4>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 ml-auto">
                            {botMsgs.length}
                          </span>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto space-y-3 pt-1 pr-1">
                          {botMsgs.map(renderSingleMessage)}
                        </div>
                      </div>
                    )}

                    {/* Separateur entre Contexte Bot et Session Support */}
                    {botMsgs.length > 0 && supportMsgs.length > 0 && supportSectionFilter === "all" && (
                      <div className="my-2 flex items-center justify-center gap-2 text-[9.5px] font-extrabold text-amber-700/80 uppercase tracking-widest">
                        <span className="h-px bg-amber-200/80 flex-1" />
                        <span>── Début de la session support ──</span>
                        <span className="h-px bg-amber-200/80 flex-1" />
                      </div>
                    )}

                    {/* Section 2 : Conseiller Support */}
                    {supportMsgs.length > 0 && (supportSectionFilter === "all" || supportSectionFilter === "support") && (
                      <div ref={clientSupportSectionRef} className="space-y-3 bg-amber-50/50 border border-amber-200 rounded-2xl p-3.5 shadow-2xs">
                        <div className="flex items-center gap-2 pb-2 border-b border-amber-200/80 shrink-0">
                          <div className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                            <Headphones className="w-3 h-3" />
                          </div>
                          <h4 className="text-[11px] font-bold text-amber-900">Échanges avec le Conseiller Support</h4>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ml-auto">
                            {supportMsgs.length}
                          </span>
                        </div>
                        <div className="max-h-[240px] overflow-y-auto space-y-3 pt-1 pr-1">
                          {supportMsgs.map(renderSingleMessage)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              <div ref={supportMsgEndRef} />
            </div>

            {/* ── INPUT BAR ── */}
            <div className="bg-white border-t border-stone-100 px-4 pt-3 pb-2 shrink-0">
              {isSessionClosed ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
                  <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🔒 Cette session support est résolue</span>
                  </p>
                  <p className="text-[10.5px] text-emerald-700/90 font-medium">
                    Pour poser une nouvelle question, cliquez sur <strong>"Parler à un humain"</strong> ci-dessus.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendSupportMessage} className="flex items-center gap-2">
                  <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
                    <input
                      type="text"
                      placeholder="Écrivez votre message..."
                      value={supportInput}
                      onChange={(e) => setSupportInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendSupportMessage();
                        }
                      }}
                      className="w-full bg-transparent text-[13px] font-medium text-[#1A1A1A] placeholder-stone-400 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!supportInput.trim() || sendingSupportMsg}
                    className="w-10 h-10 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0 cursor-pointer shadow-md"
                  >
                    {sendingSupportMsg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              )}
              <p className="text-[10px] text-stone-400 text-center mt-2 pb-1">
                🔒 Messages sécurisés et conservés dans votre historique.
              </p>
            </div>

          </div>
        </div>
      )}


    </div>
  );
}
