FROM node:20

WORKDIR /dig-cert-nitrr/cache

COPY package.json .
COPY package-lock.json .
RUN npm install

WORKDIR /dig-cert-nitrr/frontend

ENV PATH /dig-cert-nitrr/frontend/node_modules/.bin:$PATH

COPY . .

EXPOSE 3000