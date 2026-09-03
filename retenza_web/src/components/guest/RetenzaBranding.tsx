'use client';

import React from 'react';
import Link from 'next/link';

export default function RetenzaBranding() {
  return (
    <footer className="mx-5 mt-6 mb-8">
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-5" />

      {/* Main branding row */}
      <div className="flex flex-col items-center gap-3 text-center">
        {/* Powered by */}
        <div className="flex items-center gap-2 text-gray-400">
          <span className="text-[11px] font-medium tracking-wide uppercase">Powered by</span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#D73E26] to-[#A82C18] flex items-center justify-center shadow-sm">
              <span className="text-white text-[8px] font-bold font-bricolage">R</span>
            </div>
            <span className="font-bricolage font-bold text-[13px] text-gray-700">Retenza Connect</span>
          </div>
        </div>

        {/* Download CTA */}
        <Link
          href="https://retenza.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-100 text-gray-600 text-[12px] font-medium hover:bg-gray-100 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          </svg>
          Télécharger l&apos;application Retenza
        </Link>

        {/* Legal links */}
        <div className="flex items-center gap-3 text-[10px] text-gray-300">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Confidentialité</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">CGU</Link>
          <span>·</span>
          <span>© {new Date().getFullYear()} Retenza</span>
        </div>
      </div>
    </footer>
  );
}
