FROM node:20-alpine AS build
WORKDIR /app

# install deps
COPY front-end/package*.json ./
RUN npm install

# copy source
COPY front-end/ .

# set API base for client bundle; nginx proxies /api to the backend
ARG PUBLIC_API_BASE=/api
ENV PUBLIC_API_BASE=${PUBLIC_API_BASE}

# build with Vite (SvelteKit plugin + adapter-static will output to /app/build)
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
