# 1. Compilación de React + TypeScript
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Inyección de las variables de entorno para producción
ARG VITE_API_BASE_URL
ARG VITE_LOGIN_MASTER_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_LOGIN_MASTER_KEY=$VITE_LOGIN_MASTER_KEY

RUN npm run build

# 2. Servidor Nginx ultra optimizado
FROM nginx:alpine
RUN sed -i 's/listen       80;/listen       1500;/g' /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 1500
CMD ["nginx", "-g", "daemon off;"]