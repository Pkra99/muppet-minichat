FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV GATEWAY_PORT=4000
ENV RESPONDER_URL=http://responder:4001/respond

COPY --from=build /app/dist ./dist
COPY package*.json ./

# Only prod deps if you want to trim the image further
RUN npm ci --omit=dev

EXPOSE 4000

CMD ["node", "dist/index.js"]
