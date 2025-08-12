import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://digital-insight.pages.dev',
  integrations: [tailwind({ config: { applyBaseStyles: true } })],
  output: 'static'
});
