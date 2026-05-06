import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Claude.ai cream palette
        canvas: '#FAF9F5',      // Pampas — page background
        surface: '#FFFFFF',      // panels
        warm: '#F5F4ED',         // warm cream for nested surfaces
        line: '#E8E6DC',         // subtle borders
        ink: '#2C2B27',          // primary text
        muted: '#8C8A82',        // secondary text
        faint: '#B8B5AA',        // tertiary / hints
        accent: '#D97757',       // Anthropic orange
        accentSoft: '#F4E5DC',   // accent tint for backgrounds
        accentDeep: '#B85F3F',   // accent hover
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Tiempos Headline', 'Source Serif 4', 'Georgia', 'ui-serif', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(44,43,39,0.04), 0 4px 16px rgba(44,43,39,0.04)',
        card: '0 2px 8px rgba(44,43,39,0.06), 0 8px 32px rgba(44,43,39,0.04)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
