# 📊 Sistema de Asistencia y Control de Empleados

Sistema integral de gestión de asistencia para empleados con capacidades de importación desde Excel, cálculo automático de métricas, y visualización interactiva de datos.

---

## 🚀 Características Principales

### 👥 Gestión de Empleados
- ✅ Importación masiva desde Excel
- ✅ CRUD completo (Crear, Leer, Actualizar, Eliminar)
- ✅ Exportación a Excel
- ✅ Validación automática de datos
- ✅ Control de estados (Activo/Inactivo)
- ✅ Organización por departamentos y grupos

### 📅 Control de Asistencia
- ✅ Importación de archivos Excel de relojes checadores (Nextep NE-234)
- ✅ Parser inteligente multi-formato (linear/grid)
- ✅ Detección automática de estructura de hojas
- ✅ Validación de empleados contra base de datos
- ✅ Almacenamiento de marcas crudas (entrada/salida)
- ✅ **Cálculo automático día por día**
- ✅ **Gestión de períodos históricos**

### 📊 Análisis y Visualización
- ✅ **Vista de Calendario**: Visualización mensual con códigos de color
- ✅ **Tabla Detallada**: Filtros por empleado, fecha y departamento
- ✅ **Gráficas Interactivas**: Charts con Recharts
- ✅ Resumen de estadísticas por período
- ✅ Indicadores visuales de retardos, faltas y horas extra
- ✅ Exportación de reportes

### 🧮 Cálculos Automáticos
- ✅ Horas trabajadas por día
- ✅ Detección de retardos (entrada tardía)
- ✅ Salidas tempranas
- ✅ Horas extra (normales y especiales)
- ✅ Registro de faltas, permisos y vacaciones
- ✅ Comparación con horarios esperados
- ✅ Validación contra totales de Excel

---

## 🏗️ Arquitectura del Sistema

### Stack Tecnológico

#### Backend
- **Node.js** + **Express.js** (API REST)
- **SQLite3** (Base de datos)
- **ExcelJS** (Procesamiento de archivos Excel)
- **Multer** (Upload de archivos)
- **date-fns** (Manipulación de fechas)

#### Frontend
- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **Recharts** (Gráficas)
- **CSS Variables** (Theming)
- **Axios** (HTTP Client)

#### Infraestructura
- **Docker** + **Docker Compose**
- Volúmenes persistentes para datos
- Hot-reload en desarrollo
- Puerto 3005 (host) → 3000 (contenedor)

---

## 📁 Estructura del Proyecto

```
asistencia-monolito/
├── client/                      # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── Asistencia/
│   │   │   │   ├── CalendarioAsistencia.tsx      # Vista calendario
│   │   │   │   ├── TablaDetalladaAsistencia.tsx  # Vista tabla
│   │   │   │   ├── GraficasAsistencia.tsx        # Vista gráficas
│   │   │   │   ├── FileUploader.tsx              # Subida de archivos
│   │   │   │   └── AsistenciaValidationTable.tsx # Validación
│   │   │   ├── Employee/
│   │   │   │   └── EmployeeImporter.tsx          # Importador empleados
│   │   │   ├── Empleados/
│   │   │   │   └── EmpleadosTable.tsx            # Tabla empleados
│   │   │   ├── Periods/
│   │   │   │   ├── PeriodsList.tsx               # Lista períodos
│   │   │   │   └── PeriodDetailViewNew.tsx       # Detalle período
│   │   │   └── common/
│   │   │       └── VideoBackground.tsx           # Fondo video
│   │   ├── pages/
│   │   │   ├── HomePage.tsx                      # Página inicio
│   │   │   ├── EmpleadosPage.tsx                 # Gestión empleados
│   │   │   └── PeriodsPage.tsx                   # Gestión períodos
│   │   ├── services/
│   │   │   └── api.ts                            # Cliente API
│   │   └── styles/
│   │       └── index.css                         # Estilos globales
│   └── package.json
│
├── server/                      # Backend Node.js + Express
│   ├── routes/
│   │   ├── asistencia.js                         # Rutas de asistencia
│   │   └── empleados.js                          # Rutas de empleados
│   ├── parsers/
│   │   ├── intelligentParser.js                  # Parser genérico
│   │   └── nextepParser.js                       # Parser Nextep NE-234
│   └── services/
│       └── asistenciaCalculator.js               # Cálculo diario
│
├── config/
│   └── db.js                    # Configuración SQLite
│
├── data/                        # Datos persistentes (volumen Docker)
│   ├── database.sqlite          # Base de datos
│   └── uploads/
│       ├── empleados/           # Excel de empleados
│       └── asistencia/          # Excel de asistencia
│
├── DOCS/                        # Documentación técnica
│   ├── API.md                   # Endpoints API
│   ├── DATABASE.md              # Esquema de base de datos
│   ├── PARSERS.md               # Lógica de parsers
│   ├── CALCULATOR.md            # Cálculo de asistencia
│   └── COMPONENTS.md            # Componentes frontend
│
├── docker-compose.yml           # Orquestación Docker
├── Dockerfile                   # Imagen Docker
├── index.js                     # Entry point backend
└── README.md                    # Este archivo
```

---

## 🗄️ Base de Datos

### Tablas Principales

#### `empleados`
Catálogo maestro de empleados.

```sql
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num TEXT UNIQUE NOT NULL,          -- Número de empleado
  nombre TEXT NOT NULL,
  correo TEXT,
  departamento TEXT,
  grupo TEXT,
  activo BOOLEAN DEFAULT 1,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `periodos`
Períodos de asistencia (generalmente mensuales).

```sql
CREATE TABLE periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,              -- ej: "Agosto 2025"
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  archivo_origen TEXT,
  fecha_importacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `marcas_crudas`
Registros de entrada/salida sin procesar.

```sql
CREATE TABLE marcas_crudas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT,                         -- 'Entrada', 'Salida', 'Desconocido'
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);
```

#### `totales_excel`
Totales extraídos del Excel (hoja "Resumen").

```sql
CREATE TABLE totales_excel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  tiempo_requerido_min INTEGER DEFAULT 0,
  tiempo_real_min INTEGER DEFAULT 0,
  retardos_cuenta INTEGER DEFAULT 0,
  retardos_min INTEGER DEFAULT 0,
  salidas_tempranas_cuenta INTEGER DEFAULT 0,
  salidas_tempranas_min INTEGER DEFAULT 0,
  extra_normal_min INTEGER DEFAULT 0,
  extra_especial_min INTEGER DEFAULT 0,
  dias_asistidos INTEGER DEFAULT 0,
  dias_periodo INTEGER DEFAULT 0,
  vacaciones INTEGER DEFAULT 0,
  faltas INTEGER DEFAULT 0,
  permisos INTEGER DEFAULT 0,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);
```

#### `asistencia_diaria` 🆕
**Cálculos día por día realizados por el backend.**

```sql
CREATE TABLE asistencia_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  dia_semana TEXT,                   -- 'Lunes', 'Martes', etc.
  es_laborable BOOLEAN DEFAULT 1,    -- FALSE si es fin de semana
  horario_entrada_esperada TIME,     -- ej: '07:00'
  horario_salida_esperada TIME,      -- ej: '18:00'
  entrada_real TIME,                 -- Hora de entrada registrada
  salida_real TIME,                  -- Hora de salida registrada
  minutos_trabajados INTEGER DEFAULT 0,
  minutos_retardo INTEGER DEFAULT 0,
  cuenta_retardo INTEGER DEFAULT 0,  -- 0 o 1
  minutos_salida_temprana INTEGER DEFAULT 0,
  cuenta_salida_temprana INTEGER DEFAULT 0,
  minutos_extra_normal INTEGER DEFAULT 0,
  minutos_extra_especial INTEGER DEFAULT 0,
  es_falta BOOLEAN DEFAULT 0,
  es_permiso BOOLEAN DEFAULT 0,
  es_vacacion BOOLEAN DEFAULT 0,
  estado TEXT,                       -- 'Completo', 'Incompleto', 'Falta', 'No Laborable'
  observaciones TEXT,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id, fecha)
);
```

#### `logs_importacion`
Historial de importaciones.

```sql
CREATE TABLE logs_importacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER,
  tipo TEXT,                         -- 'empleados', 'asistencia'
  archivo TEXT,
  resultado TEXT,                    -- 'exitoso', 'error'
  detalles TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE SET NULL
);
```

---

## 🔌 API Endpoints

### Empleados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/empleados` | Listar todos los empleados |
| POST | `/api/empleados/create` | Crear empleado |
| PUT | `/api/empleados/:id` | Actualizar empleado |
| DELETE | `/api/empleados/:id` | Eliminar empleado |
| POST | `/api/empleados/upload` | Subir Excel de empleados |
| POST | `/api/empleados/confirm` | Confirmar importación |
| GET | `/api/empleados/export` | Descargar Excel |

### Asistencia

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/asistencia/upload` | Subir Excel de asistencia |
| GET | `/api/asistencia/verify-employees` | Validar empleados |
| POST | `/api/asistencia/confirm` | Confirmar y calcular |
| GET | `/api/asistencia/periodos` | Listar períodos |
| GET | `/api/asistencia/periodos/:id` | Detalle de período |
| GET | `/api/asistencia/periodos/:id/dia-por-dia` | **Asistencia diaria** 🆕 |

**Ver documentación completa en:** [`DOCS/API.md`](./DOCS/API.md)

---

## 🧮 Cálculo de Asistencia Diaria

### Flujo de Cálculo

1. **Upload** → Usuario sube archivo Excel
2. **Parser** → `nextepParser.js` extrae datos
3. **Validación** → Frontend valida empleados vs BD
4. **Confirmación** → Usuario confirma importación
5. **Guardado** → Backend guarda `marcas_crudas` + `totales_excel`
6. **Cálculo Diario** → `asistenciaCalculator.js` procesa día por día
7. **Persistencia** → Se crea tabla `asistencia_diaria`
8. **Visualización** → Frontend consume endpoint `/dia-por-dia`

### Algoritmo de Cálculo

```javascript
Para cada empleado:
  Para cada día del período:
    1. ¿Es día laborable? (Lunes-Viernes)
    2. Obtener marcas del día (entrada/salida)
    3. Calcular minutos trabajados
    4. Detectar retardo (entrada > 07:00)
    5. Detectar salida temprana (salida < 18:00)
    6. Determinar estado:
       - "Completo": Entrada + Salida
       - "Incompleto": Solo entrada o solo salida
       - "Falta": Sin marcas en día laborable
       - "No Laborable": Fin de semana
    7. Guardar en asistencia_diaria
```

**Ver documentación completa en:** [`DOCS/CALCULATOR.md`](./DOCS/CALCULATOR.md)

---

## 📊 Componentes de Visualización

### 1. Vista Calendario (`CalendarioAsistencia.tsx`)

Muestra un calendario mensual con colores por estado:

- 🟢 **Verde**: Asistencia completa
- 🟡 **Amarillo**: Retardo o salida temprana
- 🔴 **Rojo**: Falta
- ⚪ **Gris**: No laborable (fin de semana)
- 🔵 **Azul**: Permiso, vacación o incompleto

### 2. Vista Tabla (`TablaDetalladaAsistencia.tsx`)

Tabla detallada con columnas:
- Fecha y día de la semana
- Horarios esperados vs reales
- Minutos trabajados, retardo, salida temprana
- Estado del día
- Filtros por empleado

### 3. Vista Gráficas (`GraficasAsistencia.tsx`)

Gráficas interactivas con Recharts:
- **Barras**: Resumen por empleado (asistencias/faltas/retardos)
- **Pie**: Distribución de incidencias
- **Líneas**: Horas trabajadas por día

**Ver documentación completa en:** [`DOCS/COMPONENTS.md`](./DOCS/COMPONENTS.md)

---

## 🐳 Instalación y Despliegue

### Requisitos Previos

- Docker 20.10+
- Docker Compose 1.29+
- Git

### Instalación

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd asistencia-monolito

# 2. Construir y levantar contenedor
docker-compose up -d

# 3. Verificar logs
docker logs -f asistencia-monolito-dev

# 4. Acceder a la aplicación
# Abrir navegador en: http://localhost:3005
```

### Comandos Útiles

```bash
# Ver logs en tiempo real
docker logs -f asistencia-monolito-dev

# Reiniciar contenedor
docker-compose restart

# Reconstruir sin caché
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Acceder a shell del contenedor
docker exec -it asistencia-monolito-dev sh

# Limpiar TODO (cuidado: borra volúmenes)
docker-compose down -v
docker system prune -a --volumes
```

### Variables de Entorno

Configuradas en `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
```

---

## 📖 Guía de Uso

### 1. Importar Empleados

1. Ir a **Empleados** → Click en "📂 Importar desde Excel"
2. Seleccionar archivo Excel con columnas:
   - `num` (obligatorio)
   - `nombre` (obligatorio)
   - `correo`
   - `departamento`
   - `grupo`
3. Confirmar importación
4. Los empleados se guardan en la BD

### 2. Importar Asistencia

1. Ir a **Inicio** → Click en "📂 Subir Archivo Excel"
2. Seleccionar archivo Excel de reloj checador (ej: `001_2025_8_MON.xlsx`)
3. Sistema detecta automáticamente:
   - Hoja "Resumen" → Totales
   - Hoja "Registros" → Marcas diarias
   - Hojas individuales (1.3.5, etc.)
4. Validar empleados contra BD
5. Confirmar guardado
6. **El sistema calcula automáticamente la asistencia día por día** 🆕

### 3. Consultar Períodos

1. Ir a **Períodos**
2. Seleccionar un período (ej: "Agosto 2025")
3. Ver estadísticas generales
4. Cambiar entre vistas:
   - 📅 **Calendario**: Vista mensual
   - 📋 **Tabla**: Detalle día por día
   - 📊 **Gráficas**: Análisis visual
5. Filtrar por empleado

---

## 🐛 Solución de Problemas

### El modal no se ve completo

**Solución:** Implementado con React Portals (`createPortal`). Si persiste, hacer refresh.

### Error "removeChild" al importar empleados

**Solución:** Corregido en `EmpleadosPage.tsx` (evita cambios de estado simultáneos).

### Parser detecta 0 empleados

**Causas:**
- Archivo incorrecto (debe tener hoja "Resumen" o "Registros")
- Números de empleado con formato incorrecto

**Solución:** Verificar que el archivo tiene la estructura esperada.

### Cálculo diario retorna 0 registros

**Causas:**
- Fechas en formato ISO completo (con `T00:00:00.000Z`)

**Solución:** Corregido en `asistenciaCalculator.js` → Normaliza fechas automáticamente.

### Error "413 Payload Too Large"

**Solución:** Límite de body-parser aumentado a 50MB en `index.js`.

### Docker no refleja cambios

**Solución:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔐 Seguridad

- ✅ Validación de archivos Excel
- ✅ Sanitización de entrada de usuario
- ✅ Límites de tamaño de payload (50MB)
- ✅ ON DELETE CASCADE en relaciones FK
- ⚠️ **TODO**: Implementar autenticación
- ⚠️ **TODO**: Rate limiting en API

---

## 📝 Roadmap

### Versión Actual (v1.0)
- ✅ Gestión de empleados
- ✅ Importación de asistencia
- ✅ Cálculo día por día
- ✅ Visualización (Calendario, Tabla, Gráficas)

### Próximas Versiones

#### v1.1
- [ ] Autenticación y roles de usuario
- [ ] Horarios personalizados por empleado/grupo
- [ ] Notificaciones de faltas/retardos
- [ ] Exportación de reportes PDF

#### v1.2
- [ ] Dashboard con métricas en tiempo real
- [ ] Comparativa entre períodos
- [ ] Predicción de tendencias (ML)
- [ ] API REST completa con documentación OpenAPI

#### v2.0
- [ ] Integración con hardware de reloj checador
- [ ] App móvil (React Native)
- [ ] Multi-tenancy (múltiples empresas)
- [ ] Sincronización en la nube

---

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## 📄 Licencia

Este proyecto es privado y de uso interno.

---

## 👨‍💻 Desarrolladores

- **Backend**: Node.js + Express + SQLite
- **Frontend**: React + TypeScript + Vite
- **DevOps**: Docker + Docker Compose

---

## 📞 Soporte

Para dudas o reportes de errores, revisar la documentación en `DOCS/` o contactar al equipo de desarrollo.

---

**Última actualización:** Diciembre 2025  
**Versión:** 1.0.0
