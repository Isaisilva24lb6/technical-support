# 🐳 Guía Completa: TODO con Docker

**Todo el desarrollo y producción en contenedores Docker**

---

## 🎯 **Filosofía: Docker First**

- ✅ Desarrollo en contenedor
- ✅ Testing en contenedor
- ✅ Producción en contenedor
- ✅ Sin instalar Node.js localmente

---

## 📦 **PASO 1: Build de la Imagen**

### **Build Local (Desarrollo)**

```bash
cd /home/rubenisai24/mis-proyectos/technical-support/asistencia-monolito

# Construir imagen
docker-compose build

# Ver imagen creada
docker images | grep asistencia
```

**Salida esperada:**
```
asistencia-monolito-dev  latest  abc123  2 minutes ago  250MB
```

---

## 🚀 **PASO 2: Levantar Contenedor**

### **Iniciar Servicios**

```bash
# Iniciar en segundo plano
docker-compose up -d

# Ver estado
docker-compose ps
```

**Salida esperada:**
```
NAME                      STATUS              PORTS
asistencia-monolito-dev   Up 10 seconds       0.0.0.0:3005->3000/tcp
```

### **Ver Logs**

```bash
# Logs en tiempo real
docker-compose logs -f

# Solo últimas 50 líneas
docker-compose logs --tail=50

# Logs del último minuto
docker-compose logs --since=1m
```

---

## 🧪 **PASO 3: Probar el Parser (Dentro de Docker)**

### **Comando Básico**

```bash
# Test con archivo de ejemplo
docker-compose exec asistencia-app npm run test:parser /app/data/uploads/empleados/empleados_1763789660145.xlsx
```

### **Listar Archivos Disponibles**

```bash
# Ver qué archivos hay disponibles
docker-compose exec asistencia-app ls -lh /app/data/uploads/empleados/
```

### **Probar con Otro Archivo**

```bash
# Reemplaza NOMBRE_ARCHIVO con el archivo real
docker-compose exec asistencia-app npm run test:parser /app/data/uploads/empleados/NOMBRE_ARCHIVO.xlsx
```

---

## 🔧 **PASO 4: Comandos Útiles de Docker**

### **Ejecutar Comandos dentro del Contenedor**

```bash
# Shell interactivo (entrar al contenedor)
docker-compose exec asistencia-app sh

# Dentro del contenedor puedes hacer:
ls -la
npm run test:parser /app/data/uploads/empleados/archivo.xlsx
cat package.json
exit
```

### **Ver Estructura de Archivos**

```bash
# Ver carpetas del proyecto
docker-compose exec asistencia-app ls -la /app/

# Ver parsers
docker-compose exec asistencia-app ls -la /app/server/parsers/

# Ver utilidades
docker-compose exec asistencia-app ls -la /app/server/utils/
```

### **Verificar Dependencias**

```bash
# Ver versión de Node
docker-compose exec asistencia-app node --version

# Ver dependencias instaladas
docker-compose exec asistencia-app npm list --depth=0

# Verificar date-fns
docker-compose exec asistencia-app npm list date-fns
```

---

## 🔄 **PASO 5: Ciclo de Desarrollo**

### **Flujo Completo**

```bash
# 1. Editar código en tu editor (VS Code)
# 2. Reconstruir imagen con cambios
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 3. Probar cambios
docker-compose exec asistencia-app npm run test:parser /app/data/uploads/empleados/archivo.xlsx

# 4. Ver logs si hay errores
docker-compose logs -f
```

### **Rebuild Rápido (Sin Caché)**

```bash
# Si hiciste cambios en código JavaScript
docker-compose build --no-cache
docker-compose up -d
```

### **Restart del Contenedor**

```bash
# Reiniciar sin rebuild
docker-compose restart

# Ver logs después del restart
docker-compose logs -f
```

---

## 🗄️ **PASO 6: Acceso a Datos Persistentes**

### **Los datos están en la carpeta `data/`**

```bash
# Ver archivos subidos (desde tu máquina host)
ls -lh data/uploads/empleados/

# Ver base de datos
ls -lh data/asistencia.db

# Ver desde dentro del contenedor
docker-compose exec asistencia-app ls -lh /app/data/
```

### **Volúmenes Persistentes**

El `docker-compose.yml` tiene:
```yaml
volumes:
  - ./data:/app/data
```

Esto significa:
- ✅ Archivos en `./data/` persisten aunque elimines el contenedor
- ✅ Puedes ver/editar archivos desde tu PC
- ✅ El contenedor los ve en `/app/data/`

---

## 🌐 **PASO 7: Acceder a la Aplicación**

### **Desde tu PC**

```bash
# API
curl http://localhost:3005/api/status

# Frontend (si está built)
xdg-open http://localhost:3005
```

### **Desde la Red Local**

```bash
# Obtener IP de tu PC
ip addr show

# Acceder desde otro dispositivo
# http://TU_IP:3005
```

---

## 🤖 **PASO 8: Ollama en Docker (OPCIONAL)**

### **Crear docker-compose con Ollama**

```bash
# Crear nuevo archivo
nano docker-compose.ollama.yml
```

**Contenido:**

```yaml
version: '3.8'

services:
  asistencia-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: asistencia-monolito-dev
    ports:
      - "3005:3000"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OLLAMA_ENABLED=true
      - OLLAMA_HOST=http://ollama:11434
      - OLLAMA_MODEL=llama3.2:3b
    networks:
      - asistencia-network
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    container_name: ollama-local
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    networks:
      - asistencia-network
    restart: unless-stopped

volumes:
  ollama_data:

networks:
  asistencia-network:
    driver: bridge
```

### **Usar con Ollama**

```bash
# Levantar todo (app + ollama)
docker-compose -f docker-compose.ollama.yml up -d

# Esperar 30 segundos para que Ollama arranque

# Descargar modelo dentro del contenedor Ollama
docker-compose -f docker-compose.ollama.yml exec ollama ollama pull llama3.2:3b

# Verificar que funciona
docker-compose -f docker-compose.ollama.yml exec ollama ollama list

# Probar parser (ahora con IA habilitada)
docker-compose -f docker-compose.ollama.yml exec asistencia-app npm run test:parser /app/data/uploads/empleados/archivo.xlsx
```

---

## 📊 **PASO 9: Monitoreo y Debugging**

### **Ver Recursos Usados**

```bash
# CPU y memoria del contenedor
docker stats asistencia-monolito-dev

# Información detallada
docker-compose top
```

### **Inspeccionar Contenedor**

```bash
# Ver configuración completa
docker inspect asistencia-monolito-dev

# Ver solo IP del contenedor
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' asistencia-monolito-dev
```

### **Debugging en Vivo**

```bash
# Entrar al contenedor con shell
docker-compose exec asistencia-app sh

# Una vez dentro:
cd /app
ls -la
node test-parser.js /app/data/uploads/empleados/archivo.xlsx
npm run dev  # Si quieres correr en modo desarrollo
```

---

## 🧹 **PASO 10: Limpieza**

### **Detener Servicios**

```bash
# Detener contenedores
docker-compose down

# Detener y eliminar volúmenes (¡CUIDADO! Borra datos)
docker-compose down -v
```

### **Limpiar Imágenes Antiguas**

```bash
# Ver imágenes
docker images

# Eliminar imágenes no usadas
docker image prune -a

# Eliminar TODO (contenedores, imágenes, volúmenes)
docker system prune -a --volumes
```

### **Rebuild Completo**

```bash
# Eliminar todo y empezar de cero
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

---

## 🚢 **PASO 11: Deploy Multi-Arquitectura (Producción)**

### **Build para Raspberry Pi + PC**

```bash
# Crear builder multi-arquitectura (solo primera vez)
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# Login a Docker Hub
docker login
# Usuario: tu-usuario-dockerhub
# Password: [tu contraseña]

# Build y push para ambas arquitecturas
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  --push \
  .
```

### **En Raspberry Pi (Producción)**

```bash
# Clonar repo
git clone https://github.com/tu-usuario/asistencia-monolito.git
cd asistencia-monolito

# Pull imagen desde Docker Hub
docker-compose -f docker-compose.prod.yml pull

# Iniciar
docker-compose -f docker-compose.prod.yml up -d

# Verificar
docker-compose -f docker-compose.prod.yml ps
```

---

## 📋 **RESUMEN DE COMANDOS ESENCIALES**

```bash
# ====================================
# COMANDOS DIARIOS
# ====================================

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Probar parser
docker-compose exec asistencia-app npm run test:parser /app/data/uploads/empleados/archivo.xlsx

# Entrar al contenedor
docker-compose exec asistencia-app sh

# Detener
docker-compose down

# ====================================
# DESARROLLO
# ====================================

# Rebuild después de cambios
docker-compose build --no-cache
docker-compose up -d

# Ver archivos disponibles
docker-compose exec asistencia-app ls -lh /app/data/uploads/empleados/

# Reiniciar solo el contenedor
docker-compose restart

# ====================================
# DEBUGGING
# ====================================

# Ver recursos
docker stats

# Logs detallados
docker-compose logs --tail=100 -f

# Ejecutar Node directamente
docker-compose exec asistencia-app node test-parser.js /app/data/...

# ====================================
# LIMPIEZA
# ====================================

# Detener todo
docker-compose down

# Limpiar imágenes viejas
docker image prune -a

# Reset completo
docker-compose down
docker system prune -a
```

---

## 🎯 **PRÓXIMOS PASOS**

### **1. Probar Parser Ahora**

```bash
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Test
docker-compose exec asistencia-app npm run test:parser /app/data/uploads/empleados/empleados_1763789660145.xlsx
```

### **2. Ver Resultados**

```bash
# Si todo salió bien, verás:
╔════════════════════════════════════════════════════════════╗
║  📊 RESULTADO DEL PARSEO                                   ║
╚════════════════════════════════════════════════════════════╝

✅ Success: true
📊 Estadísticas: ...
```

### **3. Integrar en API**

Editar `server/api.js` para usar el parser en tus endpoints.

---

## ❓ **Troubleshooting**

### **Error: "Cannot find module 'date-fns'"**

**Solución:**
```bash
docker-compose build --no-cache
```

### **Error: "Permission denied"**

**Solución:**
```bash
sudo chown -R $USER:$USER data/
```

### **Contenedor se reinicia constantemente**

**Ver logs:**
```bash
docker-compose logs -f
```

**Rebuild sin caché:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

¿Listo para probar? Ejecuta:

```bash
docker-compose build
docker-compose up -d
docker-compose logs -f
```



