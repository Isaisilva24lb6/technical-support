# 🗄️ Esquema de Base de Datos

Documentación completa del esquema SQLite del sistema de asistencia.

---

## 📊 Diagrama Entidad-Relación

```
┌─────────────────┐
│   empleados     │
│─────────────────│
│ • id (PK)       │
│ • num (UNIQUE)  │
│ • nombre        │
│ • correo        │
│ • departamento  │
│ • grupo         │
│ • activo        │
│ • fecha_registro│
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────────┐            ┌──────────────────┐
│  marcas_crudas      │            │    periodos      │
│─────────────────────│            │──────────────────│
│ • id (PK)           │◄──────N────│ • id (PK)        │
│ • periodo_id (FK)   │            │ • nombre (UNIQUE)│
│ • empleado_id (FK)  │            │ • fecha_inicio   │
│ • fecha             │            │ • fecha_fin      │
│ • hora              │            │ • archivo_origen │
│ • tipo              │            │ • fecha_importacion│
└─────────────────────┘            └────────┬─────────┘
                                            │ 1
                                            │
                                            │ N
┌─────────────────────┐            ┌────────┴──────────┐
│  totales_excel      │            │ asistencia_diaria │
│─────────────────────│            │───────────────────│
│ • id (PK)           │            │ • id (PK)         │
│ • periodo_id (FK)   │◄──────N────│ • periodo_id (FK) │
│ • empleado_id (FK)  │            │ • empleado_id (FK)│
│ • tiempo_req_min    │            │ • fecha           │
│ • tiempo_real_min   │            │ • dia_semana      │
│ • retardos_cuenta   │            │ • es_laborable    │
│ • retardos_min      │            │ • entrada_real    │
│ • faltas            │            │ • salida_real     │
│ • ... (más campos)  │            │ • minutos_trabajados│
└─────────────────────┘            │ • minutos_retardo │
                                   │ • estado          │
                                   │ • ... (más campos)│
                                   └───────────────────┘
```

---

## 📋 Tablas

### 1. `empleados`

**Propósito:** Catálogo maestro de empleados de la organización.

**Schema:**
```sql
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  correo TEXT,
  departamento TEXT,
  grupo TEXT,
  activo BOOLEAN DEFAULT 1,
  fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_empleados_num ON empleados(num);
CREATE INDEX idx_empleados_departamento ON empleados(departamento);
CREATE INDEX idx_empleados_activo ON empleados(activo);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | Identificador único |
| `num` | TEXT | NO | - | Número de empleado (ej: "1", "47", "120") |
| `nombre` | TEXT | NO | - | Nombre completo |
| `correo` | TEXT | YES | NULL | Email institucional |
| `departamento` | TEXT | YES | NULL | Departamento (ej: "aca", "TI", "RH") |
| `grupo` | TEXT | YES | NULL | Grupo/turno (ej: "A", "B", "C") |
| `activo` | BOOLEAN | NO | 1 | 1=activo, 0=inactivo |
| `fecha_registro` | DATETIME | NO | NOW() | Fecha de alta en el sistema |

**Ejemplo:**
```sql
INSERT INTO empleados (num, nombre, correo, departamento, grupo, activo) 
VALUES ('1', 'Juan Gutiérrez González', 'juan.gg@example.com', 'aca', 'A', 1);
```

**Constraints:**
- `num` debe ser UNIQUE
- `nombre` es obligatorio
- `activo` por defecto es TRUE (1)

---

### 2. `periodos`

**Propósito:** Períodos de asistencia (generalmente mensuales).

**Schema:**
```sql
CREATE TABLE periodos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  archivo_origen TEXT,
  fecha_importacion DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_periodos_nombre ON periodos(nombre);
CREATE INDEX idx_periodos_fechas ON periodos(fecha_inicio, fecha_fin);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | ID único del período |
| `nombre` | TEXT | NO | - | Nombre (ej: "Agosto 2025") |
| `fecha_inicio` | DATE | NO | - | Fecha de inicio (YYYY-MM-DD) |
| `fecha_fin` | DATE | NO | - | Fecha de fin (YYYY-MM-DD) |
| `archivo_origen` | TEXT | YES | NULL | Nombre del archivo Excel |
| `fecha_importacion` | DATETIME | NO | NOW() | Timestamp de importación |

**Ejemplo:**
```sql
INSERT INTO periodos (nombre, fecha_inicio, fecha_fin, archivo_origen) 
VALUES ('Agosto 2025', '2025-08-01', '2025-08-31', '001_2025_8_MON.xlsx');
```

**Constraints:**
- `nombre` debe ser UNIQUE
- No puede haber períodos con el mismo nombre
- `fecha_fin` debe ser >= `fecha_inicio` (validación en backend)

---

### 3. `marcas_crudas`

**Propósito:** Registros de entrada/salida sin procesar (datos crudos del Excel).

**Schema:**
```sql
CREATE TABLE marcas_crudas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);
```

**Índices:**
```sql
CREATE INDEX idx_marcas_periodo ON marcas_crudas(periodo_id);
CREATE INDEX idx_marcas_empleado ON marcas_crudas(empleado_id);
CREATE INDEX idx_marcas_fecha ON marcas_crudas(fecha);
CREATE INDEX idx_marcas_periodo_empleado_fecha ON marcas_crudas(periodo_id, empleado_id, fecha);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | ID único de la marca |
| `periodo_id` | INTEGER | NO | - | FK a `periodos.id` |
| `empleado_id` | INTEGER | NO | - | FK a `empleados.id` |
| `fecha` | DATE | NO | - | Fecha del registro (YYYY-MM-DD) |
| `hora` | TIME | NO | - | Hora del registro (HH:MM o HH:MM:SS) |
| `tipo` | TEXT | YES | NULL | 'Entrada', 'Salida', o 'Desconocido' |

**Ejemplo:**
```sql
INSERT INTO marcas_crudas (periodo_id, empleado_id, fecha, hora, tipo) 
VALUES (1, 1, '2025-08-04', '08:02', 'Entrada');

INSERT INTO marcas_crudas (periodo_id, empleado_id, fecha, hora, tipo) 
VALUES (1, 1, '2025-08-04', '11:06', 'Salida');
```

**Constraints:**
- `ON DELETE CASCADE`: Si se elimina el período o empleado, se eliminan las marcas asociadas
- Puede haber múltiples marcas para el mismo día (entrada, salida, entrada, salida, etc.)

---

### 4. `totales_excel`

**Propósito:** Totales extraídos de la hoja "Resumen" del Excel.

**Schema:**
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
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id)
);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_totales_periodo_empleado ON totales_excel(periodo_id, empleado_id);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | ID único |
| `periodo_id` | INTEGER | NO | - | FK a `periodos.id` |
| `empleado_id` | INTEGER | NO | - | FK a `empleados.id` |
| `tiempo_requerido_min` | INTEGER | NO | 0 | Tiempo requerido (minutos) |
| `tiempo_real_min` | INTEGER | NO | 0 | Tiempo trabajado (minutos) |
| `retardos_cuenta` | INTEGER | NO | 0 | Total de retardos |
| `retardos_min` | INTEGER | NO | 0 | Minutos de retardo total |
| `salidas_tempranas_cuenta` | INTEGER | NO | 0 | Total salidas tempranas |
| `salidas_tempranas_min` | INTEGER | NO | 0 | Minutos salida temprana total |
| `extra_normal_min` | INTEGER | NO | 0 | Minutos extra normales |
| `extra_especial_min` | INTEGER | NO | 0 | Minutos extra especiales (festivos) |
| `dias_asistidos` | INTEGER | NO | 0 | Días que asistió |
| `dias_periodo` | INTEGER | NO | 0 | Total días del período |
| `vacaciones` | INTEGER | NO | 0 | Días de vacación |
| `faltas` | INTEGER | NO | 0 | Días de falta |
| `permisos` | INTEGER | NO | 0 | Días de permiso |

**Ejemplo:**
```sql
INSERT INTO totales_excel (
  periodo_id, empleado_id, 
  tiempo_requerido_min, tiempo_real_min,
  retardos_cuenta, retardos_min,
  faltas
) VALUES (
  1, 1,
  44100, 1944,
  7, 3907,
  13
);
```

**Constraints:**
- `UNIQUE(periodo_id, empleado_id)`: Solo un registro de totales por empleado en cada período
- `ON DELETE CASCADE`: Se eliminan si se elimina el período o empleado

---

### 5. `asistencia_diaria` 🆕

**Propósito:** Registros día por día calculados automáticamente por el backend.

**Schema:**
```sql
CREATE TABLE asistencia_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,
  fecha DATE NOT NULL,
  
  dia_semana TEXT,
  es_laborable BOOLEAN DEFAULT 1,
  
  horario_entrada_esperada TIME,
  horario_salida_esperada TIME,
  
  entrada_real TIME,
  salida_real TIME,
  
  minutos_trabajados INTEGER DEFAULT 0,
  horas_requeridas_min INTEGER DEFAULT 0,
  
  minutos_retardo INTEGER DEFAULT 0,
  cuenta_retardo INTEGER DEFAULT 0,
  
  minutos_salida_temprana INTEGER DEFAULT 0,
  cuenta_salida_temprana INTEGER DEFAULT 0,
  
  minutos_extra_normal INTEGER DEFAULT 0,
  minutos_extra_especial INTEGER DEFAULT 0,
  
  es_falta BOOLEAN DEFAULT 0,
  es_permiso BOOLEAN DEFAULT 0,
  es_vacacion BOOLEAN DEFAULT 0,
  
  estado TEXT,
  observaciones TEXT,
  
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
  UNIQUE(periodo_id, empleado_id, fecha)
);
```

**Índices:**
```sql
CREATE UNIQUE INDEX idx_asist_periodo_empleado_fecha ON asistencia_diaria(periodo_id, empleado_id, fecha);
CREATE INDEX idx_asist_fecha ON asistencia_diaria(fecha);
CREATE INDEX idx_asist_estado ON asistencia_diaria(estado);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | ID único |
| `periodo_id` | INTEGER | NO | - | FK a `periodos.id` |
| `empleado_id` | INTEGER | NO | - | FK a `empleados.id` |
| `fecha` | DATE | NO | - | Fecha del registro (YYYY-MM-DD) |
| `dia_semana` | TEXT | YES | NULL | 'Lunes', 'Martes', etc. |
| `es_laborable` | BOOLEAN | NO | 1 | TRUE si es L-V, FALSE si es S-D |
| `horario_entrada_esperada` | TIME | YES | NULL | Horario esperado entrada (ej: '07:00') |
| `horario_salida_esperada` | TIME | YES | NULL | Horario esperado salida (ej: '18:00') |
| `entrada_real` | TIME | YES | NULL | Hora real de entrada |
| `salida_real` | TIME | YES | NULL | Hora real de salida |
| `minutos_trabajados` | INTEGER | NO | 0 | Minutos entre entrada y salida |
| `horas_requeridas_min` | INTEGER | NO | 0 | Minutos requeridos por día (ej: 540 = 9h) |
| `minutos_retardo` | INTEGER | NO | 0 | Minutos de retardo |
| `cuenta_retardo` | INTEGER | NO | 0 | 0 o 1 (conteo) |
| `minutos_salida_temprana` | INTEGER | NO | 0 | Minutos de salida temprana |
| `cuenta_salida_temprana` | INTEGER | NO | 0 | 0 o 1 (conteo) |
| `minutos_extra_normal` | INTEGER | NO | 0 | Minutos extra normales |
| `minutos_extra_especial` | INTEGER | NO | 0 | Minutos extra especiales |
| `es_falta` | BOOLEAN | NO | 0 | TRUE si es falta |
| `es_permiso` | BOOLEAN | NO | 0 | TRUE si es permiso |
| `es_vacacion` | BOOLEAN | NO | 0 | TRUE si es vacación |
| `estado` | TEXT | YES | NULL | 'Completo', 'Incompleto', 'Falta', 'No Laborable' |
| `observaciones` | TEXT | YES | NULL | Notas adicionales |

**Ejemplo:**
```sql
INSERT INTO asistencia_diaria (
  periodo_id, empleado_id, fecha, dia_semana, es_laborable,
  horario_entrada_esperada, horario_salida_esperada,
  entrada_real, salida_real,
  minutos_trabajados, minutos_retardo, cuenta_retardo,
  es_falta, estado
) VALUES (
  1, 1, '2025-08-04', 'Lunes', 1,
  '07:00', '18:00',
  '08:02', '11:06',
  184, 62, 1,
  0, 'Completo'
);
```

**Constraints:**
- `UNIQUE(periodo_id, empleado_id, fecha)`: Solo un registro por empleado por día
- `ON DELETE CASCADE`: Se eliminan si se elimina el período o empleado
- `estado` puede ser: 'Completo', 'Incompleto', 'Falta', 'No Laborable', 'Desconocido'

---

### 6. `logs_importacion`

**Propósito:** Historial de importaciones para auditoría.

**Schema:**
```sql
CREATE TABLE logs_importacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER,
  tipo TEXT,
  archivo TEXT,
  resultado TEXT,
  detalles TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE SET NULL
);
```

**Campos:**

| Campo | Tipo | Null | Default | Descripción |
|-------|------|------|---------|-------------|
| `id` | INTEGER | NO | AUTO | ID único |
| `periodo_id` | INTEGER | YES | NULL | FK a `periodos.id` (nullable) |
| `tipo` | TEXT | YES | NULL | 'empleados' o 'asistencia' |
| `archivo` | TEXT | YES | NULL | Nombre del archivo |
| `resultado` | TEXT | YES | NULL | 'exitoso' o 'error' |
| `detalles` | TEXT | YES | NULL | Información adicional (JSON) |
| `fecha` | DATETIME | NO | NOW() | Timestamp del log |

**Ejemplo:**
```sql
INSERT INTO logs_importacion (periodo_id, tipo, archivo, resultado, detalles) 
VALUES (1, 'asistencia', '001_2025_8_MON.xlsx', 'exitoso', '{"marcas": 980, "empleados": 43}');
```

---

## 🔗 Relaciones

### 1-N (Uno a Muchos)

#### `periodos` → `marcas_crudas`
Un período tiene muchas marcas.

```sql
SELECT p.nombre, COUNT(m.id) as total_marcas
FROM periodos p
LEFT JOIN marcas_crudas m ON p.id = m.periodo_id
GROUP BY p.id;
```

#### `empleados` → `marcas_crudas`
Un empleado tiene muchas marcas en múltiples períodos.

```sql
SELECT e.nombre, COUNT(m.id) as total_marcas
FROM empleados e
LEFT JOIN marcas_crudas m ON e.id = m.empleado_id
GROUP BY e.id;
```

#### `periodos` → `asistencia_diaria`
Un período tiene muchos registros diarios.

```sql
SELECT p.nombre, COUNT(ad.id) as registros_diarios
FROM periodos p
LEFT JOIN asistencia_diaria ad ON p.id = ad.periodo_id
GROUP BY p.id;
```

### 1-1 (Uno a Uno)

#### `empleado` + `periodo` → `totales_excel`
Un empleado en un período tiene exactamente un registro de totales.

```sql
SELECT e.nombre, te.faltas, te.retardos_min
FROM empleados e
JOIN totales_excel te ON e.id = te.empleado_id
WHERE te.periodo_id = 1;
```

---

## 🔒 Integridad Referencial

### ON DELETE CASCADE

Cuando se elimina un registro padre, se eliminan automáticamente sus registros hijos:

```sql
DELETE FROM periodos WHERE id = 1;
-- Esto también eliminará:
-- - Todas las marcas_crudas del período 1
-- - Todos los totales_excel del período 1
-- - Todos los registros de asistencia_diaria del período 1
```

### ON DELETE SET NULL

Cuando se elimina un período, los logs no se eliminan, solo se pone `periodo_id` a NULL:

```sql
DELETE FROM periodos WHERE id = 1;
-- Los logs_importacion mantienen su registro, pero periodo_id = NULL
```

---

## 📈 Consultas Útiles

### Ver resumen de un empleado en un período

```sql
SELECT 
  e.num,
  e.nombre,
  te.faltas,
  te.retardos_min,
  te.tiempo_real_min / 60 as horas_trabajadas
FROM empleados e
JOIN totales_excel te ON e.id = te.empleado_id
WHERE te.periodo_id = 1 AND e.num = '1';
```

### Ver marcas de un día específico

```sql
SELECT 
  e.num,
  e.nombre,
  m.fecha,
  m.hora,
  m.tipo
FROM marcas_crudas m
JOIN empleados e ON m.empleado_id = e.id
WHERE m.periodo_id = 1 AND m.fecha = '2025-08-04'
ORDER BY e.num, m.hora;
```

### Ver asistencia diaria de un empleado

```sql
SELECT 
  fecha,
  dia_semana,
  entrada_real,
  salida_real,
  minutos_trabajados,
  minutos_retardo,
  estado
FROM asistencia_diaria
WHERE periodo_id = 1 AND empleado_id = 1
ORDER BY fecha;
```

### Estadísticas generales de un período

```sql
SELECT 
  COUNT(DISTINCT empleado_id) as total_empleados,
  SUM(CASE WHEN es_falta = 1 THEN 1 ELSE 0 END) as total_faltas,
  SUM(minutos_retardo) as total_minutos_retardo,
  SUM(minutos_trabajados) as total_minutos_trabajados
FROM asistencia_diaria
WHERE periodo_id = 1 AND es_laborable = 1;
```

### Top 5 empleados con más faltas

```sql
SELECT 
  e.num,
  e.nombre,
  SUM(CASE WHEN ad.es_falta = 1 THEN 1 ELSE 0 END) as total_faltas
FROM empleados e
JOIN asistencia_diaria ad ON e.id = ad.empleado_id
WHERE ad.periodo_id = 1
GROUP BY e.id
ORDER BY total_faltas DESC
LIMIT 5;
```

---

## 🛠️ Mantenimiento

### Vaciar todas las tablas (reset)

```sql
DELETE FROM logs_importacion;
DELETE FROM asistencia_diaria;
DELETE FROM totales_excel;
DELETE FROM marcas_crudas;
DELETE FROM periodos;
DELETE FROM empleados;

-- Reset autoincrement
DELETE FROM sqlite_sequence;
```

### Respaldar base de datos

```bash
# Desde el contenedor
docker exec asistencia-monolito-dev sqlite3 /app/data/database.sqlite ".backup /app/data/backup.sqlite"

# O desde el host
cp data/database.sqlite data/backup_$(date +%Y%m%d).sqlite
```

### Optimizar base de datos

```sql
-- Reconstruir índices
REINDEX;

-- Limpiar espacio
VACUUM;

-- Analizar estadísticas
ANALYZE;
```

---

## 📊 Tamaños Estimados

Para **45 empleados** y **1 año** de asistencia:

| Tabla | Registros Estimados | Tamaño Aprox |
|-------|---------------------|--------------|
| `empleados` | 45 | 5 KB |
| `periodos` | 12 | 2 KB |
| `marcas_crudas` | ~11,000 (45 emp × 2 marcas/día × 250 días) | 500 KB |
| `totales_excel` | 540 (45 emp × 12 períodos) | 50 KB |
| `asistencia_diaria` | ~15,000 (45 emp × 31 días × 12 meses) | 1 MB |
| `logs_importacion` | ~100 | 10 KB |
| **TOTAL** | | **~2 MB** |

SQLite es muy eficiente y puede manejar hasta **281 TB** de datos.

---

## 🔮 Mejoras Futuras

### 1. Tabla `horarios_empleados`

Para horarios personalizados:

```sql
CREATE TABLE horarios_empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empleado_id INTEGER NOT NULL,
  dia_semana INTEGER,  -- 1=Lunes, 7=Domingo
  hora_entrada TIME,
  hora_salida TIME,
  vigencia_desde DATE,
  vigencia_hasta DATE,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);
```

### 2. Tabla `festivos`

Para manejar días no laborables especiales:

```sql
CREATE TABLE festivos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha DATE UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  es_obligatorio BOOLEAN DEFAULT 1
);
```

### 3. Tabla `permisos`

Para gestionar permisos formales:

```sql
CREATE TABLE permisos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  empleado_id INTEGER NOT NULL,
  tipo TEXT,  -- 'permiso', 'vacacion', 'incapacidad'
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  motivo TEXT,
  aprobado BOOLEAN DEFAULT 0,
  FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE
);
```

---

## 📚 Referencias

- **SQLite**: https://www.sqlite.org/docs.html
- **node-sqlite3**: https://github.com/TryGhost/node-sqlite3

---

**Última actualización:** Diciembre 2025

