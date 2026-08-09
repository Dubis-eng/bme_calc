import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  define: {
    'process.env': {},
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    outDir: 'build',
  },
});
