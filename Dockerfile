# Multi-stage: build frontend, then serve static + API from one Node image.
FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package*.json ./
RUN npm install || npm ci
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Backend deps
COPY backend/package*.json ./
RUN npm install --omit=dev || npm ci --omit=dev

# Backend source + config
COPY backend/src ./src
COPY backend/server.js ./
COPY backend/.env ./

# Prebuilt frontend
COPY --from=frontend-build /build/dist ./public

# Runtime dirs (created at boot too)
RUN mkdir -p temp data

EXPOSE 5000
CMD ["node", "server.js"]
