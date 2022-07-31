import * as path from 'path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solidPlugin()],
  server: {
    port: 3000
  },
  build: {
    target: 'esnext'
  },
  resolve: {
    alias: [
      { find: '@/utils', replacement: path.resolve(__dirname, 'libs/utils') },
      { find: '@/constants', replacement: path.resolve(__dirname, './libs/constants') }
    ]
  }
});
