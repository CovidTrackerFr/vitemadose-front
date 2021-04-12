import { defineConfig } from 'vite'
import autoprefixer = require('autoprefixer')


// https://vitejs.dev/config/
export default ({ command, mode }) => ({
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
