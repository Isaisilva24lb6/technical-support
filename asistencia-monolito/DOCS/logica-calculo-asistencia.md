# 📊 LÓGICA DE CÁLCULO - ASISTENCIA DIARIA

## 🎯 OBJETIVO
Calcular automáticamente la asistencia día por día de cada empleado basándose en:
1. **Marcas crudas** (entradas/salidas del reloj checador)
2. **Totales del Excel** (hoja "Resumen" como referencia)
3. **Reglas de negocio** (horarios, días laborables, etc.)

---

## 📋 DATOS DE ENTRADA

### **1. Del Período (periodos)**
```sql
- fecha_inicio: '2025-08-01'
- fecha_fin: '2025-08-31'
- departamento: 'aca'
```

### **2. Del Empleado (empleados)**
```sql
- id: 1
- num: '1'
- nombre: 'Juan Gutiérrez González'
- departamento: 'aca'
- grupo: 'A' (puede ser NULL)
```

### **3. De las Marcas (marcas_crudas)**
```sql
Ejemplo de Juan en Agosto:
- 2025-08-04 | 08:02 | Entrada
- 2025-08-04 | 11:06 | Salida
- 2025-08-18 | 09:57 | Entrada
- 2025-08-18 | 13:57 | Salida
... etc
```

### **4. De los Totales (totales_excel)**
```sql
Juan - Agosto:
- tiempo_requerido_min: 735 * 60 = 44100 min
- tiempo_real_min: 32.37 * 60 ≈ 1942 min
- retardos_cuenta: 7
- retardos_min: 3907 min
- salidas_tempranas_cuenta: 7
- salidas_tempranas_min: 1661 min
- dias_asistidos: 21 (días laborables del mes)
- faltas: 13
```

---

## 🧮 PROCESO DE CÁLCULO (Día por Día)

### **PASO 1: Generar Lista de Días del Período**

```javascript
/**
 * Genera array de fechas entre fecha_inicio y fecha_fin
 * 
 * Ejemplo Agosto 2025:
 * ['2025-08-01', '2025-08-02', ..., '2025-08-31']
 */
function generarDiasPeriodo(fechaInicio, fechaFin) {
  const dias = [];
  let fecha = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  while (fecha <= fin) {
    dias.push(fecha.toISOString().split('T')[0]);
    fecha.setDate(fecha.getDate() + 1);
  }
  
  return dias;
}
```

**Resultado para Agosto 2025:** 31 días

---

### **PASO 2: Determinar si es Día Laborable**

```javascript
/**
 * Determina si una fecha es día laborable (L-V)
 * 
 * REGLA: Sábado (6) y Domingo (0) = NO laborables
 */
function esDiaLaborable(fecha) {
  const dia = new Date(fecha).getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb
  return dia !== 0 && dia !== 6; // L-V = true
}

/**
 * Obtiene el nombre del día
 */
function getNombreDia(fecha) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date(fecha).getDay()];
}
```

**Ejemplo Agosto 2025:**
- 01 Ago (Viernes) → Laborable ✓
- 02 Ago (Sábado) → NO laborable ✗
- 03 Ago (Domingo) → NO laborable ✗
- 04 Ago (Lunes) → Laborable ✓

**Total días laborables Agosto:** 21 días

---

### **PASO 3: Obtener Marcas del Día**

```javascript
/**
 * Obtiene todas las marcas de un empleado en una fecha específica
 */
async function getMarcasDelDia(periodoId, empleadoId, fecha) {
  return await db.all(`
    SELECT fecha, hora, tipo
    FROM marcas_crudas
    WHERE periodo_id = ? AND empleado_id = ? AND fecha = ?
    ORDER BY hora ASC
  `, [periodoId, empleadoId, fecha]);
}
```

**Ejemplo Juan - 04 Agosto:**
```javascript
[
  { fecha: '2025-08-04', hora: '08:02', tipo: 'Entrada' },
  { fecha: '2025-08-04', hora: '11:06', tipo: 'Salida' }
]
```

**Ejemplo Juan - 01 Agosto:**
```javascript
[] // Sin marcas = Falta
```

---

### **PASO 4: Identificar Entrada y Salida**

```javascript
/**
 * De todas las marcas del día, identifica la primera entrada y última salida
 */
function identificarEntradaSalida(marcas) {
  if (!marcas || marcas.length === 0) {
    return { entrada: null, salida: null };
  }
  
  // REGLA: Primera marca del día = Entrada
  const entrada = marcas[0];
  
  // REGLA: Última marca del día = Salida
  const salida = marcas.length > 1 ? marcas[marcas.length - 1] : null;
  
  return {
    entrada: entrada ? entrada.hora : null,
    salida: salida ? salida.hora : null
  };
}
```

**Ejemplo Juan - 04 Agosto:**
```javascript
{
  entrada: '08:02',
  salida: '11:06'
}
```

**Ejemplo Juan - 21 Agosto:**
```javascript
{
  entrada: '09:57',
  salida: null  // ← Día incompleto
}
```

---

### **PASO 5: Calcular Minutos Trabajados**

```javascript
/**
 * Calcula los minutos entre entrada y salida
 */
function calcularMinutosTrabajados(entrada, salida) {
  if (!entrada || !salida) return 0;
  
  // Convertir '08:02' → minutos desde medianoche
  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = salida.split(':').map(Number);
  
  const minutosEntrada = hE * 60 + mE;
  const minutosSalida = hS * 60 + mS;
  
  return minutosSalida - minutosEntrada;
}
```

**Ejemplo Juan - 04 Agosto:**
```javascript
entrada: '08:02' → 482 minutos
salida: '11:06'  → 666 minutos
trabajados: 666 - 482 = 184 minutos (≈ 3.07 horas) ✓
```

---

### **PASO 6: Detectar Retardos**

```javascript
/**
 * Detecta si hay retardo basándose en horario esperado
 * 
 * NOTA: Por ahora usaremos un horario genérico (07:00 AM)
 * TODO: Obtener del horario asignado al empleado/grupo
 */
function calcularRetardo(entrada, horaEsperada = '07:00') {
  if (!entrada) return { tiene: false, minutos: 0 };
  
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

**Ejemplo Juan - 04 Agosto:**
```javascript
entrada: '08:02'
esperada: '07:00'
retardo: 08:02 - 07:00 = 62 minutos ✓
```

---

### **PASO 7: Detectar Salidas Tempranas**

```javascript
/**
 * Detecta si hay salida temprana basándose en horario esperado
 * 
 * NOTA: Por ahora usaremos un horario genérico (18:00)
 * TODO: Obtener del horario asignado al empleado/grupo
 */
function calcularSalidaTemprana(salida, horaEsperada = '18:00') {
  if (!salida) return { tiene: false, minutos: 0 };
  
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

**Ejemplo Juan - 04 Agosto:**
```javascript
salida: '11:06'
esperada: '18:00'
salida_temprana: 18:00 - 11:06 = 414 minutos (6.9 horas) ✓
```

---

### **PASO 8: Determinar Estado del Día**

```javascript
/**
 * Determina el estado del día según las condiciones
 */
function determinarEstado(esLaborable, tieneEntrada, tieneSalida) {
  // Día no laborable (fin de semana)
  if (!esLaborable) {
    return 'No Laborable';
  }
  
  // Día laborable sin marcas = Falta
  if (!tieneEntrada && !tieneSalida) {
    return 'Falta';
  }
  
  // Tiene entrada pero no salida = Incompleto
  if (tieneEntrada && !tieneSalida) {
    return 'Incompleto';
  }
  
  // Tiene entrada y salida = Completo
  if (tieneEntrada && tieneSalida) {
    return 'Completo';
  }
  
  return 'Desconocido';
}
```

**Ejemplos:**
- 04 Ago (L): Entrada + Salida → **'Completo'** ✓
- 21 Ago (J): Solo Entrada → **'Incompleto'** ⚠️
- 01 Ago (V): Sin marcas → **'Falta'** ❌
- 02 Ago (S): Fin de semana → **'No Laborable'** 📅

---

## 🔄 ALGORITMO COMPLETO

```javascript
/**
 * Calcula asistencia diaria para un empleado en un período
 */
async function calcularAsistenciaDiaria(periodoId, empleadoId, fechaInicio, fechaFin) {
  
  console.log(`[CÁLCULO] Procesando asistencia de empleado #${empleadoId}...`);
  
  // 1. Generar todos los días del período
  const dias = generarDiasPeriodo(fechaInicio, fechaFin);
  
  // 2. Para cada día, calcular asistencia
  for (const fecha of dias) {
    
    // 2.1. Determinar si es laborable
    const esLaborable = esDiaLaborable(fecha);
    const diaSemana = getNombreDia(fecha);
    
    // 2.2. Obtener marcas del día
    const marcas = await getMarcasDelDia(periodoId, empleadoId, fecha);
    const { entrada, salida } = identificarEntradaSalida(marcas);
    
    // 2.3. Calcular métricas
    const minutosTrabajados = calcularMinutosTrabajados(entrada, salida);
    const retardo = calcularRetardo(entrada);
    const salidaTemprana = calcularSalidaTemprana(salida);
    const estado = determinarEstado(esLaborable, !!entrada, !!salida);
    
    // 2.4. Guardar en asistencia_diaria
    await db.run(`
      INSERT INTO asistencia_diaria (
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
        estado = excluded.estado
    `, [
      periodoId, empleadoId, fecha, diaSemana, esLaborable ? 1 : 0,
      entrada, salida, entrada ? 1 : 0, salida ? 1 : 0,
      minutosTrabajados,
      retardo.minutos, retardo.cuenta,
      salidaTemprana.minutos, salidaTemprana.cuenta,
      estado === 'Falta' ? 1 : 0,
      estado
    ]);
  }
  
  console.log(`[CÁLCULO] ✅ Asistencia calculada: ${dias.length} días procesados`);
}
```

---

## ✅ VALIDACIÓN CON TOTALES DEL EXCEL

Después de calcular todos los días, **validamos** que nuestros cálculos coincidan con el Excel:

```javascript
async function validarCalculos(periodoId, empleadoId) {
  
  // 1. Obtener nuestros cálculos
  const nuestrosCalulos = await db.get(`
    SELECT 
      SUM(minutos_trabajados) as total_trabajado,
      SUM(minutos_retardo) as total_retardo,
      SUM(cuenta_retardo) as cuenta_retardo,
      SUM(minutos_salida_temprana) as total_salida_temprana,
      SUM(cuenta_salida_temprana) as cuenta_salida_temprana,
      SUM(es_falta) as total_faltas
    FROM asistencia_diaria
    WHERE periodo_id = ? AND empleado_id = ? AND es_laborable = 1
  `, [periodoId, empleadoId]);
  
  // 2. Obtener totales del Excel
  const totalesExcel = await db.get(`
    SELECT 
      tiempo_real_min,
      retardos_min,
      retardos_cuenta,
      salidas_tempranas_min,
      salidas_tempranas_cuenta,
      faltas
    FROM totales_excel
    WHERE periodo_id = ? AND empleado_id = ?
  `, [periodoId, empleadoId]);
  
  // 3. Comparar
  const diferencias = {
    trabajado: nuestrosCalulos.total_trabajado - totalesExcel.tiempo_real_min,
    retardo_min: nuestrosCalulos.total_retardo - totalesExcel.retardos_min,
    retardo_cuenta: nuestrosCalulos.cuenta_retardo - totalesExcel.retardos_cuenta,
    faltas: nuestrosCalulos.total_faltas - totalesExcel.faltas
  };
  
  // 4. Reportar
  console.log('[VALIDACIÓN] Diferencias con Excel:');
  console.log(`  Minutos trabajados: ${diferencias.trabajado} min`);
  console.log(`  Minutos retardo: ${diferencias.retardo_min} min`);
  console.log(`  Cuenta retardo: ${diferencias.retardo_cuenta}`);
  console.log(`  Faltas: ${diferencias.faltas}`);
  
  return diferencias;
}
```

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Tabla creada** (asistencia_diaria)
2. 🔄 **Implementar funciones** en `/server/services/asistenciaCalculator.js`
3. 🔄 **Integrar en endpoint** `/api/asistencia/confirm`
4. 🔄 **Probar con datos de Juan**
5. 🔄 **Validar con totales del Excel**
6. 🔄 **Crear endpoint de consulta** `/api/asistencia/periodos/:id/dia-por-dia`
7. 🔄 **Frontend con gráficas**

---

## 📝 NOTAS IMPORTANTES

### **1. Horarios Esperados**
- Por ahora usamos horarios **genéricos** (07:00-18:00)
- **TODO:** Implementar lectura de horarios de la tabla `horarios_turnos`
- **TODO:** Asignar horarios por empleado/grupo

### **2. Horas Extra**
- El Excel tiene `extra_normal_min` y `extra_especial_min`
- **TODO:** Definir reglas para calcular horas extra
- ¿Después de cuántas horas se considera extra?
- ¿Qué diferencia hay entre normal y especial?

### **3. Vacaciones y Permisos**
- El Excel tiene campos `vacaciones` y `permisos`
- **TODO:** ¿Cómo se identifican? ¿Hay una hoja específica?
- ¿O se marcan manualmente después?

### **4. Días Festivos**
- **TODO:** Tabla de días festivos para México
- Los festivos no deben contar como faltas

---

**Documento creado:** 2025-12-01  
**Autor:** Asistente IA  
**Estado:** Planificación completa ✅

