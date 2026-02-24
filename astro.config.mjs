// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://heyahmedsherif.github.io',
  base: '/notsorandyfine/',
  trailingSlash: 'always',
  integrations: [tailwind()],
  output: 'static',
});
