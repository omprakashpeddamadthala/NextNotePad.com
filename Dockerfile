# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Copy dependency files first (leverages Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
ARG VITE_GOOGLE_CLIENT_ID="257847266541-iaqa70vcvoo61fbuk2aontn2edrpcagb.apps.googleusercontent.com"
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# Stage 2: Serve with nginx (ultra-lightweight ~25MB)
FROM nginx:stable-alpine AS production
LABEL maintainer="NextNotePad.com"
LABEL description="NextNotePad.com - Write. Code. Create — Anywhere."

# Remove default nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appgroup /var/run/nginx.pid

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
