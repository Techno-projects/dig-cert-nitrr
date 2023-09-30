FROM node:20

WORKDIR /cache

COPY package.json .
COPY package-lock.json .
RUN npm install

WORKDIR /frontend

ENV PATH /frontend/node_modules/.bin:$PATH

COPY . .

EXPOSE 3000