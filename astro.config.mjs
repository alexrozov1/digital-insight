import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://digital-insight.pages.dev',
  integrations: [
    tailwind({ config: { applyBaseStyles: true } }),
    sitemap()
  ],
  output: 'static'
});
