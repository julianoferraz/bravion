# ============================================
# Dockerfile — Bravion Global Frontend
# Multi-stage build para produção
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci --production=false

# Copiar código-fonte
COPY . .

# Build de produção
RUN npm run build

# Stage 2: Servir com Nginx
FROM nginx:alpine AS production

# Copiar configuração do Nginx (container-specific)
COPY nginx-container.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
