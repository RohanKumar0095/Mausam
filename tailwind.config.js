/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1F5C8B',
          dark: '#0e4a7b',
          deep: '#0a355c',
          navy: '#08253d',
          light: '#EAF3FA',
        },
        page: {
          bg: '#F4F8FB',
          darkBg: '#092B48',
        },
        persona: {
          health: '#1D9E75',
          fitness: '#D85A30',
          agriculture: '#639922',
          events: '#7F77DD',
          beach: '#0F6E56',
          travel: '#0F6E56',
          family: '#D4537E',
          commute: '#BA7517',
          inactiveBg: '#F1EFE8',
          inactiveText: '#5F5E5A',
        },
        severity: {
          safe: '#0F6E56',
          safeBg: '#E1F5EE',
          caution: '#854F0B',
          cautionBg: '#FAEEDA',
          severe: '#791F1F',
          severeBg: '#FCEBEB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'mausam': '12px',
      }
    },
  },
  plugins: [],
}
