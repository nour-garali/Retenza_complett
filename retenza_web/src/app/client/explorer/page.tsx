import React from 'react';
import { getClientExploreData } from '@/services/clientDashboardActions';
import { Compass, Search, MapPin, Star } from 'lucide-react';

export default async function ClientExplorerPage() {
  const fetchedSuggestions = await getClientExploreData() || [];

  const mockSuggestions = [
    {
      name: 'Boulangerie Paul',
      category: 'Boulangerie & Pâtisserie',
      address: '12 Avenue des Champs, Paris',
      coverUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=100&q=80'
    },
    {
      name: 'Café de la Gare',
      category: 'Restauration',
      address: 'Place de la Gare, Lyon',
      coverUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&q=80'
    },
    {
      name: 'Librairie Antoine',
      category: 'Culture & Livres',
      address: '45 Rue de la Soie, Marseille',
      coverUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=500&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=100&q=80'
    },
    {
      name: 'Supermarché Monoprix',
      category: 'Alimentation Générale',
      address: 'Boulevard Haussmann, Paris',
      coverUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&q=80',
      logoUrl: 'https://images.unsplash.com/photo-1588612568478-f2227183e874?w=100&q=80'
    }
  ];

  const suggestions = fetchedSuggestions.length > 0 ? fetchedSuggestions : mockSuggestions;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      
      {/* Header with Search on the right */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
            <Compass className="w-5 h-5 text-[#D73E26]" />
          </div>
          <h1 className="text-[22px] font-bricolage font-bold text-[#1B100C]">
            Explorer les commerces
          </h1>
        </div>

        {/* Local Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#9C8B82] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input 
            type="text" 
            placeholder="Rechercher par nom, catégorie..." 
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-[#1B100C] placeholder-[#9C8B82] outline-none focus:border-[#D73E26] focus:ring-2 focus:ring-[#D73E26]/10 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {suggestions.length > 0 ? suggestions.map((commerce: any, idx: number) => (
          <div key={idx} className="bg-white rounded-2xl border border-[#EDE5DF] overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
            {/* Cover Image Placeholder */}
            <div className="h-32 bg-gray-100 relative">
              {commerce.coverUrl ? (
                 <img src={commerce.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-gray-200 to-gray-300" />
              )}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs font-bold text-[#1B100C]">4.8</span>
              </div>
            </div>
            
            <div className="p-4 relative">
              {/* Logo */}
              <div className="absolute -top-6 left-4 w-12 h-12 bg-white rounded-xl shadow-sm border border-[#EDE5DF] p-1 flex items-center justify-center overflow-hidden">
                {commerce.logoUrl ? (
                  <img src={commerce.logoUrl} alt={commerce.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-lg" />
                )}
              </div>
              
              <div className="mt-6">
                <h3 className="font-bold text-[#1B100C] truncate">{commerce.name}</h3>
                <p className="text-sm text-[#5D534F] mb-3">{commerce.category || 'Commerce'}</p>
                
                <div className="flex items-center text-xs text-[#9C8B82]">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="truncate">{commerce.address || 'Adresse non renseignée'}</span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-[#EDE5DF] text-center">
            <p className="text-[#5D534F]">Aucune suggestion disponible pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
