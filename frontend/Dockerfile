# Build the SPA, then serve it with nginx, which also proxies /api to the backend.
FROM node:26.13.0-alpine AS build

WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# No git hooks inside the image.
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

FROM nginx:1.30.6-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
