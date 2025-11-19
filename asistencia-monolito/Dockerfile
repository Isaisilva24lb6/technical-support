# -----------------------------------------------------------------
# ETAPA 1: BUILD - Compila la aplicación Frontend (React)
# Usamos una imagen base de Node para construir los assets estáticos.
# Esta etapa solo requiere construir los archivos, no importa la arquitectura final.
# -----------------------------------------------------------------
FROM node:23.7.0-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias
COPY package.json package-lock.json ./

# Instala las dependencias. Esto es rápido gracias al package-lock.json
# Nota: Si tu proyecto React estuviera en una subcarpeta (ej. /client),
# deberías usar COPY y WORKDIR para ir allí.
RUN npm install

# Copia el resto del código fuente (Incluye código de React y Express)
COPY . .

# Comando para compilar el Frontend de React.
# Asume que el script 'build' está en tu package.json y compila a la carpeta 'build'.
# (Tendrás que configurar este script en tu package.json)
RUN npm run build

# -----------------------------------------------------------------
# ETAPA 2: PRODUCTION - Imagen final ligera para la Raspberry Pi y PC
# Usamos una imagen base más pequeña y específica para el despliegue.
# La arquitectura de esta imagen será definida al ejecutar 'docker buildx'.
# -----------------------------------------------------------------
FROM node:23.7.0-alpine

# Argumento para especificar la arquitectura de construcción, esencial para sqlite3.
ARG TARGETARCH

# Establece el directorio de trabajo
WORKDIR /app

# 1. Copia solo los archivos esenciales del backend (Express) y los assets compilados
# Copia los archivos del backend
COPY package.json package-lock.json ./
COPY index.js ./ # Suponiendo que tu script principal de Node es index.js
COPY ./backend ./backend # Si tienes una carpeta de backend

# Copia los assets de React compilados desde la etapa 'builder'
COPY --from=builder /app/build ./build

# 2. Instala solo las dependencias de producción.
# Esto asegura que sqlite3 se compile para la arquitectura correcta (arm64 o amd64).
# Aquí es donde el TARGETARCH se vuelve crítico para los binarios nativos.
RUN npm install --omit=dev

# 3. Configuración final
EXPOSE 3000 # Puerto en el que correrá Express.js

# Comando para arrancar el servidor Node.js
CMD ["node", "index.js"]
