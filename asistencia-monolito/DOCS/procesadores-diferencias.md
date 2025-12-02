# 📋 Diferencia Entre Procesadores

**Sistema de Asistencia tiene DOS procesadores diferentes para DOS tipos de archivos**

---

## 🎯 **RESUMEN RÁPIDO**

| Procesador | Para Qué Es | Archivo Típico | Endpoint |
|------------|-------------|----------------|----------|
| **📋 Empleados** | Catálogo de trabajadores | `empleados_lista.xlsx` | `/api/empleados/import` |
| **⏰ Asistencia** | Marcas del reloj checador | `001_2025_8_MON.xlsx` | `/api/asistencia/upload` |

---

## 1️⃣ **PROCESADOR DE EMPLEADOS**

### **¿Para Qué Es?**

Para mantener actualizado el **catálogo de empleados** (nombres, correos, números).

### **¿Qué Archivo Necesita?**

Un Excel **simple** con columnas:

```
| Número | Nombre              | Correo                 | Departamento | Grupo |
|--------|---------------------|------------------------|--------------|-------|
| 001    | Juan Pérez          | juan@empresa.com       | Producción   | A     |
| 002    | María López         | maria@empresa.com      | Administración| B     |
| 003    | Carlos Rodríguez    | carlos@empresa.com     | Mantenimiento| A     |
```

### **Estructura del Excel:**

```
Hoja1 (o nombre similar)
├── Cabecera: Nombre, Correo, Número, Departamento, Grupo
└── Datos: Lista de empleados
```

### **Ejemplo de Archivo Válido:**

- ✅ `empleados_lista.xlsx`
- ✅ `catalogo_trabajadores.xlsx`
- ✅ `personal_activo.xlsx`

### **Endpoint:**

```
POST /api/empleados/import
```

### **¿Dónde Se Usa?**

- **Página**: Empleados (`/empleados`)
- **Botón**: "Subir Archivo Excel de Empleados"

### **Flujo:**

```
1. Usuario sube Excel de empleados
2. Sistema detecta nombres y correos
3. Usuario valida los datos
4. Sistema guarda en tabla `empleados`
```

---

## 2️⃣ **PROCESADOR DE ASISTENCIA (NEXTEP NE-234)**

### **¿Para Qué Es?**

Para procesar archivos **del reloj checador Nextep NE-234** con las marcas de entrada/salida del mes.

### **¿Qué Archivo Necesita?**

Un Excel **del Nextep** con múltiples hojas:

```
📊 Hoja "Resumen"
├── Totales del periodo por empleado
├── Tiempo requerido vs tiempo real
├── Retardos, extras, faltas
└── Bonos y deducciones

⏱️  Hoja "Registros"
├── Todas las marcas del reloj checador
├── Columnas: No. Empleado | Fecha | Hora | Entrada/Salida
└── Una fila por cada check-in/check-out

👥 Hojas de Grupos (1.3.5, 6.8.14, etc.)
├── Turnos y horarios por grupo
├── Lunes, Martes, Miércoles, etc.
└── Horarios esperados
```

### **Estructura del Excel:**

```
001_2025_8_MON.xlsx
├── Hoja: Resumen
│   ├── No. | Nombre | Tiempo Req. | Retardos | Extras | Faltas
│   └── Datos: Totales por empleado
│
├── Hoja: Registros
│   ├── No. | Fecha | Hora | Entrada/Salida
│   └── Datos: Todas las marcas del mes
│
├── Hoja: 1.3.5 (Grupo 1)
│   ├── Empleados del grupo
│   └── Horarios
│
├── Hoja: 6.8.14 (Grupo 2)
│   └── ...
│
└── Más hojas de grupos...
```

### **Ejemplo de Archivo Válido:**

- ✅ `001_2025_8_MON.xlsx` ← **El que tienes**
- ✅ `asistencia_agosto_2025.xlsx`
- ✅ `nextep_septiembre.xlsx`

### **Endpoint:**

```
POST /api/asistencia/upload
```

### **¿Dónde Se Usa?**

- **Página**: Inicio (`/`)
- **Sección**: "Subir Archivo Excel de Asistencia"

### **Flujo:**

```
1. Usuario sube Excel del Nextep
2. Sistema detecta automáticamente:
   - Hoja de registros (marcas)
   - Hoja de resumen (totales)
   - Hojas de turnos (grupos)
3. Parser extrae:
   - Marcas de entrada/salida
   - Empleados del periodo
   - Totales oficiales
4. Usuario valida preview
5. Sistema guarda en tablas:
   - periodos
   - marcas_crudas
   - totales_excel
```

---

## ❌ **ERROR COMÚN**

### **Subir archivo del Nextep en el procesador de Empleados**

```
❌ Archivo: 001_2025_8_MON.xlsx
❌ Página: /empleados
❌ Error: "No se pudo detectar la cabecera del Excel"
```

**¿Por qué?**
- El procesador de empleados busca columnas "Nombre" y "Correo"
- El archivo del Nextep tiene hojas "Resumen" y "Registros"
- Son estructuras completamente diferentes

### **✅ SOLUCIÓN:**

**Archivo del Nextep debe ir en:**
- Página: **Inicio** (`/`)
- Endpoint: `/api/asistencia/upload`

---

## 🔄 **FLUJO COMPLETO DEL SISTEMA**

```
┌─────────────────────────────────────────────────────────────┐
│  PASO 1: Mantener Catálogo de Empleados Actualizado         │
├─────────────────────────────────────────────────────────────┤
│  Página: /empleados                                          │
│  Archivo: empleados_lista.xlsx                               │
│  Procesador: /api/empleados/import                           │
│  Resultado: Tabla `empleados` actualizada                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 2: Procesar Asistencia del Mes                         │
├─────────────────────────────────────────────────────────────┤
│  Página: / (Inicio)                                          │
│  Archivo: 001_2025_8_MON.xlsx (del Nextep)                   │
│  Procesador: /api/asistencia/upload                          │
│  Resultado: Marcas, totales, turnos en BD                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PASO 3: Ver Reportes y Períodos                             │
├─────────────────────────────────────────────────────────────┤
│  Página: /periodos                                           │
│  Ver: Historial de meses procesados                          │
│  Exportar: Reportes, gráficas, estadísticas                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 **TABLA COMPARATIVA**

| Aspecto | Empleados | Asistencia |
|---------|-----------|------------|
| **Página** | `/empleados` | `/` (Inicio) |
| **Endpoint** | `/api/empleados/import` | `/api/asistencia/upload` |
| **Parser** | `excelParser.js` (viejo) | `NextepParser.js` (nuevo) |
| **Estructura** | 1 hoja simple | Múltiples hojas complejas |
| **Columnas** | Nombre, Correo, Num | Fecha, Hora, Entrada/Salida |
| **Frecuencia** | Cuando hay cambios de personal | Cada mes (archivo del Nextep) |
| **Guardado** | Tabla `empleados` | Tablas `periodos`, `marcas_crudas`, etc. |
| **Primary Key** | `num` (número de empleado) | `id` (auto-increment) |
| **Validación** | Prevenir duplicados | Validar marcas y totales |

---

## 🎯 **TU CASO ESPECÍFICO**

### **Archivo que Tienes:**
```
001_2025_8_MON(xlsx).xlsx
```

### **¿Qué Es?**
- ❌ NO es un catálogo de empleados
- ✅ SÍ es un archivo del Nextep NE-234
- Tiene hojas: Resumen, Registros, grupos

### **¿Dónde Subirlo?**
```
✅ Página: Inicio (/)
✅ Endpoint: /api/asistencia/upload
✅ Parser: NextepParser (detecta automáticamente)
```

### **¿Qué Hará el Sistema?**
```
1. Detecta hoja "Registros" → Extrae marcas
2. Detecta hoja "Resumen" → Extrae totales
3. Detecta hojas de grupos → Extrae turnos
4. Te muestra preview para validar
5. Al confirmar → Guarda en base de datos
```

---

## 🛠️ **CÓMO PROBAR AHORA**

### **Opción A: Desde Docker (Línea de comandos)**

```bash
# Probar el parser con tu archivo
docker-compose exec -T asistencia-app npm run test:parser /app/data/uploads/empleados/001_2025_8_MON.xlsx
```

**Nota**: Primero necesitas copiar el archivo a la carpeta correcta en el contenedor.

### **Opción B: Desde la Interfaz Web**

1. Ir a: `http://localhost:3005/`
2. Buscar sección: "Subir Archivo Excel de Asistencia"
3. Subir: `001_2025_8_MON.xlsx`
4. Ver preview de datos detectados
5. Confirmar para guardar

---

## 📝 **RESUMEN FINAL**

```
📋 EMPLEADOS (/empleados)
   ├── Archivo: Lista simple de trabajadores
   ├── Uso: Mantener catálogo actualizado
   └── Frecuencia: Cuando hay cambios de personal

⏰ ASISTENCIA (/)
   ├── Archivo: Excel del Nextep NE-234
   ├── Uso: Procesar marcas del mes
   └── Frecuencia: Cada mes
```

---

## ❓ **FAQ**

**P: ¿Debo subir primero el catálogo de empleados?**
R: Sí, es recomendable. Así el sistema conoce a los empleados antes de procesar sus marcas.

**P: ¿Puedo procesar asistencia sin tener empleados en el catálogo?**
R: Sí, el sistema los detectará automáticamente del archivo del Nextep, pero no tendrán correos ni departamentos.

**P: ¿Qué pasa si subo el archivo del Nextep en /empleados?**
R: Error 500: "No se pudo detectar la cabecera". Debes subirlo en Inicio (/).

**P: ¿El sistema detecta automáticamente qué tipo de archivo es?**
R: El NextepParser sí (busca hojas "Registros", "Resumen"). El procesador de empleados no.

---

**SIGUIENTE PASO**: Subir `001_2025_8_MON.xlsx` en la página de **Inicio** (`/`) y ver el resultado del parser inteligente. 🚀



