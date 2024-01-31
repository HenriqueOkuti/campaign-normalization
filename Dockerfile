# Description: Dockerfile for the Node.js application.
FROM node:21-alpine


WORKDIR /app

COPY package.json ./

RUN npm i --quiet

COPY . .

RUN npm run build

CMD ["npm", "run", "build:run"]

