'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import PublicNavbar from '@/components/landing/PublicNavbar';
import { Fraunces } from 'next/font/google';

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500'] });
/* ─────────────────── SHARED CARD CONSTANTS ─────────────────── */
const CARD_RADIUS = 24;
const CARD_SHADOW = '0 6px 32px rgba(191,33,18,0.06), 0 2px 8px rgba(0,0,0,0.04)';
const CARD_SHADOW_HOVER = '0 24px 64px rgba(191,33,18,0.16), 0 12px 24px rgba(0,0,0,0.08)';
const CARD_BORDER_LEFT = '5px solid #BF2112';

/* ─────────────────── DATA ─────────────────── */

const WIDGET_STYLE = {
  background: 'linear-gradient(145deg, #FFFFFF 0%, #FBF8F7 100%)',
  borderRadius: 16,
  padding: '16px',
  border: '1px solid #E8DFD9',
  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.015), 0 2px 4px rgba(0,0,0,0.02)',
};

const clientCards = [
  {
    title: 'Vos points, partout où vous allez',
    desc: "Cumulez des points dans tous vos commerces partenaires Retenza d'un simple scan. Un seul compte, des centaines d'enseignes.",
    graphic: (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1.5px dashed var(--red)', background: 'var(--coral-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, zIndex: 2 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, zIndex: 3 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: -8, zIndex: 4 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
    )
  },
  {
    title: 'Échangez quand vous voulez',
    desc: "Convertissez vos points en réductions, cadeaux ou avantages exclusifs — au moment qui vous convient, sans date d'expiration imposée.",
    graphic: (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Café offert</span>
          <span className={fraunces.className} style={{ fontSize: 14, fontWeight: 500, color: 'var(--red)' }}>250 pts</span>
        </div>
        <div style={{ width: '100%', height: 8, background: 'var(--coral-tint)', borderRadius: 4 }}>
          <div style={{ width: '75%', height: '100%', background: 'var(--red)', borderRadius: 4 }} />
        </div>
      </div>
    )
  },
  {
    title: 'Offres flash réservées aux membres',
    desc: "Accédez en avant-première aux promotions exclusives de vos commerçants préférés. Notifié en temps réel, vous ne ratez plus rien.",
    graphic: (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--coral-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/>
          </svg>
        </div>
        <div>
          <div className={fraunces.className} style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>3 offres actives</div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>Expire dans 2h</div>
        </div>
      </div>
    )
  },
];

const merchantCards = [
  {
    title: 'Configurez votre programme en 10 minutes',
    desc: "Créez votre programme de fidélité personnalisé sans compétence technique. Règles de points, paliers, récompenses — tout est configurable depuis votre espace.",
    graphic: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[ 'Règles de points', 'Paliers', 'Récompenses' ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: i !== 2 ? 5 : 0, borderBottom: i !== 2 ? '1px dashed var(--line)' : 'none' }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span className={fraunces.className} style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{item}</span>
          </div>
        ))}
      </div>
    )
  },
  {
    isVisual: true, // Marker for our custom mockup card (handled manually)
  },
  {
    title: 'Récompensez les bons comportements',
    desc: "Offrez des points bonus pour une visite le mardi creux, un parrainage, ou un achat au-dessus d'un seuil. Pilotez la fidélité là où elle compte.",
    graphic: (() => {
      const rules = [
        {
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          ),
          name: 'Mardi -20%',
          sub: 'Booster les jours creux',
        },
        {
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          name: 'Parrainage +50 pts',
          sub: 'Récompenser le bouche-à-oreille',
        },
        {
          icon: (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
          ),
          name: 'Anniversaire ×2',
          sub: 'Double points ce jour-là',
        },
      ];
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'var(--ink-soft)', margin: '0 0 6px', fontWeight: 500 }}>
            Vos règles actives
          </p>
          {rules.map((r, i) => (
            <div key={i} style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px 4px 14px',
              background: 'var(--card)',
              border: '1px solid var(--coral-tint)',
              borderRadius: 4,
              marginBottom: i !== rules.length - 1 ? 3 : 0,
            }}>
              {/* Left notch */}
              <div style={{
                position: 'absolute', left: -6, top: '50%', marginTop: -6,
                width: 12, height: 12, borderRadius: '50%',
                background: 'var(--cream)', border: '1px solid var(--coral-tint)',
                clipPath: 'inset(0 0 0 50%)',
              }} />
              {/* Icon circle — 16px */}
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: 'var(--coral-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {r.icon}
              </div>
              {/* Text */}
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--red-dark)', lineHeight: 1.2 }}>{r.name}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: 'var(--ink-soft)', marginTop: 1 }}>{r.sub}</div>
              </div>
            </div>
          ))}
        </div>
      );
    })(),
  },
];

const globalFaqs = [
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="giftTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8506A"/>
            <stop offset="100%" stopColor="#9E1A0A"/>
          </linearGradient>
          <linearGradient id="giftBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAD7D0"/>
            <stop offset="100%" stopColor="#F0B8AD"/>
          </linearGradient>
          <linearGradient id="giftBodySide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8998A"/>
            <stop offset="100%" stopColor="#D47A6A"/>
          </linearGradient>
        </defs>
        {/* Lid */}
        <rect x="10" y="18" width="36" height="10" rx="3" fill="url(#giftTop)"/>
        {/* Shadow under lid */}
        <rect x="10" y="26" width="36" height="3" fill="#8A1329" opacity="0.3"/>
        {/* Box body */}
        <rect x="12" y="28" width="32" height="18" rx="2" fill="url(#giftBody)"/>
        {/* Box side shadow */}
        <rect x="38" y="28" width="6" height="18" rx="2" fill="url(#giftBodySide)"/>
        {/* Ribbon vertical */}
        <rect x="25" y="18" width="6" height="28" rx="1" fill="url(#giftTop)" opacity="0.8"/>
        {/* Ribbon horizontal (lid) */}
        <rect x="10" y="21" width="36" height="4" rx="1" fill="url(#giftTop)" opacity="0.8"/>
        {/* Bow left */}
        <path d="M28 18 Q20 10 16 14 Q14 18 22 18Z" fill="#E8506A"/>
        {/* Bow right */}
        <path d="M28 18 Q36 10 40 14 Q42 18 34 18Z" fill="#C31F3C"/>
        {/* Bow knot */}
        <circle cx="28" cy="18" r="3" fill="#E8506A"/>
      </svg>
    ),
    q: 'Est-ce gratuit pour démarrer ?',
    a: "Oui, 100 % gratuit pour lancer votre programme. Des options premium existent pour aller plus loin.",
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="regTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8506A"/>
            <stop offset="100%" stopColor="#C31F3C"/>
          </linearGradient>
          <linearGradient id="regBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="100%" stopColor="#F5EAE7"/>
          </linearGradient>
          <linearGradient id="regSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E8C4BC"/>
            <stop offset="100%" stopColor="#D4A89E"/>
          </linearGradient>
        </defs>
        {/* Machine body */}
        <rect x="10" y="22" width="34" height="22" rx="4" fill="url(#regBody)"/>
        {/* Body right side depth */}
        <rect x="40" y="25" width="5" height="19" rx="2" fill="url(#regSide)"/>
        {/* Screen/header area */}
        <rect x="10" y="13" width="30" height="13" rx="3" fill="url(#regTop)"/>
        {/* Screen top depth */}
        <rect x="37" y="16" width="5" height="10" rx="2" fill="#8A1329"/>
        {/* Screen display */}
        <rect x="14" y="16" width="18" height="7" rx="1.5" fill="white" opacity="0.3"/>
        {/* Keypad dots */}
        <circle cx="17" cy="29" r="2" fill="#C31F3C" opacity="0.7"/>
        <circle cx="24" cy="29" r="2" fill="#C31F3C" opacity="0.7"/>
        <circle cx="31" cy="29" r="2" fill="#C31F3C" opacity="0.7"/>
        <circle cx="17" cy="36" r="2" fill="#C31F3C" opacity="0.5"/>
        <circle cx="24" cy="36" r="2" fill="#C31F3C" opacity="0.5"/>
        <circle cx="31" cy="36" r="2" fill="#8A1329" opacity="0.8"/>
        {/* Receipt */}
        <rect x="22" y="40" width="10" height="8" rx="1" fill="white"/>
        <line x1="24" y1="43" x2="30" y2="43" stroke="#E8998A" strokeWidth="1"/>
        <line x1="24" y1="45" x2="28" y2="45" stroke="#E8998A" strokeWidth="1"/>
      </svg>
    ),
    q: "Puis-je l'intégrer à ma caisse ?",
    a: "Aucune intégration requise. Le client scanne son QR code directement depuis l'app — c'est tout.",
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="clockFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="100%" stopColor="#F5EAE7"/>
          </linearGradient>
          <linearGradient id="clockRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E8506A"/>
            <stop offset="100%" stopColor="#8A1329"/>
          </linearGradient>
        </defs>
        {/* Clock ring shadow */}
        <circle cx="29" cy="30" r="19" fill="#8A1329" opacity="0.15"/>
        {/* Clock ring */}
        <circle cx="28" cy="28" r="19" fill="url(#clockRing)"/>
        {/* Clock face */}
        <circle cx="28" cy="28" r="15" fill="url(#clockFace)"/>
        {/* Hour markers */}
        <rect x="27" y="12" width="2" height="3" rx="1" fill="#C31F3C" opacity="0.5"/>
        <rect x="27" y="41" width="2" height="3" rx="1" fill="#C31F3C" opacity="0.5"/>
        <rect x="12" y="27" width="3" height="2" rx="1" fill="#C31F3C" opacity="0.5"/>
        <rect x="41" y="27" width="3" height="2" rx="1" fill="#C31F3C" opacity="0.5"/>
        {/* Minute hand */}
        <line x1="28" y1="28" x2="28" y2="17" stroke="#1C1C2E" strokeWidth="2" strokeLinecap="round"/>
        {/* Hour hand */}
        <line x1="28" y1="28" x2="35" y2="28" stroke="#C31F3C" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Center dot */}
        <circle cx="28" cy="28" r="2.5" fill="#C31F3C"/>
        {/* Top knob */}
        <rect x="26" y="8" width="4" height="4" rx="2" fill="url(#clockRing)"/>
      </svg>
    ),
    q: 'Mes points expirent-ils ?',
    a: "Non, jamais. Vos points restent valables tant que votre compte est actif — échangez quand vous voulez.",
  },
  {
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="phoneBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A2440"/>
            <stop offset="100%" stopColor="#1C1C2E"/>
          </linearGradient>
          <linearGradient id="phoneScreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF"/>
            <stop offset="100%" stopColor="#F9F4F2"/>
          </linearGradient>
          <linearGradient id="qrAccent" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C31F3C"/>
            <stop offset="100%" stopColor="#8A1329"/>
          </linearGradient>
        </defs>
        <rect x="14" y="8" width="24" height="38" rx="5" fill="url(#phoneBody)"/>
        <rect x="16" y="10" width="20" height="34" rx="4" fill="url(#phoneScreen)"/>
        <rect x="22" y="10" width="8" height="3" rx="1.5" fill="#2A2440"/>
        <path d="M20 20 L20 16 L24 16" stroke="url(#qrAccent)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M32 20 L32 16 L28 16" stroke="url(#qrAccent)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M20 30 L20 34 L24 34" stroke="url(#qrAccent)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M32 30 L32 34 L28 34" stroke="url(#qrAccent)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <rect x="22" y="22" width="3" height="3" rx="0.5" fill="#C31F3C" opacity="0.7"/>
        <rect x="27" y="22" width="2" height="2" rx="0.5" fill="#8A1329" opacity="0.6"/>
        <rect x="22" y="27" width="2" height="2" rx="0.5" fill="#8A1329" opacity="0.6"/>
        <rect x="26" y="26" width="4" height="4" rx="0.5" fill="#C31F3C" opacity="0.5"/>
        <rect x="18" y="24" width="16" height="1.5" rx="1" fill="#C31F3C" opacity="0.35"/>
        <rect x="22" y="43" width="8" height="1.5" rx="1" fill="#8C7B73" opacity="0.4"/>
        <path d="M42 22 Q46 25 42 28" stroke="#C31F3C" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6"/>
        <path d="M42 18 Q50 25 42 32" stroke="#C31F3C" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3"/>
      </svg>
    ),
    q: 'Comment fonctionne le QR code ?',
    a: "Présentez votre QR code Retenza en magasin. Le commerçant scanne — vos points sont crédités instantanément.",
  },
];

/* ─────────────────── INLINE STYLES ─────────────────── */

const globalStyles = `
  @keyframes dash-flow {
    to { stroke-dashoffset: -24; }
  }
  @keyframes float-y {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  .faq-answer {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    opacity: 0;
  }
  .faq-answer.open {
    max-height: 200px;
    opacity: 1;
  }
  
  /* Hover effects for inner/generic cards */
  .benefit-card {
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .benefit-card:hover {
    box-shadow: ${CARD_SHADOW_HOVER} !important;
    transform: translateY(-6px) !important;
  }
  
  /* Hover effects for main clickable elements (CTAs, interactive buttons) */
  .interactive-card {
    transition: box-shadow 0.25s ease, transform 0.25s ease, border-color 0.25s ease;
  }
  .interactive-card:hover {
    transform: translateY(-4px);
    box-shadow: ${CARD_SHADOW_HOVER};
  }
  
  /* FAQ Carousel specific styles */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }

  .faq-carousel-card {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .faq-carousel-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.03), 0 12px 24px rgba(0,0,0,0.05) !important;
  }
  .faq-carousel-card .faq-icon-wrap {
    transition: all 0.3s ease;
  }
  .faq-carousel-card:hover .faq-icon-wrap {
    transform: scale(1.08);
    background: linear-gradient(135deg, rgba(230,40,60,0.12), rgba(230,40,60,0.22)) !important;
  }

  :root {
    --cream: #FBF6F1;
    --ink: #17151A;
    --ink-soft: #514C52;
    --red: #C31F3C;
    --red-dark: #8A1329;
    --coral-tint: #F5D7CD;
    --line: #E7DED4;
    --card: #FFFFFF;
  }

  .ticket-card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 4px;
    padding: 20px;
    /* CSS Grid: top zone fixed height → separator always at the same Y */
    display: grid;
    grid-template-rows: 164px auto auto;
    flex: 1 1 0;
    width: 0;
    min-width: 260px;
    max-width: 380px;
    align-self: stretch;
    box-shadow: none;
    transition: transform 0.2s ease;
  }

  /* Fixed-height text zone: same in all 3 cards */
  .card-top {
    height: 164px;
    overflow: visible;
    display: flex;
    flex-direction: column;
  }

  /* Graphic zone: clips content so cards stay compact */
  .card-bottom {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    padding-top: 0px;
  }

  .ticket-card:hover {
    transform: translateY(-4px);
  }

  .ticket-separator {
    position: relative;
    margin: 14px -20px;
    height: 12px;
  }
  
  .ticket-separator::before,
  .ticket-separator::after {
    content: "";
    position: absolute;
    top: 0;
    width: 12px;
    height: 12px;
    background: var(--cream);
    border: 1px solid var(--line);
    border-radius: 50%;
    z-index: 2;
  }
  
  .ticket-separator::before {
    left: -7px;
    clip-path: inset(0 0 0 50%);
  }
  
  .ticket-separator::after {
    right: -7px;
    clip-path: inset(0 50% 0 0);
  }
  
  .ticket-separator .line {
    position: absolute;
    top: 5px;
    left: 6px;
    right: 6px;
    height: 1px;
    border-top: 2px dotted var(--line);
  }

  html {
    scroll-behavior: smooth;
  }
  
  @keyframes fadeInTab {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-in-tab {
    animation: fadeInTab 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.08s;
    opacity: 0;
  }

  @keyframes popScale {
    0% { transform: scale(1); }
    40% { transform: scale(1.04); }
    100% { transform: scale(1); }
  }
  .label-interactive {
    transition: opacity 0.2s ease, color 0.2s ease;
  }
  .label-interactive:hover:not(.active-label) {
    opacity: 0.65;
  }
  .label-interactive.active-label {
    animation: popScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .toggle-track {
    transition: background-color 0.3s ease;
  }
  .toggle-knob {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
  }
  .toggle-track:active .toggle-knob {
    transform: translateX(var(--tx)) scale(0.85) !important;
  }
`;

/* ─────────────────── SUB COMPONENTS ─────────────────── */

function BenefitCard({ title, desc, graphic }: { icon?: React.ReactNode; iconBg?: string; title: string; desc: string; graphic?: React.ReactNode }) {
  return (
    <div className="ticket-card">
      {/* Row 1: fixed-height top zone — h3 + p, always 190px */}
      <div className="card-top">
        <h3 className={fraunces.className} style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', margin: '0 0 8px' }}>
          {title}
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
          {desc}
        </p>
      </div>

      {/* Row 2: separator — always at the same Y in all cards */}
      <div className="ticket-separator"><div className="line" /></div>

      {/* Row 3: graphic bottom zone */}
      {graphic && <div className="card-bottom">{graphic}</div>}
    </div>
  );
}

function MockupDashboardCard() {
  return (
    <div className="ticket-card">
      {/* Row 1: fixed-height top zone — same 190px as BenefitCard */}
      <div className="card-top">
        <h3 className={fraunces.className} style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)', margin: '0 0 8px' }}>
          Suivi d'engagement en direct
        </h3>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
          Visualisez l'évolution de vos visites et les habitudes de vos meilleurs clients via un dashboard clair.
        </p>
      </div>

      {/* Row 2: separator — same Y position as other cards */}
      <div className="ticket-separator"><div className="line" /></div>

      {/* Row 3: SVG Dashboard Mockup */}
      <div className="card-bottom">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
             <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)' }} />
             <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink)' }}>Visites ce mois</span>
           </div>
           <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--red)' }}>+24%</span>
        </div>
        <svg viewBox="0 0 200 80" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          <line x1="0" y1="20" x2="200" y2="20" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="50" x2="200" y2="50" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="80" x2="200" y2="80" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--red)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--red)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 60 Q 30 40, 60 50 T 130 30 T 200 10 L 200 80 L 0 80 Z" fill="url(#chartGlow)" />
          <path d="M0 60 Q 30 40, 60 50 T 130 30 T 200 10" fill="none" stroke="var(--red)" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="60" cy="50" r="4" fill="#fff" stroke="var(--red)" strokeWidth="2.5" />
          <circle cx="130" cy="30" r="4" fill="#fff" stroke="var(--red)" strokeWidth="2.5" />
          <circle cx="200" cy="10" r="4" fill="#fff" stroke="var(--red)" strokeWidth="2.5" />
        </svg>
      </div>
    </div>
  );
}

function FaqCarouselCard({ icon, q, a }: { icon: React.ReactNode; q: string; a: string }) {
  return (
    <div 
      className="faq-carousel-card"
      style={{ 
        background: '#ffffff', 
        border: '1px solid rgba(0,0,0,0.06)', 
        borderRadius: 20, 
        padding: '22px 24px 20px', 
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03), 0 8px 20px rgba(0,0,0,0.06)',
      }}>
      <div 
        className="faq-icon-wrap" 
        style={{ 
          width: 52, 
          height: 52, 
          borderRadius: 14, 
          background: 'transparent',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          marginBottom: 14,
        }}>
        {icon}
      </div>
      
      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1C1C2E', margin: '0 0 8px', lineHeight: 1.35 }}>
        {q}
      </h3>
      <p style={{ fontSize: 13, color: '#8C7B73', lineHeight: 1.55, margin: 0 }}>
        {a}
      </p>
    </div>
  );
}

/* ─────────────────── SEGMENTED CONTROL ─────────────────── */
function SegmentedControl({ active, onChange }: { active: 'client' | 'merchant'; onChange: (v: 'client' | 'merchant') => void }) {
  const isClient = active === 'client';

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 28px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    borderRadius: 10,
    color: isActive ? 'var(--red)' : 'var(--ink-soft)',
    fontFamily: "'Inter', sans-serif",
    fontWeight: isActive ? 700 : 400,
    fontSize: 15,
    letterSpacing: isActive ? '-0.01em' : '0',
    transition: 'color 0.22s ease, font-weight 0.22s ease',
    userSelect: 'none',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      background: 'var(--card)',
      border: '1px solid var(--line)',
      borderRadius: 16,
      padding: '6px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 4px 16px rgba(195,31,60,0.04)',
      position: 'relative',
    }}>
      {/* Sliding pill cursor */}
      <div style={{
        position: 'absolute',
        top: 6,
        left: isClient ? 6 : 'calc(50% + 3px)',
        width: 'calc(50% - 9px)',
        bottom: 6,
        background: 'var(--coral-tint)',
        borderRadius: 10,
        border: '1px solid rgba(195,31,60,0.15)',
        transition: 'left 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
        pointerEvents: 'none',
      }} />

      {/* Client tab */}
      <button
        className={`label-interactive ${isClient ? 'active-label' : ''}`}
        onClick={() => onChange('client')}
        style={{ ...tabStyle(isClient), flex: 1 }}
        aria-pressed={isClient}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={isClient ? 2.5 : 2}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: -1 }}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        Je suis client
      </button>

      {/* Divider — only visible when neither is "at the edge" */}
      <div style={{
        width: 1,
        height: 20,
        background: 'var(--line)',
        opacity: 0.6,
        flexShrink: 0,
        transition: 'opacity 0.2s ease',
      }} />

      {/* Merchant tab */}
      <button
        className={`label-interactive ${!isClient ? 'active-label' : ''}`}
        onClick={() => onChange('merchant')}
        style={{ ...tabStyle(!isClient), flex: 1 }}
        aria-pressed={!isClient}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={!isClient ? 2.5 : 2}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: -1 }}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Je suis commerçant
      </button>
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */

export default function AvantagesPage() {
  const [activeTab, setActiveTab] = useState<'client' | 'merchant'>('client');
  const isClient = activeTab === 'client';
  const faqScrollRef = useRef<HTMLDivElement>(null);

  const scrollToSwitcher = (tab: 'client' | 'merchant') => {
    setActiveTab(tab);
    document.getElementById('switcher-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollFaq = (direction: 'left' | 'right') => {
    if (faqScrollRef.current) {
      const scrollAmount = 304; // 280px card + 24px gap
      faqScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <PublicNavbar />

      {/* ═══════════════════════════════════════
          HERO — 2-column layout (Peach Gradient)
      ═══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(145deg, #FBF0ED 0%, #F9E2DB 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '70vh',
        padding: '0 0px 0 140px',
        gap: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Concentric rings */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 480, height: 480, borderRadius: '50%', border: '1px solid rgba(191,33,18,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -50, right: -50, width: 330, height: 330, borderRadius: '50%', border: '1px solid rgba(191,33,18,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(191,33,18,0.07)', pointerEvents: 'none' }} />

        {/* ── LEFT ── */}
        <div style={{ flex: '0 0 auto', maxWidth: 500, zIndex: 10, padding: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 100, background: 'rgba(191,33,18,0.09)', border: '1px solid rgba(191,33,18,0.18)', marginBottom: 20 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#BF2112', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Clients & Commerçants</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(30px, 3.8vw, 48px)', fontWeight: 600, color: '#1C1C2E', lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>
              Des avantages sur mesure,<br />
              <span style={{ fontWeight: 800, color: '#BF2112' }}>pour chaque profil.</span>
            </h1>
          </div>

          <p style={{ fontSize: 16, lineHeight: 1.6, color: '#8C7B73', marginBottom: 24, maxWidth: 420 }}>
            Que vous soyez client fidèle ou commerçant partenaire, Retenza récompense chaque échange — sans friction, sans carte papier.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <Link href="/register/client" className="interactive-card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #D94030, #9E1A0A)', color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 8px 20px rgba(191,33,18,0.28)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Créer un compte gratuit
            </Link>
            <Link href="/register/merchant" className="interactive-card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: '#fff', border: '1.5px solid #E4DAD5', color: '#1C1C2E', fontWeight: 600, fontSize: 15, textDecoration: 'none', boxShadow: '0 3px 8px rgba(0,0,0,0.04)' }}>
              Devenir Partenaire →
            </Link>
          </div>
          <p style={{ fontSize: 13, color: '#8C7B73', margin: 0 }}>
            Programme 100 % gratuit pour les clients.{' '}
            <span style={{ color: '#BF2112', fontWeight: 700 }}>Aucune carte papier.</span>
          </p>
        </div>

        {/* ── RIGHT: floating phone mockup ── */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
        }}>
          {/* 1. Enhanced Decorative glow behind phone */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 280, height: 280, background: 'rgba(217,64,48,0.18)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 2, width: 320, height: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1)', transformOrigin: 'center center' }}>
            
            {/* Main Phone Wrapper (Animates up/down) */}
            <div style={{ animation: 'float-y 5s ease-in-out infinite', position: 'relative', zIndex: 10 }}>
              
              {/* Phone Chassis */}
              <div style={{ 
                width: 170, height: 340, 
                background: '#fff', 
                borderRadius: 36, 
                border: '6px solid #1C1C2E', 
                boxShadow: '15px 30px 60px rgba(191,33,18,0.2), inset 0 0 0 1px rgba(0,0,0,0.05)', 
                position: 'relative', 
                display: 'flex', 
                flexDirection: 'column', 
                transform: 'rotate(-4deg)' 
              }}>
                {/* Volume & Power buttons */}
                <div style={{ position: 'absolute', left: -8, top: 70, width: 2, height: 16, background: '#1C1C2E', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: -8, top: 100, width: 2, height: 32, background: '#1C1C2E', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: -8, top: 140, width: 2, height: 32, background: '#1C1C2E', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', right: -8, top: 110, width: 2, height: 40, background: '#1C1C2E', borderRadius: '0 2px 2px 0' }} />

                {/* Inner screen wrapper (for reflection and padding) */}
                <div style={{ position: 'relative', flex: 1, borderRadius: 28, overflow: 'hidden', padding: '12px 10px', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Glass Reflection */}
                  <div style={{ position: 'absolute', top: -50, left: -100, width: '200%', height: '150%', background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.45) 50%, transparent 55%)', pointerEvents: 'none', zIndex: 100 }} />

                  {/* Dynamic Island / Notch */}
                  <div style={{ width: 48, height: 14, background: '#1C1C2E', borderRadius: 10, position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', zIndex: 110 }} />
                  
                  {/* App Content */}
                  <div style={{ flex: 1, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, background: '#BF2112', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#1C1C2E', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Retenza</div>
                    </div>
                    
                    {/* Digital Card */}
                    <div style={{ background: 'linear-gradient(135deg, #D94030, #9E1A0A)', borderRadius: 12, padding: 12, color: '#fff' }}>
                      <div style={{ fontSize: 9, opacity: 0.8, marginBottom: 0 }}>Solde actuel</div>
                      <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 12 }}>1 250 <span style={{fontSize: 11, fontWeight: 500}}>pts</span></div>
                      
                      {/* Bar */}
                      <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.25)', borderRadius: 2 }}>
                         <div style={{ width: '65%', height: '100%', background: '#fff', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontSize: 8, marginTop: 6, opacity: 0.8 }}>Encore 250 pts pour un café</div>
                    </div>
                    
                    {/* QR Code Placeholder */}
                    <div style={{ background: '#fff', border: '1px solid #F0E9E4', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#1C1C2E' }}>Scanner pour cumuler</div>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1C1C2E" strokeWidth="1.5">
                         <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="6" y="6" width="1" height="1"/><rect x="17" y="6" width="1" height="1"/><rect x="6" y="17" width="1" height="1"/><rect x="14" y="14" width="3" height="3" rx="0.5"/><rect x="18" y="18" width="3" height="3" rx="0.5"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Satellite 1: Sparkle (Top Right) */}
            <div style={{ position: 'absolute', top: 30, right: 10, width: 44, height: 44, background: '#fff', borderRadius: '50%', boxShadow: '0 8px 24px rgba(191,33,18,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, animation: 'float-y 3.5s ease-in-out infinite 0.8s' }}>
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>

            {/* Satellite 2: Gift (Bottom Right) */}
            <div style={{ position: 'absolute', bottom: 70, right: -10, width: 50, height: 50, background: '#fff', borderRadius: '50%', boxShadow: '0 10px 28px rgba(191,33,18,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, animation: 'float-y 4s ease-in-out infinite 1.2s' }}>
               <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            </div>

            {/* Floating badge (Centered below the phone) */}
            <div style={{ 
              position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
              zIndex: 30, width: 'max-content'
            }}>
              <div style={{ 
                background: '#fff', 
                borderRadius: 100, 
                padding: '8px 16px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                boxShadow: '0 8px 24px rgba(191,33,18,0.12), 0 2px 8px rgba(191,33,18,0.04)',
                animation: 'float-y 4.5s ease-in-out infinite 0.4s'
              }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FCE7DD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1C1C2E', whiteSpace: 'nowrap' }}>
                  100% digital <span style={{ color: '#BF2112', fontWeight: 600 }}>— Aucune carte papier</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BANDE DE TRANSITION (Trust Strip)
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: 'clamp(44px, 5vw, 60px) clamp(24px, 6vw, 80px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-around', alignItems: 'flex-start', gap: 32 }}>

          {[
            {
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              ),
              title: 'Sans engagement',
              sub: 'Testez gratuitement, annulez à tout moment.',
            },
            {
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              ),
              title: 'Résultats visibles',
              sub: 'Suivez vos points et récompenses en temps réel.',
            },
            {
              svg: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              ),
              title: 'Support dédié',
              sub: 'Une équipe disponible pour vous accompagner.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="trust-strip-item"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 18, flex: 1, minWidth: 0 }}
            >
              <div
                className="trust-strip-icon"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'rgba(191,33,18,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'transform 0.25s ease, background 0.25s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(191,33,18,0.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(191,33,18,0.07)';
                }}
              >
                {item.svg}
              </div>
              <div style={{ maxWidth: 220 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1C1C2E', marginBottom: 6, lineHeight: 1.3 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#8C7B73', lineHeight: 1.55 }}>{item.sub}</div>
              </div>
            </div>
          ))}

        </div>
      </section>

      {/* ═══════════════════════════════════════
          SWITCHER + PANELS (Cream)
      ═══════════════════════════════════════ */}
      <section id="switcher-section" style={{ backgroundColor: 'var(--cream)', padding: 'clamp(40px, 5vw, 64px) clamp(24px, 6vw, 80px) clamp(64px, 8vw, 96px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: 12 }}>
              Ce que vous gagnez
            </div>
            <h2 className={fraunces.className} style={{ fontSize: 'clamp(36px, 5.5vw, 56px)', fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.025em', margin: '0', lineHeight: 1.05 }}>
              Le détail <span style={{ color: 'var(--red)' }}>des bénéfices</span>
            </h2>
          </div>

          <div style={{ width: '100%', marginBottom: 40 }}>
            <SegmentedControl active={activeTab} onChange={setActiveTab} />
          </div>

          <div key={activeTab} className="fade-in-tab">
            {/* PANEL CLIENTS */}
            <div role="tabpanel" id="panel-client" aria-labelledby="tab-client" hidden={!isClient}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'stretch' }}>
                {clientCards.map((c, i) => <BenefitCard key={i} {...c} />)}
              </div>
            </div>

            {/* PANEL COMMERÇANTS */}
            <div role="tabpanel" id="panel-merchant" aria-labelledby="tab-merchant" hidden={isClient}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'center', alignItems: 'stretch' }}>
                {merchantCards.map((c, i) => {
                  if (c.isVisual) {
                    return <MockupDashboardCard key={i} />;
                  }
                  return <BenefitCard key={i} title={c.title!} desc={c.desc!} graphic={c.graphic} />;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          BOUCLE VERTUEUSE — RED (repositioned before FAQ)
      ═══════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #C31F3C 0%, #7A1125 100%)', padding: '52px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes flow-pulse {
            0% { stroke-dashoffset: 24; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes spin-slow {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        
        {/* Richer Decorative background */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '30%', right: '20%', width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', right: '10%', width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 auto 10px' }}>
            Un réseau local qui se renforce{' '}
            <span style={{ color: 'rgba(255,200,190,0.9)', fontStyle: 'italic' }}>à chaque scan</span>
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: 460, margin: '0 auto 24px' }}>
            Plus de clients fidèles = plus de commerçants heureux = plus de récompenses pour tous.
          </p>

          {/* Circular 3-step diagram */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 300, margin: '48px auto 0', aspectRatio: '1 / 0.85', minHeight: 255 }}>
            
            {/* SVG Connecting Circle */}
            <svg viewBox="0 0 100 85" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="bvGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#FF9980" stopOpacity="0" />
                </linearGradient>
                <mask id="bvCutout">
                  <rect width="100" height="100" fill="white" />
                  {/* Exactly cut out the circles for the 3 icons so the line stops cleanly before hitting them */}
                  <circle cx="50" cy="15" r="11" fill="black" />
                  <circle cx="80.3" cy="67.5" r="11" fill="black" />
                  <circle cx="19.7" cy="67.5" r="11" fill="black" />
                </mask>
              </defs>
              
              <g mask="url(#bvCutout)">
                {/* Base dashed track */}
                <circle cx="50" cy="50" r="35" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                
                {/* Animated glowing track */}
                <circle 
                  cx="50" cy="50" r="35" 
                  fill="none" stroke="url(#bvGlow)" strokeWidth="3" 
                  strokeDasharray="80 200" strokeLinecap="round" 
                  vectorEffect="non-scaling-stroke" 
                  style={{ animation: 'spin-slow 3s linear infinite', transformOrigin: '50px 50px' }} 
                />
              </g>
            </svg>

            {/* Center Text & Icon */}
            <div style={{ position: 'absolute', top: '56%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 140, zIndex: 0 }}>
              <span style={{ display: 'inline-block', animation: 'spin-slow 6s linear infinite', color: 'rgba(255,200,190,0.9)', marginBottom: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </span>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: '0.02em', lineHeight: 1.2 }}>
                Le cycle se renforce à chaque scan
              </div>
            </div>

            {/* Node 1: Client (Top) */}
            <div style={{ position: 'absolute', top: '17.6%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100, zIndex: 2 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bvPhoneBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/><stop offset="100%" stopColor="#FFE0D6" stopOpacity="0.8"/></linearGradient>
                    <linearGradient id="bvPhoneScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4"/><stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1"/></linearGradient>
                    <linearGradient id="bvQrGlow" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFCCB3"/><stop offset="100%" stopColor="#FF9980"/></linearGradient>
                    <filter id="shadowPhone"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2"/></filter>
                  </defs>
                  <rect x="16" y="8" width="32" height="48" rx="6" fill="url(#bvPhoneBody)" filter="url(#shadowPhone)"/>
                  <rect x="19" y="12" width="26" height="38" rx="4" fill="url(#bvPhoneScreen)"/>
                  <rect x="26" y="10" width="12" height="3" rx="1.5" fill="rgba(180,50,30,0.3)"/>
                  <path d="M24 24 L24 20 L28 20" stroke="url(#bvQrGlow)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M40 24 L40 20 L36 20" stroke="url(#bvQrGlow)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M24 36 L24 40 L28 40" stroke="url(#bvQrGlow)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <path d="M40 36 L40 40 L36 40" stroke="url(#bvQrGlow)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                  <rect x="26" y="25" width="4" height="4" rx="1" fill="url(#bvQrGlow)"/>
                  <rect x="34" y="25" width="4" height="4" rx="1" fill="url(#bvQrGlow)"/>
                  <rect x="26" y="31" width="4" height="4" rx="1" fill="url(#bvQrGlow)"/>
                  <rect x="32" y="32" width="3" height="3" rx="1" fill="rgba(180,50,30,0.5)"/>
                  <rect x="23" y="28" width="18" height="2" fill="#FFCCB3" opacity="0.6"/>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 2, letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Client</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>scanne &amp; gagne</div>
            </div>

            {/* Node 2: Commerce (Bottom Right) */}
            <div style={{ position: 'absolute', top: '79.4%', left: '80.3%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100, zIndex: 2 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bvStoreBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/><stop offset="100%" stopColor="#FFE0D6" stopOpacity="0.8"/></linearGradient>
                    <linearGradient id="bvStoreRoof" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFCCB3"/><stop offset="100%" stopColor="#FF8866"/></linearGradient>
                    <linearGradient id="bvStoreWindow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(180,50,30,0.1)"/><stop offset="100%" stopColor="rgba(180,50,30,0.2)"/></linearGradient>
                    <filter id="shadowStore"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2"/></filter>
                  </defs>
                  <rect x="10" y="28" width="44" height="24" rx="4" fill="url(#bvStoreBody)" filter="url(#shadowStore)"/>
                  <rect x="44" y="32" width="6" height="20" rx="2" fill="rgba(220,120,90,0.4)"/>
                  <path d="M8 28 L14 14 L50 14 L56 28Z" fill="url(#bvStoreRoof)" filter="url(#shadowStore)"/>
                  <path d="M14 14 L20 28 L26 14 Z" fill="rgba(255,255,255,0.15)"/>
                  <path d="M26 14 L32 28 L38 14 Z" fill="rgba(255,255,255,0.15)"/>
                  <path d="M38 14 L44 28 L50 14 Z" fill="rgba(255,255,255,0.15)"/>
                  <rect x="28" y="36" width="10" height="16" rx="2" fill="rgba(180,50,30,0.35)"/>
                  <rect x="14" y="33" width="10" height="8" rx="1.5" fill="url(#bvStoreWindow)"/>
                  <rect x="40" y="33" width="8" height="8" rx="1.5" fill="url(#bvStoreWindow)"/>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 2, letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Commerce</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>fidélise &amp; grandit</div>
            </div>

            {/* Node 3: Récompense (Bottom Left) */}
            <div style={{ position: 'absolute', top: '79.4%', left: '19.7%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100, zIndex: 2 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6, boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.1)' }}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bvGiftTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFCCB3"/><stop offset="100%" stopColor="#FF8866"/></linearGradient>
                    <linearGradient id="bvGiftBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95"/><stop offset="100%" stopColor="#FFE0D6" stopOpacity="0.8"/></linearGradient>
                    <filter id="shadowGift"><feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2"/></filter>
                  </defs>
                  <rect x="10" y="24" width="44" height="10" rx="3" fill="url(#bvGiftTop)" filter="url(#shadowGift)"/>
                  <rect x="12" y="34" width="40" height="20" rx="2.5" fill="url(#bvGiftBody)" filter="url(#shadowGift)"/>
                  <rect x="42" y="34" width="7" height="20" rx="2" fill="rgba(220,120,90,0.4)"/>
                  <rect x="28" y="24" width="8" height="30" rx="1.5" fill="url(#bvGiftTop)" opacity="0.8"/>
                  <path d="M32 24 Q20 12 16 16 Q14 21 24 24Z" fill="#FF8866"/>
                  <path d="M32 24 Q44 12 48 16 Q50 21 40 24Z" fill="#FFCCB3"/>
                  <circle cx="32" cy="24" r="3.5" fill="#FF8866"/>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', marginBottom: 2, letterSpacing: '-0.01em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Récompense</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>offerte &amp; échangée</div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          QUESTIONS FRÉQUENTES (Global Section)
      ═══════════════════════════════════════ */}
      <section style={{ backgroundColor: '#FFFFFF', padding: 'clamp(32px, 4vw, 40px) clamp(24px, 6vw, 80px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 'clamp(32px, 5vw, 64px)', alignItems: 'flex-start' }}>
          
          {/* Left Block - Text */}
          <div style={{ flex: '1 1 340px', maxWidth: 460 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 100, border: '1px solid rgba(191,33,18,0.18)', background: 'rgba(191,33,18,0.04)', marginBottom: 16 }}>
               <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#BF2112' }}>Vos questions</span>
            </div>
            
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#1C1C2E', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 12 }}>
              Des réponses claires,<br/>
              <span style={{ color: '#BF2112', fontStyle: 'italic' }}>pour avancer sereinement.</span>
            </h2>
            
            <p style={{ fontSize: 16, color: '#8C7B73', lineHeight: 1.6, margin: 0 }}>
              Tout ce qu'il faut savoir sur l'utilisation et le fonctionnement de Retenza.
            </p>
          </div>

          {/* Right Block - Carousel */}
          <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'visible' }}>
            {/* Scrollable Container */}
            <div 
              ref={faqScrollRef}
              className="hide-scrollbar"
              style={{ 
                display: 'flex', 
                gap: 24, 
                overflowX: 'auto',
                overflowY: 'visible',
                paddingBottom: 32, 
                paddingTop: 12,
                paddingLeft: 2,
                paddingRight: 32,
                marginTop: -12,
                scrollBehavior: 'smooth',
                width: '100%'
              }}
            >
              {globalFaqs.map((f, i) => <FaqCarouselCard key={i} icon={f.icon} q={f.q} a={f.a} />)}
            </div>
          </div>
          
        </div>
      </section>


      {/* ═══════════════════════════════════════
          SPLIT CTA — immersive, "ou" divider
      ═══════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(145deg, #FBF6F3 0%, #FDF0EB 100%)', padding: 'clamp(44px, 5vw, 64px) clamp(24px, 6vw, 80px)', position: 'relative', overflow: 'hidden' }}>

        {/* Decorative BG — left curves (reduced opacity) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', opacity: 0.05, pointerEvents: 'none' }} viewBox="0 0 400 400" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M-40 60 Q120 140 80 240 Q40 330 200 370" stroke="#C31F3C" strokeWidth="1.5" fill="none"/>
          <path d="M20 30 Q180 110 140 210 Q100 310 260 350" stroke="#C31F3C" strokeWidth="1" fill="none"/>
        </svg>

        {/* Decorative BG — right dot grid (fewer dots) */}
        <svg style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '100%', opacity: 0.06, pointerEvents: 'none' }} viewBox="0 0 340 400" fill="none" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <circle key={`${row}-${col}`} cx={col * 56 + 28} cy={row * 64 + 32} r="2.5" fill="#C31F3C"/>
            ))
          )}
        </svg>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'stretch', gap: 0 }}>

          {/* ── LEFT: Client ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 clamp(12px, 3vw, 48px)' }}>

            {/* Icon with concentric halos */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'rgba(195,31,60,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'rgba(195,31,60,0.07)', pointerEvents: 'none' }} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(145deg, #FCE7DD 0%, #F5C5B0 100%)', border: '1.5px solid rgba(195,31,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 4px 16px rgba(195,31,60,0.12)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C31F3C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>

            {/* Connector dot + line */}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C31F3C' }} />
            <div style={{ width: 1, height: 18, background: 'linear-gradient(to bottom, #C31F3C, rgba(195,31,60,0.1))', marginBottom: 18 }} />

            {/* Title */}
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(22px, 2.6vw, 27px)', fontWeight: 800, color: '#1C1C2E', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Je suis <span style={{ color: '#C31F3C' }}>client</span>
            </h3>
            <div style={{ width: 32, height: 2.5, borderRadius: 2, background: '#C31F3C', marginBottom: 16 }} />

            <p style={{ fontSize: 14, color: '#8C7B73', lineHeight: 1.65, marginBottom: 20, maxWidth: 300 }}>
              Créez votre compte gratuitement et commencez à cumuler des points dès votre prochaine visite chez un partenaire.
            </p>

            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(195,31,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C31F3C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C2E' }}>0 € — <span style={{ color: '#C31F3C' }}>gratuit pour toujours</span></span>
            </div>

            {/* Button — outline */}
            <Link href="/register/client" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 100, border: '1.5px solid #C31F3C', color: '#C31F3C', fontWeight: 700, fontSize: 14, textDecoration: 'none', background: 'rgba(195,31,60,0.04)', letterSpacing: '-0.01em' }}>
              Créer mon compte client
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

          {/* ── CENTER DIVIDER ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, padding: '0 6px' }}>
            <div style={{ flex: 1, width: 1, borderLeft: '1.5px dashed rgba(195,31,60,0.2)' }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', border: '1.5px solid rgba(195,31,60,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(195,31,60,0.08)', margin: '12px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C31F3C' }}>ou</span>
            </div>
            <div style={{ flex: 1, width: 1, borderLeft: '1.5px dashed rgba(195,31,60,0.2)' }} />
          </div>

          {/* ── RIGHT: Merchant ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '0 clamp(12px, 3vw, 48px)' }}>

            {/* Icon with concentric halos — filled red */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'rgba(195,31,60,0.04)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', inset: -7, borderRadius: '50%', background: 'rgba(195,31,60,0.08)', pointerEvents: 'none' }} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(145deg, #C31F3C 0%, #7A1125 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 6px 22px rgba(195,31,60,0.3)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
            </div>

            {/* Connector dot + line */}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C31F3C' }} />
            <div style={{ width: 1, height: 18, background: 'linear-gradient(to bottom, #C31F3C, rgba(195,31,60,0.1))', marginBottom: 18 }} />

            {/* Title */}
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(22px, 2.6vw, 27px)', fontWeight: 800, color: '#1C1C2E', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Je suis <span style={{ color: '#C31F3C' }}>commerçant</span>
            </h3>
            <div style={{ width: 32, height: 2.5, borderRadius: 2, background: '#C31F3C', marginBottom: 16 }} />

            <p style={{ fontSize: 14, color: '#8C7B73', lineHeight: 1.65, marginBottom: 20, maxWidth: 300 }}>
              Lancez votre programme de fidélité en 10 minutes, sans engagement. Fidélisez vos clients et suivez vos résultats en temps réel.
            </p>

            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#C31F3C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C2E' }}>Accès <span style={{ color: '#C31F3C' }}>gratuit</span> pour démarrer</span>
            </div>

            {/* Button — filled */}
            <Link href="/register/merchant" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 24px', borderRadius: 100, background: 'linear-gradient(135deg, #C31F3C 0%, #7A1125 100%)', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none', boxShadow: '0 6px 20px rgba(195,31,60,0.28)', letterSpacing: '-0.01em' }}>
              Devenir partenaire Retenza
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </Link>
          </div>

        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER — LIGHT (same as home page)
      ═══════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#FFFFFF', padding: '80px 40px 40px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 1100, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 60, marginBottom: 80 }}>

          {/* Col 1 — Logo + description */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: '#D94030', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(217,64,48,0.2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                </svg>
              </div>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: '#1C1C2E', letterSpacing: '-0.02em' }}>Retenza Connect</span>
            </div>
            <p style={{ color: '#8C7B73', fontSize: 14, lineHeight: 1.7, maxWidth: 280, fontWeight: 300 }}>
              Redéfinissez votre expérience d&apos;achat. L&apos;excellence de la fidélité dans une interface pensée pour vous.
            </p>
          </div>

          {/* Col 2 — Découvrir */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Découvrir</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href="/" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Accueil</Link>
              <Link href="/avantages" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Nos Privilèges</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Le Fonctionnement</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Nos Partenaires</Link>
            </div>
          </div>

          {/* Col 3 — Informations */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Conditions Générales</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Confidentialité</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Mentions Légales</Link>
            </div>
          </div>

          {/* Col 4 — Contact */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <a href="mailto:contact@retenza.com" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>contact@retenza.com</a>
              <span style={{ color: '#8C7B73', fontSize: 14, fontWeight: 400 }}>+33 1 23 45 67 89</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ width: '100%', maxWidth: 1100, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 13, color: '#8C7B73', fontWeight: 300 }}>
            © {new Date().getFullYear()} <span style={{ color: '#1C1C2E', fontWeight: 500 }}>Retenza Connect.</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C7B73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8C7B73" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </div>
        </div>
      </footer>
    </div>
  );
}
