import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { parseMarkdown } from './src/lib/frontmatter';
import { resolveHero } from './src/lib/hero';

/**
 * Writes the home hero's sources into index.html's preload script, from the
 * same resolver Home.tsx renders with — so changing the Hero photo in /admin
 * moves the preload too. Read on every request in dev, once per build.
 */
function heroPreload(): Plugin {
  return {
    name: 'hero-preload',
    transformIndexHtml(html) {
      const dir = path.resolve(__dirname, 'content/home');
      const blocks = readdirSync(dir)
        .filter((file) => file.endsWith('.md'))
        .map((file) => parseMarkdown(readFileSync(path.join(dir, file), 'utf8')).data);
      const hero = resolveHero(blocks);
      const sets = JSON.stringify({ wide: hero.wideSrcSet ?? hero.tallSrcSet ?? null, tall: hero.tallSrcSet ?? null });
      return html.replace('var heroSets = __HERO_PRELOAD__;', `var heroSets = ${sets.replace(/</g, '\\u003c')};`);
    },
  };
}

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [react(), tailwindcss(), heroPreload()],
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
