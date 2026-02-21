FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# Servir avec un serveur statique simple
FROM node:20-alpine
RUN npm install -g serve
COPY --from=builder /app/dist /app/dist

CMD ["sh", "-c", "serve -s /app/dist -l $PORT"]