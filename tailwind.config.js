/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#04060c',
        abyss: '#070b14',
        panel: '#0b1220',
        neon: '#3ff2ff',
        lime: '#c8ff4d',
        mist: '#8ea3bc',
        frost: '#eaf3fa',
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        body: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};

