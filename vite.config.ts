import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // Relative base so the build works on GitHub Pages (served from /<repo>/).
  base: './',
  plugins: [react()],
  define: {
    // Shown on the Home screen as "v<major>.<minor>".
    __APP_VERSION__: JSON.stringify(pkg.version.split('.').slice(0, 2).join('.')),
  },
  test: {
    environment: 'node',
  },
});
