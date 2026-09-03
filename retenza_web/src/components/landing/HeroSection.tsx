'use client';

import Link from 'next/link';

/**
 * CALCULS PRÉCIS (image 1536×1024) :
 * - Nav Figma dans l'image : ~85px du haut
 * - Fin de la section Hero : ~575px du haut
 * - Hauteur utile : 575 - 85 = 490px / 1536px de large = 31.9vw de hauteur visible
 * - Crop du haut : 85/1536 * 100vw = 5.534vw
 */
export default function HeroSection() {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        // Hauteur = hauteur utile du hero (sans la nav Figma, sans le footer)
        height: '32vw',
        backgroundColor: '#FDF7F4',
      }}
    >
      {/* Image décalée vers le haut pour cacher la nav Figma */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/main-visual.png"
        alt="Hero Retenza Connect"
        style={{
          display: 'block',
          width: '100%',
          // On remonte l'image de 5.534vw pour cacher la navbar Figma (85px sur 1536px)
          marginTop: 'calc(-5.534vw)',
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          ZONES CLIQUABLES INVISIBLES (positionnées sur les boutons de l'image)
          Positions calculées par rapport au conteneur de 32vw de hauteur
          ═══════════════════════════════════════════════════════ */}

      {/* Bouton: Se connecter */}
      <Link
        href="/login"
        style={{
          position: 'absolute',
          top: '67%',
          left: '9.5%',
          width: '14%',
          height: '13%',
          zIndex: 20,
          // backgroundColor: 'rgba(0,255,0,0.4)', // DEBUG: décommenter pour voir la zone
        }}
        aria-label="Se connecter"
      />

      {/* Bouton: Créer un compte */}
      <Link
        href="/register"
        style={{
          position: 'absolute',
          top: '67%',
          left: '24.5%',
          width: '14.5%',
          height: '13%',
          zIndex: 20,
        }}
        aria-label="Créer un compte"
      />

      {/* Lien: Devenir Partenaire Retenza */}
      <Link
        href="/register/merchant"
        style={{
          position: 'absolute',
          top: '84%',
          left: '15%',
          width: '20%',
          height: '7%',
          zIndex: 20,
        }}
        aria-label="Devenir Partenaire Retenza"
      />
    </div>
  );
}
