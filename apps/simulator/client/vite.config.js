import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le simulateur est servi sous /diagnostic (chemin imposé par la landing,
// qui l'affiche en iframe same-origin). base doit matcher ce chemin pour
// que les assets buildés (JS/CSS) soient référencés correctement.
export default defineConfig({
  plugins: [react()],
  base: '/diagnostic/',
  server: {
    proxy: {
      '/diagnostic/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/diagnostic/, ''),
      },
    },
  },
});
