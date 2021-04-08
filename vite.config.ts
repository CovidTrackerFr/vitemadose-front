import { defineConfig } from 'vite'


// https://vitejs.dev/config/
export default ({ command, mode }) => ({
  base: (mode === 'development')?'/':'/vitemadose/',
  build: {
    sourcemap: true

  }
});
