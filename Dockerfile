# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Builds SvelteKit (adapter-auto will choose node on CI)
RUN npm run build

# ---- Run stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Keep node_modules to satisfy any runtime requires from the built server
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./

EXPOSE 3000
CMD ["node", "build"]
