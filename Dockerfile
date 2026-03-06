FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS backend-deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=backend-deps /app/server/node_modules ./node_modules
COPY server ./ 
COPY --from=frontend-builder /app/dist /app/dist

RUN mkdir -p /app/server/uploads/media

EXPOSE 3001

CMD ["node", "start-production.mjs"]
