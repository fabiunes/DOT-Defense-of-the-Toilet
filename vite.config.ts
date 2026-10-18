import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative base so the build works on GitHub Pages (served from /<repo>/).
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
  },
});
