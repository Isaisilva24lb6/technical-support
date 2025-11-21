# -----------------------------------------------------------------
# ETAPA 1: BUILD - Compila la aplicación Frontend (React)
# Usamos una imagen base de Node para construir los assets estáticos.
# Esta etapa solo requiere construir los archivos, no importa la arquitectura final.
# -----------------------------------------------------------------
FROM node:23.7.0-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de definición de dependencias (raíz y cliente)
COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/

# Instala las dependencias de la raíz
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
COPY index.js ./
COPY ./server ./server
COPY ./config ./config

# Copia los assets de React compilados desde la etapa 'builder' (Vite compila a client/dist)
COPY --from=builder /app/client/dist ./build

# 2. Instala solo las dependencias de producción.
# Esto asegura que sqlite3 se compile para la arquitectura correcta (arm64 o amd64).
# Aquí es donde el TARGETARCH se vuelve crítico para los binarios nativos.
RUN npm install --omit=dev

# Crea la carpeta para los archivos Excel subidos
RUN mkdir -p data/uploads

# 3. Configuración final
# Puerto en el que correrá Express.js
EXPOSE 3000

# Comando para arrancar el servidor Node.js
CMD ["node", "index.js"]
