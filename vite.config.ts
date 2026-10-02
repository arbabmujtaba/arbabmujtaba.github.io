import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // The build output, uploaded media and the content-state registry are
      // written by the dev server itself (builds, image derivatives, publish);
      // watching them only produces reload storms.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : { ignored: ['**/dist/**', '**/public/uploads/**', '**/content-state.json', '**/.kiro/**'] },
    },
  };
});
