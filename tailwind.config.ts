import type { Config } from "tailwindcss";

// Loaded by globals.css via @config. Colors and fonts point at the CSS
// tokens in globals.css so Tailwind classes and inline var(--*) styles
// always agree. font-display / font-mono intentionally resolve to the
// same sans: the system has one family and no monospace.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:         'var(--ink)',
        paper:       'var(--paper)',
        accent:      'var(--accent)',
        secondary:   'var(--secondary)',
        muted:       'var(--muted)',
        border:      'var(--border)',
        highlight:   'var(--highlight)',
        surface:     'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'nav-bg':    'var(--nav-bg)',
        success:     'var(--success)',
        warning:     'var(--warning)',
        critical:    'var(--critical)',
      },
      fontFamily: {
        display: ['var(--font-body)'],
        sans:    ['var(--font-body)'],
        mono:    ['var(--font-body)'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
    },
  },
  plugins: [],
};

export default config;
