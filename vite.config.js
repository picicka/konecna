import { defineConfig } from 'vite';

// Hra je statický web: relativní base, aby build fungoval na GitHub Pages (picicka.github.io/konecna) i kdekoli jinde.
export default defineConfig({
    base: './',
    build: { target: 'es2022' },
});
