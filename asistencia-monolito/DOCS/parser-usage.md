# 📖 Guía de Uso del Parser Inteligente

Sistema de parseo automático para archivos del reloj checador **Nextep NE-234**.

---

## 🎯 **¿Qué hace el sistema?**

El sistema **detecta automáticamente** la estructura de los archivos Excel del reloj checador sin necesidad de IA:

✅ **Identifica hojas**: Registros (marcas), Resumen (totales), Turnos (horarios)  
✅ **Detecta columnas**: Número de empleado, fecha, hora, tipo de marca, etc.  
✅ **Parsea fechas/horas**: Múltiples formatos automáticamente  
✅ **Extrae datos**: Marcas, totales, turnos, empleados  
✅ **IA opcional**: Ollama para casos ambiguos (100% opcional)

---

## 📁 **Estructura Creada**

```
asistencia-monolito/
├── shared/
│   └── constants.js              # Constantes y palabras clave
├── server/
│   ├── parsers/
│   │   ├── intelligentParser.js  # Parser con heurística (sin IA)
│   │   └── nextepParser.js       # Parser especializado Nextep NE-234
│   ├── ai/
│   │   └── ollamaClient.js       # Cliente Ollama (opcional)
│   └── utils/
│       └── dateParser.js         # Utilidades de fechas/horas
└── test-parser.js                # Script de prueba
```

---

## 🚀 **Instalación**

### **1. Instalar Dependencias**

```bash
cd /home/rubenisai24/mis-proyectos/technical-support/asistencia-monolito
npm install
```

**Nueva dependencia agregada:**
- `date-fns`: Para parseo robusto de fechas

---

## 🧪 **Probar el Parser**

### **Test Básico**

```bash
# Probar con un archivo de ejemplo
npm run test:parser

# O especificar un archivo
npm run test:parser ./data/uploads/empleados/tu-archivo.xlsx
```

**Salida esperada:**

```
╔════════════════════════════════════════════════════════════╗
║  🧪 Test del NextepParser                                  ║
╚════════════════════════════════════════════════════════════╝

📁 Archivo a parsear: ./data/uploads/empleados/archivo.xlsx

[PARSER] Archivo cargado: archivo.xlsx
[PARSER] Hojas encontradas: Registros, Resumen, Grupo 1
[PARSER] Hoja "Registros" detectada como: registros (confianza: 95%)
[PARSER] Hoja "Resumen" detectada como: resumen (confianza: 88%)
[PARSER] Hoja "Grupo 1" detectada como: turnos (confianza: 72%)

╔════════════════════════════════════════════════════════════╗
║  📊 RESULTADO DEL PARSEO                                   ║
╚════════════════════════════════════════════════════════════╝

✅ Success: true

📅 Período:
  - Archivo: archivo.xlsx
  - Inicio: 01/08/2025
  - Fin: 31/08/2025

📊 Estadísticas:
  - Total hojas: 3
  - Hoja de registros: Registros
  - Hoja de resumen: Resumen
  - Hojas de turnos: Grupo 1
  - Empleados detectados: 50
  - Marcas encontradas: 1240
  - Tiempo de procesamiento: 324ms

📝 Primeras 10 marcas:
   Num   | Fecha        | Hora  | Tipo
   ------|--------------|-------|----------
   001   | 01/08/2025   | 07:05 | Entrada
   001   | 01/08/2025   | 18:00 | Salida
   002   | 01/08/2025   | 07:00 | Entrada
   002   | 01/08/2025   | 17:30 | Salida
   ... y 1236 marcas más

✅ Test completado exitosamente
```

---

## 💻 **Uso en Código**

### **Ejemplo Básico**

```javascript
const { NextepParser } = require('./server/parsers/nextepParser');

async function procesarAsistencia() {
  const parser = new NextepParser();
  
  const result = await parser.parse('./data/uploads/asistencia.xlsx');
  
  if (result.success) {
    console.log(`✅ Parseado exitosamente:`);
    console.log(`   - ${result.stats.totalMarcas} marcas`);
    console.log(`   - ${result.stats.totalEmpleados} empleados`);
    
    // Usar los datos
    result.marcas.forEach(marca => {
      console.log(`${marca.num_empleado}: ${marca.fecha} ${marca.hora} - ${marca.tipo}`);
    });
  } else {
    console.error('❌ Errores:', result.errors);
  }
}
```

### **Integrar en tu API**

```javascript
// server/routes/asistencia.js
const express = require('express');
const multer = require('multer');
const { NextepParser } = require('../parsers/nextepParser');

const router = express.Router();
const upload = multer({ dest: './data/uploads/' });

router.post('/upload-asistencia', upload.single('excelFile'), async (req, res) => {
  try {
    const parser = new NextepParser();
    const result = await parser.parse(req.file.path);
    
    if (!result.success) {
      return res.status(400).json({
        error: 'Error al parsear el archivo',
        details: result.errors,
        warnings: result.warnings
      });
    }
    
    // TODO: Guardar result.marcas en la base de datos
    // TODO: Guardar result.totales en la base de datos
    // TODO: Guardar result.turnos en la base de datos
    
    res.json({
      success: true,
      message: 'Archivo procesado exitosamente',
      stats: result.stats,
      periodo: result.periodo
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🧠 **Cómo Funciona (Sin IA)**

### **1. Detección de Hojas**

El `IntelligentParser` usa **palabras clave** y **patrones de datos**:

```javascript
// Hoja de REGISTROS tiene:
- Palabras: 'fecha', 'hora', 'entrada', 'salida', 'marca'
- Patrones: fechas + horas + números repetidos

// Hoja de RESUMEN tiene:
- Palabras: 'total', 'retardo', 'extra', 'falta'
- Patrones: muchos números, pocos registros repetidos

// Hoja de TURNOS tiene:
- Palabras: 'horario', 'turno', 'grupo', 'lunes', 'martes'
- Patrones: horarios (07:00-18:00), días de la semana
```

### **2. Mapeo de Columnas**

Usa **expresiones regulares** para encontrar columnas:

```javascript
const COLUMN_PATTERNS = {
  num: /n[uúo]m|#|id|clave/i,
  nombre: /nombre|name|empleado/i,
  fecha: /fecha|date|día/i,
  hora: /hora|time/i,
  tipo: /tipo|entrada|salida/i
};
```

### **3. Parseo de Fechas/Horas**

Intenta **múltiples formatos** automáticamente:

```javascript
// Fechas soportadas:
- 20/07/2025 (dd/mm/yyyy)
- 2025-07-20 (yyyy-mm-dd)
- 1/8/2025 (d/m/yyyy)
- Excel serial number (44774)

// Horas soportadas:
- 07:05 (HH:MM)
- 7:05 AM (H:MM AM/PM)
- 0.5 (Excel decimal = 12:00)
```

### **4. Nivel de Confianza**

El parser calcula la **confianza** de su detección:

```javascript
Confianza >= 0.7  →  ✅ Muy probable, usar directamente
Confianza 0.4-0.7 →  ⚠️  Posible, revisar warnings
Confianza < 0.4   →  ❌ Incierto, marcar para revisión manual
                      (Aquí Ollama puede ayudar si está habilitado)
```

---

## 🤖 **Ollama (IA Local - OPCIONAL)**

Ollama **NO es necesario** para el funcionamiento básico. Solo mejora la detección en casos ambiguos.

### **Cuándo Usar Ollama**

- ✅ Archivos con formato nuevo/no estándar
- ✅ Hojas con nombres poco claros
- ✅ Confianza del parser < 60%

### **Instalar Ollama (Opcional)**

```bash
# En tu Raspberry Pi o PC
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo ligero (2GB)
ollama pull llama3.2:3b

# Verificar que funciona
ollama run llama3.2:3b "¿Qué es un reloj checador?"
```

### **Habilitar Ollama**

```bash
# En .env o variables de entorno
OLLAMA_ENABLED=true
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### **Cómo Funciona con Ollama**

```javascript
const { NextepParser } = require('./server/parsers/nextepParser');

const parser = new NextepParser();
const result = await parser.parse('./archivo.xlsx');

// Si una hoja tiene baja confianza, el parser automáticamente:
// 1. Consulta a Ollama
// 2. Ollama analiza y responde en JSON
// 3. Si Ollama mejora la confianza, usa su resultado
// 4. Si falla, usa el resultado del IntelligentParser
```

**Sin Ollama:**
```
[PARSER] Hoja "Hoja3" ambigua (confianza: 45%)
⚠️  Advertencias: "Hoja3" tiene confianza baja, revisar manualmente
```

**Con Ollama:**
```
[PARSER] Hoja "Hoja3" ambigua (confianza: 45%)
[OLLAMA] Analizando hoja: Hoja3
[OLLAMA] ✅ Análisis completado: tipo=turnos, confianza=0.82
[PARSER] Ollama mejoró detección: turnos (82%)
```

---

## ⚙️ **Configuración Avanzada**

### **Agregar Nuevas Palabras Clave**

Edita `shared/constants.js`:

```javascript
const SHEET_KEYWORDS = {
  registros: [
    'fecha', 'hora', 'entrada', 'salida',
    'tu-nueva-palabra'  // Agregar aquí
  ],
  // ...
};
```

### **Agregar Nuevos Patrones de Columna**

```javascript
const COLUMN_PATTERNS = {
  num: /n[uúo]m|#|id|clave/i,
  // Agregar nuevo campo
  miCampo: /mi.*patron|keyword/i
};
```

---

## 🐛 **Troubleshooting**

### **Error: "No se detectó fila de cabecera"**

**Causa**: El archivo no tiene una fila clara con palabras clave.

**Solución**:
```javascript
// El parser usará la fila 1 por defecto
// Verifica que la primera fila tenga los nombres de columnas
```

### **Error: "No se pudo parsear la fecha"**

**Causa**: Formato de fecha no soportado.

**Solución**: Agrega el formato en `server/utils/dateParser.js`:

```javascript
const formats = [
  'dd/MM/yyyy',
  'yyyy-MM-dd',
  'tu-formato-aquí'  // Agregar
];
```

### **Warning: "Hoja con confianza baja"**

**Opciones**:
1. Revisar manualmente la hoja
2. Habilitar Ollama para análisis con IA
3. Agregar palabras clave en `constants.js`

---

## 📊 **Formato de Salida**

### **Estructura del Resultado**

```javascript
{
  success: boolean,                    // ¿Éxito?
  periodo: {
    nombre_archivo: string,
    fecha_inicio: Date,
    fecha_fin: Date,
    fecha_carga: Date,
    departamento: string,
    estado: string,
    usuario_carga: string
  },
  empleados: [
    {
      num: string,                     // "001"
      nombre: string,                  // "Juan Pérez"
      activo: boolean
    }
  ],
  marcas: [
    {
      num_empleado: string,            // "001"
      fecha: Date,                     // 2025-08-01
      hora: string,                    // "07:05"
      tipo: string,                    // "Entrada" | "Salida"
      fila_original: number            // 15 (para debugging)
    }
  ],
  turnos: [],                          // Por implementar
  totales: [],                         // Datos de la hoja Resumen
  warnings: string[],                  // Advertencias no críticas
  errors: string[],                    // Errores críticos
  stats: {
    totalHojas: number,
    hojasDetectadas: {
      registros: string,               // "Registros"
      resumen: string,                 // "Resumen"
      turnos: string[]                 // ["Grupo 1", "Grupo 2"]
    },
    totalEmpleados: number,
    totalMarcas: number,
    totalTurnos: number,
    tiempoProcesamiento: number        // milisegundos
  }
}
```

---

## 🔗 **Próximos Pasos**

1. **Integrar en tu API**: Usa el parser en tus rutas de Express
2. **Guardar en SQLite**: Insertar `result.marcas` en la tabla `marcas_crudas`
3. **Validación manual**: Crear UI para confirmar datos parseados
4. **Cálculos**: Procesar marcas para detectar retardos, horas extra, etc.
5. **Tests**: Probar con múltiples archivos del Nextep NE-234

---

## 📝 **Ejemplo Completo**

```javascript
const { NextepParser } = require('./server/parsers/nextepParser');
const db = require('./config/db');

async function procesarArchivoAsistencia(filePath) {
  const parser = new NextepParser();
  const result = await parser.parse(filePath);
  
  if (!result.success) {
    throw new Error(`Errores: ${result.errors.join(', ')}`);
  }
  
  // Insertar período
  db.run(
    `INSERT INTO periodos (nombre_archivo, fecha_inicio, fecha_fin, departamento, estado)
     VALUES (?, ?, ?, ?, ?)`,
    [
      result.periodo.nombre_archivo,
      result.periodo.fecha_inicio,
      result.periodo.fecha_fin,
      result.periodo.departamento,
      result.periodo.estado
    ],
    function(err) {
      if (err) throw err;
      
      const periodoId = this.lastID;
      
      // Insertar marcas
      const stmt = db.prepare(
        `INSERT INTO marcas_crudas 
         (periodo_id, num_empleado, fecha, hora, tipo)
         VALUES (?, ?, ?, ?, ?)`
      );
      
      result.marcas.forEach(marca => {
        stmt.run(
          periodoId,
          marca.num_empleado,
          marca.fecha,
          marca.hora,
          marca.tipo
        );
      });
      
      stmt.finalize();
      
      console.log(`✅ Procesadas ${result.marcas.length} marcas`);
    }
  );
}
```

---

¿Listo para probar? Ejecuta:

```bash
npm run test:parser
```



