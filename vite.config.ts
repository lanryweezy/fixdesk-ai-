import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import react from '@vitejs/plugin-react';
import esbuild from 'esbuild';

export default defineConfig({
  plugins: [
    react(),
    electron({
      entry: 'electron/main.ts',
      vite: {
        build: {
          minify: false,
          rollupOptions: {
            plugins: [
              {
                name: 'esbuild-for-main',
                async buildEnd() {
                  await esbuild.build({
                    entryPoints: ['electron/main.ts'],
                    bundle: true,
                    outfile: 'dist-electron/main.js',
                    platform: 'node',
                    external: ['electron', 'robotjs', '@google/generative-ai'],
                  });
                },
              },
            ],
          },
        },
      },
    }),
  ],
  build: {
    outDir: 'dist',
  },
});