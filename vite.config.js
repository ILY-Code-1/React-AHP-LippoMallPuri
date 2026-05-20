import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `envPrefix` is extended so the single `SECRET` env variable is exposed to the
// client bundle as `import.meta.env.SECRET` (Vite only exposes `VITE_*` by default).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envPrefix: ['VITE_', 'SECRET'],
})
