'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 2400, suffix: '+', label: 'Commerçants actifs', desc: 'Boutiques, cafés, restaurants, services' },
  { value: 98, suffix: '%', label: 'Satisfaction client', desc: 'Score moyen de satisfaction utilisateur' },
  { value: 4.9, suffix: '★', label: 'Note moyenne', desc: 'Sur App Store & Google Play' },
  { value: 120, suffix: 'K', label: 'Scans par mois', desc: 'Transactions validées sur la plateforme' },
];

function Counter({ target, suffix, duration = 2 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Number(start.toFixed(target % 1 !== 0 ? 1 : 0)));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function StatsSection() {
  const titleRef = useRef<HTMLDivElement>(null);
  const inView = useInView(titleRef, { once: true, margin: '-80px' });

  return (
    <section className="relative bg-[#0D0B0A] py-32 md:py-48 overflow-hidden">
      {/* Background image with heavy overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#0D0B0A]" />
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'url(/stats-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }} />
      </div>

      {/* Grain */}
      <div className="absolute inset-0 z-1 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />

      {/* Aurora */}
      <div className="absolute inset-0 z-2 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(215,62,38,0.08) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 md:px-12 lg:px-20">
        {/* Label */}
        <div ref={titleRef} className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.04] mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#D73E26] animate-pulse" />
            <span className="text-white/40 font-inter text-xs tracking-widest uppercase">L'Impact Retenza</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-bricolage font-bold text-white leading-tight tracking-tight"
            style={{ fontSize: 'clamp(36px, 5vw, 72px)' }}
          >
            Des chiffres qui<br />
            <span style={{
              background: 'linear-gradient(135deg, #D73E26, #FF6B4A)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>parlent d'eux-mêmes.</span>
          </motion.h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.06] rounded-3xl overflow-hidden">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="bg-[#0D0B0A] p-8 md:p-12 flex flex-col gap-3 group hover:bg-[#181210] transition-colors duration-300"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="font-bricolage font-bold text-white" style={{ fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1 }}>
                {inView && <Counter target={stat.value} suffix={stat.suffix} />}
              </div>
              <p className="font-bricolage font-semibold text-white/70 text-lg">{stat.label}</p>
              <p className="font-inter text-white/30 text-sm leading-relaxed">{stat.desc}</p>
              <div className="w-8 h-[2px] bg-[#D73E26] mt-2 group-hover:w-16 transition-all duration-500 rounded-full" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
