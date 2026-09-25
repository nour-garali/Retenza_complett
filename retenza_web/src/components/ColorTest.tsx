'use client';

export default function ColorTest() {
  return (
    <div className="p-8 space-y-6 bg-retenza-paper min-h-screen">
      <h1 className="text-3xl font-bricolage font-bold gradient-text-grenadier">
        Retenza Connect — La Fidélité, Réinventée.
      </h1>
      
      {/* Test des nouvelles couleurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Couleur principale */}
        <div className="bg-white rounded-retenza p-6 shadow-retenza-soft">
          <div className="w-full h-20 bg-retenza-primary rounded-retenza-sm mb-4"></div>
          <h3 className="font-semibold text-retenza-ink">Primary</h3>
          <p className="text-sm text-retenza-ink-soft">#E85A45</p>
        </div>

        {/* Couleur primary-soft (avec transparence) */}
        <div className="bg-white rounded-retenza p-6 shadow-retenza-soft">
          <div className="w-full h-20 rounded-retenza-sm mb-4" 
               style={{backgroundColor: 'rgba(232, 90, 69, 0.8)'}}></div>
          <h3 className="font-semibold text-retenza-ink">Primary Soft</h3>
          <p className="text-sm text-retenza-ink-soft">80% transparence</p>
        </div>

        {/* Couleur primary-ghost (très transparente) */}
        <div className="bg-white rounded-retenza p-6 shadow-retenza-soft">
          <div className="w-full h-20 rounded-retenza-sm mb-4" 
               style={{backgroundColor: 'rgba(232, 90, 69, 0.1)'}}></div>
          <h3 className="font-semibold text-retenza-ink">Primary Ghost</h3>
          <p className="text-sm text-retenza-ink-soft">10% transparence</p>
        </div>

        {/* Couleur primary-light */}
        <div className="bg-white rounded-retenza p-6 shadow-retenza-soft">
          <div className="w-full h-20 bg-retenza-primary-light rounded-retenza-sm mb-4"></div>
          <h3 className="font-semibold text-retenza-ink">Primary Light</h3>
          <p className="text-sm text-retenza-ink-soft">#F07862</p>
        </div>

        {/* Glass tint effect */}
        <div className="glass-tint rounded-retenza p-6 border">
          <h3 className="font-semibold text-retenza-ink">Glass Tint</h3>
          <p className="text-sm text-retenza-ink-soft">Effet glassmorphism</p>
        </div>

        {/* Fond soft */}
        <div className="bg-retenza-soft rounded-retenza p-6">
          <h3 className="font-semibold text-retenza-ink">Soft Background</h3>
          <p className="text-sm text-retenza-ink-soft">Fond très doux</p>
        </div>
      </div>

      {/* Boutons de test */}
      <div className="flex flex-wrap gap-4">
        <button className="bg-retenza-primary text-white px-6 py-3 rounded-retenza font-medium hover:bg-retenza-secondary transition-colors shadow-retenza-glow-soft">
          Bouton Principal
        </button>
        
        <button className="bg-retenza-primary-soft text-white px-6 py-3 rounded-retenza font-medium hover:opacity-90 transition-opacity">
          Bouton Transparent
        </button>
        
        <button className="bg-retenza-primary-ghost text-retenza-primary border border-retenza-primary px-6 py-3 rounded-retenza font-medium hover:bg-retenza-primary-soft hover:text-white transition-all">
          Bouton Ghost
        </button>
      </div>

      {/* Texte avec gradient */}
      <div className="text-center py-8">
        <h2 className="text-4xl font-bricolage font-bold gradient-text-grenadier">
          Nouvelle Palette Plus Claire
        </h2>
        <p className="text-retenza-ink-soft mt-4">
          Couleurs plus douces et transparentes pour une meilleure cohérence visuelle
        </p>
      </div>
    </div>
  );
}