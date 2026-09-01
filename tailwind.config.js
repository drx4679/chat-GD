/** @type {import('tailwindcss').Config} */
// Configuration Tailwind CSS avec thèmes et couleurs personnalisées pour l'interface de chat
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#6366f1', dark: '#4f46e5' },
        chat: { sent: '#6366f1', received: '#f3f4f6', bg: '#f9fafb' },
      },
    },
  },
  plugins: [],
};
