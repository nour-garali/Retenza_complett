'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ══════════════════════════
          NAV
      ══════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255, 255, 255, 0.95)', // <-- Rendu blanc
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #F3F4F6', // Bordure plus douce pour le fond blanc
        padding: '12px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/welcome_logo.png" alt="Logo" style={{ width: 40, height: 40 }} />
          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800, fontSize: 20, color: '#1C1C2E',
          }}>Retenza Connect</span>
        </div>

        <div style={{ display: 'flex', gap: 32 }} className="hidden lg:flex">
          {[
            { label: 'Accueil', active: true },
            { label: 'Avantages', active: false },
            { label: 'Comment ça marche', active: false },
            { label: 'Partenaires', active: false },
            { label: 'Contact', active: false },
          ].map(item => (
            <span key={item.label} style={{
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              color: item.active ? '#BF2112' : '#374151',
              borderBottom: item.active ? '2.5px solid #BF2112' : 'none',
              paddingBottom: 2,
            }}>{item.label}</span>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{
            padding: '10px 20px', borderRadius: 12,
            border: '1.5px solid #E4DAD5', background: '#fff',
            color: '#1C1C2E', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            Se connecter
          </Link>
          <Link href="/register" style={{
            padding: '10px 20px', borderRadius: 12,
            background: 'linear-gradient(135deg, #D94030, #9E1A0A)',
            color: '#fff', fontWeight: 700, fontSize: 14,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(191,33,18,0.28)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════
          HERO — Two columns
          Background: EXACT COLOR CODE FROM HERO-CARD-CLEAN
          Image: mix-blend-mode: darken to blend its background seamlessly
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FBF0ED', // <-- Le code couleur de fond exact de hero-card-clean.png
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '70vh', // <-- Diminution de la hauteur (de 88vh à 70vh)
        padding: '0 0px 0 140px', // <-- Augmentation du padding gauche (de 60px à 140px)
        gap: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* Ombre des arbres à GAUCHE (comme dans l'exemple) */}
        <img
          src="/tree-shadows.png"
          alt="Ombre"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0, 
            height: '100%', 
            mixBlendMode: 'darken',
            zIndex: 1, 
            opacity: 0.9,
            pointerEvents: 'none',
          }}
        />

        {/* ── LEFT: Text content ── */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: '0 0 auto', maxWidth: 520, zIndex: 10 }}
        >
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '7px 16px', borderRadius: 100,
            background: 'rgba(191,33,18,0.09)',
            border: '1px solid rgba(191,33,18,0.18)',
            marginBottom: 28,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BF2112" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
              <line x1="12" y1="22" x2="12" y2="7"/>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#BF2112' }}>
              Fidélité • Avantages • Récompenses
            </span>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(38px, 4.5vw, 62px)',
              fontWeight: 600, color: '#1C1C2E',
              lineHeight: 1.08, letterSpacing: '-0.03em',
            }}>La fidélité</div>
            <div style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(38px, 4.5vw, 62px)',
              fontWeight: 800, color: '#BF2112',
              lineHeight: 1.08, letterSpacing: '-0.03em',
            }}>récompensée</div>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 17, lineHeight: 1.65, color: '#8C7B73',
            marginBottom: 32, maxWidth: 420,
          }}>
            Cumulez des points, débloquez des avantages<br />
            et restez fidèle à ce qui vous inspire.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
            <Link href="/login" style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '14px 26px', borderRadius: 14,
              background: 'linear-gradient(135deg, #D94030, #9E1A0A)',
              color: '#fff', fontWeight: 600, fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 8px 20px rgba(191,33,18,0.28)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Se connecter
            </Link>
            <Link href="/register" style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '14px 26px', borderRadius: 14,
              background: '#fff', border: '1.5px solid #E4DAD5',
              color: '#1C1C2E', fontWeight: 600, fontSize: 16,
              textDecoration: 'none',
              boxShadow: '0 3px 8px rgba(0,0,0,0.04)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              Créer un compte
            </Link>
          </div>

          {/* Partner link */}
          <Link href="/register/merchant" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#8C7B73', fontSize: 14, textDecoration: 'none',
          }}>
            Vous avez un commerce ?{' '}
            <span style={{ color: '#BF2112', fontWeight: 700 }}>
              Devenir Partenaire Retenza →
            </span>
          </Link>
        </motion.div>

        {/* ── RIGHT: Card 3D image ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* L'astuce magique : mixBlendMode: 'darken' permet à l'image 
              de fusionner PARFAITEMENT avec notre couleur de fond #FBF0ED */}
          <motion.img
            src="/hero-card-clean.png"
            alt="Carte de fidélité Retenza Connect 3D"
            style={{
              width: '100%',
              maxWidth: 700,
              display: 'block',
              mixBlendMode: 'darken', // <--- LA SOLUTION POUR UN FOND UNIFORME SANS BORDURE
              marginLeft: '50px', // <--- Décalage vers la droite demandé
              zIndex: 2,
            }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FFFFFF',
        padding: '60px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        borderTop: '1px solid rgba(0,0,0,0.04)',
      }}>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(40px, 10vw, 180px)', // <-- Espace augmenté ici (responsive)
          flexWrap: 'wrap',
          maxWidth: 1200,
          width: '100%',
          marginBottom: 60,
        }}>
          {/* Feature 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: '#FDF4EF', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C02112" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1C2E', marginBottom: 4 }}>
                Avantages exclusifs
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, maxWidth: 160 }}>
                Profitez d'offres rien<br/>que pour vous.
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: '#FDF4EF', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C02112" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="14" rx="2" ry="2"/>
                <line x1="12" y1="8" x2="12" y2="22"/>
                <path d="M12 8V4.5A2.5 2.5 0 0 0 9.5 2h-1A2.5 2.5 0 0 0 6 4.5V8"/>
                <path d="M12 8V4.5A2.5 2.5 0 0 1 14.5 2h1A2.5 2.5 0 0 1 18 4.5V8"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1C2E', marginBottom: 4 }}>
                Récompenses
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, maxWidth: 160 }}>
                Cumulez des points<br/>et gagnez plus.
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              backgroundColor: '#FDF4EF', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C02112" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1C2E', marginBottom: 4 }}>
                100% Sécurisé
              </div>
              <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.5, maxWidth: 160 }}>
                Vos données sont<br/>protégées.
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════════
          L'EXPÉRIENCE RETENZA — ELEGANT SHOWCASE
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FCF8F7', // Soft tint to separate from the white section above
        padding: '120px 40px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle decorative background element */}
        <div style={{
          position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
          width: 800, height: 800, background: 'radial-gradient(circle, rgba(191,33,18,0.03) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 1200, width: '100%', zIndex: 1 }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                display: 'inline-block',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#BF2112',
                marginBottom: 20,
              }}
            >
              L'expérience Retenza
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 800, color: '#1C1C2E',
                letterSpacing: '-0.03em', lineHeight: 1.1,
                margin: 0,
              }}
            >
              Le pouvoir de la fidélité,<br />
              <span style={{ color: '#BF2112', fontStyle: 'italic', fontWeight: 700 }}>réinventé pour vous.</span>
            </motion.h2>
          </div>

          {/* 3 Floating Features */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 'clamp(40px, 6vw, 80px)',
          }}>
            {[
              {
                title: "Scan Rapide",
                desc: "Présentez votre QR code en caisse pour cumuler vos points instantanément et en toute sécurité.",
                img: "/feature_scan_3d.png",
                delay: 0.1
              },
              {
                title: "Catalogue Exclusif",
                desc: "Accédez à des centaines d'offres et transformez vos points en expériences mémorables.",
                img: "/feature_gift_3d.png",
                delay: 0.2
              },
              {
                title: "Suivi en Direct",
                desc: "Gardez un œil sur votre solde de points et vos économies directement depuis l'application.",
                img: "/feature_wallet_3d.png",
                delay: 0.3
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: feature.delay, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  flex: '1 1 300px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  maxWidth: 360,
                }}
              >
                <motion.div
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{
                    height: 220, width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 30, position: 'relative'
                  }}
                >
                  <div style={{
                    position: 'absolute', width: 140, height: 140,
                    backgroundColor: 'rgba(191, 33, 18, 0.05)',
                    borderRadius: '50%', filter: 'blur(30px)',
                    zIndex: 0
                  }} />
                  <img
                    src={feature.img}
                    alt={feature.title}
                    style={{
                      maxHeight: '100%', maxWidth: '100%', objectFit: 'contain',
                      zIndex: 1, filter: 'drop-shadow(0 24px 32px rgba(191,33,18,0.12))'
                    }}
                  />
                </motion.div>
                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#1C1C2E', marginBottom: 12, letterSpacing: '-0.02em' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 16, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMMENT ÇA MARCHE — Red Banner with 4 steps
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #C41E0A 0%, #8B0000 100%)',
        padding: '64px 60px',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Subtle wave decoration */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '60px',
          flexWrap: 'wrap',
          zIndex: 1, position: 'relative',
        }}>
          {/* LEFT: Title block */}
          <div style={{ flex: '0 0 260px', color: '#FFF' }}>
            <div style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 100, padding: '5px 14px', marginBottom: 20,
            }}>
              COMMENT ÇA MARCHE ?
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(26px, 3vw, 38px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
              marginBottom: 20,
              letterSpacing: '-0.02em',
            }}>
              C&apos;est simple, rapide<br/>et <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)' }}>avantageux.</span>
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, maxWidth: 240 }}>
              Retenza Connect vous simplifie la fidélité en quelques étapes seulement.
            </p>
          </div>

          {/* RIGHT: 4 steps with dashed arrows */}
          <div style={{
            flex: '1 1 600px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            {[
              {
                num: 1,
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C41E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                ),
                title: 'Créez votre compte',
                desc: 'Inscrivez-vous gratuitement en quelques secondes.',
              },
              {
                num: 2,
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C41E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                ),
                title: 'Faites vos achats',
                desc: 'Effectuez vos achats chez nos partenaires.',
              },
              {
                num: 3,
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C41E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                ),
                title: 'Cumulez des points',
                desc: 'Gagnez des points à chaque transaction.',
              },
              {
                num: 4,
                icon: (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C41E0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                  </svg>
                ),
                title: 'Échangez & profitez',
                desc: 'Échangez vos points contre des récompenses exclusives.',
              },
            ].map((step, idx, arr) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                {/* Step card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                  {/* Circle icon with number badge */}
                  <div style={{ position: 'relative', marginBottom: 18 }}>
                    <div style={{
                      width: 72, height: 72, borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}>
                      {step.icon}
                    </div>
                    {/* Number badge */}
                    <div style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 22, height: 22, borderRadius: '50%',
                      backgroundColor: '#C41E0A',
                      border: '2.5px solid #FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#FFF',
                    }}>{step.num}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 8, lineHeight: 1.3 }}>{step.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>

                {/* Dashed arrow between steps */}
                {idx < arr.length - 1 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    paddingTop: 28, flexShrink: 0, width: 40,
                  }}>
                    <svg width="36" height="16" viewBox="0 0 36 16" fill="none">
                      <path d="M0 8 H28" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeDasharray="4 3"/>
                      <path d="M26 4 L34 8 L26 12" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          APP PROMO - REFINED & ELEGANT
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FFFFFF',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'center',
        borderTop: '1px solid rgba(0,0,0,0.02)',
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '60px',
          flexWrap: 'wrap',
        }}>
          {/* LEFT: Text Content */}
          <div style={{
            flex: '1 1 450px',
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
          }}>
            <div style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#BF2112',
              marginBottom: 24,
              padding: '8px 16px',
              backgroundColor: '#FDF4EF',
              borderRadius: 100,
            }}>
              L'expérience mobile
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 400,
              color: '#1C1C2E',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              marginBottom: 32,
            }}>
              Vos privilèges,<br/>
              <span style={{ color: '#BF2112', fontWeight: 600, fontStyle: 'italic' }}>toujours à portée de main.</span>
            </h2>
            <p style={{ 
              fontSize: 18, 
              color: '#8C7B73', 
              maxWidth: 540, 
              marginBottom: 40, 
              lineHeight: 1.6,
              fontWeight: 300,
            }}>
              Une interface épurée pour suivre vos récompenses, découvrir des lieux d'exception et simplifier chacun de vos paiements.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button style={{
                padding: '16px 32px', borderRadius: 100,
                backgroundColor: '#1C1C2E', color: '#FFF',
                border: 'none', fontWeight: 500, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(28,28,46,0.15)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                App Store
              </button>
              <button style={{
                padding: '16px 32px', borderRadius: 100,
                backgroundColor: '#FFFFFF', color: '#1C1C2E',
                border: '1px solid rgba(0,0,0,0.1)', fontWeight: 500, fontSize: 16,
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                transition: 'background 0.2s ease',
              }}>
                <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor"><path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/></svg>
                Google Play
              </button>
            </div>
          </div>

          {/* RIGHT: Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: '1 1 450px', display: 'flex', justifyContent: 'center' }}
          >
            <img 
              src="/app-mockup.png" 
              alt="Application mobile Retenza Connect" 
              style={{ 
                width: '100%', 
                maxWidth: 500, 
                display: 'block', 
                objectFit: 'contain',
                mixBlendMode: 'multiply'
              }} 
            />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS — Minimalist version (After Mobile App)
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#1E1E28',
        padding: '70px 40px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: 1000, width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '40px 20px',
        }}>
          {[
            { value: '25 000+', label: 'Clients satisfaits' },
            { value: '320+', label: 'Commerces partenaires' },
            { value: '950K+', label: 'Points distribués' },
            { value: '99,9%', label: 'Transactions sécurisées' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{
                flex: '1 1 180px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontSize: 'clamp(36px, 4vw, 48px)',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.03em',
                lineHeight: 1,
                marginBottom: 12,
              }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: '#A0A0AB', fontWeight: 400 }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════
          VOS RÉCOMPENSES PRENNENT VIE — Red Banner
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #C41E0A 0%, #8B0000 100%)',
        padding: '40px 40px',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 60, flexWrap: 'wrap', zIndex: 1, position: 'relative',
        }}>
          {/* LEFT: Integrated visual avec fond transparent */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <img
              src="/section5.png"
              alt="Application Retenza — récompenses et fidélité"
              style={{
                maxWidth: 440,
                width: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </motion.div>

          {/* RIGHT: Text + features */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            style={{ flex: '1 1 400px', color: '#FFFFFF' }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
              POURQUOI CHOISIR RETENZA ?
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(32px, 4vw, 52px)',
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 20,
              color: '#FFFFFF',
            }}>
              Vos récompenses<br/>prennent vie
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 48, maxWidth: 460 }}>
              Transformez chacun de vos achats en expériences inoubliables et profitez d'avantages uniques.
            </p>

            {/* 3 features in grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
              {[
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  ),
                  label: 'Offres personnalisées',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                  ),
                  label: 'Des récompenses actives',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                  label: 'Des partenaires de confiance',
                },
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                    {feat.icon}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{feat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS — Ils nous font confiance
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'radial-gradient(ellipse at center, #FFFFFF 0%, #FFF3F0 100%)',
        padding: '100px 40px',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 60,
          flexWrap: 'wrap',
        }}>
          {/* Left Block */}
          <div style={{ flex: '1 1 300px', maxWidth: 400 }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#FEF1EF', color: '#BF2112',
              padding: '6px 14px', borderRadius: 6,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Ils nous font confiance
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(32px, 4vw, 46px)',
              fontWeight: 800, color: '#1C1C2E',
              letterSpacing: '-0.02em', lineHeight: 1.1,
              marginTop: 20, marginBottom: 20,
            }}>
              Des commerçants <br />
              <span style={{ color: '#BF2112' }}>satisfaits</span>
            </h2>
            <p style={{ color: '#6B7280', fontSize: 15, lineHeight: 1.6, maxWidth: 360, margin: 0 }}>
              Rejoignez des centaines de commerces qui ont déjà transformé leur relation client avec Retenza Connect.
            </p>

            {/* Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 40 }}>
              <button style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <button style={{
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: '#BF2112', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(191,33,18,0.3)'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
              <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#BF2112' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#D1D5DB' }} />
              </div>
            </div>
          </div>

          {/* Right Block - Cards */}
          <div style={{
            flex: '2 1 600px',
            display: 'flex',
            flexWrap: 'nowrap',
            overflowX: 'auto',
            gap: 24,
            paddingBottom: 40,
            WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
            scrollbarWidth: 'none', // Firefox hide scrollbar
            msOverflowStyle: 'none', // IE/Edge hide scrollbar
          }}>
            <style>{`
              /* Hide scrollbar for Chrome/Safari/Webkit */
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {[
              {
                name: "Karim B.", role: "Gérant de restaurant", img: "/avatar_karim.png",
                quote: "Avec Retenza Connect, nous avons augmenté nos visites de 30% en seulement 3 mois ! Nos clients adorent la carte dans leur wallet.",
                highlightTop: "+30%", highlightBottom: "de visites", delay: 0.1
              },
              {
                name: "Sofia A.", role: "Boutique de mode", img: "/avatar_sofia.png",
                quote: "La carte digitale est un vrai plus, mes clientes l'adorent ! Le suivi est simple et les récompenses motivantes.",
                highlightTop: "+250", highlightBottom: "nouvelles clientes", delay: 0.2
              },
              {
                name: "Mehdi R.", role: "Salon de coiffure", img: "/avatar_mehdi.png",
                quote: "Le tableau de bord est clair et complet. Je peux suivre mon activité et mes clients facilement.",
                highlightTop: "+40%", highlightBottom: "clients fidèles", delay: 0.3
              }
            ].map((testi, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: testi.delay }}
                style={{
                  minWidth: 320,
                  maxWidth: 320,
                  flex: '0 0 auto',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Header: Avatar + Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <img src={testi.img} alt={testi.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', backgroundColor: '#F3F4F6' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#1C1C2E' }}>{testi.name}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{testi.role}</div>
                  </div>
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#BF2112" stroke="#BF2112" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  ))}
                </div>

                {/* Quote */}
                <div style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.6, flexGrow: 1, position: 'relative' }}>
                  <span style={{ color: '#BF2112', fontWeight: 900, fontFamily: 'serif', fontSize: 18, marginRight: 4 }}>“</span>
                  {testi.quote}
                </div>

                {/* Highlight Badge */}
                <div style={{
                  alignSelf: 'flex-end',
                  backgroundColor: '#FEF1EF',
                  padding: '8px 16px',
                  borderRadius: 12,
                  textAlign: 'center',
                  marginTop: 20
                }}>
                  <div style={{ color: '#BF2112', fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>{testi.highlightTop}</div>
                  <div style={{ color: '#BF2112', fontSize: 10, fontWeight: 600 }}>{testi.highlightBottom}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          POURQUOI CHOISIR (B2B STATS) — Horizontal Thin Style
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#121217',
        padding: '60px 40px',
        display: 'flex',
        justifyContent: 'center',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}>
        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0,
        }}>
          {/* Left Title */}
          <div style={{
            flex: '1 1 300px',
            paddingRight: 40,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(28px, 3.5vw, 36px)',
              fontWeight: 800, color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              marginBottom: 16,
            }}>
              Pourquoi choisir<br/>
              <span style={{ color: '#BF2112' }}>Retenza Connect ?</span>
            </h2>
            <div style={{ width: 40, height: 3, backgroundColor: '#BF2112', borderRadius: 2 }} />
          </div>

          {/* Right Stats Row */}
          <div style={{
            flex: '3 1 700px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'nowrap',
          }}>
            {[
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                value: '98%',
                valueColor: '#BF2112',
                label: 'de clients conservent\nleur carte digitale'
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
                value: '+35%',
                valueColor: '#FFFFFF',
                label: 'de clients récurrents\nen moyenne'
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                value: '-70%',
                valueColor: '#BF2112',
                label: 'de temps consacré\nà la gestion'
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
                value: '100%',
                valueColor: '#FFFFFF',
                label: 'sécurisé et conforme\nRGPD'
              }
            ].map((stat, i) => (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    padding: '0 10px',
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    backgroundColor: '#1E1E28',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#BF2112', marginBottom: 20,
                  }}>
                    {stat.icon}
                  </div>
                  <div style={{
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    fontSize: 'clamp(32px, 3.5vw, 42px)', fontWeight: 800, color: stat.valueColor,
                    letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 12
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ width: 20, height: 3, backgroundColor: '#BF2112', borderRadius: 2, marginBottom: 16 }} />
                  <div style={{ fontSize: 13, color: '#A0A0AB', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {stat.label}
                  </div>
                </motion.div>
                
                {/* Vertical Divider (except for last) */}
                {i < 3 && (
                  <div style={{ width: 1, height: 120, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          COMMERCES — Adapté à tous les commerces
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FCF8F7', // Very subtle warm tint from the image
        padding: '100px 40px',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          maxWidth: 1200, width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 60,
          flexWrap: 'wrap',
        }}>
          {/* Left Text Block */}
          <div style={{ flex: '1 1 300px', maxWidth: 460 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: '#FEF1EF', color: '#D92D20',
              padding: '6px 14px', borderRadius: 100,
              fontSize: 13, fontWeight: 600,
              marginBottom: 20,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Adapté à tous les commerces
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(28px, 3vw, 36px)',
              fontWeight: 800, color: '#111827',
              letterSpacing: '-0.02em', lineHeight: 1.15,
              margin: 0,
            }}>
              Une solution pour tous les commerces de proximité
            </h2>
          </div>

          {/* Right Cards Scroll/Flex */}
          <div style={{
            flex: '2 1 600px',
            display: 'flex',
            gap: 20,
            position: 'relative',
            padding: '20px 0',
          }}>
            {/* Dotted connection line behind the cards */}
            <div style={{
              position: 'absolute',
              top: '50%', left: 0, right: 0,
              height: 2,
              borderTop: '2px dashed rgba(217,45,32,0.15)',
              transform: 'translateY(-50%)',
              zIndex: 0,
            }} />

            {[
              { title: 'Restaurants', img: '/restaurant_3d_icon.png' },
              { title: 'Boutiques', img: '/boutique_3d_icon.png' },
              { title: 'Salons de coiffure', img: '/salon_3d_icon.png' },
              { title: 'Cafés & Bars', img: '/cafe_3d_icon.png' },
              { title: 'Instituts & Bien-être', img: '/spa_3d_icon.png' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  flex: '1 0 140px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: '20px 10px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                  zIndex: 1,
                  textAlign: 'center',
                }}
              >
                <div style={{ height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <img src={item.img} alt={item.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{item.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          PARTENAIRES — Ils nous font confiance
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        backgroundColor: '#FFFFFF',
        padding: '80px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1100, width: '100%',
        }}>
          {/* Header row: Centered title, arrows on the right */}
          <div style={{ position: 'relative', textAlign: 'center', marginBottom: 52 }}>
            <div style={{
              display: 'inline-block',
              fontSize: 12, fontWeight: 700,
              color: '#D92D20', backgroundColor: '#FEF3F2',
              padding: '6px 16px', borderRadius: 100,
              marginBottom: 20,
            }}>
              Nos partenaires
            </div>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 800, color: '#1C1C2E',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              margin: 0,
            }}>
              Des partenaires qui <span style={{ color: '#D92D20' }}>grandissent avec nous.</span>
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', marginTop: 16, fontWeight: 400, lineHeight: 1.6 }}>
              De grandes enseignes nous font confiance pour booster leur<br/>activité et fidéliser leurs clients grâce à Retenza Connect.
            </p>

          </div>

          {/* Partners logo row with arrows */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            width: '100%',
          }}>
            {/* Left Arrow */}
            <button style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: 'none', backgroundColor: '#FEF3F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
            }} className="hidden md:flex">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D92D20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            {/* Logos container */}
            <div style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'nowrap',
              overflowX: 'auto',
              flexGrow: 1,
              paddingBottom: 20,
              marginBottom: -20, // counteract padding
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}>
              <style>{`div::-webkit-scrollbar { display: none; }`}</style>
              {[
              {
                name: 'Carrefour',
                logo: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 17, color: '#374151', letterSpacing: '-0.02em', fontFamily: 'serif' }}>Carrefour</span>
                    <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                      <path d="M20 0C8.95 0 0 8.95 0 20s8.95 20 20 20 20-8.95 20-20S31.05 0 20 0zm0 36c-8.84 0-16-7.16-16-16S11.16 4 20 4s16 7.16 16 16-7.16 16-16 16z" fill="#374151"/>
                      <path d="M22.5 10c-3.3 0-6.1 1.9-7.5 4.7L18 20l-3 5.3C16.4 28.1 19.2 30 22.5 30 28.3 30 33 25.3 33 19.5S28.3 10 22.5 10zm0 16c-1.8 0-3.3-1.1-4.1-2.6l2.3-4.1-2.3-4.1c.8-1.5 2.3-2.6 4.1-2.6 2.8 0 5 2.2 5 5s-2.2 5-5 5z" fill="#374151"/>
                    </svg>
                  </div>
                ),
              },
              {
                name: 'MONOPRIX',
                logo: (
                  <span style={{ fontWeight: 400, fontSize: 18, color: '#374151', letterSpacing: '0.06em', fontFamily: 'serif' }}>MONOPRIX</span>
                ),
              },
              {
                name: 'Tunisair',
                logo: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                      <ellipse cx="20" cy="20" rx="18" ry="10" fill="#374151" transform="rotate(-30 20 20)"/>
                      <ellipse cx="20" cy="20" rx="8" ry="18" fill="#FFFFFF"/>
                    </svg>
                    <div style={{ textAlign: 'left', color: '#374151' }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', lineHeight: 1, textAlign: 'right' }}>الخطوط التونسية</div>
                      <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: '0.04em' }}>TUNISAIR</div>
                    </div>
                  </div>
                ),
              },
              {
                name: 'CHANCE',
                logo: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><circle cx="12" cy="12" r="8"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textAlign: 'right' }}>شاس</div>
                      <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>CHANCE</div>
                    </div>
                  </div>
                ),
              },
              {
                name: 'Hannibal Lease',
                logo: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#374151' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      backgroundColor: '#374151', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em',
                    }}>HL</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.1 }}>Hannibal</div>
                      <div style={{ fontWeight: 400, fontSize: 13 }}>Lease</div>
                    </div>
                  </div>
                ),
              },
              {
                name: 'Magasin Général',
                logo: (
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#374151', lineHeight: 1.1, textAlign: 'left', display: 'inline-block' }}>
                    magasin<br/><span style={{ fontWeight: 400 }}>général</span>
                  </span>
                ),
              },
            ].map((partner, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{
                  flex: '1 1 160px',
                  padding: '22px 28px',
                  borderRadius: 18,
                  border: '1.5px solid #F3F4F6',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                  minHeight: 80,
                  cursor: 'default',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                }}
              >
                {partner.logo}
              </motion.div>
            ))}
            </div>

            {/* Right Arrow */}
            <button style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
              border: 'none', backgroundColor: '#D92D20',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 4px 14px rgba(217, 45, 32, 0.3)',
            }} className="hidden md:flex">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </section>




      {/* ══════════════════════════════════════════════════════════
          CTA FINAL — Prêt à être récompensé ?
      ══════════════════════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #C41E0A 0%, #8B0000 100%)',
        padding: '100px 40px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 350, height: 350, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div style={{
          maxWidth: 1100, width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 60, flexWrap: 'wrap',
          zIndex: 1, position: 'relative',
        }}>
          {/* LEFT: Text */}
          <div style={{ flex: '1 1 400px', color: '#FFF' }}>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 24,
              letterSpacing: '-0.03em',
            }}>
              Prêt à être<br/>récompensé ?
            </h2>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, marginBottom: 48, maxWidth: 480 }}>
              Rejoignez Retenza Connect et profitez de privilèges exclusifs. Inscription gratuite et immédiate.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Link href="/register" style={{
                padding: '18px 40px', borderRadius: 100,
                backgroundColor: '#FFFFFF', color: '#BF2112',
                fontWeight: 800, fontSize: 16,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s ease',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Créer un compte gratuit →
              </Link>
              <Link href="/login" style={{
                padding: '18px 40px', borderRadius: 100,
                backgroundColor: 'transparent', color: '#FFFFFF',
                fontWeight: 600, fontSize: 16,
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10,
                border: '2px solid rgba(255,255,255,0.4)',
              }}>
                En savoir plus
              </Link>
            </div>
          </div>

          {/* RIGHT: Card mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
            whileInView={{ opacity: 1, scale: 1, rotate: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}
          >
            <div style={{
              width: 320, height: 200, borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.08) 100%)',
              border: '1px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)',
              padding: '28px 32px',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
              color: '#FFF',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>CARTE DE FIDÉLITÉ</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20 }}>Retenza Connect</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 2H3v16h5l3 3 3-3h7V2z"/></svg>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, letterSpacing: '0.2em', opacity: 0.8 }}>1234 •••• •••• 5678</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>Membre depuis 2025</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER COMPLET - ULTRA REFINED
      ══════════════════════════════════════════════════════════ */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        padding: '100px 40px 40px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1100, width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 60,
          marginBottom: 80,
        }}>
          {/* Col 1 */}
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <img src="/welcome_logo.png" alt="Logo" style={{ width: 28, height: 28 }} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: '#1C1C2E', letterSpacing: '-0.02em' }}>Retenza Connect</span>
            </div>
            <p style={{ color: '#8C7B73', fontSize: 14, lineHeight: 1.7, maxWidth: 280, fontWeight: 300 }}>
              Redéfinissez votre expérience d'achat. L'excellence de la fidélité dans une interface pensée pour vous.
            </p>
          </div>
          
          {/* Col 2 */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Découvrir</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Accueil</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Nos Privilèges</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Le Fonctionnement</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Nos Partenaires</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Conditions Générales</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Confidentialité</Link>
              <Link href="#" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>Mentions Légales</Link>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontWeight: 600, color: '#1C1C2E', marginBottom: 24, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <a href="mailto:contact@retenza.com" style={{ color: '#8C7B73', textDecoration: 'none', fontSize: 14, fontWeight: 400 }}>contact@retenza.com</a>
              <span style={{ color: '#8C7B73', fontSize: 14, fontWeight: 400 }}>+33 1 23 45 67 89</span>
            </div>
          </div>
        </div>

        <div style={{
          width: '100%', maxWidth: 1100,
          borderTop: '1px solid rgba(0,0,0,0.04)',
          paddingTop: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ fontSize: 13, color: '#8C7B73', fontWeight: 300 }}>
            © 2025 <span style={{ color: '#1C1C2E', fontWeight: 500 }}>Retenza Connect.</span>
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
