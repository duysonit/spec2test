/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // HSC interactive blue (--brand #2681FF). accent-500 = brand.
        accent: {
          50: '#EAF2FF',
          100: '#D6E7FF',
          200: '#ADCFFF',
          300: '#85ADFF',
          400: '#4784FF',
          500: '#2681FF',
          600: '#0051C2',
          700: '#0044A3',
          800: '#003785',
          900: '#002A66',
        },
        // Neutral ramp remapped to HSC cool dark neutrals.
        slate: {
          50: '#FFFFFF',
          100: '#F5F7FA',
          200: '#E4E6EB',
          300: '#B4B9C2',
          400: '#95A1AD', // --text-secondary
          500: '#607080', // --text-tertiary
          600: '#4D545C', // --border-strong / disabled
          700: '#3A424C',
          800: '#2F353D', // --border (hairline) / secondary chips
          900: '#1C2229', // --bg-surface-2 (raised / inputs)
          950: '#0B0E11',
        },
        // Gain / up — HSC green (SG)
        emerald: {
          50: '#C5EBCB',
          100: '#C5EBCB',
          200: '#99E0A5',
          300: '#6FD681',
          400: '#49CC5F',
          500: '#03A61E',
          600: '#1D862F',
          700: '#177827',
          800: '#116920',
          900: '#0A5216',
          950: '#052E0C',
        },
        // Loss / down / destructive — HSC red (SR)
        rose: {
          50: '#EBC4C7',
          100: '#EBC4C7',
          200: '#EB9FA5',
          300: '#EB7A84',
          400: '#F64655',
          500: '#CF303D',
          600: '#992831',
          700: '#8A212A',
          800: '#701920',
          900: '#470E13',
          950: '#1F0608',
        },
        // Reference / warning — HSC yellow (#FFD400)
        amber: {
          50: '#FFF9E0',
          100: '#FFF3C2',
          200: '#FFEA85',
          300: '#FFE066',
          400: '#FFD940',
          500: '#FFD400',
          600: '#E6BE00',
          700: '#B89800',
          800: '#8A7200',
          900: '#5C4C00',
          950: '#2E2600',
        },
      },
      borderRadius: {
        // HSC radii: buttons/inputs 4px (default `rounded`), cards 8px.
        card: '0.5rem',
      },
      boxShadow: {
        // HSC elevation — soft, cool, low-opacity.
        card: '0 0 1px rgba(55,66,77,.40), 0 2px 4px rgba(9,30,66,.20)',
        'card-hover': '0 2px 6px rgba(9,30,66,.25), 0 12px 20px rgba(55,66,77,.30)',
      },
      keyframes: {
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%': { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%': { transform: 'translateZ(0) rotate(360deg)' },
        },
        'shiny-text': {
          '0%, 90%, 100%': { 'background-position': 'calc(-100% - var(--shiny-width)) 0' },
          '30%, 60%': { 'background-position': 'calc(100% + var(--shiny-width)) 0' },
        },
      },
      animation: {
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around': 'spin-around calc(var(--speed) * 2) infinite linear',
        'shiny-text': 'shiny-text 8s infinite',
      },
    },
  },
  plugins: [],
}
