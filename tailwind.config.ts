import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:       '#0F172A',
        paper:     '#F8FAFC',
        accent:    '#C84B31',
        secondary: '#1E3A8A',
        muted:     '#64748B',
        border:    '#E2E8F0',
        highlight: '#EFF6FF',
        surface:   '#FFFFFF',
        'surface-2': '#F1F5F9',
        'nav-bg':  '#0D1B2A',
        success:   '#059669',
        warning:   '#D97706',
        critical:  '#DC2626',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Jost', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'xs':  '0 1px 2px rgba(15,23,42,0.04)',
        'sm':  '0 2px 8px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)',
        'md':  '0 4px 16px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.04)',
        'lg':  '0 8px 32px rgba(15,23,42,0.12), 0 4px 8px rgba(15,23,42,0.06)',
        'xl':  '0 16px 48px rgba(15,23,42,0.16), 0 8px 16px rgba(15,23,42,0.08)',
      },
      backgroundImage: {
        'page-header': 'linear-gradient(135deg, #0D1B2A 0%, #162544 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
