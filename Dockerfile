# ============================================================
# DOCKERFILE - GPX Processor Frontend
# ============================================================
# Build React avec Vite → Servir avec Nginx
# Railway détecte ce Dockerfile automatiquement
# ============================================================

# --- Étape 1 : Build ---
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# L'URL du backend sera injectée par Railway comme variable d'env
# au moment du build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# --- Étape 2 : Servir avec Nginx ---
FROM nginx:alpine

# Config Nginx pour SPA (toutes les routes → index.html)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copier le build
COPY --from=builder /app/dist /usr/share/nginx/html

CMD ["sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
