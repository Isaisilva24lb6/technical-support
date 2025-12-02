# 🏗️ Arquitectura del Sistema de Asistencia

**Guía completa de la arquitectura monolítica del sistema**

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura Monolítica](#arquitectura-monolítica)
3. [Estructura de Carpetas](#estructura-de-carpetas)
4. [Componentes Principales](#componentes-principales)
5. [Flujo de Datos](#flujo-de-datos)
6. [Tecnologías Utilizadas](#tecnologías-utilizadas)

---

## 🎯 Visión General

El sistema es una **aplicación monolítica full-stack** que procesa archivos Excel del reloj checador **Nextep NE-234** y gestiona la asistencia de empleados.

### **Características Principales:**

```
✅ Procesamiento inteligente de Excel (formato GRID)
✅ Gestión completa de empleados (CRUD)
✅ Base de datos SQLite persistente
✅ Parser heurístico (sin dependencia de IA)
✅ API REST completa
✅ Frontend React con TypeScript
✅ Docker multi-arquitectura (AMD64 + ARM64)
✅ Integración opcional con Ollama (AI local)
```

---

## 🏛️ Arquitectura Monolítica

### **Diagrama General:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCKER CONTAINER                         │
│                    Puerto: 3005 → 3000                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              FRONTEND (React + Vite)                  │  │
│  │  Build estático servido desde /build                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Páginas:                                            │  │
│  │    - HomePage (/)              - Procesar asistencia│  │
│  │    - EmpleadosPage (/empleados) - Gestión empleados │  │
│  │    - PeriodosPage (/periodos)   - Historial períodos│  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │ HTTP Requests (Axios)           │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           BACKEND (Node.js + Express)                 │  │
│  │  Puerto interno: 3000                                │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Rutas API:                                          │  │
│  │    /api/empleados   - Gestión de empleados          │  │
│  │    /api/asistencia  - Procesamiento Nextep          │  │
│  │    /api/database    - Gestión BD (pruebas)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │                                 │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              CAPA DE PARSERS                          │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  IntelligentParser:   Análisis heurístico genérico  │  │
│  │  NextepParser:        Especializado para Nextep     │  │
│  │  ExcelParser:         Parser de catálogo empleados  │  │
│  │  DateParser:          Fechas y horas diversas       │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                 │
│                           │                                 │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           BASE DE DATOS (SQLite)                      │  │
│  │  Ubicación: /app/data/asistencia.db                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Tablas:                                             │  │
│  │    - empleados          (catálogo)                   │  │
│  │    - periodos           (archivos procesados)        │  │
│  │    - marcas_crudas      (checks del reloj)           │  │
│  │    - totales_excel      (totales del Nextep)         │  │
│  │    - horarios_turnos    (turnos y grupos)            │  │
│  │    - asistencia_diaria  (datos calculados)           │  │
│  │    - logs_importacion   (historial)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ALMACENAMIENTO DE ARCHIVOS                    │  │
│  │  Ubicación: /app/data/uploads/                       │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  /empleados/    - Excel de catálogos                │  │
│  │  /asistencia/   - Archivos del Nextep               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      INTEGRACIÓN OLLAMA (Opcional)                    │  │
│  │  Cliente para análisis AI local                      │  │
│  │  Puerto: 11434 (host externo)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  VOLÚMENES PERSISTENTES                     │
├─────────────────────────────────────────────────────────────┤
│  ./data  →  /app/data  (Base de datos y uploads)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estructura de Carpetas

```
asistencia-monolito/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/       # Componentes compartidos
│   │   │   ├── Employee/     # Importador de empleados
│   │   │   ├── Empleados/    # CRUD de empleados ⭐ NUEVO
│   │   │   └── Upload/       # Uploader de archivos
│   │   ├── pages/
│   │   │   ├── HomePage.tsx           # Procesar asistencia
│   │   │   ├── EmpleadosPage.tsx      # Gestión empleados
│   │   │   └── PeriodosPage.tsx       # Historial
│   │   ├── services/
│   │   │   └── api.ts         # Cliente API centralizado
│   │   └── styles/            # CSS global
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Backend Node.js
│   ├── routes/
│   │   ├── empleados.js       # Rutas de empleados ⭐ ACTUALIZADO
│   │   ├── asistencia.js      # Rutas de asistencia ⭐ NUEVO
│   │   └── database.js        # Gestión BD ⭐ NUEVO
│   ├── parsers/
│   │   ├── intelligentParser.js  # Parser heurístico ⭐ NUEVO
│   │   └── nextepParser.js       # Especializado Nextep ⭐ NUEVO
│   ├── utils/
│   │   ├── excelParser.js     # Parser catálogo empleados
│   │   └── dateParser.js      # Parser fechas/horas ⭐ NUEVO
│   ├── ai/
│   │   └── ollamaClient.js    # Cliente Ollama (opcional) ⭐ NUEVO
│   └── api.js                 # Router principal
│
├── config/
│   └── db.js                  # Configuración SQLite
│
├── shared/                    # Código compartido ⭐ NUEVO
│   └── constants.js           # Keywords y patrones
│
├── data/                      # Datos persistentes (volumen Docker)
│   ├── asistencia.db          # Base de datos SQLite
│   └── uploads/               # Archivos temporales
│       ├── empleados/
│       └── asistencia/
│
├── DOCS/                      # Documentación ⭐ ACTUALIZADO
│   ├── README.md              # Índice principal
│   ├── arquitectura-sistema.md
│   ├── api-endpoints.md
│   ├── crud-empleados.md
│   └── ...
│
├── docker-compose.yml
├── Dockerfile
├── index.js                   # Punto de entrada
├── test-parser.js             # Script de pruebas ⭐ NUEVO
└── package.json
```

---

## 🧩 Componentes Principales

### **1. Frontend (React + TypeScript)**

#### **HomePage** (`/`)
```typescript
Funcionalidad:
  - Subir archivo del Nextep (001_2025_8_MON.xlsx)
  - Ver preview del parseo
  - Confirmar y guardar en BD
  - Ver estadísticas de la BD en tiempo real
  - Botón "Vaciar BD" para pruebas

Componentes:
  - FileUploader: Drag & drop de archivos
  - VideoBackground: Video corporativo (solo al subir)
  - Estadísticas: Panel con contadores

Estado:
  - uploading: boolean
  - result: AsistenciaUploadResponse | null
  - error: string | null
  - dbStats: DatabaseStats | null
```

#### **EmpleadosPage** (`/empleados`)
```typescript
Funcionalidad:
  - Sistema de vistas (lista/importar)
  - Tabla CRUD completa
  - Importar desde Excel
  - Crear empleado manual
  - Editar empleado
  - Eliminar empleado (soft delete)
  - Exportar a Excel

Componentes:
  - EmployeeImporter: Importador Excel con validación
  - EmpleadosTable: Tabla con CRUD
  - AgregarEmpleadoModal: Modal crear empleado
  - EditarEmpleadoModal: Modal editar empleado

Modos:
  - 'list': Muestra tabla (sin video)
  - 'import': Muestra importador (con video)
```

---

### **2. Backend (Node.js + Express)**

#### **API Router** (`server/api.js`)
```javascript
Router principal que monta sub-routers:

app.use('/api', apiRouter);
  ├── /empleados   → empleadosRoutes
  ├── /asistencia  → asistenciaRoutes
  └── /database    → databaseRoutes
```

#### **Rutas de Empleados** (`server/routes/empleados.js`)
```javascript
Endpoints:
  POST   /api/empleados/import    - Parsear Excel
  POST   /api/empleados/confirm   - Guardar parseados
  POST   /api/empleados/create    - Crear individual ⭐ NUEVO
  GET    /api/empleados           - Listar todos
  GET    /api/empleados/:id       - Obtener uno
  PUT    /api/empleados/:id       - Actualizar ⭐ NUEVO
  DELETE /api/empleados/:id       - Eliminar (soft)
  GET    /api/empleados/export    - Exportar Excel ⭐ NUEVO
```

#### **Rutas de Asistencia** (`server/routes/asistencia.js`) ⭐ NUEVO
```javascript
Endpoints:
  POST   /api/asistencia/upload   - Procesar Nextep
  POST   /api/asistencia/confirm  - Guardar en BD

Procesamiento:
  1. Recibe archivo Excel del Nextep
  2. Usa NextepParser para detectar:
     - Hoja "Registros" (formato GRID)
     - Hoja "Resumen" (totales)
     - Hojas de grupos (turnos)
  3. Extrae marcas, empleados, totales
  4. Retorna preview para validación
  5. Usuario confirma → Guarda en BD
```

#### **Rutas de Database** (`server/routes/database.js`) ⭐ NUEVO
```javascript
Endpoints (Solo pruebas):
  GET    /api/database/stats  - Estadísticas BD
  DELETE /api/database/reset  - Vaciar completamente

Uso:
  - Desarrollo y testing
  - Reiniciar desde cero
  - Verificar cantidad de registros
```

---

### **3. Parsers (Procesamiento Inteligente)**

#### **IntelligentParser** ⭐ NUEVO
```javascript
Ubicación: server/parsers/intelligentParser.js

Funcionalidad:
  - Análisis heurístico de hojas Excel
  - Detección automática de tipo de hoja:
    • registros: Marcas del reloj
    • resumen: Totales del período
    • turnos: Horarios y grupos
    • empleados: Catálogo de personal
  
Métodos principales:
  - analyzeSheet(sheet): Analiza estructura
  - detectSheetType(sheet): Detecta tipo por keywords
  - findHeaderRow(sheet): Encuentra cabecera
  - mapColumns(headers): Mapea columnas a campos
  - extractHeaders(row): Extrae nombres de columnas

Algoritmo de Detección:
  1. Lee todas las hojas del Excel
  2. Analiza primeras 50 filas de cada hoja
  3. Busca keywords específicos por tipo
  4. Calcula confianza (0-100%)
  5. Retorna análisis detallado

Keywords usados:
  - registros: ['registro', 'lista', 'marcas']
  - resumen: ['resumen', 'totales', 'bono', 'deducción']
  - turnos: ['horario', 'turno', 'grupo', 'lunes']
  - empleados: ['nombre', 'correo', 'departamento']
```

#### **NextepParser** ⭐ NUEVO
```javascript
Ubicación: server/parsers/nextepParser.js
Extiende: IntelligentParser

Funcionalidad:
  - Especializado para archivos del Nextep NE-234
  - Detecta y procesa formato GRID (calendario)
  - Extrae marcas, totales, turnos

Formatos Soportados:
  1. FORMATO LINEAL (clásico):
     | Num | Fecha      | Hora  | Tipo    |
     |-----|------------|-------|---------|
     | 1   | 2025-08-01 | 08:02 | Entrada |
  
  2. FORMATO GRID (Nextep común): ⭐ NUEVO
     | Nombre | Depto | 1     | 2     | 3     |
     |--------|-------|-------|-------|-------|
     | Juan   | aca   | 08:02 | 09:57 | 09:50 |
     |        |       | 11:06 | 13:57 | 13:58 |

Métodos principales:
  - parse(filePath): Procesa archivo completo
  - detectFormatoRegistros(sheet): Detecta lineal vs grid
  - parseRegistrosGrid(sheet): Procesa formato calendario
  - extractHorasDeCell(cellValue): Extrae múltiples horas
  - parseResumen(sheet): Extrae totales
  - parseTurnos(sheet): Extrae horarios

Detección de Formato:
  - Busca números del 1-31 como cabeceras
  - Si encuentra 10+ días → formato GRID
  - Si no → formato LINEAL

Procesamiento GRID:
  1. Detecta fila con días (1, 2, 3... 31)
  2. Extrae año/mes del nombre del archivo
  3. Por cada empleado (fila):
     - Extrae número y nombre
     - Por cada día (columna):
       - Lee celda con horas
       - Separa por saltos de línea
       - Crea marca por cada hora
       - Alterna Entrada/Salida
  4. Retorna array de marcas completo
```

#### **ExcelParser** (Existente)
```javascript
Ubicación: server/utils/excelParser.js

Funcionalidad:
  - Parser para catálogo de empleados
  - Detecta nombres y correos Microsoft
  - Extrae números de empleado
  - Validación de formato

Método principal:
  - parseEmployeesExcel(filePath)

Retorna:
  {
    employees: [...],
    warnings: [...],
    stats: { total, conCorreo, sinCorreo }
  }
```

---

### **4. Base de Datos (SQLite)**

#### **Esquema Completo:**

```sql
-- TABLA: empleados (Catálogo de personal)
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID interno
  num TEXT NOT NULL UNIQUE,              -- Número del empleado (del Excel) ⭐ SIN PADDING
  nombre TEXT NOT NULL,                  -- Nombre completo
  correo TEXT UNIQUE,                    -- Email (opcional)
  departamento TEXT DEFAULT 'aca',       -- Departamento
  grupo TEXT,                            -- Grupo/Turno (A, B, C)
  activo INTEGER DEFAULT 1               -- 1=Activo, 0=Inactivo
);

-- TABLA: periodos (Archivos procesados)
CREATE TABLE periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_archivo TEXT NOT NULL UNIQUE,   -- Nombre del archivo del Nextep
  fecha_inicio DATE NOT NULL,            -- Inicio del período
  fecha_fin DATE NOT NULL,               -- Fin del período
  fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
  departamento TEXT DEFAULT 'aca',
  estado TEXT DEFAULT 'procesando',      -- procesando, completado, error
  detalle_errores TEXT,
  usuario_carga TEXT DEFAULT 'admin'
);

-- TABLA: marcas_crudas (Checks del reloj)
CREATE TABLE marcas_crudas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,           -- FK a periodos
  empleado_id INTEGER NOT NULL,          -- FK a empleados
  num_empleado TEXT NOT NULL,            -- Referencia (para debugging)
  fecha DATE NOT NULL,                   -- Fecha de la marca
  hora TIME NOT NULL,                    -- Hora de la marca
  tipo TEXT CHECK(tipo IN ('Entrada', 'Salida', 'Desconocido')),
  dia_semana TEXT,                       -- Lunes, Martes, etc.
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id, fecha, hora)  -- Evita duplicados
);

-- TABLA: totales_excel (Totales del Nextep - Hoja Resumen)
CREATE TABLE totales_excel (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  num_empleado TEXT NOT NULL,
  nombre_empleado TEXT NOT NULL,
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
  bono_nota REAL DEFAULT 0,
  bono_extra REAL DEFAULT 0,
  deduccion_tarde REAL DEFAULT 0,
  deduccion_salida REAL DEFAULT 0,
  deduccion_otro REAL DEFAULT 0,
  resultado_real REAL DEFAULT 0,
  observacion TEXT,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id)
);

-- TABLA: horarios_turnos (Horarios por grupo)
CREATE TABLE horarios_turnos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  grupo TEXT NOT NULL,                   -- A, B, C, etc.
  turno_numero INTEGER DEFAULT 1,
  entrada_manana TEXT,                   -- HH:mm
  salida_manana TEXT,
  entrada_tarde TEXT,
  salida_tarde TEXT,
  descripcion_completa TEXT,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
);

-- TABLA: asistencia_diaria (Calculados por el sistema)
CREATE TABLE asistencia_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  dia_semana TEXT,
  horario_entrada_esperada TIME,
  horario_salida_esperada TIME,
  entrada_real TIME,
  salida_real TIME,
  minutos_retardo INTEGER DEFAULT 0,
  cuenta_retardo INTEGER DEFAULT 0,
  minutos_salida_temprana INTEGER DEFAULT 0,
  cuenta_salida_temprana INTEGER DEFAULT 0,
  minutos_extra_normal INTEGER DEFAULT 0,
  minutos_extra_especial INTEGER DEFAULT 0,
  minutos_trabajados INTEGER DEFAULT 0,
  es_falta INTEGER DEFAULT 0,
  es_permiso INTEGER DEFAULT 0,
  es_vacacion INTEGER DEFAULT 0,
  observaciones TEXT,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id, fecha)
);

-- TABLA: logs_importacion (Historial)
CREATE TABLE logs_importacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  fecha_proceso DATETIME DEFAULT CURRENT_TIMESTAMP,
  hojas_procesadas INTEGER DEFAULT 0,
  empleados_procesados INTEGER DEFAULT 0,
  marcas_insertadas INTEGER DEFAULT 0,
  errores_encontrados INTEGER DEFAULT 0,
  advertencias TEXT,
  duracion_segundos REAL,
  estado_final TEXT DEFAULT 'exitoso',
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
);
```

---

## 🔄 Flujo de Datos

### **Flujo 1: Importar Empleados**

```
Usuario                Frontend              Backend              BD
   │                      │                     │                 │
   │  Sube Excel         │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  POST /import       │                 │
   │                      ├────────────────────►                  │
   │                      │                     │  ExcelParser    │
   │                      │                     │  ├─► Parse      │
   │                      │                     │  └─► Extract    │
   │                      │  {employees: [...]}  │                 │
   │                      ◄────────────────────┤                 │
   │  Preview            │                     │                 │
   ◄──────────────────────┤                     │                 │
   │                      │                     │                 │
   │  Confirma           │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  POST /confirm      │                 │
   │                      ├────────────────────►                  │
   │                      │                     │  INSERT INTO    │
   │                      │                     │  empleados      │
   │                      │                     ├─────────────────►
   │                      │                     │                 │
   │                      │  {insertados: 44}   │                 │
   │  ✅ Éxito           ◄────────────────────┤                 │
   ◄──────────────────────┤                     │                 │
```

### **Flujo 2: Procesar Asistencia**

```
Usuario                Frontend              Backend              BD
   │                      │                     │                 │
   │  Sube Nextep        │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  POST /upload       │                 │
   │                      ├────────────────────►                  │
   │                      │                     │  NextepParser   │
   │                      │                     │  ├─► detectFormatoGrid
   │                      │                     │  ├─► parseRegistrosGrid
   │                      │                     │  ├─► parseResumen
   │                      │                     │  └─► parseTurnos
   │                      │                     │                 │
   │                      │  {marcas: 1240,     │                 │
   │                      │   empleados: 50}    │                 │
   │  Preview            ◄────────────────────┤                 │
   ◄──────────────────────┤                     │                 │
   │                      │                     │                 │
   │  Confirma           │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  POST /confirm      │                 │
   │                      ├────────────────────►                  │
   │                      │                     │  Relaciona:     │
   │                      │                     │  num_empleado   │
   │                      │                     │  → empleados.id │
   │                      │                     │                 │
   │                      │                     │  INSERT INTO    │
   │                      │                     │  marcas_crudas  │
   │                      │                     ├─────────────────►
   │  ✅ Guardado        ◄────────────────────┤                 │
   ◄──────────────────────┤                     │                 │
```

### **Flujo 3: Crear Empleado Manual** ⭐ NUEVO

```
Usuario                Frontend              Backend              BD
   │                      │                     │                 │
   │  Click ➕           │                     │                 │
   ├──────────────────────►                     │                 │
   │  Llena form         │                     │                 │
   │  Confirma           │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  POST /create       │                 │
   │                      ├────────────────────►                  │
   │                      │  {num, nombre...}   │                 │
   │                      │                     │  Valida:        │
   │                      │                     │  - num único    │
   │                      │                     │  - correo único │
   │                      │                     │                 │
   │                      │                     │  INSERT INTO    │
   │                      │                     │  empleados      │
   │                      │                     ├─────────────────►
   │  ✅ Creado          ◄────────────────────┤                 │
   ◄──────────────────────┤                     │                 │
```

### **Flujo 4: Exportar Empleados** ⭐ NUEVO

```
Usuario                Frontend              Backend              BD
   │                      │                     │                 │
   │  Click 📥           │                     │                 │
   ├──────────────────────►                     │                 │
   │                      │  GET /export        │                 │
   │                      ├────────────────────►                  │
   │                      │                     │  SELECT *       │
   │                      │                     │  FROM empleados │
   │                      │                     ◄─────────────────┤
   │                      │                     │                 │
   │                      │                     │  ExcelJS:       │
   │                      │                     │  ├─► Create     │
   │                      │                     │  ├─► Style      │
   │                      │                     │  └─► Write      │
   │                      │                     │                 │
   │                      │  Stream Excel       │                 │
   │  📥 Descarga        ◄────────────────────┤                 │
   ◄──────────────────────┤                     │                 │
   │                      │                     │                 │
   │  empleados_2025.xlsx │                     │                 │
```

---

## 🔗 Relaciones entre Componentes

### **Frontend ↔ Backend:**

```
Frontend (React)          Backend (Express)
     │                          │
     ├─► api.ts                 │
     │   (Cliente Axios)        │
     │                          │
     ├─► empleadosApi.import()  ├─► POST /api/empleados/import
     ├─► empleadosApi.create()  ├─► POST /api/empleados/create
     ├─► empleadosApi.update()  ├─► PUT  /api/empleados/:id
     ├─► empleadosApi.delete()  ├─► DELETE /api/empleados/:id
     ├─► empleadosApi.export()  ├─► GET  /api/empleados/export
     │                          │
     ├─► asistenciaApi.upload() ├─► POST /api/asistencia/upload
     ├─► asistenciaApi.confirm()├─► POST /api/asistencia/confirm
     │                          │
     └─► databaseApi.stats()    └─► GET  /api/database/stats
         databaseApi.reset()        DELETE /api/database/reset
```

### **Backend ↔ Database:**

```
Backend (Express)         SQLite Database
     │                          │
     ├─► db.run()              ├─► INSERT, UPDATE, DELETE
     ├─► db.get()              ├─► SELECT (una fila)
     ├─► db.all()              ├─► SELECT (todas)
     │                          │
     └─► Relaciones:            │
         empleados.id ←──────── marcas_crudas.empleado_id
         periodos.id  ←──────── marcas_crudas.periodo_id
         empleados.id ←──────── totales_excel.empleado_id
         periodos.id  ←──────── horarios_turnos.periodo_id
```

---

## 🛠️ Tecnologías Utilizadas

### **Backend:**
```json
{
  "express": "^5.1.0",        // Framework web
  "sqlite3": "^5.1.7",        // Base de datos
  "exceljs": "^4.4.0",        // Procesamiento Excel
  "multer": "^2.0.2",         // Upload de archivos
  "cors": "^2.8.5",           // CORS
  "date-fns": "^3.3.1"        // Manejo de fechas
}
```

### **Frontend:**
```json
{
  "react": "^18.3.1",         // Framework UI
  "react-router-dom": "^7.1.1", // Routing
  "axios": "^1.8.0",          // Cliente HTTP
  "react-icons": "^5.4.0",    // Iconos
  "typescript": "~5.7.2",     // Type checking
  "vite": "^6.0.11"           // Build tool
}
```

### **Parsers:**
```javascript
// Desarrollados internamente (sin dependencias externas)
- IntelligentParser: Análisis heurístico
- NextepParser: Especializado para Nextep
- DateParser: Fechas y horas
- ExcelParser: Catálogo empleados
```

### **AI (Opcional):**
```javascript
// Ollama: Modelo local (sin API keys)
- Llama 3.2 o similar
- Compatible ARM64 (Raspberry Pi)
- Totalmente offline
- Solo como complemento
```

---

## 🎯 Principios de Diseño

### **1. Sin Dependencia de IA:**
```
✅ Parser heurístico inteligente
✅ Detección por keywords y patrones
✅ Lógica determinista
✅ AI solo como complemento opcional
✅ Funciona 100% sin conexión externa
```

### **2. Gestión Flexible:**
```
✅ Importar catálogo desde Excel
✅ Crear empleados manualmente
✅ Editar información en tiempo real
✅ Exportar versión actualizada
✅ Sincronización continua
```

### **3. Validación Robusta:**
```
✅ Prevención de duplicados (num, correo)
✅ Validación de tipos de datos
✅ Constraints a nivel BD
✅ Validación frontend en tiempo real
✅ Mensajes de error claros
```

### **4. Trazabilidad Completa:**
```
✅ Logs detallados en backend
✅ Historial de importaciones
✅ Timestamps en todas las operaciones
✅ Estados de procesamiento
✅ Advertencias y errores registrados
```

---

## 📊 Performance

### **Parseo de Excel:**
```
Archivo típico del Nextep:
  - 17 hojas
  - 50 empleados
  - 1240 marcas
  - Tiempo: 400-600ms ✅

Optimizaciones:
  - Streaming de ExcelJS
  - Análisis solo de primeras 50 filas
  - Caché de análisis de hojas
  - Detección temprana de formato
```

### **Consultas BD:**
```
SQLite en modo WAL (Write-Ahead Logging):
  - Lecturas concurrentes
  - Escrituras rápidas
  - Integridad ACID
  - Backups en caliente

Índices:
  - empleados.num (UNIQUE)
  - empleados.correo (UNIQUE)
  - marcas_crudas (periodo_id, empleado_id, fecha, hora)
```

---

## 🔒 Seguridad

### **Validaciones:**
```
Backend:
  - Sanitización de inputs
  - Validación de tipos
  - Prevención de inyección SQL (prepared statements)
  - Límites de tamaño de archivos

Frontend:
  - Validación en tiempo real
  - Type checking con TypeScript
  - Sanitización de datos antes de enviar
```

### **Manejo de Archivos:**
```
- Nombres únicos con timestamp
- Limpieza automática después de procesar
- Validación de extensiones (.xlsx)
- Límites de tamaño configurables
```

---

## 📚 Documentación Relacionada

- [Base de Datos Detallada](./base-de-datos.md)
- [API Endpoints Completa](./api-endpoints.md)
- [Parser Inteligente](./parser-inteligente.md)
- [CRUD de Empleados](./crud-empleados.md)
- [Formato GRID del Nextep](./formato-grid-nextep.md)

---

**Última actualización: 2025-01-29**



