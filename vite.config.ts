import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'
import autoprefixer = require('autoprefixer')

// https://vitejs.dev/config/
export default ({ command, mode }) => ({
  plugins: [
    legacy()
  ],
  build: {
    sourcemap: false
  },
  css: {
    postcss: {
      plugins: [
        autoprefixer()
      ]
    }
  }
});
