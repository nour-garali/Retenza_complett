'use client';

import React, { useState } from 'react';
import { 
  CheckCircle, Zap, MessageSquare, BarChart3, Sparkles, Globe,
  QrCode, CreditCard, Mail, Smartphone, ArrowUpRight, BadgeCheck
} from 'lucide-react';

type Category = 'all' | 'communication' | 'analytics' | 'integrations' | 'premium';

type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Category;
  icon: React.ReactNode;
  price: string | null;
  priceLabel: string;
  badge?: string;
  activated: boolean;
  featured?: boolean;
};

const PRODUCTS: Product[] = [
  {
    id: 'sms-pro',
    name: 'SMS Pro',
    tagline: 'Relance automatique par SMS',
    description: "Envoyez des SMS à vos clients. Relances automatiques, rappels d'anniversaire et promotions flash.",
    category: 'communication',
    icon: <MessageSquare className="w-4.5 h-4.5" />,
    price: '29',
    priceLabel: '€ / mois',
    activated: false,
    featured: true,
    badge: 'Populaire',
  },
  {
    id: 'email-campaigns',
    name: 'Email Marketing',
    tagline: 'Campagnes email illimitées',
    description: 'Créez de beaux emails et segmentez vos clients. Mesurez chaque résultat en temps réel.',
    category: 'communication',
    icon: <Mail className="w-4.5 h-4.5" />,
    price: '19',
    priceLabel: '€ / mois',
    activated: true,
  },
  {
    id: 'ai-insights',
    name: 'IA Insights',
    tagline: 'Intelligence artificielle sur vos données',
    description: "Analyse hebdomadaire IA : clients à risque, meilleurs horaires d'envoi, tendances de fidélité.",
    category: 'analytics',
    icon: <Sparkles className="w-4.5 h-4.5" />,
    price: '39',
    priceLabel: '€ / mois',
    activated: false,
    featured: true,
    badge: 'Nouveau',
  },
  {
    id: 'advanced-analytics',
    name: 'Analytics Avancé',
    tagline: 'Tableaux de bord en profondeur',
    description: 'Exportez vos données, créez des rapports personnalisés et visualisez vos performances.',
    category: 'analytics',
    icon: <BarChart3 className="w-4.5 h-4.5" />,
    price: '24',
    priceLabel: '€ / mois',
    activated: false,
  },
  {
    id: 'qr-custom',
    name: 'QR Code Premium',
    tagline: 'QR codes personnalisés à votre marque',
    description: "QR codes aux couleurs de votre commerce, avec analytics de scan et impression HD.",
    category: 'integrations',
    icon: <QrCode className="w-4.5 h-4.5" />,
    price: null,
    priceLabel: 'Gratuit',
    activated: true,
  },
  {
    id: 'web-widget',
    name: 'Widget Web',
    tagline: 'Intégrez Retenza sur votre site',
    description: 'Un widget flottant pour que vos visiteurs rejoignent votre programme depuis votre site.',
    category: 'integrations',
    icon: <Globe className="w-4.5 h-4.5" />,
    price: '9',
    priceLabel: '€ / mois',
    activated: false,
  },
  {
    id: 'push-unlimited',
    name: 'Push Illimité',
    tagline: 'Notifications push sans limite',
    description: 'Envoyez autant de notifications push que vous souhaitez, sans quota, sur iOS et Android.',
    category: 'communication',
    icon: <Smartphone className="w-4.5 h-4.5" />,
    price: null,
    priceLabel: 'Gratuit',
    activated: true,
  },
  {
    id: 'stripe',
    name: 'Stripe Connect',
    tagline: 'Paiements en ligne intégrés',
    description: 'Acceptez les paiements directement depuis Retenza. Liez votre compte Stripe en 2 minutes.',
    category: 'integrations',
    icon: <CreditCard className="w-4.5 h-4.5" />,
    price: '0',
    priceLabel: '+ frais Stripe',
    activated: false,
  },
  {
    id: 'white-label',
    name: 'Marque Blanche',
    tagline: 'Votre propre application de fidélité',
    description: "Une app mobile à votre marque sur l'App Store et Google Play. L'expérience Retenza, à votre nom.",
    category: 'premium',
    icon: <BadgeCheck className="w-4.5 h-4.5" />,
    price: '199',
    priceLabel: '€ / mois',
    activated: false,
    badge: 'Premium',
  },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all',           label: 'Tous' },
  { id: 'communication', label: 'Communication' },
  { id: 'analytics',     label: 'Analytics' },
  { id: 'integrations',  label: 'Intégrations' },
  { id: 'premium',       label: 'Premium' },
];

function ProductCard({ product, onToggle }: { product: Product; onToggle: (id: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm flex flex-col hover:shadow-md hover:border-gray-300/70 transition-all group">
      <div className="p-5 flex flex-col flex-1 gap-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            {/* Monochrome icon */}
            <div className="w-9 h-9 rounded-xl bg-gray-100 text-[#1B100C] flex items-center justify-center shrink-0 group-hover:bg-[#FFF5F2] group-hover:text-[#D73E26] transition-colors">
              {product.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[14px] font-bold text-[#1B100C]">{product.name}</span>
                {product.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    product.badge === 'Nouveau'   ? 'bg-[#FFF5F2] text-[#D73E26] border-[#D73E26]/20' :
                    product.badge === 'Populaire' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {product.badge}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-[#5D534F] mt-0.5">{product.tagline}</p>
            </div>
          </div>
          {product.activated && (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
          )}
        </div>

        {/* Description */}
        <p className="text-[13px] text-[#5D534F] leading-relaxed flex-1">{product.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
          <div>
            <span className="text-[16px] font-bricolage font-bold text-[#1B100C]">
              {product.price === null ? 'Gratuit' : product.price === '0' ? 'Gratuit' : `${product.price} €`}
            </span>
            {product.price && product.price !== '0' && (
              <span className="text-[11px] text-[#5D534F] ml-1">{product.priceLabel}</span>
            )}
          </div>
          <button
            onClick={() => onToggle(product.id)}
            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
              product.activated
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-[#D73E26] text-white hover:bg-[#C0321C] shadow-sm shadow-[#D73E26]/20'
            }`}
          >
            {product.activated ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [category, setCategory] = useState<Category>('all');
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  const toggleProduct = (id: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, activated: !p.activated } : p));
  };

  const filtered = category === 'all' ? products : products.filter(p => p.category === category);
  const activeCount = products.filter(p => p.activated).length;

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="flex items-end justify-between mb-8 pt-2">
        <div>
          <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">Marketplace</h1>
          <p className="text-[13px] text-[#5D534F] mt-0.5">Étendez les capacités de Retenza avec des modules et intégrations.</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Zap className="w-3.5 h-3.5 text-[#D73E26]" />
          <span className="text-[13px] font-semibold text-[#1B100C]">
            {activeCount} module{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Featured Banner — light, calm */}
      <div className="bg-white rounded-2xl border border-gray-200/70 shadow-sm p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#D73E26]" />
            <span className="text-[11px] font-bold text-[#D73E26] uppercase tracking-widest">Nouveau · IA Insights</span>
          </div>
          <h2 className="text-[16px] font-bricolage font-bold text-[#1B100C] mb-1">
            Votre assistant IA personnel pour la fidélité
          </h2>
          <p className="text-[13px] text-[#5D534F] max-w-lg leading-relaxed">
            Détection des clients à risque, recommandations d'horaires et résumé hebdomadaire automatique.
          </p>
        </div>
        <button
          onClick={() => setCategory('analytics')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D73E26] hover:bg-[#C0321C] text-white text-[13px] font-semibold rounded-xl transition-colors shrink-0 shadow-sm shadow-[#D73E26]/20"
        >
          Découvrir <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm mb-6 w-fit">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${
              category === cat.id
                ? 'bg-[#1A0F0A] text-white shadow-sm'
                : 'text-[#5D534F] hover:text-[#1B100C] hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-8">
        {filtered.map(product => (
          <ProductCard key={product.id} product={product} onToggle={toggleProduct} />
        ))}
      </div>

    </div>
  );
}
