'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Store, ArrowLeft, Star } from 'lucide-react';
import PublicNavbar from '@/components/landing/PublicNavbar';

export default function RegisterChoiceScreen() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#FBF0ED', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <PublicNavbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          flex: '0 0 52%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 72px 60px 100px',
        }}>

          {/* Heading */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(32px, 3.5vw, 50px)',
              fontWeight: 600, color: '#1C1C2E',
              lineHeight: 1.1, letterSpacing: '-0.03em',
            }}>Créez votre</div>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(32px, 3.5vw, 50px)',
              fontWeight: 800, color: '#BF2112',
              lineHeight: 1.1, letterSpacing: '-0.03em',
            }}>compte Retenza</div>
          </div>

          <p style={{ fontSize: 15, color: '#8C7B73', lineHeight: 1.65, marginBottom: 36, maxWidth: 380 }}>
            Choisissez le profil qui vous correspond. Rejoignez des milliers d'utilisateurs qui profitent déjà de la fidélité réinventée.
          </p>

          {/* Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Client */}
            <div
              onClick={() => router.push('/register/client')}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '20px 24px',
                border: '1.5px solid #EDE5DF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#BF2112';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(191,33,18,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#EDE5DF';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #D94030, #9E1A0A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(191,33,18,0.3)',
              }}>
                <User size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1C1C2E', marginBottom: 2 }}>
                  Je suis un Client
                </div>
                <div style={{ fontSize: 13, color: '#8C7B73', lineHeight: 1.5 }}>
                  Points, récompenses &amp; avantages exclusifs dans mes commerces favoris.
                </div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: '#FDF4EF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>

            {/* Merchant */}
            <div
              onClick={() => router.push('/register/merchant')}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '20px 24px',
                border: '1.5px solid #EDE5DF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                transition: 'all 0.25s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#1C1C2E';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(28,28,46,0.10)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#EDE5DF';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'linear-gradient(135deg, #2C3E6B, #1C1C2E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 14px rgba(28,28,46,0.25)',
              }}>
                <Store size={20} color="#fff" strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: '#1C1C2E', marginBottom: 2 }}>
                  Je suis un Commerçant
                </div>
                <div style={{ fontSize: 13, color: '#8C7B73', lineHeight: 1.5 }}>
                  Programme de fidélité sur mesure pour développer ma clientèle.
                </div>
              </div>
              <div style={{
                width: 34, height: 34, borderRadius: 11,
                background: '#F0F2F7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1C1C2E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
          </div>

          <p style={{ marginTop: 28, fontSize: 14, color: '#8C7B73' }}>
            Vous avez déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#BF2112', fontWeight: 700, textDecoration: 'none' }}>
              Se connecter →
            </Link>
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1,
          background: 'transparent',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <img
            src="/box.png"
            alt="Votre compte vous attend"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
            }}
          />
        </div>

      </div>
    </div>
  );
}
