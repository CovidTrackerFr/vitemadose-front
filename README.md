# Boostrap

Install dependencies :
`npm install`

Run vite (we're obviously using vitejs for vite-ma-dose !) :
`npm run dev` or `vite` (see `package.json` scripts)

Open your browser : http://localhost:3000/
and enjoy live reload / on-the-fly typescript compilation

# Production

Package for production with `vite build` : `dist` directory will contain minified assets for production

For debug purposes, if you want to generate sourcemaps for production build, you can configure
`vite.config.ts` file by changing the `build.sourcemap` config property to `true`

# Mobile apps

See [dedicated readme in `mobile/` directory](mobile/README.md)
