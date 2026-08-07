// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://atthismoment.show',

  // Artists send large photographs. Astro resizes them and serves modern
  // formats automatically, so nobody has to prepare images by hand.
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },

  build: {
    // Pages are written as /about/index.html so URLs end in a slash and stay
    // stable if the site ever moves hosts.
    format: 'directory',
  },
});
