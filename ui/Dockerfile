FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_GATEWAY_URL is baked at build time into the JS bundle
ARG VITE_GATEWAY_URL=http://localhost:4000
ENV VITE_GATEWAY_URL=${VITE_GATEWAY_URL}

RUN npm run build

# Runtime: nginx serving static assets
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Basic nginx config is fine for this SPA; default serves index.html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
