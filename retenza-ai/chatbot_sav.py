import sys
import time
import base64
import concurrent.futures
import streamlit as st
from pymongo import MongoClient
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import chatbot_config as config
import chatbot_classifier as classifier

# Force l'encodage UTF-8 pour stdout/stderr (emojis dans les logs console Windows)
try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except AttributeError:
    pass  # Python < 3.7 ou environnement sans reconfigure

# Configuration de la page Streamlit
st.set_page_config(
    page_title="Retenza AI — Chatbot SAV Prédictif",
    page_icon="🤖",
    layout="centered"
)

# Style CSS Premium personnalisé (assorti au thème Retenza)
st.markdown("""
    <style>
        /* Couleurs et polices (Theme Neutre & Professionnel) */
        :root {
            --primary: #2563eb;
            --bg-light: #ffffff;
            --border: #e5e5e5;
        }
        /* ====== FOND DE PAGE & LAYOUT FLEXBOX STRUCTUREL ====== */
        .stApp {
            background-color: #eef1f7 !important;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
        }
        [data-testid="stHeader"] {
            background: transparent !important;
        }

        /* 1. La section principale occupe exactement toute la hauteur de la fenêtre en Flexbox */
        [data-testid="stAppViewContainer"] > section.main,
        [data-testid="stMain"],
        .main {
            height: 100vh !important;
            max-height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
            background-color: transparent !important;
        }

        /* Support des wrappers intermédiaires Streamlit pour propager le flex */
        [data-testid="stAppViewContainer"] > section.main > div:not([data-testid="stBottom"]) {
            display: flex !important;
            flex-direction: column !important;
            flex: 1 1 auto !important;
            min-height: 0 !important;
            height: 100% !important;
            overflow: hidden !important;
        }

        /* ====== CADRE UNIQUE CONTINU (Zone Messages + Saisie) ======
           
           Structure Flexbox unifiée :
           - .block-container (Haut du cadre) s'étire dynamiquement (flex: 1 1 auto)
             pour occuper TOUT l'espace vertical disponible jusqu'à stBottom.
           - [data-testid="stBottom"] (Bas du cadre) s'attache directement en dessous
             avec 0px d'écart.
           - ZÉRO trou/espace visible peu importe le nombre de messages (0, 1, 2, 10+ msgs).
           - Defilement interne automatique (overflow-y: auto) quand les messages dépassent. */
        
        .stApp [data-testid="stMainBlockContainer"],
        .stMainBlockContainer,
        .block-container {
            max-width: 860px !important;
            width: 92% !important;
            /* Marge extérieure haut : 70px sous le header "Chatbot Retenza" */
            margin: 70px auto 0 auto !important;
            padding: 24px 28px 20px 28px !important;
            background: #ffffff !important;
            border: 1px solid #dde4ef !important;
            border-bottom: none !important;
            border-radius: 18px 18px 0 0 !important;
            box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08) !important;
            
            /* Remplissage flex vertical continu */
            flex: 1 1 auto !important;
            min-height: 0 !important;
            overflow-y: auto !important;
        }

        /* ====== ZONE SAISIE (stBottom) — BAS DU CADRE UNIQUE ====== */
        [data-testid="stBottom"] {
            flex: 0 0 auto !important;
            max-width: 860px !important;
            width: 92% !important;
            /* Marges extérieures : 0px en haut (collé au block-container), 20px en bas */
            margin: 0 auto 20px auto !important;
            padding: 8px 22px 14px !important;
            background: #ffffff !important;
            /* Bordure bas/gauche/droite — jointure continue avec le haut du cadre */
            border: 1px solid #dde4ef !important;
            border-top: none !important;
            border-radius: 0 0 18px 18px !important;
            box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08) !important;
            
            position: relative !important;
            bottom: auto !important;
            z-index: 100 !important;
        }

        /* Supprimer tout pseudo-élément séparateur Streamlit */
        [data-testid="stBottom"]::before {
            display: none !important;
        }

        /* Champ texte intérieur */
        [data-testid="stChatInput"] [data-testid="stChatInputTextArea"],
        [data-testid="stChatInput"] textarea {
            border-radius: 18px !important;
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
        }


        /* Bouton principal (ex: Connexion) - Bleu Royal */
        .stButton>button {
            background-color: #2563eb;
            color: white;
            border-radius: 8px;
            font-weight: 500;
            border: none;
            transition: all 0.2s;
            width: 100%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .stButton>button:hover {
            background-color: #1d4ed8;
            color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        /* Bandeaux d'indicateurs (Moderation adoucie) */
        .indicator-band {
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
            margin-bottom: 20px;
            font-size: 0.95rem;
        }
        .indicator-green {
            background-color: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
        }
        .indicator-yellow, .indicator-orange {
            background-color: #fffbeb;
            color: #854d0e;
            border: 1px solid #fde047;
        }
        .indicator-red {
            background-color: #fef2f2;
            color: #991b1b;
            border: 1px solid #fca5a5;
        }        /* ====== SIDEBAR (Style Claude) ====== */
        [data-testid="stSidebar"] {
            background-color: #f5f0ec !important;
        }
        [data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2, [data-testid="stSidebar"] h3, [data-testid="stSidebar"] p {
            color: #0d0d0d !important;
            font-size: 0.85rem !important;
            margin-top: 4px !important;
            margin-bottom: 4px !important;
        }
        [data-testid="stSidebar"] hr {
            border-color: #e5e5e5 !important;
        }
        [data-testid="stSidebar"] .stButton > button {
            background: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            text-align: left !important;
            justify-content: flex-start !important;
            align-items: center !important;
            padding: 8px 12px !important;
            margin-bottom: 2px !important;
            font-weight: 500 !important;
            color: #0d0d0d !important;
            box-shadow: none !important;
            display: inline-flex !important;
            width: 100% !important;
        }
        /* Aligner le contenu interne (icône + texte) à gauche */
        [data-testid="stSidebar"] .stButton > button > div,
        [data-testid="stSidebar"] .stButton > button span,
        [data-testid="stSidebar"] .stButton > button p {
            justify-content: flex-start !important;
            text-align: left !important;
            align-items: center !important;
            display: inline-flex !important;
        }
        [data-testid="stSidebar"] .stButton > button:hover {
            background-color: #ebe5e0 !important;
        }
        /* Bouton "Nouveau chat" specifique (style premium ChatGPT) - cible specifiquement le premier element de la sidebar */
        [data-testid="stSidebar"] [data-testid="stVerticalBlock"] > div:nth-child(2) .stButton > button {
            background-color: #ffffff !important;
            border: 1px solid #e5e5e5 !important;
            border-radius: 8px !important;
            padding: 8px 12px !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
            margin-bottom: 15px !important;
            transition: background-color 0.15s ease, border-color 0.15s ease !important;
        }
        [data-testid="stSidebar"] [data-testid="stVerticalBlock"] > div:nth-child(2) .stButton > button:hover {
            background-color: #ebe5e0 !important;
            border-color: #d5cfc9 !important;
        }


        /* ====== ZONE DE CHAT (Style Meta AI / ChatGPT — Gris Neutre) ====== */
        .stChatMessage {
            padding: 0.25rem 0 !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            margin-bottom: 1.1rem !important;
            gap: 10px !important;
        }
        /* Messages du bot : supprimer la marge basse pour coller la barre d'actions */
        .stChatMessage:has(.msg-role-assistant) {
            margin-bottom: 0 !important;
        }
        /* Element-container Streamlit qui entoure la meta-action-bar : remonter près de la bulle */
        .element-container:has(.meta-action-bar) {
            margin-top: -2px !important;
            margin-bottom: 10px !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
        }

        /* Marqueur de rôle invisible (prend 0px dans le flux) */
        .msg-role-marker {
            display: none !important;
            font-size: 0 !important;
            line-height: 0 !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Neutraliser le style par défaut de tous les sous-conteneurs Streamlit internes */
        .stChatMessage [data-testid="stChatMessageContent"] * {
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
        }

        .stChatMessage [data-testid="stChatMessageContent"] .stMarkdown,
        .stChatMessage [data-testid="stChatMessageContent"] .element-container {
            width: fit-content !important;
            max-width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
        }

        /* Typographie globale des messages — taille & centrage vertical */
        .stChatMessage [data-testid="stChatMessageContent"] p {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.5 !important;
            font-size: 0.94rem !important;
            display: block !important;
        }
        .stChatMessage [data-testid="stChatMessageContent"] p:not(:last-child) {
            margin-bottom: 8px !important;
        }

        /* Listes à puces : espacées, naturelles */
        .stChatMessage [data-testid="stChatMessageContent"] ul,
        .stChatMessage [data-testid="stChatMessageContent"] ol {
            margin: 4px 0 4px 16px !important;
            padding: 0 !important;
        }
        .stChatMessage [data-testid="stChatMessageContent"] li {
            margin-bottom: 4px !important;
            line-height: 1.5 !important;
            font-size: 0.94rem !important;
        }
        .stChatMessage [data-testid="stChatMessageContent"] strong {
            font-weight: 700 !important;
            color: #111111 !important;
        }

        .msg-text {
            display: inline !important;
            word-break: break-word !important;
            white-space: pre-wrap !important;
            line-height: 1.4 !important;
        }

        /* ── MESSAGE UTILISATEUR (Aligné à DROITE, Avatar à DROITE, Bulle Bleue Compacte) ── */
        .stChatMessage:has(.msg-role-user),
        .stChatMessage:has([data-testid*="User"]),
        .stChatMessage:has([data-testid="chatAvatarIcon-user"]) {
            display: flex !important;
            flex-direction: row-reverse !important;
            align-items: center !important;
            justify-content: flex-start !important;
            padding-left: 15% !important;
            padding-right: 0.25rem !important;
        }

        .stChatMessage:has(.msg-role-user) [data-testid="stChatMessageContent"],
        .stChatMessage:has([data-testid*="User"]) [data-testid="stChatMessageContent"],
        .stChatMessage:has([data-testid="chatAvatarIcon-user"]) [data-testid="stChatMessageContent"] {
            background: #2563eb !important;
            color: #ffffff !important;
            padding: 12px 18px !important;
            border-radius: 18px 18px 4px 18px !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06) !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: flex-start !important;
            width: fit-content !important;
            min-width: 0 !important;
            max-width: 70% !important;
            min-height: 0 !important;
            height: auto !important;
            flex: 0 1 auto !important;
            margin-left: auto !important;
            margin-right: 0 !important;
            text-align: left !important;
            box-sizing: border-box !important;
        }

        .stChatMessage:has(.msg-role-user) [data-testid="stChatMessageContent"] p,
        .stChatMessage:has(.msg-role-user) [data-testid="stChatMessageContent"] span,
        .stChatMessage:has([data-testid*="User"]) [data-testid="stChatMessageContent"] p,
        .stChatMessage:has([data-testid*="User"]) [data-testid="stChatMessageContent"] span {
            color: #ffffff !important;
            font-size: 0.94rem !important;
            line-height: 1.4 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Avatar Utilisateur (à droite) */
        .stChatMessage:has(.msg-role-user) [data-testid="stChatMessageAvatar"],
        .stChatMessage:has([data-testid*="User"]) [data-testid="stChatMessageAvatar"],
        .stChatMessage:has([data-testid="chatAvatarIcon-user"]),
        .stChatMessage:has(.msg-role-user) > div:first-child {
            background-color: #dbeafe !important;
            border: 1px solid #bfdbfe !important;
            border-radius: 50% !important;
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            min-height: 32px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 0.9rem !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
            flex-shrink: 0 !important;
        }

        /* ── MESSAGE ASSISTANT / BOT — Style Meta AI (Gris Neutre Compact) ── */
        /* 1. Pas d'avatar (Meta AI n'affiche pas d'icône à gauche du bot) */
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageAvatar"],
        .stChatMessage:has([data-testid*="Assistant"]) [data-testid="stChatMessageAvatar"],
        .stChatMessage:has([data-testid="chatAvatarIcon-assistant"]),
        .stChatMessage:has(.msg-role-assistant) > div:first-child:not([data-testid="stChatMessageContent"]) {
            display: none !important;
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
        }

        /* 2. Conteneur du message bot */
        .stChatMessage:has(.msg-role-assistant),
        .stChatMessage:has([data-testid*="Assistant"]),
        .stChatMessage:has([data-testid="chatAvatarIcon-assistant"]) {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: flex-start !important;
            padding-right: 10% !important;
            padding-left: 0 !important;
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
        }

        /* 3. Bulle gris neutre compacte avec centrage vertical */
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"],
        .stChatMessage:has([data-testid*="Assistant"]) [data-testid="stChatMessageContent"],
        .stChatMessage:has([data-testid="chatAvatarIcon-assistant"]) [data-testid="stChatMessageContent"] {
            background-color: #f0f0f0 !important;
            border: none !important;
            color: #111111 !important;
            padding: 12px 18px !important;
            border-radius: 18px !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: flex-start !important;
            width: fit-content !important;
            min-width: 0 !important;
            max-width: 82% !important;
            min-height: 0 !important;
            height: auto !important;
            margin-right: auto !important;
            margin-left: 0 !important;
            text-align: left !important;
            box-sizing: border-box !important;
        }

        /* 4. Typographie dans la bulle bot */
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] p,
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] span,
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] li,
        .stChatMessage:has([data-testid*="Assistant"]) [data-testid="stChatMessageContent"] p {
            color: #111111 !important;
            font-size: 0.94rem !important;
            line-height: 1.45 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* 5. Listes dans la bulle bot */
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] ul,
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] ol {
            margin: 6px 0 4px 18px !important;
        }
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] li {
            margin-bottom: 5px !important;
            line-height: 1.65 !important;
        }
        .stChatMessage:has(.msg-role-assistant) [data-testid="stChatMessageContent"] strong {
            color: #111111 !important;
            font-weight: 700 !important;
        }

        /* 6. Barre d'actions Meta AI — icônes SVG noires sur fond gris circulaire */
        .meta-action-bar {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            margin-top: 4px !important;     /* petit espace sous la bulle */
            margin-left: 2px !important;
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
        }
        .meta-action-btn {
            background: #e4e4e4 !important;   /* fond gris circulaire comme Meta AI */
            border: none !important;
            cursor: pointer !important;
            color: #111111 !important;         /* icône noire */
            width: 25px !important;
            height: 25px !important;
            padding: 0 !important;
            border-radius: 50% !important;    /* cercle parfait */
            transition: background 0.15s !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
        }
        .meta-action-btn svg {
            width: 12px !important;
            height: 12px !important;
            stroke: #111111 !important;
            fill: none !important;
            stroke-width: 2 !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
            display: block !important;
        }
        .meta-action-btn:hover {
            background: #cccccc !important;
        }
        .meta-action-btn:active {
            background: #bbbbbb !important;
        }
        /* Confirmation copie & feedback */
        .copy-confirm {
            font-size: 0.75rem !important;
            font-weight: 700 !important;
            color: #16a34a !important;
            padding: 2px 8px !important;
            display: inline-block !important;
            opacity: 0 !important;
            transition: opacity 0.25s ease !important;
        }
        .copy-confirm.show { opacity: 1 !important; }



        /* ── MESSAGE ALERTE SYSTÈME / MODÉRATION ── */
        .stChatMessage:has(.msg-role-alert) {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            padding: 0 0.25rem !important;
        }

        .stChatMessage:has(.msg-role-alert) [data-testid="stChatMessageContent"] {
            background-color: #fef2f2 !important;
            border: 1px solid #fca5a5 !important;
            color: #991b1b !important;
            padding: 12px 18px !important;
            border-radius: 14px !important;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.08) !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        .stChatMessage:has(.msg-role-alert) [data-testid="stChatMessageContent"] p {
            color: #991b1b !important;
            font-size: 0.93rem !important;
            line-height: 1.5 !important;
            margin: 0 !important;
        }

        .stChatMessage:has(.msg-role-alert) [data-testid="stChatMessageAvatar"] {
            background-color: #fee2e2 !important;
            border: 1px solid #fca5a5 !important;
            border-radius: 50% !important;
            width: 36px !important;
            height: 36px !important;
            min-width: 36px !important;
            min-height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 1rem !important;
            flex-shrink: 0 !important;
        }

        /* ====== INPUT (Barre de recherche) ====== */
        .stChatInputContainer {
            border-radius: 1.5rem !important;
            background-color: #f4f4f4 !important;
            border: 1px solid transparent !important;
            box-shadow: none !important;
            padding-left: 1rem !important;
        }
        .stChatInputContainer:focus-within {
            background-color: #f4f4f4 !important;
            border-color: #e5e5e5 !important;
        }
        
        /* ====== HEADER FIXE (Style ChatGPT) ====== */
        [data-testid="stHeader"] {
            background-color: #ffffff !important;
            border-bottom: 1px solid #e5e5e5 !important;
        }
        /* Supprimé : le padding-top: 3.5rem n'est plus nécessaire.
           Le margin-top: 80px sur .block-container gère désormais le dégagement du header. */

        /* ====== SIDEBAR PROFILE POPOVER (Style Claude) ====== */
        /* Conteneur principal : position relative pour que le last-child absolute soit bien ancré */
        [data-testid="stSidebarUserContent"] {
            position: relative !important;
            height: 100vh !important;
            overflow: hidden !important;
        }

        /* La zone de contenu scrollable pour les conversations uniquement */
        div.st-key-conv_list_container {
            height: calc(100vh - 200px) !important;
            max-height: calc(100vh - 200px) !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            scrollbar-width: none !important; /* Firefox */
        }
        div.st-key-conv_list_container::-webkit-scrollbar {
            display: none !important; /* Chrome/Safari */
        }
        
        /* Bouton profil toujours ancré de manière absolue au bas de la sidebar (slide avec elle si fermée) */
        div.st-key-profile_popover {
            position: absolute !important;
            bottom: 16px !important;
            left: 12px !important;
            right: 12px !important;
            z-index: 1000 !important;
            background-color: #f5f0ec !important;
            box-sizing: border-box !important;
        }
        
        div.st-key-profile_popover div[data-testid="stPopover"] > button {
            background-color: #ffffff !important; /* Fond blanc */
            border: 1px solid #e5e5e5 !important; /* Bordure fine */
            color: #0d0d0d !important;
            padding: 8px 12px !important;
            border-radius: 8px !important;
            width: 100% !important;
            text-align: left !important;
            justify-content: flex-start !important;
            display: flex !important;
            align-items: center !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; /* Légèrement surélevé */
            gap: 12px !important;
            font-size: 0.9rem !important;
            font-weight: 600 !important;
            transition: background-color 0.15s ease, border-color 0.15s ease !important;
        }
        div.st-key-profile_popover div[data-testid="stPopover"] > button:hover {
            background-color: #f9f9f9 !important;
            border-color: #cbd5e1 !important;
        }

        /* Le conteneur du texte dans le bouton popover */
        div.st-key-profile_popover div[data-testid="stPopover"] > button > div {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            justify-content: center !important;
            line-height: 1.2 !important;
        }

        /* Modifier le texte principal du bouton */
        div.st-key-profile_popover div[data-testid="stPopover"] > button p {
            font-size: 0.85rem !important;
            font-weight: 600 !important;
            color: #0f172a !important;
            margin: 0 !important;
            text-transform: capitalize !important;
        }

        /* Ajouter le sous-titre "Client connecté" via ::after sur le conteneur du texte */
        div.st-key-profile_popover div[data-testid="stPopover"] > button > div::after {
            content: "Client connecté" !important;
            font-size: 0.72rem !important;
            color: #6b7280 !important;
            font-weight: 400 !important;
            margin-top: 1px !important;
        }

        /* Le chevron ▼ à droite du bouton popover */
        div.st-key-profile_popover div[data-testid="stPopover"] > button::after {
            content: "▼" !important;
            font-size: 0.65rem !important;
            color: #94a3b8 !important;
            margin-left: auto !important;
            transition: transform 0.2s ease !important;
        }

        /* Rotation du chevron quand ouvert */
        div.st-key-profile_popover div[data-testid="stPopover"] > button[aria-expanded="true"]::after {
            transform: rotate(180deg) !important;
        }

        /* En-têtes de section et séparateurs de la sidebar */
        /* Le div.sidebar-section-header est rendu dans un element-container Streamlit. */
        /* On NE PAS utiliser padding-top car Streamlit peut couper le contenu paddingé via overflow:hidden. */
        /* À la place, on met min-height sur l'element-container parent du markdown de section. */
        div.element-container:has(.sidebar-section-header) {
            min-height: 20px !important;  /* Réduit de 36px à 20px : évite le clipping sans créer un grand vide */
            display: flex !important;
            align-items: flex-end !important;
            overflow: visible !important;
        }
        .sidebar-section-header {
            font-size: 0.8rem !important;
            font-weight: 500 !important;
            color: #8a8a8a !important;
            padding: 8px 0 6px 6px !important;
            margin: 0 !important;
            text-transform: none !important;
            letter-spacing: 0.01em !important;
            display: block !important;
            line-height: 1.4 !important;
        }
        .sidebar-divider {
            margin: 4px 0 !important;
            border: none !important;
            border-top: 1px solid #e5e5e5 !important;
            opacity: 0.6 !important;
        }
        
        /* Note: les styles du popover contextuel sont définis plus bas dans le CSS (section POPOVER) */
        
        /* Style du champ de recherche de la sidebar */
        [data-testid="stSidebar"] [data-testid="stTextInput"] {
            margin-top: 5px !important;
            margin-bottom: 5px !important;
        }
        [data-testid="stSidebar"] [data-testid="stTextInput"] input {
            background-color: #ffffff !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            padding: 8px 12px 8px 36px !important; /* Espace pour l'icône loupe à gauche */
            font-size: 0.85rem !important;
            color: #0f172a !important;
            box-shadow: none !important;
            /* Loupe SVG intégrée en arrière-plan */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") !important;
            background-repeat: no-repeat !important;
            background-position: 12px center !important;
        }
        [data-testid="stSidebar"] [data-testid="stTextInput"] input::placeholder {
            color: #94a3b8 !important;
        }
        [data-testid="stSidebar"] [data-testid="stTextInput"] input:focus {
            border-color: #cbd5e1 !important;
            /* Changement de couleur de la loupe au focus */
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") !important;
        }
        
        /* ====== CARTE CLICABLE DE RECHERCHE DANS SIDEBAR ====== */
        .search-card-container {
            position: relative !important;
            margin-bottom: 6px !important;
            width: 100% !important;
        }
        /* Rendre le bouton streamlit invisible au-dessus de la carte */
        .search-card-container .stButton {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 10 !important;
        }
        .search-card-container .stButton > button {
            background: transparent !important;
            border: none !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 0 !important; /* Totalement transparent */
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            cursor: pointer !important;
        }
        /* Style de la carte HTML */
        .chat-card-html {
            pointer-events: none !important; /* Laisse passer le clic pour le bouton du dessus */
            display: flex !important;
            align-items: flex-start !important;
            gap: 12px !important;
            padding: 8px 12px !important;
            background-color: transparent !important;
            border-radius: 8px !important;
            transition: background-color 0.2s ease !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }
        .search-card-container:hover .chat-card-html {
            background-color: #ececec !important; /* Hover gris ChatGPT */
        }
        .chat-card-icon {
            font-size: 1.1rem !important;
            color: #4b5563 !important;
            margin-top: 2px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 18px !important;
            height: 18px !important;
        }
        .chat-card-body {
            display: flex !important;
            flex-direction: column !important;
            gap: 2px !important;
            width: calc(100% - 30px) !important;
        }
        .chat-card-title {
            font-size: 0.85rem !important;
            font-weight: 500 !important;
            color: #0f172a !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            width: 100% !important;
            text-align: left !important;
        }
        .chat-card-snippet {
            font-size: 0.72rem !important;
            color: #64748b !important;
            line-height: 1.3 !important;
            text-align: left !important;
            width: 100% !important;
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important; /* Limite à 2 lignes maximum */
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            word-break: break-word !important;
        }
        .chat-card-snippet strong {
            color: #0f172a !important;
            font-weight: 600 !important;
            background-color: rgba(254, 240, 138, 0.4) !important;
            padding: 0 2px !important;
            border-radius: 2px !important;
        }


        /* ====== LIGNE DE CONVERSATION : style Claude (plat, sans carte, compact) ====== */

        /* Cacher les marqueurs de statut restants */
        .conv-row-marker, .rename-mode-marker {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* Compacité verticale globale de la sidebar */
        [data-testid="stSidebarUserContent"] > [data-testid="stVerticalBlock"] {
            gap: 2px !important;
        }

        /* ── Ligne complète (le stHorizontalBlock) dans la sidebar ── */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] {
            gap: 0 !important;
            align-items: center !important;
            padding: 0px 6px !important;
            margin: 0 !important;
            border-radius: 8px !important;
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            transition: background-color 0.15s ease !important;
            height: 36px !important;
        }

        /* Hover sur toute la ligne OU ligne active */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"]:hover,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"]:has(.active-session) {
            background-color: #ebe5e0 !important;
        }

        /* Forcer absolument tout à l'intérieur des colonnes de la sidebar en transparent */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] *,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] [data-testid="column"],
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .element-container,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] > div {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* ── Bouton Titre de Discussion ── */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            outline: none !important;
            height: 32px !important;
            min-height: 32px !important;
            padding: 0 8px !important;
            margin: 0 !important;
            border-radius: 0 !important;
            color: #1a1a1a !important;
            font-size: 0.875rem !important;
            font-weight: 400 !important;
            width: 100% !important;
            justify-content: flex-start !important;
            text-align: left !important;
        }
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button:hover,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button:focus,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button:active {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        /* Override des conteneurs internes du bouton Streamlit */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button > div,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button > div > div {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            overflow: hidden !important;
        }

        /* Ellipsis sur le texte du titre */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button p,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] .stButton > button span {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
            display: block !important;
        }


        /* ====== BOUTON MENU ⋮ ====== */

        /* Masqué par défaut (opacité 0), sans bordure, visible au survol */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] div[data-testid="stPopover"] > button {
            opacity: 0 !important;
            width: 28px !important;
            min-width: 28px !important;
            height: 28px !important;
            display: inline-flex !important;
            justify-content: center !important;
            align-items: center !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
            color: #737373 !important;
            transition: opacity 0.15s ease, color 0.15s ease !important;
        }

        /* Afficher au hover de la ligne OU quand le menu est ouvert */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"]:hover div[data-testid="stPopover"] > button,
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] div[data-testid="stPopover"] > button[aria-expanded="true"] {
            opacity: 1 !important;
        }

        /* Survol direct de l'icône ⋮ */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] div[data-testid="stPopover"] > button:hover {
            color: #171717 !important;
            background: rgba(0, 0, 0, 0.08) !important;
            border-radius: 4px !important;
        }

        /* Cacher la flèche de chevron vers le bas par défaut de st.popover dans la sidebar */
        [data-testid="stSidebar"] [data-testid="stHorizontalBlock"] div[data-testid="stPopover"] > button svg:nth-of-type(2) {
            display: none !important;
        }


        /* ====== MODE RENOMMAGE : champ texte + ✓ + ✕ ====== */

        /* Ligne de renommage complète */
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) {
            gap: 4px !important;
            align-items: center !important;
            padding: 0 4px !important;
            margin: 0 !important;
            height: 34px !important;
        }

        /* Input d'édition */
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) [data-baseweb="input"] {
            border-color: #2563eb !important;
            border-radius: 4px !important;
            height: 28px !important;
            background: #ffffff !important;
        }
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) svg {
            display: none !important;
        }

        /* Bouton ✓ vert discret (dans la 2ème colonne, qui est le 3ème enfant en comptant le spacer) */
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) > div:nth-child(3) button {
            color: #16a34a !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            font-weight: bold !important;
            font-size: 1rem !important;
            padding: 0 !important;
            height: 28px !important;
        }
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) > div:nth-child(3) button:hover {
            background: rgba(22, 163, 74, 0.1) !important;
            border-radius: 4px !important;
        }

        /* Bouton ✕ gris discret (dans la 3ème colonne, qui est le 5ème enfant en comptant le spacer) */
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) > div:nth-child(5) button {
            color: #9ca3af !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            font-weight: bold !important;
            font-size: 0.9rem !important;
            padding: 0 !important;
            height: 28px !important;
        }
        div[data-testid="stHorizontalBlock"]:has(.rename-mode-marker) button[key^="rename_cancel_"]:hover {
            background: rgba(156, 163, 175, 0.1) !important;
            border-radius: 4px !important;
        }

        /* ====== POPOVER : menu contextuel fluide (style ChatGPT / Claude) ====== */

        /* Corps du popover : padding vertical seulement, coins arrondis */
        div[data-testid="stPopoverBody"] {
            padding: 4px 0 !important;
            border-radius: 8px !important;
            min-width: 155px !important;
            max-width: 200px !important;
            overflow: hidden !important;
            border: 1px solid #e5e5e5 !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
            background-color: #ffffff !important;
        }

        /* Supprimer tous les espacements entre les element-containers du popover */
        div[data-testid="stPopoverBody"] .element-container,
        div[data-testid="stPopoverBody"] .stButton,
        div[data-testid="stPopoverBody"] .stMarkdown {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
        }

        /* Style uniforme des boutons : texte simple, transparent, sans bordure */
        div[data-testid="stPopoverBody"] button {
            display: block !important;
            width: 100% !important;
            height: 30px !important;
            padding: 0 12px !important;
            margin: 0 !important;
            font-size: 0.84rem !important;
            font-weight: 400 !important;
            text-align: left !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 5px !important;
            color: #111827 !important;
            line-height: 1 !important;
            cursor: pointer !important;
        }
        div[data-testid="stPopoverBody"] button:hover {
            background: #f3f4f6 !important;
            border: none !important;
            box-shadow: none !important;
            color: #000 !important;
        }

        /* Séparateur fin et "Supprimer" en rouge discret */
        div[data-testid="stPopoverBody"] button[key^="menu_del_"] {
            border-top: 1px solid #e5e7eb !important;
            margin-top: 4px !important;
            padding-top: 4px !important;
            border-radius: 0 !important;
            color: #dc2626 !important;
        }
        div[data-testid="stPopoverBody"] button[key^="menu_del_"]:hover {
            background: #fef2f2 !important;
            color: #b91c1c !important;
        }


        /* ====== EMPTY STATE (Nouvelle Conversation) ====== */
        .empty-state-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 60vh;
            text-align: center;
            animation: fadeIn 0.5s ease-in-out;
        }
        .empty-state-title {
            font-size: 1.8rem;
            color: #0d0d0d;
            font-weight: 500;
            margin-bottom: 2.5rem;
        }
        .empty-state-pills {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
        }
        .empty-state-pill {
            border: 1px solid #e5e5e5;
            border-radius: 20px;
            padding: 8px 16px;
            color: #4b5563;
            font-size: 0.9rem;
            background-color: transparent;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
    <script>
    /* ── copyChatbotMsg : lit le texte depuis data-raw (base64) ── */
    function copyChatbotMsg(btn) {
        try {
            var rawB64 = btn.getAttribute('data-raw') || '';
            var textToCopy = '';
            if (rawB64) {
                try {
                    textToCopy = decodeURIComponent(escape(atob(rawB64)));
                } catch(b64err) {
                    textToCopy = rawB64;
                }
            }
            /* Fallback : lire le texte de la bulle précédente dans le DOM */
            if (!textToCopy.trim()) {
                var bar = btn.closest('[class*="element-container"]') || btn.parentElement;
                var prev = bar && bar.previousElementSibling;
                if (prev) textToCopy = (prev.innerText || prev.textContent || '').trim();
            }
            textToCopy = textToCopy.trim();
            if (!textToCopy) { showToastConfirm(btn, '⚠ Vide', '#dc2626'); return; }

            var msgid = btn.getAttribute('data-msgid') || '';
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy)
                    .then(function() { showToastConfirm(btn, '✓ Copié', '#16a34a', msgid); })
                    .catch(function() { fallbackCopyExec(btn, textToCopy, msgid); });
            } else {
                fallbackCopyExec(btn, textToCopy, msgid);
            }
        } catch(err) {
            console.error('[Retenza] Copy error:', err);
        }
    }

    function fallbackCopyExec(btn, text, msgid) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus(); ta.select();
        try {
            var ok = document.execCommand('copy');
            showToastConfirm(btn, ok ? '✓ Copié' : '⚠ Erreur', ok ? '#16a34a' : '#dc2626', msgid);
        } catch(e) { showToastConfirm(btn, '⚠ Erreur', '#dc2626', msgid); }
        document.body.removeChild(ta);
    }

    /* ── sendFeedbackBtn : lit les paramètres via data-attributes ── */
    function sendFeedbackBtn(btn) {
        try {
            var type    = btn.getAttribute('data-type')  || 'like';
            var email   = btn.getAttribute('data-email') || '';
            var commId  = btn.getAttribute('data-comm')  || '';
            var sessId  = btn.getAttribute('data-sess')  || '';
            var idx     = parseInt(btn.getAttribute('data-idx') || '0', 10);
            var msgid   = btn.getAttribute('data-msgid') || '';

            btn.style.background = (type === 'like') ? '#bbf7d0' : '#fecaca';
            btn.disabled = true;
            var label = (type === 'like') ? '👍 Merci !' : '👎 Noté';
            var color = (type === 'like') ? '#16a34a' : '#dc2626';
            showToastConfirm(btn, label, color, msgid);

            fetch('http://localhost:5000/api/chatbot/message-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    commerce_id: commId,
                    session_id: sessId,
                    message_idx: idx,
                    feedback: type
                })
            })
            .then(function(r) { return r.json(); })
            .then(function(d) {
                if (d.status !== 'success') console.warn('[Retenza] Feedback non sauvegardé', d);
            })
            .catch(function(e) { console.warn('[Retenza] Feedback API offline:', e); });
        } catch(err) {
            console.error('[Retenza] sendFeedbackBtn error:', err);
        }
    }

    /* ── Alias pour compatibilité ── */
    function sendFeedback(btn, type, email, commId, sessId, idx) {
        btn.setAttribute('data-type', type);
        btn.setAttribute('data-email', email);
        btn.setAttribute('data-comm', commId);
        btn.setAttribute('data-sess', sessId);
        btn.setAttribute('data-idx', String(idx));
        sendFeedbackBtn(btn);
    }

    /* ── Toast de confirmation ── */
    function showToastConfirm(btn, text, color, msgid) {
        var bar = btn.parentElement;
        if (!bar) return;
        var conf = bar.querySelector('.copy-confirm');
        if (!conf) {
            conf = document.createElement('span');
            conf.className = 'copy-confirm';
            bar.appendChild(conf);
        }
        conf.style.color = color;
        conf.textContent = text;
        conf.classList.add('show');
        clearTimeout(conf._timer);
        conf._timer = setTimeout(function() { conf.classList.remove('show'); }, 2000);
    }
    </script>
""", unsafe_allow_html=True)

# Connexion MongoDB réutilisable
@st.cache_resource
def get_db_client():
    try:
        return MongoClient(config.MONGO_URI)
    except Exception as e:
        st.error(f"Erreur de connexion à la base de données: {e}")
        return None

db_client = get_db_client()

def get_commerces():
    """Récupère les commerces depuis MongoDB ou renvoie une liste de secours."""
    # Mapping statique de secours (ID technique → nom lisible)
    _STATIC_NAMES = {
        "commerce_local_1": "Boutique Tunis",
        "commerce_local_2": "Boutique Sousse",
        "commerce_local":   "Boutique Retenza",
    }

    def _humanize(cid, raw_name):
        """Retourne le nom lisible : évite d'afficher un ID technique."""
        if not raw_name or raw_name == cid or raw_name.startswith("commerce_"):
            return _STATIC_NAMES.get(cid, cid.replace("_", " ").title())
        return raw_name

    if db_client:
        try:
            db = db_client[config.DB_NAME]
            commerces = list(db["commerces"].find({}))
            if commerces:
                res = {}
                for c in commerces:
                    cid = c.get("commerce_id") or c.get("id") or str(c.get("_id"))
                    raw = c.get("nom") or c.get("name") or c.get("label") or ""
                    res[cid] = _humanize(cid, raw)
                if res:
                    return res
        except Exception as e:
            print(f"Erreur get_commerces: {e}")

    # Fallback local
    return {
        "commerce_local_1": "Boutique Tunis",
        "commerce_local_2": "Boutique Sousse",
        "commerce_local":   "Boutique Retenza",
    }

commerces_map = get_commerces()

def send_block_email(client_name, client_email, commerce_name, offending_messages, block_reason):
    """Envoie un e-mail d'alerte au commerçant."""
    # S'assurer qu'on a au moins une adresse de destination
    to_email = config.MERCHANT_NOTIFICATION_EMAIL or config.SMTP_USER
    if not to_email:
        print("[SMTP SIMULATION] Aucun utilisateur ou email de destination configure. Simulation dans la console.")
        return
        
    try:
        msg = MIMEMultipart()
        msg['From'] = config.EMAIL_FROM
        msg['To'] = to_email
        msg['Subject'] = f"🚨 ALERTE SAV : Client Suspendu — {client_name}"
        
        body = f"""Bonjour,

Le client suivant a été suspendu automatiquement de la plateforme après avoir reçu {config.MAX_WARNINGS}/{config.MAX_WARNINGS} avertissements pour comportement inapproprié.

DÉTAILS DU COMPTE :
- Nom : {client_name}
- Email : {client_email}
- Boutique : {commerce_name}
- Date du blocage : {datetime.now().strftime('%d/%m/%Y à %H:%M:%S')}
- Raison du blocage : {block_reason}

MESSAGES AYANT DÉCLENCHÉ LES AVERTISSEMENTS :
"""
        for i, m in enumerate(offending_messages, 1):
            body += f"\nAvertissement {i} ({m.get('category')}, Gravité: {m.get('severity')}) :\n\"{m.get('text')}\" (le {m.get('timestamp')})\n"
            
        body += "\nVous pouvez consulter l'historique complet des messages et débloquer ce client directement depuis votre tableau de bord d'administration Retenza."
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Envoi SMTP
        if config.SMTP_USER:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT)
            if config.SMTP_SECURE:
                server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT)
            else:
                server.starttls()
            server.login(config.SMTP_USER, config.SMTP_PASS)
            server.sendmail(config.SMTP_USER, to_email, msg.as_string())
            server.quit()
            print(f"[SMTP SENT] Alerte envoyee a <{to_email}>")
        else:
            # Simulation en console
            print("\n--- [SIMULATION ALERTE SMTP] ---")
            print(f"Destinataire : {to_email}")
            print(f"Objet        : {msg['Subject']}")
            print(f"Contenu      :\n{body}")
            print("--------------------------------\n")
    except Exception as e:
        print(f"[SMTP ERROR] Echec de l'envoi du mail d'alerte : {e}")

# =====================================================================
# GESTION DES SESSIONS CLIENTS (DANS MONGODB)
# =====================================================================
def clean_title(title):
    """Nettoie le titre de la session (retire les emojis, les puces, les espaces superflus) et met en majuscule le premier caractère."""
    if not title:
        return "Nouvelle conversation"
    
    title = title.strip()
    cleaned = ""
    for char in title:
        # Conserver les caractères standard (ord < 127) et latins accentués (ord entre 192 et 383)
        if ord(char) < 127 or (192 <= ord(char) <= 383):
            cleaned += char
            
    # Nettoyer les puces ou espaces résiduels
    cleaned = cleaned.strip("● \t\n\r-_.")
    return cleaned.capitalize() if cleaned else "Nouvelle conversation"

def get_client_status(email, commerce_id, client_name="Client"):
    """Récupère ou initialise l'état de blocage et warnings d'un client."""
    if not db_client:
        return {"email": email, "warnings": 0, "is_blocked": False}
        
    db = db_client[config.DB_NAME]
    status = db.chatbot_status.find_one({"email": email.lower(), "commerce_id": commerce_id})
    
    if not status:
        status = {
            "email": email.lower(),
            "nom": client_name,
            "commerce_id": commerce_id,
            "warnings": 0,
            "is_blocked": False,
            "blocked_at": None,
            "block_reason": None,
            "warnings_history": []
        }
        db.chatbot_status.insert_one(status)
    return status

def update_client_status(status):
    """Met à jour l'état de blocage d'un client en DB."""
    if db_client:
        db = db_client[config.DB_NAME]
        db.chatbot_status.replace_one(
            {"email": status["email"], "commerce_id": status["commerce_id"]},
            status
        )

def get_message_snippet(messages, search_query):
    """Génère un extrait du message contenant le terme de recherche avec surbrillance HTML."""
    if not search_query:
        return ""
    import html
    search_query_lower = search_query.lower()
    for msg in messages:
        text = msg.get("text", "")
        idx = text.lower().find(search_query_lower)
        if idx != -1:
            start = max(0, idx - 30)
            end = min(len(text), idx + len(search_query) + 50)
            snippet = text[start:end]
            
            prefix = "... " if start > 0 else ""
            suffix = " ..." if end < len(text) else ""
            
            full_snippet = prefix + snippet + suffix
            
            matched_word = text[idx : idx + len(search_query)]
            
            safe_snippet = html.escape(full_snippet)
            safe_matched_word = html.escape(matched_word)
            
            # Entoure d'une balise strong (surchargée en CSS avec fond jaune)
            highlighted = safe_snippet.replace(
                safe_matched_word, 
                f"<strong>{safe_matched_word}</strong>"
            )
            return highlighted
    return ""

def get_all_sessions(email, commerce_id, search_query=None):
    """Récupère la liste de toutes les sessions triées par date décroissante."""
    if not db_client:
        return []
    db = db_client[config.DB_NAME]
    
    query = {"email": email.lower(), "commerce_id": commerce_id}
    if search_query:
        query["$or"] = [
            {"title": {"$regex": search_query, "$options": "i"}},
            {"messages.text": {"$regex": search_query, "$options": "i"}}
        ]
        
    projection = {"session_id": 1, "title": 1, "updated_at": 1, "is_pinned": 1}
    if search_query:
        projection["messages"] = 1
        
    cursor = db.chatbot_conversations.find(query, projection).sort("updated_at", -1)
    
    sessions = []
    for doc in cursor:
        snippet = ""
        if search_query and "messages" in doc:
            snippet = get_message_snippet(doc["messages"], search_query)
            
        sessions.append({
            "session_id": doc.get("session_id", "default"),
            "title": doc.get("title", "Nouvelle conversation"),
            "updated_at": doc.get("updated_at", ""),
            "is_pinned": doc.get("is_pinned", False),
            "snippet": snippet
        })
    return sessions

def toggle_pin_session(email, commerce_id, session_id):
    """Active ou désactive l'épinglage d'une conversation."""
    if not db_client:
        return
    db = db_client[config.DB_NAME]
    conv = db.chatbot_conversations.find_one({
        "email": email.lower(),
        "commerce_id": commerce_id,
        "session_id": session_id
    })
    if conv:
        new_pinned = not conv.get("is_pinned", False)
        db.chatbot_conversations.update_one(
            {"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id},
            {"$set": {"is_pinned": new_pinned}}
        )

def update_session_title(email, commerce_id, session_id, new_title):
    """Met à jour le titre d'une session de conversation."""
    if not db_client:
        return
    db = db_client[config.DB_NAME]
    db.chatbot_conversations.update_one(
        {"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id},
        {"$set": {"title": new_title, "title_edited_manually": True}}
    )

def delete_session(email, commerce_id, session_id):
    """Supprime une session de conversation de la base de données."""
    if not db_client:
        return
    db = db_client[config.DB_NAME]
    db.chatbot_conversations.delete_one({
        "email": email.lower(),
        "commerce_id": commerce_id,
        "session_id": session_id
    })

def start_rename_mode(session_key):
    """Active le mode renommage pour une session (utilisé comme on_click de st.button)."""
    st.session_state.rename_session_id = session_key

def save_rename(session_key, email, commerce_id):
    """Sauvegarde le nouveau titre et quitte le mode renommage."""
    input_key = f"rename_input_{session_key}"
    val = st.session_state.get(input_key, "").strip()
    if val:
        update_session_title(email, commerce_id, session_key, val[:50])
    # Si vide, on garde l'ancien titre (rien à mettre à jour)
    st.session_state.rename_session_id = None

def cancel_rename():
    """Annule le mode renommage sans sauvegarder."""
    st.session_state.rename_session_id = None

@st.dialog("Supprimer la conversation")
def confirm_delete_dialog(session_key, title_clean, email, commerce_id, is_active_session):
    """Boîte de dialogue modale de confirmation de suppression de session."""
    st.write(f"Êtes-vous sûr de vouloir supprimer définitivement la conversation **{title_clean}** ? Tout l'historique sera perdu.")
    c1, c2 = st.columns(2)
    with c1:
        if st.button("Annuler", use_container_width=True):
            st.rerun()
    with c2:
        if st.button("Supprimer", type="primary", use_container_width=True):
            delete_session(email, commerce_id, session_key)
            if is_active_session:
                st.session_state.session_id = None
            st.toast("Conversation supprimée")
            st.rerun()

def get_conversation(email, commerce_id, session_id):
    """Récupère l'historique de conversation d'une session spécifique."""
    if not db_client:
        return []
    db = db_client[config.DB_NAME]
    conv = db.chatbot_conversations.find_one({
        "email": email.lower(), 
        "commerce_id": commerce_id,
        "session_id": session_id
    })
    return conv["messages"] if conv else []

def save_message_to_conversation(email, commerce_id, session_id, role, text, category=None, severity=None):
    """Ajoute un message à l'historique de conversation."""
    if not db_client:
        return
    db = db_client[config.DB_NAME]
    
    timestamp = datetime.now().isoformat()
    message_doc = {
        "role": role,
        "text": text,
        "timestamp": timestamp,
    }
    if category:
        message_doc["category"] = category
    if severity:
        message_doc["severity"] = severity
        
    # Mettre à jour le titre si c'est le premier message de l'utilisateur et qu'il n'a pas été édité manuellement
    update_data = {"$push": {"messages": message_doc}, "$set": {"updated_at": timestamp}}
    
    if role == "user":
        conv = db.chatbot_conversations.find_one({"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id})
        has_manual_title = conv.get("title_edited_manually", False) if conv else False
        if not has_manual_title and (not conv or not conv.get("messages")):
            # Premier message -> générer le titre
            words = text.split()
            if len(words) > 5:
                title = " ".join(words[:5]) + "..."
            else:
                title = " ".join(words)
            update_data["$set"]["title"] = title

    db.chatbot_conversations.update_one(
        {"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id},
        update_data,
        upsert=True
    )

# =====================================================================
# ÉCRANS DE L'INTERFACE STREAMLIT
# =====================================================================

# 1. Écran de connexion (Login)
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False

if not st.session_state.logged_in:
    st.image("https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?auto=format&fit=crop&w=800&q=80", width=120)
    st.title("🤖 Chatbot Assistant SAV")
    st.write("Bienvenue sur le portail d'assistance client. Veuillez vous identifier pour démarrer la discussion.")
    
    commerce_opt = list(commerces_map.keys())
    commerce_labels = [commerces_map[k] for k in commerce_opt]
    selected_commerce_label = st.selectbox("Sélectionnez votre boutique :", commerce_labels)
    selected_commerce_id = commerce_opt[commerce_labels.index(selected_commerce_label)]
    
    email_input = st.text_input("Votre adresse email :").strip()
    
    if st.button("Se connecter"):
        if not email_input:
            st.error("Veuillez saisir votre adresse email.")
        else:
            # Vérifier si l'email existe dans la collection clients
            db = db_client[config.DB_NAME] if db_client else None
            client_record = None
            if db is not None:
                client_record = db.clients.find_one({
                    "email": {"$regex": f"^{email_input}$", "$options": "i"},
                    "commerce_id": selected_commerce_id
                })
                
            if not client_record:
                # Tenter de chercher dans analyses_ia par email
                if db is not None:
                    client_record = db.analyses_ia.find_one({
                        "email": {"$regex": f"^{email_input}$", "$options": "i"},
                        "commerce_id": selected_commerce_id
                    })
            
            if not client_record:
                st.error("Adresse email non enregistrée pour cette boutique.")
            else:
                client_name = client_record.get("nom", "Client")
                
                # Charger le statut de blocage
                status = get_client_status(email_input, selected_commerce_id, client_name)
                
                if status["is_blocked"]:
                    st.session_state.is_blocked = True
                    st.session_state.block_reason = status.get("block_reason", "Comportement inapproprié")
                    st.session_state.logged_in = True
                    st.session_state.email = email_input
                    st.session_state.commerce_id = selected_commerce_id
                    st.session_state.client_name = client_name
                    st.rerun()
                else:
                    st.session_state.logged_in = True
                    st.session_state.email = email_input
                    st.session_state.commerce_id = selected_commerce_id
                    st.session_state.client_name = client_name
                    st.session_state.is_blocked = False
                    st.rerun()

# 2. Écran de Blocage / Suspension
elif st.session_state.get("is_blocked", False):
    st.title("🚨 Accès Suspendu")
    st.markdown(f"""
        <div class="indicator-band indicator-red">
            {config.STATUS_INDICATORS[3]}
        </div>
    """, unsafe_allow_html=True)
    
    st.error(config.BLOCK_MESSAGE)
    st.write(f"**Raison de la suspension :** {st.session_state.get('block_reason', 'Comportements agressifs répétés')}")
    st.info("Si vous pensez qu'il s'agit d'une erreur, veuillez contacter directement le service client du magasin.")
    
    if st.button("Déconnexion"):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

# 3. Écran du Chat actif
else:
    # Récupérer l'état frais en DB
    status = get_client_status(st.session_state.email, st.session_state.commerce_id, st.session_state.client_name)
    
    # Sécurité supplémentaire au cas où le commerçant bloque ou débloque en arrière-plan
    if status["is_blocked"]:
        st.session_state.is_blocked = True
        st.session_state.block_reason = status.get("block_reason", "Comportement inapproprié")
        st.rerun()
        
    # Injection dynamique du titre dans le header natif Streamlit (qui est fixe d'origine)
    st.markdown(f"""
        <style>
            [data-testid="stHeader"]::before {{
                content: "Chatbot Retenza  \u25bc";
                font-size: 1.1rem;
                color: #0d0d0d;
                font-weight: 600;
                display: flex;
                align-items: center;
                padding-left: 3rem;
                height: 100%;
                white-space: nowrap !important;
            }}
        </style>
    """, unsafe_allow_html=True)
    
    if st.session_state.get("api_fallback_active", False):
        st.warning("⚠️ Connexion à l'IA temporairement ralentie. Mode de secours local actif.")

    import uuid
    
    # Initialiser session_id et compteurs de session
    if "session_id" not in st.session_state or st.session_state.session_id is None:
        st.session_state.session_id = str(uuid.uuid4())
    if "uncertainty_count" not in st.session_state:
        st.session_state.uncertainty_count = 0
    if "session_summary_generated" not in st.session_state:
        st.session_state.session_summary_generated = False

    # ── HELPERS NOUVEAUX MODULES (ESCALADE, FEEDBACK, RÉSUMÉ AUTO) ──
    def create_support_ticket(email, commerce_id, session_id, reason="Demande d'escalade humaine", summary=None):
        try:
            db = db_client[config.DB_NAME] if db_client else None
            if db is not None:
                conv = db.chatbot_conversations.find_one({"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id})
                messages_history = conv.get("messages", []) if conv else []
                ticket = {
                    "created_at": datetime.now().isoformat(),
                    "email": email,
                    "commerce_id": commerce_id,
                    "session_id": session_id,
                    "status": "OPEN",
                    "reason": reason,
                    "summary": summary or "Demande d'assistance directe par le client",
                    "messages_count": len(messages_history)
                }
                db.support_tickets.insert_one(ticket)
                db.audit_logs.insert_one({
                    "timestamp": datetime.now().isoformat(),
                    "type": "SUPPORT_ESCALATION",
                    "email": email,
                    "commerce_id": commerce_id,
                    "details": f"Ticket d'escalade ouvert: {reason}"
                })
                classifier.METRICS_TRACKER["escalations_count"] += 1
                return True
        except Exception as err:
            print(f"[ERROR] Failed to create support ticket: {err}")
        return False

    def save_language_feedback(email, commerce_id, session_id, message_idx):
        try:
            db = db_client[config.DB_NAME] if db_client else None
            if db is not None:
                db.chatbot_language_feedbacks.insert_one({
                    "timestamp": datetime.now().isoformat(),
                    "email": email,
                    "commerce_id": commerce_id,
                    "session_id": session_id,
                    "message_idx": message_idx,
                    "reason": "Langue / dialecte inadapté"
                })
                classifier.METRICS_TRACKER["language_feedbacks_count"] += 1
                st.toast("🌐 Signalement de langue enregistré ! Merci pour votre retour.", icon="✅")
        except Exception as e:
            print(f"[ERROR] save_language_feedback failed: {e}")

    def check_and_generate_session_summary(email, commerce_id, session_id, messages):
        if len(messages) >= 6 and not st.session_state.get("session_summary_generated", False):
            try:
                db = db_client[config.DB_NAME] if db_client else None
                if db is not None:
                    conv = db.chatbot_conversations.find_one({"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id})
                    if conv and not conv.get("summary"):
                        user_msgs = [m.get("text", "") for m in messages if m.get("role") == "user"]
                        summary_text = (
                            f"Discussion ({len(messages)} msgs) — Dernier sujet : '{user_msgs[-1][:60]}' — "
                            f"Statut : Traité par l'assistant SAV."
                        )
                        db.chatbot_conversations.update_one(
                            {"email": email.lower(), "commerce_id": commerce_id, "session_id": session_id},
                            {"$set": {"summary": summary_text, "summary_updated_at": datetime.now().isoformat()}}
                        )
                        st.session_state.session_summary_generated = True
            except Exception as ex:
                print(f"[ERROR] Summary generation failed: {ex}")


    # ==========================
    # BARRE LATÉRALE (SIDEBAR)
    # ==========================
    with st.sidebar:
        # Logo ou espace vide en haut
        st.write("")
        
        # Bouton "Nouveau chat" avec icône native professionnelle (Style ChatGPT compose)
        if st.button("Nouveau chat", icon=":material/edit:", use_container_width=True):
            st.session_state.session_id = str(uuid.uuid4())
            st.session_state.uncertainty_count = 0
            st.session_state.session_summary_generated = False
            st.rerun()

        # Bouton permanent d'escalade "Parler à un humain"
        if st.button("🎧 Parler à un humain", icon=":material/support_agent:", use_container_width=True):
            success = create_support_ticket(
                st.session_state.email,
                st.session_state.commerce_id,
                st.session_state.session_id,
                reason="Demande d'assistance directe par le client (bouton Parler à un humain)"
            )
            if success:
                st.success("✅ Ticket ouvert ! Un conseiller du service client va prendre le relais.")
            
        # Champ de recherche (Style ChatGPT)
        search_query = st.text_input(
            "Rechercher dans les chats",
            placeholder="Rechercher dans les chats",
            label_visibility="collapsed",
            key="chat_search_query"
        ).strip().lower()
        
        st.write("")


        
        # Récupérer toutes les sessions existantes filtrées en profondeur par le terme recherché
        all_sessions = get_all_sessions(
            st.session_state.email, 
            st.session_state.commerce_id, 
            search_query=search_query if search_query else None
        )
        
        # Log temporaire diagnostique
        print(f"[DIAGNOSTIC] Utilisateur : {st.session_state.email}, Boutique : {st.session_state.commerce_id}")
        print(f"[DIAGNOSTIC] Nombre de sessions recuperees en base : {len(all_sessions)}")
        for idx, s in enumerate(all_sessions):
            try:
                print(f"  - Session {idx}: id={s['session_id']}, title={s['title']}, is_pinned={s.get('is_pinned', False)}")
            except UnicodeEncodeError:
                safe_title = s['title'].encode('ascii', errors='replace').decode('ascii')
                print(f"  - Session {idx}: id={s['session_id']}, title={safe_title}, is_pinned={s.get('is_pinned', False)}")
        
        # ── DÉFINITION DE LA FONCTION DE RENDU DES LIGNES ──
        def render_conv_row(s, is_pinned_item):
            is_active = (s["session_id"] == st.session_state.session_id)
            title_clean = clean_title(s["title"])
            session_key = s["session_id"]

            if st.session_state.get("rename_session_id") == session_key:
                # ── MODE RENOMMAGE : pas de conv-row-marker pour ne pas activer le CSS de hover ──
                _email = st.session_state.email
                _cid   = st.session_state.commerce_id
                inp_col, ok_col, cancel_col = st.columns([4.2, 0.7, 0.7])
                with inp_col:
                    # Marqueur placé INSIDE la colonne pour que le parent stHorizontalBlock contienne la classe
                    st.markdown('<div class="rename-mode-marker"></div>', unsafe_allow_html=True)
                    st.text_input(
                        "",
                        value=title_clean,
                        max_chars=50,
                        key=f"rename_input_{session_key}",
                        label_visibility="collapsed",
                        on_change=save_rename,
                        args=(session_key, _email, _cid)
                    )
                with ok_col:
                    st.button("✓", key=f"rename_ok_{session_key}",
                              on_click=save_rename,
                              args=(session_key, _email, _cid),
                              use_container_width=True)
                with cancel_col:
                    st.button("✕", key=f"rename_cancel_{session_key}",
                              on_click=cancel_rename,
                              use_container_width=True)

            else:
                # ── MODE NORMAL : titre + menu ⋮ (2 colonnes) ──
                pin_class = "pinned" if is_pinned_item else "unpinned"
                active_class = "active-session" if is_active else ""
                col_title, col_menu = st.columns([5.5, 0.9])

                with col_title:
                    # Marqueur placé INSIDE la colonne pour que le parent stHorizontalBlock contienne la classe
                    st.markdown(f'<div class="conv-row-marker {pin_class} {active_class}"></div>', unsafe_allow_html=True)
                    if st.button(title_clean, key=f"nav_{session_key}", use_container_width=True):
                        st.session_state.session_id = session_key
                        st.rerun()

                with col_menu:
                    pin_label  = "Désépingler" if is_pinned_item else "Épingler"
                    with st.popover("", icon=":material/more_vert:",
                                    key=f"menu_pop_{session_key}",
                                    use_container_width=True):
                        # Épingler / Désépingler
                        st.button(
                            pin_label,
                            key=f"menu_pin_{session_key}",
                            on_click=toggle_pin_session,
                            args=(st.session_state.email,
                                  st.session_state.commerce_id,
                                  session_key),
                            use_container_width=True
                        )
                        # Renommer
                        st.button(
                            "Renommer",
                            key=f"menu_rename_{session_key}",
                            on_click=start_rename_mode,
                            args=(session_key,),
                            use_container_width=True
                        )
                        # Supprimer
                        if st.button("Supprimer", key=f"menu_del_{session_key}",
                                     use_container_width=True):
                            confirm_delete_dialog(
                                session_key, title_clean,
                                st.session_state.email,
                                st.session_state.commerce_id,
                                is_active
                            )

        # ── CONTENEUR DÉFILANT POUR LES CONVERSATIONS (géré via CSS) ──
        with st.container(key="conv_list_container"):
            # Si recherche active, on affiche les résultats formatés avec extraits de texte
            if search_query:
                if all_sessions:
                    for s in all_sessions:
                        # Récupération et formatage de l'extrait
                        snippet = s.get("snippet", "")
                        if not snippet:
                            snippet = "Correspondance trouvée dans le titre de la discussion"
                            
                        is_active = (s["session_id"] == st.session_state.session_id)
                        title_prefix = "● " if is_active else ""
                        
                        st.markdown(f"""
                            <div class="search-card-container">
                                <div class="chat-card-html">
                                    <span class="chat-card-icon">💬</span>
                                    <div class="chat-card-body">
                                        <div class="chat-card-title">{title_prefix}{clean_title(s['title'])}</div>
                                        <div class="chat-card-snippet">{snippet}</div>
                                    </div>
                                </div>
                            </div>
                        """, unsafe_allow_html=True)
                        
                        # Bouton invisible superposé pour capter le clic sur la carte HTML
                        if st.button("", key=f"search_btn_{s['session_id']}", use_container_width=True):
                            st.session_state.session_id = s["session_id"]
                            # Sauvegarder le terme de recherche pour scroller jusqu'au message
                            st.session_state.highlight_query = search_query
                            st.rerun()
                else:
                    st.caption("Aucun résultat trouvé")
            else:
                pinned_sessions = [s for s in all_sessions if s.get("is_pinned", False)]
                recent_sessions = [s for s in all_sessions if not s.get("is_pinned", False)]

                # 1. Section épinglés
                if pinned_sessions:
                    st.markdown('<div class="sidebar-section-header">Épinglés</div>', unsafe_allow_html=True)
                    for s in pinned_sessions:
                        render_conv_row(s, is_pinned_item=True)
                    # Ligne de séparation fine entre les deux sections
                    st.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)

                # 2. Section récents
                if recent_sessions:
                    st.markdown('<div class="sidebar-section-header">Récents</div>', unsafe_allow_html=True)
                    for s in recent_sessions:
                        render_conv_row(s, is_pinned_item=False)
                else:
                    st.markdown('<div class="sidebar-section-header">Récents</div>', unsafe_allow_html=True)
                    st.caption("Aucune conversation")
                


        # Récupération et formitage des infos du profil
        client_name = st.session_state.get("client_name", "Client")
        initials = "".join([part[0].upper() for part in client_name.split()[:2]]) if client_name else "GH"
        client_short = client_name.split()[0].lower() if client_name else "gho"
        client_email = st.session_state.get("email", "")
        
        # Injecter dynamiquement l'avatar initiales en CSS pour le bouton popover profil UNIQUEMENT
        st.markdown(f"""
            <style>
                /* Cible uniquement le popover profil */
                div.st-key-profile_popover div[data-testid="stPopover"] > button::before {{
                    content: "{initials[0]}";
                    width: 32px;
                    height: 32px;
                    background-color: #2563eb !important; /* Bleu royal */
                    color: #ffffff !important;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    font-size: 0.85rem;
                    flex-shrink: 0;
                }}
            </style>
        """, unsafe_allow_html=True)

        # Popover qui s'affiche sous forme de bouton profil
        warnings_count = status.get("warnings", 0)
        max_w = config.MAX_WARNINGS
        with st.popover(f"{client_name.split()[0].lower()} ", key="profile_popover", use_container_width=True):
            # Définir couleur et badge selon avertissements
            if warnings_count == 0:
                warn_color = "#16a34a"
                warn_bg = "#f0fdf4"
                warn_icon = "✅"
                warn_text = f"Aucun avertissement"
            elif warnings_count < max_w:
                warn_color = "#d97706"
                warn_bg = "#fffbeb"
                warn_icon = "⚠️"
                warn_text = f"Avertissement {warnings_count}/{max_w}"
            else:
                warn_color = "#dc2626"
                warn_bg = "#fef2f2"
                warn_icon = "🚫"
                warn_text = f"Accès limité {warnings_count}/{max_w}"
            
            initials_display = "".join([p[0].upper() for p in client_name.split()[:2]])
            
            st.markdown(f"""
                <div style="padding:4px 0 8px 0;">
                    <!-- Avatar + Nom -->
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                        <div style="width:44px;height:44px;background:#ea580c;color:#fff;
                                    border-radius:50%;display:flex;align-items:center;
                                    justify-content:center;font-weight:700;font-size:1rem;
                                    flex-shrink:0;">
                            {initials_display}
                        </div>
                        <div>
                            <div style="font-weight:700;color:#0d0d0d;font-size:0.95rem;line-height:1.2;">
                                {client_name}
                            </div>
                            <div style="color:#6b7280;font-size:0.75rem;margin-top:2px;">
                                Client connecté
                            </div>
                        </div>
                    </div>
                    <!-- Email -->
                    <div style="background:#f4f4f4;border-radius:8px;padding:8px 12px;margin-bottom:10px;">
                        <div style="font-size:0.7rem;color:#9ca3af;font-weight:600;
                                    text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">
                            Email
                        </div>
                        <div style="font-size:0.82rem;color:#374151;word-break:break-all;">
                            {client_email}
                        </div>
                    </div>
                    <!-- Badge avertissements -->
                    <div style="background:{warn_bg};border-radius:8px;padding:8px 12px;
                                display:flex;align-items:center;gap:8px;">
                        <span style="font-size:0.85rem;">{warn_icon}</span>
                        <span style="font-size:0.82rem;color:{warn_color};font-weight:600;">
                            {warn_text}
                        </span>
                    </div>
                </div>
            """, unsafe_allow_html=True)
            
            if st.button("🚪 Se déconnecter", use_container_width=True):
                for key in list(st.session_state.keys()):
                    del st.session_state[key]
                st.rerun()

    # ==========================
    # ZONE DE CHAT PRINCIPALE
    # ==========================
    # Récupérer l'historique complet de la session courante
    messages = get_conversation(st.session_state.email, st.session_state.commerce_id, st.session_state.session_id)
    
    # Rendre l'historique dans des bulles natives
    if not messages:
        # ── NOUVELLE SESSION : insérer le message d'accueil automatique du bot ──
        commerce_display = commerces_map.get(st.session_state.commerce_id, "notre boutique")
        client_first = st.session_state.get("client_name", "").split()[0] if st.session_state.get("client_name") else ""
        greeting_text = (
            f"Bonjour {client_first} ! 👋 Je suis l'assistant virtuel de **Retenza**.\n\n"
            f"Je suis là pour vous accompagner concernant votre boutique actuelle : **{commerce_display}**.\n\n"
            "Voici les sujets sur lesquels je peux vous renseigner :\n"
            "- 📦 Le **suivi de vos commandes**\n"
            "- 🔄 Les **retours et réclamations**\n"
            "- ⭐ Votre **programme de fidélité Retenza**\n"
            "- 🛍️ Les **infos produits** et disponibilités\n\n"
            "Comment puis-je vous aider aujourd'hui ?"
        )

        # Module 4: Relance proactive si le client est VIP ou à risque de churn
        # Le status de modération ne contient pas segment_gmm — on lit analyses_ia directement
        try:
            _db = db_client[config.DB_NAME] if db_client else None
            _ia_doc = _db.analyses_ia.find_one({
                "email": {"$regex": f"^{st.session_state.email}$", "$options": "i"},
                "commerce_id": st.session_state.commerce_id
            }) if _db else None
            if not _ia_doc:
                # Fallback sans commerce_id
                _ia_doc = _db.analyses_ia.find_one({
                    "email": {"$regex": f"^{st.session_state.email}$", "$options": "i"}
                }) if _db else None
            _segment = (_ia_doc.get("segment_gmm") or "").lower() if _ia_doc else ""
            _churn_raw = _ia_doc.get("churn_score", 0) if _ia_doc else 0
            _churn_pct = round(_churn_raw * 100 if isinstance(_churn_raw, float) and _churn_raw <= 1 else _churn_raw, 1)
            _is_vip = (_segment == "vip")
            _is_churn_risk = (_churn_pct >= 60)
            if _is_vip or _is_churn_risk:
                greeting_text += (
                    "\n\n🌟 *Offre Spéciale Retenza* : "
                    + ("En tant que client VIP, profite du code promo **VIPCARE15** pour -15% sur ta prochaine commande ! 🎁"
                       if _is_vip
                       else "On ne voudrait pas te perdre ! Profite du code **RETOUR15** pour -15% sur ta prochaine commande. 🎁")
                )
        except Exception as _vip_err:
            print(f"[VIP_PROMO] Erreur lecture analyses_ia pour proactivité : {_vip_err}")


        save_message_to_conversation(
            st.session_state.email,
            st.session_state.commerce_id,
            st.session_state.session_id,
            "assistant",
            greeting_text
        )
        # Afficher immédiatement la bulle d'accueil sans rerun (évite le flash vide)
        with st.chat_message("assistant", avatar=None):
            st.markdown(
                f'<span class="msg-role-marker msg-role-assistant"></span>',
                unsafe_allow_html=True
            )
            st.markdown(greeting_text)

    else:
        # Module 4: Générer automatiquement le résumé de session si >= 6 messages
        check_and_generate_session_summary(
            st.session_state.email,
            st.session_state.commerce_id,
            st.session_state.session_id,
            messages
        )

        highlight_query = st.session_state.get("highlight_query", "")
        target_idx = -1  # Index du message cible pour le scroll

        for i, msg in enumerate(messages):
            role = msg.get("role")
            text = msg.get("text", "")
            category = msg.get("category", "")
            
            # Déterminer si ce message contient le terme recherché
            is_target = (highlight_query and highlight_query.lower() in text.lower() and target_idx == -1)
            if is_target:
                target_idx = i
                st.markdown(f'<div id="msg-highlight-target"></div>', unsafe_allow_html=True)
            
            # Déterminer l'avatar/nom et la classe CSS en fonction du rôle
            avatar = "👤" if role == "user" else "🤖"
            role_class = "user" if role == "user" else "assistant"
            if category in ["IMPOLI", "INSULTE", "MENACE", "HAINE"]:
                avatar = "🚨"
                role_class = "alert"

            # Un seul bloc DOM propre : le marqueur invisible puis st.markdown natif
            with st.chat_message(role, avatar=None if role == "assistant" else avatar):
                st.markdown(
                    f'<span class="msg-role-marker msg-role-{role_class}"></span>',
                    unsafe_allow_html=True
                )
                st.markdown(text)

            # Barre d'actions Meta AI — icônes SVG noires sur fond gris circulaire
            if role == "assistant" and role_class == "assistant":
                safe_text = text.encode('utf-8', errors='ignore').decode('utf-8')
                b64_text = base64.b64encode(safe_text.encode('utf-8')).decode('utf-8')
                msg_id = f"action_{i}"
                
                # SVG icons : copy, thumbs-up, thumbs-down (noir, style Feather/Lucide)
                icon_copy = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
                icon_up   = '<svg viewBox="0 0 24 24"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>'
                icon_down  = '<svg viewBox="0 0 24 24"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>'
                
                email_s = st.session_state.email.replace("'", "\\'")
                comm_s = st.session_state.commerce_id.replace("'", "\\'")
                sess_s = st.session_state.session_id.replace("'", "\\'")

                st.markdown(f'''
                <div class="meta-action-bar" id="{msg_id}">
                    <button class="meta-action-btn"
                        title="Copier le texte de la réponse"
                        data-raw="{b64_text}"
                        data-msgid="{msg_id}"
                        onclick="copyChatbotMsg(this)">
                        {icon_copy}
                    </button>
                    <button class="meta-action-btn"
                        title="J'aime cette réponse"
                        data-type="like"
                        data-email="{email_s}"
                        data-comm="{comm_s}"
                        data-sess="{sess_s}"
                        data-idx="{i}"
                        data-msgid="{msg_id}"
                        onclick="sendFeedbackBtn(this)">
                        {icon_up}
                    </button>
                    <button class="meta-action-btn"
                        title="Je n'aime pas cette réponse"
                        data-type="dislike"
                        data-email="{email_s}"
                        data-comm="{comm_s}"
                        data-sess="{sess_s}"
                        data-idx="{i}"
                        data-msgid="{msg_id}"
                        onclick="sendFeedbackBtn(this)">
                        {icon_down}
                    </button>
                </div>
                ''', unsafe_allow_html=True)

        # Module 2: Proposition d'escalade automatique si 2 incertitudes consécutives
        if st.session_state.get("uncertainty_count", 0) >= 2:
            st.info("💡 **Besoin d'aide supplémentaire ?** Nos réclamations nécessitent parfois l'intervention d'un conseiller.")
            if st.button("🚨 Transmettre ma demande au service client (Créer un ticket)", key="auto_escalate_btn", use_container_width=True):
                if create_support_ticket(
                    st.session_state.email,
                    st.session_state.commerce_id,
                    st.session_state.session_id,
                    reason="Escalade automatique après réponses incertaines"
                ):
                    st.success("✅ Votre ticket d'escalade a été créé avec succès ! Le service client étudie votre dossier.")
                    st.session_state.uncertainty_count = 0

        # Si un terme de surbrillance est actif, injecter le JS de scroll + animation
        if highlight_query and target_idx >= 0:
            st.markdown("""
                <style>
                @keyframes highlightPulse {
                    0%   { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); background-color: rgba(254, 240, 138, 0.4); }
                    50%  { box-shadow: 0 0 0 8px rgba(250, 204, 21, 0); background-color: rgba(254, 240, 138, 0.15); }
                    100% { box-shadow: none; background-color: transparent; }
                }
                #msg-highlight-target + div [data-testid="stChatMessage"] {
                    animation: highlightPulse 2s ease 0.3s both;
                    border-radius: 12px;
                }
                </style>
                <script>
                (function() {
                    function scrollToHighlight() {
                        var target = document.getElementById('msg-highlight-target');
                        if (target) {
                            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                    setTimeout(scrollToHighlight, 300);
                })();
                </script>
            """, unsafe_allow_html=True)
            st.session_state.highlight_query = ""

    # ── ZONE DE SAISIE NATIVE ───────────────────────────────────────────
    is_generating = st.session_state.get("is_generating", False)
    
    # CSS visuel si la génération est active
    if is_generating:
        st.markdown("""
        <style>
            [data-testid="stChatInputSubmitButton"] {
                background-color: #cbd5e1 !important;
                color: #94a3b8 !important;
                opacity: 0.5 !important;
                cursor: not-allowed !important;
                pointer-events: none !important;
            }
        </style>
        """, unsafe_allow_html=True)

    user_input = st.chat_input("Tapez votre question ici...")
        
    if user_input and user_input.strip():
        if is_generating:
            # Ignorer toute tentative de réenvoi pendant la génération
            user_input = None
        else:
            st.session_state.is_generating = True
            st.session_state.pending_user_input = user_input.strip()
            st.rerun()

    # Message en attente de traitement
    pending_input = st.session_state.get("pending_user_input")
    if pending_input:
        user_input = pending_input
        st.session_state.pending_user_input = None




        
        # Module 3: Rate limiting par utilisateur / session
        user_key = st.session_state.get("email") or st.session_state.session_id
        if not classifier.check_rate_limit(user_key, max_requests=10, window_seconds=60):
            st.warning("⚠️ **Limite de messages atteinte** : Vous envoyez des messages trop rapidement. Veuillez patienter quelques secondes.")
            st.session_state.is_generating = False
        else:
            with st.chat_message("user", avatar="👤"):
                st.markdown(
                    f'<span class="msg-role-marker msg-role-user"></span>',
                    unsafe_allow_html=True
                )
                st.markdown(user_input)
            try:
                # 1. Enregistrer le message de l'utilisateur en base
                save_message_to_conversation(
                    st.session_state.email,
                    st.session_state.commerce_id,
                    st.session_state.session_id,
                    "user",
                    user_input
                )
                
                # 2. Classifier le message avec Groq/Gemini (détection de ton et gravité)
                classification = classifier.classify_message(user_input)
                
                is_inappropriate = classification.get("is_inappropriate", False)
                category = classification.get("category", "NORMAL")
                severity = classification.get("severity", "LOW")
                reason = classification.get("reason", "")
                
                # Mettre à jour la classification du message en DB
                db = db_client[config.DB_NAME] if db_client else None
                if db is not None:
                    conv = db.chatbot_conversations.find_one({"email": st.session_state.email.lower(), "commerce_id": st.session_state.commerce_id, "session_id": st.session_state.session_id})
                    if conv and conv.get("messages"):
                        last_idx = len(conv["messages"]) - 1
                        db.chatbot_conversations.update_one(
                            {"email": st.session_state.email.lower(), "commerce_id": st.session_state.commerce_id, "session_id": st.session_state.session_id},
                            {"$set": {
                                f"messages.{last_idx}.category": category,
                                f"messages.{last_idx}.severity": severity
                            }}
                        )

                if is_inappropriate:
                    status["warnings"] += 1
                    classifier.METRICS_TRACKER["warnings_count"] += 1
                    infraction_doc = {
                        "timestamp": datetime.now().isoformat(),
                        "text": user_input,
                        "category": category,
                        "severity": severity
                    }
                    status["warnings_history"].append(infraction_doc)
                    
                    if status["warnings"] >= config.MAX_WARNINGS:
                        status["is_blocked"] = True
                        status["blocked_at"] = datetime.now().isoformat()
                        status["block_reason"] = f"Avertissements répétés ({category} : {reason})"
                        classifier.METRICS_TRACKER["blocked_users_count"] += 1
                        
                        save_message_to_conversation(
                            st.session_state.email,
                            st.session_state.commerce_id,
                            st.session_state.session_id,
                            "assistant",
                            config.BLOCK_MESSAGE,
                            category=category,
                            severity=severity
                        )
                        update_client_status(status)
                        send_block_email(
                            st.session_state.client_name,
                            st.session_state.email,
                            commerces_map[st.session_state.commerce_id],
                            status["warnings_history"],
                            status["block_reason"]
                        )
                        st.session_state.is_blocked = True
                        st.session_state.block_reason = status["block_reason"]
                        st.session_state.is_generating = False
                        st.rerun()
                    else:
                        sys_reply = config.WARNING_MESSAGE_1 if status["warnings"] == 1 else config.WARNING_MESSAGE_2
                        save_message_to_conversation(
                            st.session_state.email,
                            st.session_state.commerce_id,
                            st.session_state.session_id,
                            "assistant",
                            sys_reply,
                            category=category,
                            severity=severity
                        )
                        update_client_status(status)
                        st.session_state.is_generating = False
                        st.rerun()
                else:
                    # Module 1: Génération avec Cache FAQ, Latence, et Streaming
                    # (pas d'indicateur typing affiché — la zone de saisie est déjà désactivée)
                    with st.chat_message("assistant", avatar=None):
                        st.markdown(
                            '<span class="msg-role-marker msg-role-assistant"></span>',
                            unsafe_allow_html=True
                        )
                        history = get_conversation(st.session_state.email, st.session_state.commerce_id, st.session_state.session_id)

                        
                        # Vérification Cache FAQ (<10ms)
                        cached_resp = classifier.get_cached_faq_response(user_input, commerces_map.get(st.session_state.commerce_id, "la boutique"))
                        if cached_resp:
                            classifier.METRICS_TRACKER["cache_hits"] += 1
                            bot_reply = cached_resp
                            st.markdown(bot_reply)
                        else:
                            # Génération LLM avec mesure de latence
                            t0 = time.time()
                            try:
                                bot_reply, is_fallback = classifier._execute_with_timeout(
                                    classifier.generate_chatbot_response,
                                    args=(
                                        st.session_state.client_name,
                                        st.session_state.email,
                                        commerces_map.get(st.session_state.commerce_id, "la boutique"),
                                        history,
                                        user_input,
                                        st.session_state.commerce_id
                                    ),
                                    timeout=classifier.LLM_TIMEOUT_SECONDS
                                )
                            except TimeoutError:
                                # Réponse de secours locale - pas de message "mode de secours" visible
                                bot_reply = classifier._get_offline_response(
                                    st.session_state.client_name,
                                    st.session_state.email,
                                    commerces_map.get(st.session_state.commerce_id, "la boutique"),
                                    history,
                                    user_input
                                )
                                is_fallback = True
                            
                            latency_ms = (time.time() - t0) * 1000
                            classifier.METRICS_TRACKER["total_calls"] += 1
                            classifier.METRICS_TRACKER["total_latency_ms"] += latency_ms
                            if classifier.llm_provider == "groq":
                                classifier.METRICS_TRACKER["groq_calls"] += 1
                            elif classifier.llm_provider == "gemini":
                                classifier.METRICS_TRACKER["gemini_calls"] += 1
                            else:
                                classifier.METRICS_TRACKER["offline_calls"] += 1

                            st.session_state.api_fallback_active = is_fallback
                            
                            # Streaming visuel token par token
                            def token_generator():
                                words = bot_reply.split(" ")
                                for w in words:
                                    yield w + " "
                                    time.sleep(0.02)
                            
                            st.write_stream(token_generator())

                    # Module 2: Suivi des incertitudes du bot
                    # (pas de typing_placeholder.empty() car on n'en affiche plus)
                    if classifier.is_uncertain_response(bot_reply):
                        st.session_state.uncertainty_count += 1
                    else:
                        st.session_state.uncertainty_count = 0

                    # Enregistrer la réponse de l'assistant en DB
                    save_message_to_conversation(
                        st.session_state.email,
                        st.session_state.commerce_id,
                        st.session_state.session_id,
                        "assistant",
                        bot_reply
                    )
                    # Libérer la saisie et rafraîchir
                    st.session_state.is_generating = False
                    st.rerun()
            except Exception as ex:
                print(f"[FATAL ERROR] Exception in chat form submission: {ex}")
                st.warning("⚠️ Un incident technique temporaire est survenu. Veuillez reformuler votre message.")
                st.session_state.is_generating = False

