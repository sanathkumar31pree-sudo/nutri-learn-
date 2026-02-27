/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                moss: {
                    DEFAULT: '#2E4036',
                    50: '#eef2f0',
                    100: '#c8d8ce',
                    200: '#a2beac',
                    300: '#7ca48a',
                    400: '#568a68',
                    500: '#2E4036',
                    600: '#25332b',
                    700: '#1c2620',
                    800: '#131915',
                    900: '#0a0c0a',
                },
                clay: {
                    DEFAULT: '#CC5833',
                    50: '#fdf0ec',
                    100: '#f7cfc4',
                    200: '#f1ae9c',
                    300: '#eb8d74',
                    400: '#e56c4c',
                    500: '#CC5833',
                    600: '#a34629',
                    700: '#7a341f',
                    800: '#522215',
                    900: '#29110a',
                },
                cream: '#F2F0E9',
                charcoal: '#1A1A1A',
            },
            fontFamily: {
                jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
                cormorant: ['"Cormorant Garamond"', 'serif'],
                mono: ['"IBM Plex Mono"', 'monospace'],
                caveat: ['"Caveat"', 'cursive'],
                outfit: ['"Outfit"', 'sans-serif'],
                quicksand: ['"Quicksand"', 'sans-serif'],
                patrick: ['"Patrick Hand"', 'cursive'],
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 10px rgba(204, 88, 51, 0.4)' },
                    '50%': { boxShadow: '0 0 25px rgba(204, 88, 51, 0.8)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
            },
        },
    },
    plugins: [],
}
