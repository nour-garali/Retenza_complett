'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';

export default function MerchantSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const benefits = [
    { icon: '📊', title: 'Analytics en temps réel', desc: 'Suivez vos clients actifs, vos scans et vos taux de rétention jour après jour.' },
    { icon: '⚡', title: 'Configuration en 5 minutes', desc: 'Créez votre programme de fidélité personnalisé sans aucune compétence technique.' },
    { icon: '🎯', title: 'Ciblage intelligent', desc: 'Identifiez vos meilleurs clients et créez des offres qui font revenir.' },
  ];

  return (
    <section ref={ref} id="commerçants" className="relative bg-[#F4EFE9] py-32 md:py-48 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left: Image */}
          <motion.div
            className="relative order-2 lg:order-1"
            initial={{ opacity: 0, x: -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative rounded-[32px] overflow-hidden aspect-[4/3] shadow-[0_40px_120px_rgba(13,11,10,0.15)]">
              <img src="/merchant-dashboard.png" alt="Dashboard Commerçant Retenza" className="w-full h-full object-cover" />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D0B0A]/30 to-transparent" />
            </div>

            {/* Floating metric card */}
            <motion.div
              className="absolute -bottom-6 -right-6 p-5 rounded-2xl shadow-[0_20px_60px_rgba(13,11,10,0.15)]"
              style={{ background: 'white', minWidth: '180px' }}
              animate={{ y: [0, -8, 0] }} transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <p className="font-inter text-[#6B5D54] text-xs mb-1 uppercase tracking-wider">Ce mois-ci</p>
              <p className="font-bricolage font-bold text-[#0D0B0A] text-3xl">+34%</p>
              <p className="font-inter text-[#6B5D54] text-sm mt-0.5">Clients récurrents</p>
              <div className="mt-3 flex gap-1">
                {[40, 65, 50, 80, 70, 90, 85].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-[#D73E26]" style={{ height: `${h * 0.3}px`, opacity: 0.4 + (i / 7) * 0.6 }} />
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Text */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E8902A]/10 border border-[#E8902A]/20 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#E8902A]" />
              <span className="text-[#E8902A] font-inter text-xs font-semibold tracking-widest uppercase">Pour les Commerçants</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-bricolage font-bold text-[#0D0B0A] leading-tight tracking-tight mb-6"
              style={{ fontSize: 'clamp(32px, 4vw, 56px)' }}
            >
              Votre commerce mérite<br />
              <span className="text-[#6B5D54]">des outils à sa hauteur.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="font-inter text-[#6B5D54] text-lg leading-relaxed mb-12"
            >
              Retenza Connect vous donne la puissance d'un grand groupe à l'échelle d'un commerce de proximité.
              Fidélisez, analysez, récompensez.
            </motion.p>

            <div className="flex flex-col gap-6 mb-12">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  className="flex items-start gap-5"
                  initial={{ opacity: 0, x: 30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-xl shrink-0 shadow-[0_4px_16px_rgba(13,11,10,0.06)]">
                    {b.icon}
                  </div>
                  <div>
                    <h4 className="font-bricolage font-bold text-[#0D0B0A] text-lg mb-1">{b.title}</h4>
                    <p className="font-inter text-[#6B5D54] text-sm leading-relaxed">{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.a
              href="/register/merchant"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold font-inter text-white text-[15px] transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, #D73E26, #A82C18)', boxShadow: '0 8px 32px rgba(215,62,38,0.3)' }}
              initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 48px rgba(215,62,38,0.45)' }}
              whileTap={{ scale: 0.98 }}
            >
              Créer mon espace commerçant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
