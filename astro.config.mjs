// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://notsorandyfine.com',
  base: '/',
  trailingSlash: 'always',
  integrations: [tailwind()],
  output: 'static',
});
