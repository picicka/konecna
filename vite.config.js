import { defineConfig } from 'vite';

// Hra je statický web. Zdroj je ve src/ (včetně index.html), statická grafika ve static/ (atlasy z npm run art),
// build jde do public/, které Herd servíruje jako konecna.test a GitHub Pages nasazuje jako picicka.github.io/konecna.
// Relativní base, aby build fungoval na obou místech.
export default defineConfig({
    root: 'src',
    publicDir: '../static',
    base: './',
    build: { outDir: '../public', emptyOutDir: true, target: 'es2022' },
});
