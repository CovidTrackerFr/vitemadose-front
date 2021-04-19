FROM node:14 as base
#ENV NODE_ENV=production

WORKDIR /app
ENV PATH /app/node_modules/.bin:${PATH}

COPY ["package.json", "package-lock.json*", "./"]

RUN npm install



FROM base as build

COPY . .

RUN npm run build
