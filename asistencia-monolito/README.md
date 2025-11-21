# 🏢 Sistema de Asistencia - Monolito

Sistema monolítico para procesar y gestionar archivos Excel de asistencia de empleados, desplegado en Raspberry Pi 5.

---

## 📋 **Descripción del Proyecto**

Este proyecto automatiza el procesamiento de archivos Excel de asistencia generados por relojes checadores. El sistema:

- ✅ Recibe archivos Excel con múltiples hojas (Resumen, Registros, grupos de empleados)
- ✅ Extrae y normaliza todas las marcas de entrada/salida
- ✅ Calcula retardos, horas extra, faltas y tiempo trabajado
- ✅ Compara los cálculos propios vs los totales oficiales del Excel
- ✅ Genera reportes y estadísticas de asistencia

---

## 🏗️ **Arquitectura**

**Tipo:** Monolito en contenedor Docker

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **Frontend** | React + TypeScript + Vite | Interfaz de usuario |
| **Backend** | Node.js v23.7.0 + Express.js | API REST y lógica de negocio |
| **Base de Datos** | SQLite 3 | Almacenamiento local (archivo `data/asistencia.db`) |
| **Procesamiento Excel** | ExcelJS | Lectura y extracción de datos |
| **Subida de Archivos** | Multer | Manejo de archivos Excel |

---

## 🚀 **Tecnologías y Versiones**

- **Node.js:** v23.7.0
- **npm:** v10.9.2
- **Gestión de Versiones:** NVM (Node Version Manager)
- **Contenedorización:** Docker (multi-arquitectura: amd64 + arm64)
- **Control de Versiones:** Git + GitHub

---

## 📦 **Requisitos Previos**

### **Para Desarrollo:**
- Windows 10/11 con **WSL2** (Debian/Ubuntu)
- **Docker Desktop** instalado y configurado con WSL2
- **NVM** instalado en WSL2
- **Node.js v23.7.0** y **npm v10.9.2** (vía NVM)
- Cuenta en **Docker Hub** (para despliegue multi-arquitectura)

### **Para Producción (Raspberry Pi 5):**
- Raspberry Pi 5 con Debian/Raspberry Pi OS
- Docker instalado
- SSD principal de 1TB + 2 SSD externos de 1TB (backup)
- IP fija configurada en el router
- PM2 (opcional, para gestión de procesos)

---

## 🛠️ **Instalación y Configuración**

### **1. Clonar el Repositorio**

```bash
git clone https://github.com/tu-usuario/asistencia-monolito.git
cd asistencia-monolito
```

### **2. Configurar Node.js (Solo si desarrollas sin Docker)**

```bash
# Instalar y usar la versión correcta de Node
nvm install 23.7.0
nvm use 23.7.0

# Verificar versiones
node -v  # Debe mostrar v23.7.0
npm -v   # Debe mostrar v10.9.2
```

---

## 🐳 **Uso con Docker**

### **Desarrollo Local (Tu PC)**

```bash
# Construir y levantar el contenedor
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener el contenedor
docker-compose down

# Reconstruir si hay cambios
docker-compose up -d --build
```

**Acceder a la aplicación:** http://localhost:3005

**Nota:** El puerto es 3005 en lugar de 3000 para evitar conflictos con otros proyectos.

---

### **Construcción Multi-Arquitectura (Para Docker Hub)**

**Configuración inicial (solo primera vez):**

```bash
# 1. Crear builder multi-arquitectura
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 2. Login a Docker Hub
docker login
# Usuario: tu usuario
```

**Construir y subir imagen:**

```bash
# Construir para amd64 (PC) y arm64 (Raspberry Pi) y subir
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t usuario/asistencia-monolito:latest \
  --push \
  .
```

---

### **Despliegue en Raspberry Pi (Producción)**

```bash
# 1. Clonar el repositorio (solo primera vez)
git clone https://github.com/tu-usuario/asistencia-monolito.git
cd asistencia-monolito

# 2. Descargar la imagen desde Docker Hub
docker-compose -f docker-compose.prod.yml pull

# 3. Levantar el contenedor
docker-compose -f docker-compose.prod.yml up -d

# 4. Verificar estado
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

**Acceder desde la red local:** http://192.168.1.X:3000 (IP de tu Raspberry Pi)

**Nota:** En producción (RPi) se usa el puerto 3000 por defecto. En desarrollo local usamos 3005.

---

## 📂 **Estructura del Proyecto**

```
asistencia-monolito/
├── 📄 Dockerfile                    # Construcción multi-arquitectura
├── 📄 docker-compose.yml           # Desarrollo local
├── 📄 docker-compose.prod.yml      # Producción (Raspberry Pi)
├── 📄 package.json                 # Dependencias del backend
├── 🚀 index.js                     # Punto de entrada del servidor
│
├── 📁 config/
│   └── db.js                       # Configuración de SQLite (7 tablas)
│
├── 📁 server/
│   └── api.js                      # Rutas API (upload, status, etc.)
│
├── 📁 client/                      # Frontend React
│   ├── vite.config.ts              # Configuración de Vite (con proxy)
│   ├── package.json                # Dependencias del frontend
│   └── src/
│       ├── App.tsx                 # Componente principal
│       └── ...
│
├── 📁 data/                        # Datos persistentes (ignorado en Git)
│   ├── asistencia.db               # Base de datos SQLite
│   └── uploads/                    # Archivos Excel subidos
│
└── 📁 DOCS/                        # Documentación adicional
    └── setup-log.md                # Histórico de configuración
```

---

## 🗄️ **Base de Datos (SQLite)**

El sistema utiliza **7 tablas** para capturar toda la información del Excel:

1. **`periodos`** - Información de cada archivo Excel cargado
2. **`empleados`** - Datos básicos de empleados
3. **`horarios_turnos`** - Configuración de turnos por periodo
4. **`marcas_crudas`** - Marcas del reloj checador (hoja "Registros")
5. **`asistencia_diaria`** - Datos procesados día por día (calculados)
6. **`totales_excel`** - Totales oficiales del Excel (hoja "Resumen")
7. **`logs_importacion`** - Historial de importaciones

**Ubicación:** `data/asistencia.db` (se crea automáticamente al iniciar)

---

## 🔌 **API Endpoints**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/status` | Estado del servidor y conexión a BD |
| `POST` | `/api/upload-excel` | Subir y procesar archivo Excel |

---

## 🔄 **Flujo de Trabajo**

### **1. Desarrollo (en tu PC con WSL2)**
```bash
# Editar código → docker-compose up -d → Probar → Commit
```

### **2. Construcción Multi-Arquitectura**
```bash
# Construir para amd64 + arm64 → Subir a Docker Hub
docker buildx build --platform linux/amd64,linux/arm64 -t usuario/asistencia-monolito:latest --push .
```

### **3. Despliegue en Raspberry Pi**
```bash
# Pull desde Docker Hub → Levantar contenedor
docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 **Estado del Proyecto**

**Fase Actual:** ✅ Sistema Base Funcionando y Probado

- [x] Arquitectura definida
- [x] Dockerfile multi-arquitectura
- [x] Base de datos (7 tablas)
- [x] API básica (subida de archivos)
- [x] Docker Compose (desarrollo y producción)
- [x] **Sistema probado y operacional** ✨
- [x] **Base de datos creada (64KB, 7 tablas)** ✨
- [x] **API REST respondiendo correctamente** ✨
- [ ] Lógica de procesamiento de Excel (próximo paso)
- [ ] Interfaz de usuario React
- [ ] Tests (TDD)

**Acceso al Sistema:** http://localhost:3005  
**API Status:** http://localhost:3005/api/status

Ver detalles completos y errores resueltos en: [`DOCS/setup-log.md`](./DOCS/setup-log.md)

---

## 🐛 **Resolución de Problemas**

### **El contenedor no arranca:**
```bash
# Ver logs detallados
docker-compose logs -f

# Verificar estado
docker-compose ps
```

### **Error: "port is already allocated"**
**Causa:** Otro contenedor está usando el puerto 3005 (o 3000).

**Solución:**
```bash
# Ver qué contenedor usa el puerto
docker ps -a | grep 3005

# Cambiar el puerto en docker-compose.yml
ports:
  - "3006:3000"  # Usar otro puerto disponible
```

### **El contenedor se reinicia constantemente (Restarting)**
**Causa:** Error en el código que hace que Node.js crashee.

**Solución:**
```bash
# Ver logs sin -d para ver el error
docker-compose up

# O inspeccionar logs del contenedor
docker logs asistencia-monolito-dev
```

### **Error: "Invalid containerPort" en Docker build**
**Causa:** Comentario inline en el comando `EXPOSE` del Dockerfile.

**Solución:** Mover comentarios a líneas separadas.

### **Error de conexión a la base de datos:**
- Verificar que la carpeta `data/` exista
- Verificar permisos de escritura
- Verificar que el volumen esté montado: `docker-compose ps`

### **Build muy lento:**
- Verificar que existe `.dockerignore`
- Limpiar imágenes antiguas: `docker system prune -a`
- Limpiar caché de build: `docker-compose build --no-cache`

### **Frontend no se ve / Página en blanco:**
- Verificar que React se compiló correctamente en los logs
- Verificar que la carpeta `build/` existe en el contenedor:
  ```bash
  docker exec asistencia-monolito-dev ls -la /app/build
  ```

Para más detalles sobre errores específicos y sus soluciones, consulta: [`DOCS/setup-log.md`](./DOCS/setup-log.md#-pruebas-del-sistema-y-errores-encontrados)

---

## 📝 **Licencia**

(Por definir)

---

## 👥 **Autor**

Desarrollado por el equipo de soporte técnico.

**Docker Hub:** [usuario](https://hub.docker.com/u/usuario)

---

## 📚 **Documentación Adicional**

- [Histórico de Configuración](./DOCS/setup-log.md)
- [Estructura del Excel de Asistencia](./DOCS/excel-structure.md) *(por crear)*
- [Guía de Desarrollo con TDD](./DOCS/tdd-guide.md) *(por crear)*

