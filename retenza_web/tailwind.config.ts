import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bricolage: ["var(--font-bricolage)", "serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        outfit: ["var(--font-bricolage)", "serif"],
        space: ["var(--font-inter)", "monospace"],
      },
      colors: {
        // Palette Retenza Connect - Cohérente
        retenza: {
          // Couleurs principales - Version plus claire et transparente
          primary: "#E85A45",     // Rouge plus clair - Action principale
          "primary-light": "#F07862",  // Encore plus clair
          "primary-soft": "rgba(232, 90, 69, 0.8)",   // Avec transparence 80%
          "primary-ghost": "rgba(232, 90, 69, 0.1)",  // Très transparent pour fonds
          secondary: "#C54632",   // Rouge moyen - Survol/Texte  
          accent: "#F2774E",      // Ember - Dégradés/Glow
          soft: "#FDE8E4",        // Fond très doux - plus clair
          
          // Neutres chauds
          white: "#FFFFFF",       // Surface principale
          paper: "#FBF8F6",       // Fond général
          ink: "#20140F",         // Texte principal
          "ink-soft": "#6E5B52",  // Texte secondaire  
          "ink-light": "#9A8980", // Texte tertiaire
          line: "#ECE3DD",        // Bordures
          
          // Couleurs de statut (scoring client)
          vip: "#E85A45",         // VIP - Même que primary (version claire)
          risk: "#E8902A",        // À risque
          regular: "#3F7E78",     // Régulier
          lost: "#A99C95",        // Perdu
        },
        
        // Alias pour compatibilité
        primary: "#E85A45",        // Rouge plus clair
        secondary: "#C54632",      // Rouge moyen
        accent: "#F2774E",
        
        // États (success, warning, error)
        success: "#3F7E78",       // Reprise du "regular"
        warning: "#E8902A",       // Reprise du "risk" 
        error: "#E85A45",         // Reprise du primary (version claire)
      },
      
      // Ombres cohérentes avec la marque - Versions plus douces
      boxShadow: {
        'retenza-soft': '0 1px 3px rgba(0,0,0,0.04)',
        'retenza-medium': '0 8px 22px rgba(32,20,15,.07)',
        'retenza-strong': '0 18px 44px rgba(32,20,15,.07)',
        'retenza-glow': '0 4px 14px rgba(232,90,69,.25)',      // Glow plus doux
        'retenza-glow-strong': '0 16px 44px rgba(232,90,69,.28)', // Glow fort plus doux
        'retenza-glow-soft': '0 2px 8px rgba(232,90,69,.15)',  // Nouveau: glow très doux
      },
      
      // Border radius cohérent
      borderRadius: {
        'retenza': '18px',
        'retenza-sm': '12px', 
        'retenza-lg': '22px',
        'retenza-xl': '30px',
      }
    },
  },
  plugins: [],
} satisfies Config;
