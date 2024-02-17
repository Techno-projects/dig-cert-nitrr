FROM node:20 as build

WORKDIR /frontend

COPY package.json .
COPY package-lock.json .
RUN npm install

ENV PATH /frontend/node_modules/.bin:$PATH

COPY . .


EXPOSE 3000
