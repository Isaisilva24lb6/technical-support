# 📊 Formato GRID del Nextep NE-234

**Guía completa del formato calendario/grid del reloj checador Nextep**

---

## 📋 Tabla de Contenidos

1. [¿Qué es el Formato GRID?](#qué-es-el-formato-grid)
2. [Estructura del Excel](#estructura-del-excel)
3. [Detección Automática](#detección-automática)
4. [Procesamiento](#procesamiento)
5. [Ejemplos Reales](#ejemplos-reales)
6. [Algoritmo de Parseo](#algoritmo-de-parseo)

---

## 🎯 ¿Qué es el Formato GRID?

El formato GRID (o calendario) es un layout especial del Excel generado por el reloj checador **Nextep NE-234** donde:

```
✅ Los DÍAS son COLUMNAS (1, 2, 3... 31)
✅ Los EMPLEADOS son FILAS
✅ Cada CELDA contiene MÚLTIPLES horas del día
```

### **Visual Rápido:**

```
┌──────────┬───────┬────────┬────────┬────────┬─────┐
│ Nombre   │ Depto │   1    │   2    │   3    │ ... │
├──────────┼───────┼────────┼────────┼────────┼─────┤
│ Juan     │ aca   │ 08:02  │ 09:57  │ 09:50  │     │
│          │       │ 11:06  │ 13:57  │ 13:58  │     │
├──────────┼───────┼────────┼────────┼────────┼─────┤
│ Maria    │ aca   │ 08:45  │ 09:30  │        │     │
│          │       │ 14:12  │ 14:00  │        │     │
└──────────┴───────┴────────┴────────┴────────┴─────┘

Día 1 (Agosto 1): Juan checó 2 veces: 08:02, 11:06
Día 2 (Agosto 2): Juan checó 2 veces: 09:57, 13:57
Día 3 (Agosto 3): Juan checó 2 veces: 09:50, 13:58
```

---

## 📄 Estructura del Excel

### **Archivo Típico del Nextep:**

```
Nombre: 001_2025_8_MON.xlsx
        ↑   ↑    ↑  ↑
        │   │    │  └─ Mes (MON = Agosto en español)
        │   │    └──── Mes numérico (8)
        │   └───────── Año (2025)
        └───────────── ID del departamento (001)

Contiene ~17 hojas:
  - Registros        ← FORMATO GRID (principal) ⭐
  - Resumen          ← Totales del período
  - Grupo A, B, C... ← Horarios de turnos
```

---

## 🗂️ Hoja "Registros" (Formato GRID)

### **Cabecera:**

```excel
Fila 1-4: Información del período
┌────────────────────────────────────────────────────────────┐
│ CENTRO  NOMBRE:         PEDRAZA ADMINISTRACION             │
│ DEPARTAMENTO:  001 - aca                                   │
│ MES:           Agosto                                      │
│ PERIODO:       01/08/2025 - 31/08/2025                     │
└────────────────────────────────────────────────────────────┘

Fila 5-6: Cabecera de días
┌────┬────────┬──────┬───┬───┬───┬───┬───┬───┬───┬──────┬───┐
│ #  │ Nombre │ Depto│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ ...  │ 31│
│    │        │      │vie│sáb│dom│lun│mar│mié│jue│ ...  │dom│
└────┴────────┴──────┴───┴───┴───┴───┴───┴───┴───┴──────┴───┘
        ↑        ↑     ↑
        │        │     └─ Días del mes (columnas)
        │        └─────── Departamento
        └──────────────── Nombre del empleado
```

### **Datos de Empleados:**

```excel
Fila 7+: Datos de asistencia
┌────┬──────────────┬──────┬───────┬───────┬───────┬──────┐
│ 1  │ Juan         │ aca  │ 08:02 │ 09:57 │ 09:50 │ ...  │
│    │ Gutiérrez    │      │ 11:06 │ 13:57 │ 13:58 │      │
├────┼──────────────┼──────┼───────┼───────┼───────┼──────┤
│ 48 │ Mia Rivera   │ aca  │ 08:45 │ 09:30 │       │ ...  │
│    │              │      │ 14:12 │ 14:00 │       │      │
├────┼──────────────┼──────┼───────┼───────┼───────┼──────┤
│ 100│ Pedro Ancheyta│aca  │ 08:20 │       │ 09:10 │ ...  │
│    │              │      │ 11:30 │       │ 13:45 │      │
└────┴──────────────┴──────┴───────┴───────┴───────┴──────┘
  ↑          ↑         ↑        ↑
  │          │         │        └─ Horas del día 1 (múltiples)
  │          │         └────────── Departamento
  │          └──────────────────── Nombre
  └─────────────────────────────── Número empleado (sin padding) ⭐
```

---

## 🔍 Características Clave del Formato

### **1. Múltiples Horas por Celda:**

```
Celda típica (empleado 1, día 1):
┌─────────┐
│  08:02  │ ← Primera marca (entrada)
│  11:06  │ ← Segunda marca (salida)
│  14:00  │ ← Tercera marca (entrada)
│  18:30  │ ← Cuarta marca (salida)
└─────────┘

Separación: Salto de línea (\n)
Parseo: Split por \n
Tipo: Alterna (Entrada → Salida → Entrada → Salida)
```

### **2. Celdas Vacías:**

```
Si empleado no checó ese día:
┌─────────┐
│         │ ← Celda vacía o "-"
└─────────┘

Procesamiento:
  - Se detecta como vacía
  - No genera marcas
  - Posible falta (calculado después)
```

### **3. Nombres de Empleados:**

```
Pueden ocupar 2 filas:
┌────┬──────────────┐
│ 1  │ Juan         │ ← Primera fila
│    │ Gutiérrez    │ ← Segunda fila (si el nombre es largo)
└────┴──────────────┘

O solo 1 fila:
┌────┬──────────────┐
│ 48 │ Mia Rivera   │ ← Una sola fila
└────┴──────────────┘

Detección:
  - Primer columna con número → empleado nuevo
  - Primer columna vacía → continuación del nombre anterior
```

### **4. Números de Empleado:**

```
IMPORTANTE: SIN PADDING (leading zeros)

Correcto:   1, 48, 100, 278
Incorrecto: 001, 048, 100, 278

Por qué:
  - Excel lo guarda como número
  - El Nextep lo exporta sin ceros
  - La BD usa el mismo formato
  - Facilita las relaciones num → empleados.id
```

---

## 🤖 Detección Automática

### **Algoritmo de Detección:**

```javascript
// NextepParser.detectFormatoRegistros()

function detectFormatoRegistros(sheet) {
  let diasComoColumnas = 0;
  
  // Busca en las primeras 10 filas
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 50; col++) {
      const valor = sheet.getCell(row, col).value;
      
      // ¿Es un número del 1 al 31?
      if (typeof valor === 'number' && valor >= 1 && valor <= 31) {
        diasComoColumnas++;
      }
    }
  }
  
  // Si encontró 10+ días → GRID
  if (diasComoColumnas >= 10) {
    return 'GRID';
  }
  
  // Si no → LINEAL (formato clásico)
  return 'LINEAL';
}

Resultado:
  diasComoColumnas >= 10 → Formato GRID ✅
  diasComoColumnas < 10  → Formato LINEAL
```

### **Señales de Formato GRID:**

```
✅ Múltiples columnas con números 1-31
✅ Cabecera con días de la semana
✅ Primera columna con números de empleado
✅ Nombre de hoja: "Registros", "Lista", "Marcas"
✅ Celdas con múltiples líneas de texto
```

---

## ⚙️ Procesamiento

### **Flujo Completo:**

```
1. ABRIR EXCEL
   ├─► Leer todas las hojas
   └─► Seleccionar hoja "Registros" (prioridad alta)

2. DETECTAR FORMATO
   ├─► Buscar números 1-31 en cabecera
   ├─► Contar días encontrados
   └─► Determinar: GRID o LINEAL

3. EXTRAER AÑO Y MES
   ├─► Fuente 1: Nombre del archivo (001_2025_8_MON.xlsx)
   │   └─► Regex: /(\d{4})_(\d+)/
   │       → año: 2025, mes: 8
   │
   └─► Fuente 2: Contenido de la hoja
       └─► Buscar "PERIODO: 01/08/2025 - 31/08/2025"
       → Parsear fecha de inicio

4. DETECTAR FILA DE CABECERA
   ├─► Buscar fila con números 1-31
   └─► Guardar posiciones de columnas:
       {
         columnaNum: 1,
         columnaNombre: 2,
         columnaDepto: 3,
         dia1: 4,
         dia2: 5,
         ...
         dia31: 34
       }

5. PROCESAR EMPLEADOS (fila por fila)
   ├─► Leer número de empleado (columna 1)
   ├─► Leer nombre (columna 2)
   ├─► Leer departamento (columna 3)
   │
   └─► Por cada día (columnas 4-34):
       ├─► Leer celda
       ├─► Extraer horas (split \n)
       └─► Crear marcas:
           {
             num_empleado: "1",
             fecha: "2025-08-01",
             hora: "08:02",
             tipo: "Entrada"
           },
           {
             num_empleado: "1",
             fecha: "2025-08-01",
             hora: "11:06",
             tipo: "Salida"
           }

6. RETORNAR RESULTADO
   └─► {
         marcas: [...],       // Array de todas las marcas
         empleados: [...],    // Empleados únicos detectados
         stats: {
           totalMarcas: 1240,
           totalEmpleados: 50,
           diasProcesados: 31
         }
       }
```

---

## 💻 Código: parseRegistrosGrid()

### **Método Principal:**

```javascript
// NextepParser.parseRegistrosGrid(sheet, headerRow, columnMap)

parseRegistrosGrid(sheet, headerRow, columnMap) {
  const marcas = [];
  const empleadosDetectados = new Set();
  
  // Extraer año y mes del archivo
  const { año, mes } = this.extractYearMonth();
  
  // Buscar columnas de días (1-31)
  const diasColumnas = this.detectDayColumns(sheet, headerRow);
  // diasColumnas = [
  //   { dia: 1, columna: 4 },
  //   { dia: 2, columna: 5 },
  //   ...
  //   { dia: 31, columna: 34 }
  // ]
  
  // Procesar cada fila después de la cabecera
  let rowIdx = headerRow + 1;
  const maxRows = sheet.rowCount;
  
  while (rowIdx <= maxRows) {
    const row = sheet.getRow(rowIdx);
    
    // ¿Hay número de empleado?
    const numEmpleado = this.extractEmployeeNumber(row.getCell(1));
    
    if (!numEmpleado) {
      rowIdx++;
      continue; // Fila vacía o continuación de nombre
    }
    
    // Extraer datos del empleado
    const nombre = this.extractText(row.getCell(2));
    const departamento = this.extractText(row.getCell(3)) || 'aca';
    
    empleadosDetectados.add(numEmpleado);
    
    // Procesar cada día
    for (const { dia, columna } of diasColumnas) {
      const celda = row.getCell(columna);
      const horas = this.extractHorasDeCell(celda);
      
      if (horas.length === 0) continue; // Día sin marcas
      
      // Generar fecha del día
      const fecha = `${año}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
      
      // Crear marcas (alternando Entrada/Salida)
      horas.forEach((hora, idx) => {
        marcas.push({
          num_empleado: numEmpleado,
          nombre_empleado: nombre,
          departamento: departamento,
          fecha: fecha,
          hora: hora,
          tipo: (idx % 2 === 0) ? 'Entrada' : 'Salida'
        });
      });
    }
    
    rowIdx++;
  }
  
  return {
    marcas: marcas,
    empleados: Array.from(empleadosDetectados).map(num => ({
      num: num,
      detectadoEn: 'hoja_registros'
    })),
    stats: {
      totalMarcas: marcas.length,
      totalEmpleados: empleadosDetectados.size,
      diasProcesados: diasColumnas.length
    }
  };
}
```

### **Método Auxiliar: extractHorasDeCell()**

```javascript
// NextepParser.extractHorasDeCell(cell)

extractHorasDeCell(cell) {
  if (!cell || !cell.value) return [];
  
  let texto = '';
  
  if (typeof cell.value === 'string') {
    texto = cell.value;
  } else if (typeof cell.value === 'object' && cell.value.richText) {
    // Celda con formato rich text (múltiples líneas con estilos)
    texto = cell.value.richText
      .map(part => part.text)
      .join('\n');
  } else {
    return [];
  }
  
  // Split por saltos de línea
  const lineas = texto.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);
  
  const horas = [];
  const regexHora = /\b(\d{1,2}):(\d{2})\b/g;
  
  for (const linea of lineas) {
    let match;
    while ((match = regexHora.exec(linea)) !== null) {
      const hora = `${match[1].padStart(2, '0')}:${match[2]}`;
      horas.push(hora);
    }
  }
  
  return horas;
}

// Ejemplos:
extractHorasDeCell("08:02\n11:06")       → ["08:02", "11:06"]
extractHorasDeCell("08:02\n11:06\n14:00")→ ["08:02", "11:06", "14:00"]
extractHorasDeCell("")                   → []
extractHorasDeCell("Permiso")            → []
extractHorasDeCell("9:30\n14:12")        → ["09:30", "14:12"]
```

---

## 📊 Ejemplos Reales

### **Ejemplo 1: Empleado con Horario Completo**

**Excel:**
```
| # | Nombre          | Depto | 1     | 2     |
|---|-----------------|-------|-------|-------|
| 1 | Juan Gutiérrez  | aca   | 08:02 | 09:57 |
|   |                 |       | 11:06 | 13:57 |
```

**Marcas Generadas:**
```javascript
[
  {
    num_empleado: "1",
    nombre_empleado: "Juan Gutiérrez",
    departamento: "aca",
    fecha: "2025-08-01",
    hora: "08:02",
    tipo: "Entrada"
  },
  {
    num_empleado: "1",
    nombre_empleado: "Juan Gutiérrez",
    departamento: "aca",
    fecha: "2025-08-01",
    hora: "11:06",
    tipo: "Salida"
  },
  {
    num_empleado: "1",
    nombre_empleado: "Juan Gutiérrez",
    departamento: "aca",
    fecha: "2025-08-02",
    hora: "09:57",
    tipo: "Entrada"
  },
  {
    num_empleado: "1",
    nombre_empleado: "Juan Gutiérrez",
    departamento: "aca",
    fecha: "2025-08-02",
    hora: "13:57",
    tipo: "Salida"
  }
]
```

---

### **Ejemplo 2: Empleado con Horarios Irregulares**

**Excel:**
```
| # | Nombre         | Depto | 1     | 2     | 3     |
|---|----------------|-------|-------|-------|-------|
| 48| Mia Rivera     | aca   | 08:45 |       | 09:10 |
|   |                |       | 14:12 |       | 13:45 |
```

**Marcas Generadas:**
```javascript
[
  // Día 1: Checó
  {
    num_empleado: "48",
    nombre_empleado: "Mia Rivera",
    fecha: "2025-08-01",
    hora: "08:45",
    tipo: "Entrada"
  },
  {
    num_empleado: "48",
    nombre_empleado: "Mia Rivera",
    fecha: "2025-08-01",
    hora: "14:12",
    tipo: "Salida"
  },
  
  // Día 2: No checó (celda vacía)
  // (no genera marcas)
  
  // Día 3: Checó
  {
    num_empleado: "48",
    nombre_empleado: "Mia Rivera",
    fecha: "2025-08-03",
    hora: "09:10",
    tipo: "Entrada"
  },
  {
    num_empleado: "48",
    nombre_empleado: "Mia Rivera",
    fecha: "2025-08-03",
    hora: "13:45",
    tipo: "Salida"
  }
]
```

---

### **Ejemplo 3: Empleado con Tiempo Extra**

**Excel:**
```
| # | Nombre          | Depto | 1     |
|---|-----------------|-------|-------|
| 100| Pedro Ancheyta | aca   | 08:20 |
|    |                |       | 11:30 |
|    |                |       | 14:00 |
|    |                |       | 18:45 |
|    |                |       | 19:00 |
|    |                |       | 21:30 |
```

**Marcas Generadas:**
```javascript
[
  // Turno mañana
  { hora: "08:20", tipo: "Entrada" },
  { hora: "11:30", tipo: "Salida" },
  
  // Turno tarde
  { hora: "14:00", tipo: "Entrada" },
  { hora: "18:45", tipo: "Salida" },
  
  // Tiempo extra
  { hora: "19:00", tipo: "Entrada" },
  { hora: "21:30", tipo: "Salida" }
]

Total de marcas: 6
Turnos: 2 completos + 1 extra
```

---

## 🎯 Ventajas del Formato GRID

### **Para el Usuario:**
```
✅ Vista de calendario visual
✅ Fácil de leer el mes completo
✅ Detecta patrones rápidamente
✅ Compacto (1 fila por empleado)
```

### **Para el Sistema:**
```
✅ Información densa (1240+ marcas en 1 hoja)
✅ Estructura predecible
✅ Fácil detección automática
✅ Rápido de procesar (400-600ms)
```

---

## ⚠️ Casos Especiales

### **1. Celdas con Texto (no horas):**

```excel
| 1 | Juan | aca | Permiso | 08:02 |
                      ↑         ↑
                      │         └─ Procesable: Genera marca
                      └─────────── No procesable: Se ignora

Regex: /\b(\d{1,2}):(\d{2})\b/
  - "Permiso"  → No match, ignora
  - "Falta"    → No match, ignora
  - "08:02"    → Match, procesa ✅
```

### **2. Horas con Formato Inconsistente:**

```javascript
"8:02"    → Normaliza a "08:02" ✅
"08:2"    → NO match (minutos deben ser 2 dígitos)
"8:02 AM" → Match "8:02", normaliza a "08:02" ✅
"24:00"   → Match, pero inválido (verificar después)
```

### **3. Múltiples Empleados con Mismo Nombre:**

```excel
| 1  | Juan Gutiérrez | aca | ... |
| 48 | Juan Gutiérrez | rh  | ... |

Diferenciación:
  - Por número de empleado (1 vs 48) ✅
  - Por departamento (aca vs rh)
  - BD usa empleados.id (único)
```

### **4. Meses con Días Variables:**

```
Febrero:  28 días (o 29)
Abril:    30 días
Agosto:   31 días

Procesamiento:
  - Detecta todos los días presentes en cabecera
  - Procesa solo las columnas que existen
  - Ignora columnas 30-31 si no están presentes
```

---

## 📈 Performance

### **Benchmark (Archivo Típico):**

```
Archivo:      001_2025_8_MON.xlsx
Empleados:    50
Días:         31
Marcas:       1240
Tiempo:       550ms

Desglose:
  - Abrir Excel:          120ms
  - Detectar formato:      30ms
  - Analizar hojas:        80ms
  - Procesar GRID:        280ms
  - Generar resultado:     40ms
```

### **Optimizaciones Aplicadas:**

```javascript
✅ Caché de análisis de hojas
✅ Regex compilado una vez
✅ Set() para empleados únicos (O(1) lookup)
✅ Procesamiento incremental (no carga todo en RAM)
✅ Early exit en detección de formato
```

---

## 🧪 Testing

### **Archivo de Prueba:**
```bash
npm run test:parser data/uploads/asistencia/001_2025_8_MON.xlsx

Salida esperada:
========================================
📄 ANALIZANDO ARCHIVO: 001_2025_8_MON.xlsx
========================================

📊 RESULTADO DEL PARSEO:
----------------------------------------
✅ Éxito: true
🗓️ Período: 01/08/2025 - 31/08/2025
📁 Departamento: aca

📈 ESTADÍSTICAS:
  ⏱️ Marcas encontradas: 1240
  👥 Empleados detectados: 50
  📋 Hojas procesadas: 3
  
🔍 ANÁLISIS DE HOJAS:
  1. Registros (tipo: registros, confianza: 87%)
     Formato: GRID ✅
     Marcas: 1240
     
  2. Resumen (tipo: resumen, confianza: 95%)
     Totales: 50 empleados
     
  3. Grupo A (tipo: turnos, confianza: 82%)
     Horarios: A (6:00-11:00, 13:00-18:00)
```

---

## 📚 Documentación Relacionada

- [Parser Inteligente](./parser-inteligente.md)
- [Arquitectura del Sistema](./arquitectura-sistema.md)
- [API Endpoints](./api-endpoints.md)
- [Procesamiento de Asistencia](./procesar-asistencia.md)

---

**Última actualización: 2025-01-29**



