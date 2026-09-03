'use client';

import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 10));

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
        borderBottom: scrolled ? '1px solid #f0ece9' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
      }}
    >
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 40px',
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'linear-gradient(135deg, #E84C3D 0%, #C0291A 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(215,62,38,0.25)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 3"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 21, color: '#1a1a1a', letterSpacing: '-0.02em' }}>
            Retenza Connect
          </span>
        </Link>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="hidden lg:flex">
          {[
            { label: 'Accueil', active: true },
            { label: 'Avantages', active: false },
            { label: 'Comment ça marche', active: false },
            { label: 'Partenaires', active: false },
            { label: 'Contact', active: false },
          ].map((item) => (
            <span key={item.label} style={{ position: 'relative', cursor: 'pointer', paddingBottom: 6 }}>
              <span style={{
                fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 600,
                color: item.active ? '#D73E26' : '#374151',
                transition: 'color 0.2s',
              }}>
                {item.label}
              </span>
              {item.active && (
                <span style={{
                  position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 24, height: 3, borderRadius: 2, backgroundColor: '#D73E26',
                }} />
              )}
            </span>
          ))}
        </nav>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" className="hidden md:flex" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 12,
            border: '1.5px solid #e5e7eb', backgroundColor: '#fff',
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, color: '#374151',
            textDecoration: 'none', transition: 'all 0.2s',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Se connecter
          </Link>
          <Link href="/register" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 22px', borderRadius: 12,
            backgroundColor: '#D73E26', color: '#fff',
            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
            textDecoration: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(215,62,38,0.3)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            Créer un compte
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
