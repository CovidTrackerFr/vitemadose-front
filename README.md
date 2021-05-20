![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)

# Contribuer

Merci :) Ton aide est la bienvenue !

Le guide de contribution se trouve dans le fichier [CONTRIBUTING.md](./CONTRIBUTING.md)

# Requirements

You need minimum `node@12` to be able to properly run `ViteJS`

Don't hesitate to install multiple `node` version in your dev environment using [n](https://www.npmjs.com/package/n)

# Boostrap

Install dependencies :
`npm ci`

Run vite (we're obviously using vitejs for vite-ma-dose !) :
`npm run dev` or `vite` (see `package.json` scripts)

Open your browser : http://localhost:3000/
and enjoy live reload / on-the-fly typescript compilation

## Alternative: Running with docker
If you don't want to install node.js on your machine, you can isolate it with [docker](https://www.docker.com/get-started):

Start docker container (that executes `npm run dev`) :
`docker-compose up`

### Docker how-to
The first time `docker-compose up` is run, it will build the `base` docker image with `npm install` inside `node:14` docker image.

When the `package*.json` have changed, you need to rebuild the base image:
```
docker-compose down --volumes
docker-compose build
```
.. then start again with `docker-compose up`.


To inspect what happens inside : `docker-compose exec frontend bash`

# Production

Package for production with `vite build` : `dist` directory will contain minified assets for production

For debug purposes, if you want to generate sourcemaps for production build, you can configure
`vite.config.ts` file by changing the `build.sourcemap` config property to `true`

# Mobile apps

See [vitemadose-android](https://github.com/CovidTrackerFr/vitemadose-android) and [vitemadose-ios](https://github.com/CovidTrackerFr/vitemadose-ios).

# Development workflow

- `main` is automatically deployed on https://vitemadose.covidtracker.fr/

  => Push on this branch only when you're ready.

- `dev` is the development branch, start any new feature/fix from it.

  We generally try to create dedicated feature branches with issue number in it, except when the
  commit is really small

# Stack pointers

We're using :

  - **Typescript** as the main language => [typescript for js programmers](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
  - **lit-element** as the web-component library => https://lit.dev/
  - **pagejs** as our routing library => [documentation](https://visionmedia.github.io/page.js/)
  - **Bootstrap** as the CSS library => https://getbootstrap.com/docs/5.0/getting-started/introduction/ ([icons](https://icons.getbootstrap.com/))
  - **SASS** as CSS transpiler => [documentation](https://sass-lang.com/documentation)
  - **ViteJS** for the development/production build toolchain => [guide](https://vitejs.dev/guide/)
