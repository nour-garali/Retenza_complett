'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

const faqs = [
  { q: 'Retenza Connect est-il gratuit pour les commerçants ?', a: "Oui, nous proposons un accès gratuit pour démarrer. Des fonctionnalités avancées sont disponibles dans nos offres premium adaptées à la taille de votre commerce." },
  { q: 'Les clients ont-ils besoin d\'installer une application ?', a: "L'application Retenza Connect est disponible sur iOS et Android. Elle est légère, rapide et conçue pour être aussi simple qu'intuitive." },
  { q: 'Comment fonctionne la validation des points ?', a: "Le commerçant scanne le QR code du client en une seconde. Les points sont crédités instantanément sur son compte. Aucune paperasse, aucune friction." },
  { q: 'Puis-je personnaliser mon programme de fidélité ?', a: "Entièrement. Vous définissez le ratio points/achat, les récompenses, les seuils et la durée de validité. Votre programme, votre image." },
  { q: 'Mes données sont-elles sécurisées ?', a: "Toutes les données sont hébergées en Europe, chiffrées et conformes au RGPD. Nous ne revendons jamais vos données ni celles de vos clients." },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const inView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className="border-b border-black/[0.06] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        className="w-full flex items-center justify-between py-7 text-left group"
        onClick={() => setOpen(!open)}
      >
        <span className="font-bricolage font-semibold text-[#0D0B0A] text-lg group-hover:text-[#D73E26] transition-colors duration-200">
          {q}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 w-8 h-8 rounded-full border border-black/10 flex items-center justify-center text-[#6B5D54] ml-6 group-hover:border-[#D73E26]/30 group-hover:text-[#D73E26] transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="font-inter text-[#6B5D54] text-[15px] leading-relaxed pb-6 max-w-2xl">{a}</p>
      </motion.div>
    </motion.div>
  );
}

export default function CTASection() {
  const ctaRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' });
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' });

  return (
    <>
      {/* FAQ Section */}
      <section className="bg-[#FAFAF8] py-32 md:py-48">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 lg:gap-24">
            <div ref={faqRef}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={faqInView ? { opacity: 1, y: 0 } : {}}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/[0.04] border border-black/[0.06] mb-8"
              >
                <span className="text-[#6B5D54] font-inter text-xs font-semibold tracking-widest uppercase">FAQ</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }} animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-bricolage font-bold text-[#0D0B0A] leading-tight tracking-tight"
                style={{ fontSize: 'clamp(28px, 3vw, 44px)' }}
              >
                Questions fréquentes
              </motion.h2>
            </div>
            <div>
              {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final — Dark, Dramatic */}
      <section className="relative bg-[#0D0B0A] py-32 md:py-48 overflow-hidden">
        {/* Grain */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }} />

        {/* Radial glow */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(215,62,38,0.15) 0%, transparent 60%)' }}
          animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 6, repeat: Infinity }} />

        <div className="relative z-10 max-w-[900px] mx-auto px-6 md:px-12 text-center" ref={ctaRef}>
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            className="font-inter text-white/30 text-xs tracking-[0.4em] uppercase mb-8"
          >
            Rejoignez la révolution
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-bricolage font-bold text-white leading-tight tracking-tight mb-8"
            style={{ fontSize: 'clamp(40px, 6vw, 88px)' }}
          >
            Prêt à transformer<br />
            <span style={{
              background: 'linear-gradient(135deg, #D73E26 0%, #FF6B4A 50%, #D73E26 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>votre commerce ?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="font-inter text-white/40 text-lg leading-relaxed mb-12 max-w-xl mx-auto"
          >
            Rejoignez plus de 2 400 commerçants qui utilisent déjà Retenza Connect pour fidéliser leurs clients.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register/merchant"
              className="inline-flex items-center justify-center gap-2.5 px-10 py-5 rounded-full font-bold font-inter text-white text-base transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #D73E26, #A82C18)', boxShadow: '0 8px 48px rgba(215,62,38,0.4)' }}>
              Démarrer gratuitement
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/register/client"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 rounded-full font-semibold font-inter text-white/50 hover:text-white text-base border border-white/10 hover:border-white/25 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.07]">
              Je suis un client
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A0908] border-t border-white/[0.05] py-16 px-6 md:px-12 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#D73E26] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 48 48" fill="none">
                    <path d="M40 24C40 32.8366 32.8366 40 24 40C15.1634 40 8 32.8366 8 24C8 15.1634 15.1634 8 24 8" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
                    <path d="M36 6.5V16H26.5" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-bricolage font-bold text-white text-lg">Retenza</span>
              </div>
              <p className="font-inter text-white/30 text-sm leading-relaxed">La plateforme de fidélisation qui connecte les commerçants à leur clientèle.</p>
            </div>
            {[
              { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Changelog', 'API'] },
              { title: 'Entreprise', links: ['À propos', 'Blog', 'Carrières', 'Contact'] },
              { title: 'Légal', links: ['Confidentialité', 'CGU', 'RGPD', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h5 className="font-inter font-semibold text-white/50 text-xs tracking-widest uppercase mb-5">{col.title}</h5>
                <ul className="flex flex-col gap-3">
                  {col.links.map(link => (
                    <li key={link}><a href="#" className="font-inter text-white/30 hover:text-white/70 text-sm transition-colors duration-200">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.05] pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-inter text-white/20 text-xs">© {new Date().getFullYear()} Retenza Connect. Tous droits réservés.</p>
            <p className="font-inter text-white/15 text-xs">Fait avec ♥ en France</p>
          </div>
        </div>
      </footer>
    </>
  );
}
