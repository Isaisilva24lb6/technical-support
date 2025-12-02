# 🧮 Calculador de Asistencia Diaria

## Descripción General

El `asistenciaCalculator.js` es un servicio backend que procesa las marcas crudas de entrada/salida y genera registros diarios de asistencia con métricas calculadas.

---

## 📋 Flujo de Cálculo

### 1. Trigger (Disparador)

El cálculo se ejecuta automáticamente después de confirmar la importación de un archivo de asistencia:

```javascript
// server/routes/asistencia.js
router.post('/confirm', async (req, res) => {
  // ... guardar marcas_crudas y totales_excel
  
  // 🆕 CALCULAR ASISTENCIA DIARIA
  const resultado = await asistenciaCalculator.calcularAsistenciaDiaria(
    periodoId,
    periodo.fecha_inicio,
    periodo.fecha_fin,
    empleados
  );
  
  console.log(`✅ ${resultado.registrosCreados} registros creados`);
});
```

### 2. Proceso de Cálculo

```
┌─────────────────────────────────────────┐
│  1. Generar días del período            │
│     (ej: 2025-08-01 a 2025-08-31)       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Obtener IDs de empleados desde BD   │
│     (mapear num → id)                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Para cada empleado:                 │
│     ├─ Para cada día:                   │
│     │  ├─ ¿Es día laborable?            │
│     │  ├─ Obtener marcas del día        │
│     │  ├─ Identificar entrada/salida    │
│     │  ├─ Calcular minutos trabajados   │
│     │  ├─ Calcular retardo              │
│     │  ├─ Calcular salida temprana      │
│     │  ├─ Determinar estado             │
│     │  └─ Guardar en asistencia_diaria  │
│     └─ Siguiente día                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Retornar resultado                  │
│     - registrosCreados                  │
│     - diasProcesados                    │
│     - tiempoSegundos                    │
└─────────────────────────────────────────┘
```

---

## 🔧 Funciones Principales

### `calcularAsistenciaDiaria(periodoId, fechaInicio, fechaFin, empleados)`

**Entrada:**
- `periodoId`: ID del período en la tabla `periodos`
- `fechaInicio`: Fecha de inicio (YYYY-MM-DD o ISO)
- `fechaFin`: Fecha de fin (YYYY-MM-DD o ISO)
- `empleados`: Array de objetos `{ num, nombre }`

**Salida:**
```javascript
{
  success: true,
  diasProcesados: 29,
  registrosCreados: 1247,
  tiempoSegundos: 2.35
}
```

**Proceso:**

1. **Normalizar fechas** (remover parte de tiempo si es ISO)
2. **Generar array de días** usando `generarDiasPeriodo()`
3. **Obtener IDs de empleados** desde BD con `obtenerEmpleadosMap()`
4. **Iterar sobre empleados y días**
5. **Calcular métricas** para cada día
6. **Guardar en `asistencia_diaria`** con UPSERT
7. **Retornar estadísticas**

---

## 📊 Cálculos Realizados

### 1. Determinar si es Día Laborable

```javascript
function esDiaLaborable(fecha) {
  const dia = new Date(fecha + 'T00:00:00').getDay();
  return dia !== 0 && dia !== 6; // 0=Domingo, 6=Sábado
}
```

**Resultado:**
- `true`: Lunes a Viernes
- `false`: Sábado y Domingo

---

### 2. Identificar Entrada y Salida

```javascript
function identificarEntradaSalida(marcas) {
  if (marcas.length === 0) {
    return { entrada: null, salida: null };
  }
  
  // Primera marca = Entrada
  const entrada = marcas[0].hora;
  
  // Última marca = Salida (si hay más de una)
  const salida = marcas.length > 1 ? marcas[marcas.length - 1].hora : null;
  
  return { entrada, salida };
}
```

**Ejemplo:**

Marcas del día:
```
08:15, 12:00, 13:00, 17:30
```

Resultado:
```javascript
{
  entrada: '08:15',  // Primera marca
  salida: '17:30'    // Última marca
}
```

---

### 3. Calcular Minutos Trabajados

```javascript
function calcularMinutosTrabajados(entrada, salida) {
  if (!entrada || !salida) return 0;
  
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = salida.split(':').map(Number);
  
  const minutosEntrada = hE * 60 + mE;
  const minutosSalida = hS * 60 + mS;
  
  return minutosSalida - minutosEntrada;
}
```

**Ejemplo:**

```javascript
entrada: '08:15'  // 8*60 + 15 = 495 minutos
salida:  '17:30'  // 17*60 + 30 = 1050 minutos

minutos_trabajados = 1050 - 495 = 555 minutos (9h 15m)
```

---

### 4. Calcular Retardo

Horario esperado de entrada: **07:00**

```javascript
function calcularRetardo(entrada, horaEsperada = '07:00') {
  if (!entrada) return { tiene: false, minutos: 0, cuenta: 0 };
  
  const [hE, mE] = entrada.split(':').map(Number);
  const [hEsp, mEsp] = horaEsperada.split(':').map(Number);
  
  const minutosEntrada = hE * 60 + mE;
  const minutosEsperados = hEsp * 60 + mEsp;
  
  if (minutosEntrada > minutosEsperados) {
    return {
      tiene: true,
      minutos: minutosEntrada - minutosEsperados,
      cuenta: 1
    };
  }
  
  return { tiene: false, minutos: 0, cuenta: 0 };
}
```

**Ejemplo:**

```javascript
entrada: '08:15'  // 495 minutos
esperado: '07:00'  // 420 minutos

retardo = 495 - 420 = 75 minutos (1h 15m)
```

---

### 5. Calcular Salida Temprana

Horario esperado de salida: **18:00**

```javascript
function calcularSalidaTemprana(salida, horaEsperada = '18:00') {
  if (!salida) return { tiene: false, minutos: 0, cuenta: 0 };
  
  const [hS, mS] = salida.split(':').map(Number);
  const [hEsp, mEsp] = horaEsperada.split(':').map(Number);
  
  const minutosSalida = hS * 60 + mS;
  const minutosEsperados = hEsp * 60 + mEsp;
  
  if (minutosSalida < minutosEsperados) {
    return {
      tiene: true,
      minutos: minutosEsperados - minutosSalida,
      cuenta: 1
    };
  }
  
  return { tiene: false, minutos: 0, cuenta: 0 };
}
```

**Ejemplo:**

```javascript
salida: '16:30'  // 990 minutos
esperado: '18:00'  // 1080 minutos

salida_temprana = 1080 - 990 = 90 minutos (1h 30m)
```

---

### 6. Determinar Estado del Día

```javascript
function determinarEstado(esLaborable, tieneEntrada, tieneSalida) {
  if (!esLaborable) {
    return 'No Laborable';
  }
  
  if (!tieneEntrada && !tieneSalida) {
    return 'Falta';
  }
  
  if (tieneEntrada && !tieneSalida) {
    return 'Incompleto';
  }
  
  if (tieneEntrada && tieneSalida) {
    return 'Completo';
  }
  
  return 'Desconocido';
}
```

**Estados posibles:**
- `'No Laborable'`: Fin de semana
- `'Falta'`: Día laborable sin marcas
- `'Incompleto'`: Solo entrada o solo salida
- `'Completo'`: Entrada y salida registradas
- `'Desconocido'`: Caso no contemplado

---

## 💾 Guardado en Base de Datos

```javascript
async function guardarRegistroDiario(registro) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO asistencia_diaria (
        periodo_id, empleado_id, fecha, dia_semana, es_laborable,
        entrada_real, salida_real, tiene_entrada, tiene_salida,
        minutos_trabajados,
        minutos_retardo, cuenta_retardo,
        minutos_salida_temprana, cuenta_salida_temprana,
        es_falta, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(periodo_id, empleado_id, fecha) DO UPDATE SET
        entrada_real = excluded.entrada_real,
        salida_real = excluded.salida_real,
        minutos_trabajados = excluded.minutos_trabajados,
        minutos_retardo = excluded.minutos_retardo,
        cuenta_retardo = excluded.cuenta_retardo,
        minutos_salida_temprana = excluded.minutos_salida_temprana,
        cuenta_salida_temprana = excluded.cuenta_salida_temprana,
        es_falta = excluded.es_falta,
        estado = excluded.estado
      `,
      [
        registro.periodoId,
        registro.empleadoId,
        registro.fecha,
        registro.diaSemana,
        registro.esLaborable ? 1 : 0,
        registro.entrada,
        registro.salida,
        registro.entrada ? 1 : 0,
        registro.salida ? 1 : 0,
        registro.minutosTrabajados,
        registro.retardo.minutos,
        registro.retardo.cuenta,
        registro.salidaTemprana.minutos,
        registro.salidaTemprana.cuenta,
        registro.estado === 'Falta' ? 1 : 0,
        registro.estado
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}
```

**Características:**
- ✅ **UPSERT**: Si ya existe el registro (mismo período + empleado + fecha), se actualiza
- ✅ **Atomic**: Cada inserción es una transacción
- ✅ **Foreign Keys**: Valida que `periodo_id` y `empleado_id` existan

---

## 📈 Ejemplo Completo

### Datos de Entrada

**Período:** Agosto 2025 (2025-08-01 a 2025-08-31)

**Empleado:** Juan (#1)

**Marcas del mes:**
```sql
-- Día 4 (lunes)
fecha: 2025-08-04, hora: 08:02, tipo: Entrada
fecha: 2025-08-04, hora: 11:06, tipo: Salida

-- Día 18 (lunes)
fecha: 2025-08-18, hora: 09:57, tipo: Entrada
fecha: 2025-08-18, hora: 13:57, tipo: Salida

-- Día 25 (lunes)
fecha: 2025-08-25, hora: 08:50, tipo: Entrada
fecha: 2025-08-25, hora: 14:58, tipo: Salida

-- ... resto de días sin marcas
```

### Proceso de Cálculo

#### Día 2025-08-04 (Lunes)

1. **Es laborable:** ✅ Sí (lunes)
2. **Marcas:**
   - Entrada: 08:02
   - Salida: 11:06
3. **Minutos trabajados:** 184 min (3h 4m)
4. **Retardo:**
   - Esperado: 07:00 (420 min)
   - Real: 08:02 (482 min)
   - Retardo: **62 min** (1h 2m) ⚠️
5. **Salida temprana:**
   - Esperado: 18:00 (1080 min)
   - Real: 11:06 (666 min)
   - Salida temprana: **414 min** (6h 54m) ⚠️
6. **Estado:** `'Completo'`

**Registro guardado:**
```sql
INSERT INTO asistencia_diaria (...) VALUES (
  1,                    -- periodo_id
  1,                    -- empleado_id (Juan)
  '2025-08-04',         -- fecha
  'Lunes',              -- dia_semana
  1,                    -- es_laborable
  '08:02',              -- entrada_real
  '11:06',              -- salida_real
  1, 1,                 -- tiene_entrada, tiene_salida
  184,                  -- minutos_trabajados
  62, 1,                -- minutos_retardo, cuenta_retardo
  414, 1,               -- minutos_salida_temprana, cuenta
  0, 0,                 -- minutos_extra_normal, minutos_extra_especial
  0, 0, 0,              -- es_falta, es_permiso, es_vacacion
  'Completo'            -- estado
);
```

---

#### Día 2025-08-05 (Martes)

1. **Es laborable:** ✅ Sí (martes)
2. **Marcas:** ❌ Ninguna
3. **Estado:** `'Falta'`

**Registro guardado:**
```sql
INSERT INTO asistencia_diaria (...) VALUES (
  1, 1, '2025-08-05', 'Martes', 1,
  NULL, NULL,          -- sin entrada ni salida
  0, 0,                -- sin marcas
  0,                   -- 0 minutos trabajados
  0, 0, 0, 0,          -- sin retardos ni salidas tempranas
  0, 0,                -- sin extras
  1, 0, 0,             -- ✓ es_falta
  'Falta'
);
```

---

#### Día 2025-08-09 (Sábado)

1. **Es laborable:** ❌ No (sábado)
2. **Estado:** `'No Laborable'`

**Registro guardado:**
```sql
INSERT INTO asistencia_diaria (...) VALUES (
  1, 1, '2025-08-09', 'Sábado', 0,  -- es_laborable = 0
  NULL, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0,
  'No Laborable'
);
```

---

## ✅ Validación Contra Excel

El calculador puede comparar sus resultados con los totales del Excel:

```javascript
async function validarCalculos(periodoId, empleadoId) {
  // Obtener nuestros cálculos
  const nuestrosCalculos = await db.get(`
    SELECT 
      SUM(minutos_trabajados) as total_trabajado,
      SUM(minutos_retardo) as total_retardo,
      SUM(cuenta_retardo) as cuenta_retardo,
      SUM(es_falta) as total_faltas
    FROM asistencia_diaria
    WHERE periodo_id = ? AND empleado_id = ? AND es_laborable = 1
  `, [periodoId, empleadoId]);
  
  // Obtener totales del Excel
  const totalesExcel = await db.get(`
    SELECT tiempo_real_min, retardos_min, retardos_cuenta, faltas
    FROM totales_excel
    WHERE periodo_id = ? AND empleado_id = ?
  `, [periodoId, empleadoId]);
  
  // Calcular diferencias
  const diferencias = {
    trabajado: nuestrosCalculos.total_trabajado - totalesExcel.tiempo_real_min,
    retardo_min: nuestrosCalculos.total_retardo - totalesExcel.retardos_min,
    faltas: nuestrosCalculos.total_faltas - totalesExcel.faltas
  };
  
  return { nuestros: nuestrosCalculos, excel: totalesExcel, diferencias };
}
```

**Uso:**
```javascript
const validacion = await validarCalculos(1, 1);
console.log('Diferencias:', validacion.diferencias);
// { trabajado: 0, retardo_min: 0, faltas: 0 } ← ¡Coincide! ✅
```

---

## 🚀 Performance

### Optimizaciones Implementadas

1. **Consultas agrupadas:**
   - Se obtiene el mapa de empleados en una sola consulta con `IN (...)`
   - Se consultan marcas una vez por día

2. **UPSERT nativo de SQLite:**
   - `ON CONFLICT(...) DO UPDATE` evita errores y permite re-cálculo

3. **Logging selectivo:**
   - Solo logs importantes (inicio, fin, errores)
   - Evita spam en consola

### Tiempos Estimados

Para **45 empleados** y **29 días** (1305 registros):

- ⚡ **Tiempo típico:** 2-3 segundos
- 🐢 **Peor caso:** 5-6 segundos (BD en HDD lento)

---

## 🛠️ Configuración

### Horarios Estándar

Actualmente hardcodeados:

```javascript
const HORARIO_ENTRADA_ESTANDAR = '07:00';
const HORARIO_SALIDA_ESTANDAR = '18:00';
```

**TODO:** Hacer configurable por:
- Empleado (horarios personalizados)
- Grupo (turnos: matutino, vespertino, nocturno)
- Día de la semana (jornadas reducidas)

### Días Laborables

Actualmente: Lunes a Viernes

**TODO:** Considerar:
- Días festivos (tabla `festivos`)
- Periodos vacacionales
- Horarios especiales

---

## 🐛 Manejo de Errores

```javascript
try {
  const resultado = await calcularAsistenciaDiaria(...);
  console.log(`✅ ${resultado.registrosCreados} registros`);
} catch (error) {
  console.error('[CALCULADOR ERROR]', error.message);
  // No falla el proceso de importación completo
  // Solo se registra el error y continúa
}
```

**Errores comunes:**
- Empleado sin ID en BD (se omite con warning)
- Fechas inválidas (normalización automática)
- BD bloqueada (retry automático de SQLite)

---

## 📝 Logs Generados

```
[CALCULADOR] Iniciando cálculo para período 1...
[CALCULADOR] Rango: 2025-08-01 a 2025-08-31
[CALCULADOR] Empleados: 43
[CALCULADOR DEBUG] Generando días: 2025-08-01 a 2025-08-31 = 31 días
[CALCULADOR] ✓ Empleado #1 procesado (31 días)
[CALCULADOR] ✓ Empleado #3 procesado (31 días)
...
[CALCULADOR] ✅ Cálculo completado en 2.35s
[CALCULADOR] Registros creados: 1333
```

---

## 🔮 Futuras Mejoras

1. **Horas Extra:**
   - Detectar minutos trabajados > 8 horas
   - Diferenciar extra normal vs especial (fines de semana/festivos)

2. **Permisos y Vacaciones:**
   - Integrar con tabla `permisos`
   - Marcar días como "Permiso" o "Vacación" automáticamente

3. **Horarios Flexibles:**
   - Leer de tabla `horarios_empleados`
   - Soportar turnos rotativos

4. **Validación en Tiempo Real:**
   - API endpoint para validar sin guardar
   - Preview de resultados antes de confirmar

5. **Cálculo Incremental:**
   - Solo recalcular días modificados
   - Cache de resultados previos

6. **Multi-threading:**
   - Paralelizar cálculo por empleados
   - Usar Workers para períodos grandes

---

## 📚 Referencias

- **Código fuente:** `/server/services/asistenciaCalculator.js`
- **Uso:** `/server/routes/asistencia.js` (línea ~160)
- **BD:** Ver [`DATABASE.md`](./DATABASE.md)
- **API:** Ver [`API.md`](./API.md)

---

**Última actualización:** Diciembre 2025

