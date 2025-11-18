# syntax=docker/dockerfile:1

########################
# Build stage
########################
FROM node:20-alpine AS build

# Work in app root (this is where package.json lives)
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the sources and build
COPY . .
RUN npm run build

########################
# Runtime stage (nginx)
########################
FROM nginx:alpine

# Static files go here for nginx
COPY --from=build /app/build /usr/share/nginx/html

# Use our custom nginx config (must be in repo root as nginx.conf)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
