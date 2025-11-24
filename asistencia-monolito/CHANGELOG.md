# 📋 CHANGELOG

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [1.0.1] - 2025-11-23

### 🐛 Corregido
- **Contenedor Docker reiniciándose constantemente**
  - Problema: El contenedor mostraba estado "Restarting" con ExitCode 0
  - Causa: Imagen de Docker corrupta por construcción con caché problemática
  - Solución: Reconstrucción completa sin caché (`docker compose build --no-cache`)
  - Duración del problema: Ciclo de reinicios infinito (~24+ reinicios)
  - Estado: ✅ Resuelto y documentado

### 🔒 Seguridad
- **Eliminación de información sensible de la documentación**
  - Removidas todas las referencias a nombres de usuario de Docker Hub
  - Reemplazados con placeholders genéricos (`tu-usuario-dockerhub`)
  - Archivos actualizados:
    - `README.md`
    - `docker-compose.prod.yml`
    - `DOCS/frontend-architecture.md`
    - `DOCS/setup-log.md`
    - `DOCS/employee-management.md`
  - Removidas rutas absolutas con nombres de usuario del sistema
  - Estado: ✅ Repositorio listo para push seguro

### 📚 Documentación
- Agregado [`DOCS/troubleshooting-docker.md`](./DOCS/troubleshooting-docker.md) - Guía completa de solución de problemas con Docker
- Agregado [`DOCS/docker-hub-setup.md`](./DOCS/docker-hub-setup.md) - Guía de configuración de Docker Hub
- Actualizado `QUICK_START.md` con sección de problemas comunes de Docker
- Actualizado `README.md` con:
  - Referencia a documentación de troubleshooting
  - Advertencia sobre configuración de Docker Hub antes de hacer push
  - Reorganización de la sección de documentación adicional

---

## [1.0.0] - 2025-11-21

### ✅ Agregado

#### **Módulo de Gestión de Empleados (Completo)**
- Sistema de importación de empleados desde archivos Excel
- Parser inteligente que detecta automáticamente:
  - Cabeceras en cualquier fila (primeras 10 filas)
  - Múltiples hojas de Excel (busca "SABANAS", "PERSONAL", "EMPLEADOS")
  - Correos como hipervínculos (formato `mailto:`)
  - Datos mal formateados (saltos de línea, espacios múltiples)
  - Correos con errores (`,` en vez de `.`, `@@` duplicados)
  - Columnas de números con variaciones (`N°`, `Nº`, `#`, `No.`)
- Validación manual con tabla interactiva antes de guardar
- Prevención de duplicados por número de empleado o correo
- Detección y corrección automática de:
  - Comas en dominios → puntos (`.`)
  - Arroba duplicada (`@@` → `@`)
  - Espacios alrededor de `@`
  - Saltos de línea dentro de celdas

#### **Frontend**
- Interfaz React con diseño glassmorphism
- Video de fondo corporativo (solo en página principal)
- Componente `FileUploader` con drag & drop
- Componente `DataValidationTable` para revisión de datos
- Componente `EmployeeImporter` que integra todo el flujo
- Modo oscuro/claro
- 100% responsive (móvil, tablet, desktop)

#### **Backend**
- API REST con Express.js
- Base de datos SQLite con tabla `empleados` (incluye campo `correo`)
- CORS configurado para desarrollo
- Multer para subida de archivos Excel
- ExcelJS para parsing robusto
- Endpoints:
  - `POST /api/empleados/import` - Sube y parsea Excel
  - `POST /api/empleados/confirm` - Guarda empleados validados
  - `GET /api/empleados` - Lista todos los empleados
  - `GET /api/empleados/:id` - Obtiene empleado por ID
  - `DELETE /api/empleados/:id` - Desactiva empleado

#### **Docker**
- Dockerfile multi-etapa optimizado
- Docker Compose para desarrollo local
- Persistencia de datos con volumen `/data`
- Puerto 3005 (host) → 3000 (container)
- Auto-restart si falla

#### **Documentación**
- README.md completo con guía de inicio rápido
- DOCS/employee-management.md con casos de uso y troubleshooting
- DOCS/frontend-architecture.md con estructura del frontend
- DOCS/session-log-nov-21-2025.md con log detallado de la sesión
- CHANGELOG.md para seguimiento de versiones

### 🔧 Mejorado
- Parser de Excel ahora soporta 10+ variaciones de formato
- Detección de cabeceras más robusta
- Corrección automática de errores comunes en correos
- Manejo de hipervínculos en celdas

### 🐛 Corregido
- Error al intentar hacer `.includes()` en celdas vacías
- Video de fondo no visible por prop name incorrecto
- CORS bloqueando peticiones desde frontend
- Error "Cannot GET /" al servir frontend en producción
- Errores TypeScript en compilación del frontend
- Drop zone casi invisible por opacidad muy baja
- Parser no detectaba columna "N°" como número
- Correos como hipervínculos no se extraían correctamente

### 🗑️ Eliminado
- Campo "departamento" temporalmente (no está en Excel actual)
- Campo "grupo" temporalmente (no está en Excel actual)

---

## [0.1.0] - 2025-11-20

### ✅ Agregado
- Estructura inicial del proyecto
- Configuración de base de datos SQLite
- Tablas básicas: `periodos`, `empleados`, `asistencia_diaria`
- Frontend básico con React y Vite
- Backend básico con Express
- Docker Compose inicial

---

## 🔮 Próximas Versiones

### [1.1.0] - Módulo de Reloj Checador (En desarrollo)
- Importación de registros de entrada/salida desde Excel
- Cálculo de horas trabajadas
- Detección de faltas e incidencias
- Dashboard con estadísticas

### [1.2.0] - Sistema de Notificaciones
- Integración con Microsoft Graph API
- Envío de alertas por correo Outlook/Hotmail
- Notificaciones de faltas y retrasos

### [2.0.0] - Modo Multi-usuario
- Sistema de autenticación
- Roles y permisos
- Auditoría de cambios

---

**Convenciones:**
- ✅ **Agregado** - Nuevas características
- 🔧 **Mejorado** - Cambios en características existentes
- 🐛 **Corregido** - Bugs solucionados
- 🗑️ **Eliminado** - Características removidas
- ⚠️ **Deprecado** - Características que se eliminarán pronto
- 🔒 **Seguridad** - Parches de seguridad


