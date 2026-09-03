'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PublicNavbar() {
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState('');

  useEffect(() => {
    if (pathname !== '/') {
      setActiveHash('');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHash('#' + entry.target.id);
          }
        });
      },
      {
        rootMargin: '-82px 0px -50% 0px', // -82px to account for header, -50% to trigger when section is in top half
      }
    );

    const ids = ['accueil', 'comment-ca-marche', 'partenaires', 'contact'];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      // Force 'accueil' when scrolled at the very top
      if (window.scrollY < 50) {
        setActiveHash('#accueil');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Handle initial hash on mount
    if (window.location.hash) {
      setActiveHash(window.location.hash);
      setTimeout(() => {
        const id = window.location.hash.replace('#', '');
        const el = document.getElementById(id);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else if (window.scrollY < 50) {
      setActiveHash('#accueil');
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only intercept if we are already on the homepage
    if (pathname === '/') {
      if (href === '/' || href.startsWith('/#')) {
        e.preventDefault();
        
        const targetId = href === '/' ? 'accueil' : href.replace('/#', '');
        setActiveHash('#' + targetId);
        
        // Update URL hash without causing a jump
        if (href !== '/') {
          window.history.pushState(null, '', href);
        } else {
          window.history.pushState(null, '', '/');
        }

        if (targetId === 'accueil') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const element = document.getElementById(targetId);
          if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 80; // -80px offset
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }
      }
    }
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #F3F4F6',
      padding: '12px 40px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }} onClick={(e) => handleLinkClick(e, '/')}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: '#D94030',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(217, 64, 48, 0.25)'
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
          </svg>
        </div>
        <span style={{
          fontFamily: "'Bricolage Grotesque', sans-serif",
          fontWeight: 800, fontSize: 20, color: '#1C1C2E',
        }}>Retenza Connect</span>
      </Link>

      <div style={{ display: 'flex', gap: 32 }} className="hidden lg:flex">
        {[
          { label: 'Accueil', href: '/' },
          { label: 'Avantages', href: '/avantages' },
          { label: 'Comment ça marche', href: '/#comment-ca-marche' },
          { label: 'Partenaires', href: '/#partenaires' },
          { label: 'Contact', href: '/#contact' },
        ].map(item => {
          let isActive = false;
          
          if (pathname === '/') {
            if (item.href === '/') {
              isActive = activeHash === '#accueil' || activeHash === '';
            } else if (item.href.startsWith('/#')) {
              isActive = activeHash === item.href.replace('/', '');
            }
          } else {
            // On other pages (like /avantages)
            isActive = pathname.startsWith(item.href.split('#')[0]) && item.href.split('#')[0] !== '/';
          }

          return (
            <Link key={item.label} href={item.href} onClick={(e) => handleLinkClick(e, item.href)} style={{
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              color: isActive ? '#BF2112' : '#374151',
              borderBottom: isActive ? '2.5px solid #BF2112' : '2.5px solid transparent',
              paddingBottom: 2, textDecoration: 'none',
              transition: 'color 0.2s ease, border-color 0.2s ease',
            }}>{item.label}</Link>
          );
        })}
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
  );
}
