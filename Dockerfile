# ─────────────────────────────────────────────────────────
# Etapa 1: Build — compila la app con Vite
# ─────────────────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Copiamos solo los manifiestos primero para aprovechar la
# caché de capas de Docker (si no cambian, no reinstala deps)
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código
COPY . .

# La URL del backend se inyecta en tiempo de build.
# Se puede sobreescribir con --build-arg al construir la imagen.
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_NAME=SuiteCore
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_NAME=$VITE_APP_NAME

RUN npm run build

# ─────────────────────────────────────────────────────────
# Etapa 2: Producción — sirve /dist con Nginx
# ─────────────────────────────────────────────────────────
FROM nginx:alpine AS production

# Copiamos los archivos compilados
COPY --from=build /app/dist /usr/share/nginx/html

# Copiamos nuestra configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
