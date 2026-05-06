import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',   // ← AÑADE ESTA LÍNEA
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {} },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
} satisfies Config


