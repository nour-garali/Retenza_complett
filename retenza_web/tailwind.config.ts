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
    },
  },
  plugins: [],
} satisfies Config;
