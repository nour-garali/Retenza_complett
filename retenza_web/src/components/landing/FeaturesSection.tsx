'use client';

import { motion } from 'framer-motion';

const items = [
  {
    title: 'Avantages exclusifs',
    desc: "Profitez d'offres rien\nque pour vous.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    title: 'Récompenses',
    desc: 'Cumulez des points\net gagnez plus.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/>
        <line x1="12" y1="22" x2="12" y2="7"/>
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
      </svg>
    ),
  },
  {
    title: '100% Sécurisé',
    desc: 'Vos données sont\nprotégées.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D73E26" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section style={{
      backgroundColor: '#fff',
      padding: '56px 40px',
      borderTop: '1px solid #f0ece9',
    }}>
      <div style={{
        maxWidth: 1320, margin: '0 auto',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 48,
      }}>
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}
          >
            {/* Icon circle */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: '#FEF0ED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {item.icon}
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Inter', sans-serif", fontWeight: 800,
                fontSize: 17, color: '#1A1A1A', marginBottom: 4, lineHeight: 1.3,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                color: '#9CA3AF', lineHeight: 1.5,
                whiteSpace: 'pre-line',
              }}>
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
