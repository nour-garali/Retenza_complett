'use client';

import React, { useState } from 'react';
import type { GuestCardFormData, GuestCardFormErrors } from '@/types/guest';

interface GuestCardFormProps {
  primaryColor: string;
  onSubmit: (data: GuestCardFormData) => Promise<void>;
  isLoading: boolean;
}

function validate(data: GuestCardFormData): GuestCardFormErrors {
  const errors: GuestCardFormErrors = {};
  if (!data.firstName.trim()) errors.firstName = 'Le prénom est requis.';
  if (!data.lastName.trim()) errors.lastName = 'Le nom est requis.';
  if (!data.email.trim()) {
    errors.email = "L'email est requis.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Format d'email invalide.";
  }
  if (!data.phone.trim()) {
    errors.phone = 'Le téléphone est requis.';
  } else if (!/^\+?[\d\s\-().]{7,}$/.test(data.phone)) {
    errors.phone = 'Format de numéro invalide.';
  }
  return errors;
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  error?: string;
  primaryColor: string;
  autoComplete?: string;
}

function Field({ label, value, onChange, placeholder, type = 'text', error, primaryColor, autoComplete }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-gray-600 font-inter">{label}</label>
      <div
        className="flex items-center bg-white rounded-2xl border-2 transition-all duration-200"
        style={{
          borderColor: error ? '#EF4444' : focused ? primaryColor : '#E8E8E8',
          boxShadow: focused && !error ? `0 0 0 3px ${primaryColor}18` : error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent border-none outline-none py-3.5 px-4 text-[14px] font-medium text-gray-900 placeholder-gray-400"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default function GuestCardForm({ primaryColor, onSubmit, isLoading }: GuestCardFormProps) {
  const [data, setData] = useState<GuestCardFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<GuestCardFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof GuestCardFormData) => (value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      const newErrors = validate({ ...data, [field]: value });
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const validationErrors = validate(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    await onSubmit(data);
  };

  return (
    <div className="mx-5 mt-5 bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <div>
          <div className="font-bricolage font-bold text-gray-900 text-[15px]">Créer ma carte</div>
          <div className="text-gray-400 text-xs mt-0.5">Inscription gratuite et immédiate</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3.5">
        {/* Row: first + last name */}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Prénom *"
            value={data.firstName}
            onChange={set('firstName')}
            placeholder="Marie"
            error={errors.firstName}
            primaryColor={primaryColor}
            autoComplete="given-name"
          />
          <Field
            label="Nom *"
            value={data.lastName}
            onChange={set('lastName')}
            placeholder="Dupont"
            error={errors.lastName}
            primaryColor={primaryColor}
            autoComplete="family-name"
          />
        </div>

        <Field
          label="Adresse email *"
          value={data.email}
          onChange={set('email')}
          placeholder="vous@exemple.com"
          type="email"
          error={errors.email}
          primaryColor={primaryColor}
          autoComplete="email"
        />

        <Field
          label="Numéro de téléphone *"
          value={data.phone}
          onChange={set('phone')}
          placeholder="+33 6 12 34 56 78"
          type="tel"
          error={errors.phone}
          primaryColor={primaryColor}
          autoComplete="tel"
        />

        {/* Privacy note */}
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Vos informations sont utilisées uniquement pour créer et gérer votre carte de fidélité.
          Elles ne seront jamais revendues ni partagées à des tiers.{' '}
          <span className="underline cursor-pointer">En savoir plus</span>
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}CC 100%)`,
            boxShadow: `0 8px 24px ${primaryColor}40`,
          }}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Création en cours…</span>
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <span>Obtenir ma carte gratuite</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
