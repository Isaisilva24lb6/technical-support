# 🔄 Flujo Completo del Sistema de Asistencia

**Guía paso a paso para procesar archivos del Nextep NE-234**

---

## 🎯 **CONCEPTO CLAVE: El `num` de Empleado**

El **número de empleado (`num`)** es la **clave que relaciona todo**:

```
Archivo de Empleados:
  num = 1 → Juan Gutiérrez, juan@empresa.com, aca

Archivo del Nextep:
  num = 1 → Marcas: [08:02, 11:06, 14:00, 18:30]
  
Sistema relaciona:
  num = 1 (empleados) ←→ num = 1 (marcas)
  
Resultado:
  Juan Gutiérrez trabajó:
    - 08:02 Entrada
    - 11:06 Salida
    - 14:00 Entrada
    - 18:30 Salida
```

---

## 📋 **FLUJO PASO A PASO**

### **PASO 0: Vaciar Base de Datos (Solo Pruebas)**

Si estás haciendo pruebas y quieres empezar limpio:

```bash
# Opción A: Desde curl
curl -X DELETE http://localhost:3005/api/database/reset

# Opción B: Desde consola del navegador
fetch('/api/database/reset', { method: 'DELETE' })
  .then(r => r.json())
  .then(console.log)
```

**Resultado:**
```json
{
  "success": true,
  "message": "Base de datos vaciada exitosamente",
  "results": {
    "empleados_eliminados": 50,
    "periodos_eliminados": 1,
    "marcas_eliminadas": 1240,
    "totales_eliminados": 50
  }
}
```

---

### **PASO 1: Subir Catálogo de Empleados**

#### **1.1 Preparar archivo de empleados**

**Nombre**: `empleados_lista.xlsx`

**Estructura:**

```
| Número | Nombre              | Correo                 | Departamento | Grupo |
|--------|---------------------|------------------------|--------------|-------|
| 1      | Juan Gutiérrez      | juan@empresa.com       | aca          | A     |
| 2      | Ivanhoe             | ivanhoe@empresa.com    | aca          | B     |
| 3      | Josafat Mtz         | josafat@empresa.com    | aca          | A     |
| 6      | Dolores             | dolores@empresa.com    | aca          | C     |
| ...    | ...                 | ...                    | ...          | ...   |
```

**IMPORTANTE**: El `Número` debe coincidir con el número del Nextep.

#### **1.2 Subir en la aplicación**

1. Ir a: `http://localhost:3005/empleados`
2. Subir: `empleados_lista.xlsx`
3. Validar datos detectados
4. Click: "Confirmar y Guardar"

#### **1.3 Resultado en Base de Datos**

```sql
-- Tabla: empleados
INSERT INTO empleados (num, nombre, correo, departamento, grupo, activo)
VALUES 
  ('001', 'Juan Gutiérrez', 'juan@empresa.com', 'aca', 'A', 1),
  ('002', 'Ivanhoe', 'ivanhoe@empresa.com', 'aca', 'B', 1),
  ('003', 'Josafat Mtz', 'josafat@empresa.com', 'aca', 'A', 1);
  -- ... más empleados
```

**PRIMARY KEY**: `num` (número de empleado)

---

### **PASO 2: Subir Archivo de Asistencia (Nextep)**

#### **2.1 Preparar archivo del Nextep**

**Nombre**: `001_2025_8_MON.xlsx`

**Contiene:**
- Hoja "Resumen": Totales por empleado
- Hoja "Registros": Calendario con marcas
- Hojas de grupos: 1.3.5, 6.8.14, etc.

#### **2.2 Subir en la aplicación**

1. Ir a: `http://localhost:3005/` (Inicio)
2. Subir: `001_2025_8_MON.xlsx`
3. Ver preview:
   - ✅ Marcas encontradas: 1240+
   - ✅ Empleados detectados: 50
   - ✅ Período: 01/08/2025 - 31/08/2025
4. Click: "Guardar en Base de Datos"

#### **2.3 Procesamiento del Sistema**

```javascript
// 1. Guardar período
INSERT INTO periodos (nombre_archivo, fecha_inicio, fecha_fin, departamento, estado)
VALUES ('001_2025_8_MON.xlsx', '2025-08-01', '2025-08-31', 'aca', 'completado');

// periodo_id = 1

// 2. Por cada marca encontrada:
FOR EACH marca IN result.marcas:
  
  // Buscar empleado por número
  SELECT id FROM empleados WHERE num = marca.num_empleado;
  
  IF empleado_existe:
    // Guardar marca relacionada con empleado
    INSERT INTO marcas_crudas (
      periodo_id, 
      empleado_id,        ← ID del empleado
      num_empleado,       ← Número del empleado (para referencia)
      fecha, 
      hora, 
      tipo
    )
    VALUES (1, empleado_id, '001', '2025-08-01', '08:02', 'Entrada');
  ELSE:
    // Empleado no existe en catálogo
    WARNING: "Empleado num=001 no encontrado en catálogo"
```

#### **2.4 Resultado en Base de Datos**

```sql
-- Tabla: marcas_crudas
| id | periodo_id | empleado_id | num_empleado | fecha      | hora  | tipo    |
|----|------------|-------------|--------------|------------|-------|---------|
| 1  | 1          | 1           | 001          | 2025-08-01 | 08:02 | Entrada |
| 2  | 1          | 1           | 001          | 2025-08-01 | 11:06 | Salida  |
| 3  | 1          | 1           | 001          | 2025-08-02 | 09:57 | Entrada |
| 4  | 1          | 1           | 001          | 2025-08-02 | 13:57 | Salida  |
| 5  | 1          | 2           | 002          | 2025-08-01 | 11:34 | Entrada |
...
```

**Relación**:
- `empleado_id` → Foreign key a `empleados.id`
- `num_empleado` → Referencia al número (para debugging)

---

## 🔗 **CÓMO SE RELACIONAN LOS DATOS**

### **Esquema de Base de Datos:**

```
┌─────────────────┐
│   empleados     │
├─────────────────┤
│ id (PK)         │←──────────┐
│ num (UNIQUE)    │           │
│ nombre          │           │
│ correo          │           │
│ departamento    │           │
│ grupo           │           │
└─────────────────┘           │
                              │
                              │ FOREIGN KEY
                              │
┌─────────────────────────────┼──────────┐
│         marcas_crudas       │          │
├─────────────────────────────┴──────────┤
│ id (PK)                                │
│ periodo_id (FK → periodos)             │
│ empleado_id (FK → empleados.id) ←──────┘
│ num_empleado (referencia)              │
│ fecha                                  │
│ hora                                   │
│ tipo                                   │
└────────────────────────────────────────┘
```

### **Consulta Típica:**

```sql
-- Obtener todas las marcas de Juan Gutiérrez en agosto 2025
SELECT 
  e.num,
  e.nombre,
  m.fecha,
  m.hora,
  m.tipo
FROM marcas_crudas m
JOIN empleados e ON m.empleado_id = e.id
WHERE e.num = '001'
  AND m.fecha BETWEEN '2025-08-01' AND '2025-08-31'
ORDER BY m.fecha, m.hora;
```

---

## 🎯 **CASOS DE USO**

### **Caso 1: Empleado Existe en Catálogo**

```
Catálogo: num=1, nombre="Juan Gutiérrez", correo="juan@empresa.com"
Nextep:   num=1, marcas=[08:02, 11:06, ...]

Sistema:
  ✅ Encuentra empleado con num=1
  ✅ Relaciona marcas con empleado_id=1
  ✅ Guarda en marcas_crudas
```

### **Caso 2: Empleado NO Existe en Catálogo**

```
Catálogo: (vacío)
Nextep:   num=1, marcas=[08:02, 11:06, ...]

Sistema:
  ⚠️ No encuentra empleado con num=1
  
Opción A: Crear empleado automáticamente
  INSERT INTO empleados (num, nombre, correo)
  VALUES ('001', 'Empleado 001', NULL);
  
Opción B: Rechazar y pedir que suba catálogo primero
  WARNING: "50 empleados no encontrados en catálogo"
```

**¿Cuál prefieres?** Te recomiendo **Opción A** (crear automáticamente).

### **Caso 3: Números No Coinciden**

```
Catálogo: num=1 (Juan), num=2 (María)
Nextep:   num=1 (ok), num=99 (no existe)

Sistema:
  ✅ num=1 → Relaciona con Juan
  ⚠️ num=99 → Crea "Empleado 099" o rechaza
```

---

## 🔧 **COMANDOS ÚTILES PARA PRUEBAS**

### **Vaciar Base de Datos**

```bash
# Desde curl
curl -X DELETE http://localhost:3005/api/database/reset

# Desde navegador (consola)
fetch('/api/database/reset', {method: 'DELETE'}).then(r => r.json()).then(console.log)
```

### **Ver Estadísticas**

```bash
# Ver cuántos registros hay
curl http://localhost:3005/api/database/stats
```

**Salida:**
```json
{
  "success": true,
  "stats": {
    "empleados": 50,
    "periodos": 1,
    "marcas": 1240,
    "totales": 50
  }
}
```

### **Ver Empleados**

```bash
curl http://localhost:3005/api/empleados
```

---

## 📊 **FLUJO COMPLETO EN DIAGRAMA**

```
INICIO: Base de datos vacía
    │
    ↓
┌───────────────────────────────────────────┐
│ PASO 1: Subir Catálogo de Empleados      │
├───────────────────────────────────────────┤
│ Página: /empleados                        │
│ Archivo: empleados_lista.xlsx             │
│ Endpoint: POST /api/empleados/import      │
│                                           │
│ Parser detecta:                           │
│   - Columnas: Nombre, Correo, Num, Depto │
│   - 50 empleados                          │
│                                           │
│ Usuario valida y confirma                 │
│                                           │
│ Sistema guarda:                           │
│   tabla empleados:                        │
│     num='001', nombre='Juan Gutiérrez'    │
│     num='002', nombre='Ivanhoe'           │
│     ...                                   │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ PASO 2: Subir Archivo de Asistencia      │
├───────────────────────────────────────────┤
│ Página: / (Inicio)                        │
│ Archivo: 001_2025_8_MON.xlsx              │
│ Endpoint: POST /api/asistencia/upload     │
│                                           │
│ Parser detecta:                           │
│   - Hoja "Registros": Formato grid       │
│   - Hoja "Resumen": Totales              │
│   - 1240 marcas                           │
│   - 50 empleados únicos                   │
│                                           │
│ Usuario ve preview y confirma             │
│                                           │
│ Sistema guarda:                           │
│   tabla periodos:                         │
│     id=1, nombre='001_2025_8_MON.xlsx'    │
│                                           │
│   tabla marcas_crudas:                    │
│     Para cada marca:                      │
│       SELECT id FROM empleados            │
│       WHERE num = '001'                   │
│       → empleado_id = 1                   │
│                                           │
│       INSERT INTO marcas_crudas           │
│         (periodo_id, empleado_id,         │
│          num_empleado, fecha, hora, tipo) │
│         VALUES                            │
│         (1, 1, '001',                     │
│          '2025-08-01', '08:02',           │
│          'Entrada')                       │
└───────────────────────────────────────────┘
    │
    ↓
┌───────────────────────────────────────────┐
│ RESULTADO: Base de Datos Poblada          │
├───────────────────────────────────────────┤
│ empleados: 50 registros                   │
│ periodos: 1 registro (agosto 2025)        │
│ marcas_crudas: 1240 registros             │
│ totales_excel: 50 registros               │
│                                           │
│ TODAS relacionadas por num de empleado   │
└───────────────────────────────────────────┘
```

---

## 🔑 **PRIMARY KEYS Y RELACIONES**

### **Tabla `empleados`**

```sql
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID interno
  num TEXT NOT NULL UNIQUE,              -- ← CLAVE: Número del empleado (del Excel)
  nombre TEXT NOT NULL,
  correo TEXT UNIQUE,
  departamento TEXT DEFAULT 'aca',
  grupo TEXT,
  activo INTEGER DEFAULT 1
);
```

**Ejemplo:**
```
| id | num | nombre          | correo              | departamento | grupo |
|----|-----|-----------------|---------------------|--------------|-------|
| 1  | 001 | Juan Gutiérrez  | juan@empresa.com    | aca          | A     |
| 2  | 002 | Ivanhoe         | ivanhoe@empresa.com | aca          | B     |
| 3  | 003 | Josafat Mtz     | josafat@empresa.com | aca          | A     |
| 4  | 006 | Dolores         | dolores@empresa.com | aca          | C     |
```

**Nota**: El `id` es auto-increment, el `num` viene del Excel.

### **Tabla `marcas_crudas`**

```sql
CREATE TABLE marcas_crudas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  periodo_id INTEGER NOT NULL,
  empleado_id INTEGER NOT NULL,         -- ← Relaciona con empleados.id
  num_empleado TEXT NOT NULL,           -- ← Referencia (para debugging)
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  tipo TEXT CHECK(tipo IN ('Entrada', 'Salida')),
  FOREIGN KEY (empleado_id) REFERENCES empleados(id),
  UNIQUE(periodo_id, empleado_id, fecha, hora)
);
```

**Ejemplo:**
```
| id | periodo_id | empleado_id | num_empleado | fecha      | hora  | tipo    |
|----|------------|-------------|--------------|------------|-------|---------|
| 1  | 1          | 1           | 001          | 2025-08-01 | 08:02 | Entrada |
| 2  | 1          | 1           | 001          | 2025-08-01 | 11:06 | Salida  |
| 3  | 1          | 2           | 002          | 2025-08-01 | 11:34 | Entrada |
| 4  | 1          | 2           | 002          | 2025-08-01 | 19:38 | Salida  |
```

---

## 🎯 **LÓGICA DE RELACIÓN**

### **Al Guardar Marcas:**

```javascript
// server/routes/asistencia.js (en el endpoint /confirm)

for (const marca of result.marcas) {
  // 1. Buscar empleado por número
  const empleado = await new Promise((resolve, reject) => {
    db.get(
      'SELECT id FROM empleados WHERE num = ?',
      [marca.num_empleado],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
  
  let empleadoId;
  
  if (empleado) {
    // Caso A: Empleado existe
    empleadoId = empleado.id;
  } else {
    // Caso B: Empleado NO existe → Crear automáticamente
    empleadoId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO empleados (num, nombre, correo, departamento, activo) VALUES (?, ?, NULL, ?, 1)',
        [marca.num_empleado, marca.nombre || `Empleado ${marca.num_empleado}`, 'aca'],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
    
    console.log(`[ASISTENCIA] Empleado ${marca.num_empleado} creado automáticamente`);
  }
  
  // 2. Guardar marca
  await new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO marcas_crudas 
       (periodo_id, empleado_id, num_empleado, fecha, hora, tipo, dia_semana)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        periodoId,
        empleadoId,            // ← ID del empleado
        marca.num_empleado,    // ← Número del empleado (para referencia)
        marca.fecha,
        marca.hora,
        marca.tipo,
        marca.dia_semana
      ],
      function(err) {
        if (err) {
          // Manejar duplicados
          if (err.message.includes('UNIQUE constraint')) {
            console.warn(`[ASISTENCIA] Marca duplicada: ${marca.num_empleado} ${marca.fecha} ${marca.hora}`);
            resolve(); // Ignorar duplicado
          } else {
            reject(err);
          }
        } else {
          resolve();
        }
      }
    );
  });
}
```

---

## 💡 **VENTAJAS DEL SISTEMA**

### **1. Flexibilidad**

```
✅ Puedes subir empleados primero
✅ O puedes subir asistencia directamente (crea empleados automáticamente)
✅ Puedes actualizar catálogo cuando quieras
```

### **2. Integridad**

```
✅ num es UNIQUE en empleados (no puede haber duplicados)
✅ FOREIGN KEY asegura que las marcas siempre tienen un empleado válido
✅ UNIQUE en marcas evita duplicados (mismo empleado, fecha, hora)
```

### **3. Trazabilidad**

```
✅ num_empleado en marcas_crudas permite ver el número original
✅ Logs de importación registran todo
✅ Advertencias si hay empleados no encontrados
```

---

## 🧪 **CICLO DE PRUEBAS COMPLETO**

```bash
# 1. Vaciar base de datos
curl -X DELETE http://localhost:3005/api/database/reset

# 2. Verificar que está vacía
curl http://localhost:3005/api/database/stats
# Resultado: {"empleados": 0, "marcas": 0}

# 3. Subir catálogo de empleados
# (desde la web: /empleados)

# 4. Verificar empleados
curl http://localhost:3005/api/empleados
# Resultado: {"empleados": [...50 empleados], "total": 50}

# 5. Subir archivo de asistencia
# (desde la web: /)

# 6. Verificar marcas
curl http://localhost:3005/api/database/stats
# Resultado: {"marcas": 1240, "empleados": 50}
```

---

## ❓ **PREGUNTAS FRECUENTES**

### **P: ¿Qué pasa si el num del Nextep no está en el catálogo?**

**R**: El sistema lo crea automáticamente:
```sql
INSERT INTO empleados (num, nombre, correo, departamento, activo)
VALUES ('099', 'Empleado 099', NULL, 'aca', 1);
```

Después puedes actualizar su información manualmente.

### **P: ¿Puedo vaciar solo los empleados sin borrar las marcas?**

**R**: No recomendado por integridad referencial. Mejor vaciar todo:
```bash
curl -X DELETE http://localhost:3005/api/database/reset
```

### **P: ¿Qué pasa si subo el mismo archivo del Nextep dos veces?**

**R**: 
- Primera vez: Crea período y guarda marcas
- Segunda vez: Marca el período como duplicado (por nombre de archivo UNIQUE)
- Las marcas duplicadas se ignoran (por UNIQUE constraint)

### **P: ¿El sistema completa información si tengo empleados parciales?**

**R**: Sí. Ejemplo:
```
Catálogo: num=1, nombre="Juan" (sin correo)
Nextep:   num=1, marcas=[...]

Sistema:
  ✅ Relaciona marcas con Juan
  ⚠️ Juan no tiene correo (puedes agregarlo después)
```

---

## 🚀 **PRÓXIMO PASO**

**Subir el archivo `001_2025_8_MON.xlsx` de nuevo en la página de Inicio (`/`) y ver el resultado con el parser actualizado que ahora detecta formato GRID.**

El sistema debería encontrar las **1240+ marcas** ahora. 🎯



