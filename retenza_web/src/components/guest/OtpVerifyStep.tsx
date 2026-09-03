'use client';

import React, { useState, useRef, useEffect } from 'react';

interface OtpVerifyStepProps {
  email: string;
  primaryColor: string;
  expiresInMinutes: number;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export default function OtpVerifyStep({
  email, primaryColor, expiresInMinutes, onVerify, onResend, isLoading, error,
}: OtpVerifyStepProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(expiresInMinutes * 60);
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) { setCanResend(true); return; }
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { setCanResend(true); clearInterval(t); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const nd = [...digits]; nd[i] = d; setDigits(nd);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
    if (d && i === 5 && nd.join('').length === 6) onVerify(nd.join(''));
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (p.length === 6) { setDigits(p.split('')); inputRefs.current[5]?.focus(); onVerify(p); }
  };

  const handleResend = async () => {
    setCanResend(false); setResendCooldown(60);
    setDigits(['', '', '', '', '', '']); setTimeLeft(expiresInMinutes * 60);
    inputRefs.current[0]?.focus();
    await onResend();
  };

  const isExpired = timeLeft === 0;
  const code = digits.join('');

  return (
    <div className="w-full">
      
      {/* Title with word breaking for long emails */}
      <p className="text-[14px] text-gray-500 mb-2 leading-relaxed">
        Un code a été envoyé à <br />
        <span className="font-bold text-gray-900 break-all">{email}</span>
      </p>

      {/* Timer */}
      <p className="text-[13px] font-medium mb-6 flex items-center gap-1.5" style={{ color: isExpired ? '#EF4444' : '#9CA3AF' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {isExpired ? 'Le code a expiré.' : `Expire dans ${fmt(timeLeft)}`}
      </p>

      {/* 6 digit inputs - Fixed sizing to prevent squishing */}
      <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            disabled={isLoading || isExpired}
            className="w-10 sm:w-12 h-12 sm:h-14 text-center text-[20px] font-black rounded-xl border-2 outline-none transition-all bg-gray-50 disabled:opacity-40 focus:ring-2 focus:ring-gray-100 focus:bg-white"
            style={{
              borderColor: d ? primaryColor : '#E5E7EB',
              color: d ? primaryColor : '#111827',
              boxShadow: d ? `0 4px 12px ${primaryColor}15` : 'none'
            }}
          />
        ))}
      </div>

      {error && <p className="text-[13px] text-red-500 font-medium mb-4 bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

      {/* Submit */}
      <button
        onClick={() => onVerify(code)}
        disabled={isLoading || code.length < 6 || isExpired}
        className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]
                   disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-5 shadow-md"
        style={{ backgroundColor: primaryColor }}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Vérification...
          </>
        ) : 'Confirmer'}
      </button>

      {/* Resend */}
      <div className="text-center">
        {canResend ? (
          <button onClick={handleResend} className="text-[13px] font-bold underline text-gray-500 hover:text-gray-900 transition-colors">
            Renvoyer un nouveau code
          </button>
        ) : (
          <p className="text-[13px] text-gray-400 font-medium">Vous pourrez renvoyer un code dans {resendCooldown}s</p>
        )}
      </div>
    </div>
  );
}
