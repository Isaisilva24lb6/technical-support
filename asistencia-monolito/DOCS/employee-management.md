# 👥 MÓDULO DE GESTIÓN DE EMPLEADOS

## 📋 Descripción General

Este módulo permite importar y gestionar la base de datos de empleados utilizando archivos Excel. El sistema incluye **parsing inteligente** para detectar nombres y correos de Microsoft (Outlook, Hotmail, corporativos) incluso en casos con datos mal formateados.

---

## 🎯 Características Principales

### 1. **Parsing Inteligente de Excel**

El sistema puede detectar y extraer automáticamente:

- **Nombres completos** (con acentos, ñ, y caracteres especiales)
- **Correos de Microsoft** (Outlook, Hotmail, Live, MSN, y dominios corporativos)
- **Números de empleado** (en diferentes formatos: `001`, `E-001`, `EMP001`)
- **Departamentos y grupos**

#### Casos Especiales que Maneja:

| Problema | Solución |
|----------|----------|
| **Múltiples nombres en una celda** | `"Juan Pérez, María López"` → Se crean 2 empleados |
| **Múltiples correos en una celda** | `"juan@outlook.com, maria@hotmail.com"` → Se emparejan con los nombres |
| **Correos mal formateados** | `"juan @ outlook.com"` → Se limpia a `"juan@outlook.com"` |
| **Nombres con caracteres especiales** | `"José María Ñoño"` → Se capitaliza correctamente |
| **Números con prefijos** | `"E-001"`, `"EMP001"` → Se extrae el número `001` |
| **Más nombres que correos** | Se marcan los empleados sin correo con una **advertencia** |
| **Más correos que nombres** | Se usa el primer nombre y se numeran las variantes |

### 2. **Validación Manual de Datos**

Después de parsear el Excel, el sistema muestra una **tabla interactiva** donde puedes:

- ✅ Revisar todos los datos detectados
- ✏️ Editar cualquier campo antes de guardar
- ⚠️ Ver advertencias de datos faltantes o duplicados
- 🔍 Identificar empleados sin correo

### 3. **Prevención de Duplicados**

El sistema previene duplicados automáticamente:

- **Por número de empleado:** Si existe, se **actualiza** la información
- **Por correo:** Si existe, se **marca como duplicado** y no se inserta
- **Notificación:** Se informa al usuario qué empleados fueron insertados, actualizados o duplicados

---

## 🏗️ Arquitectura del Módulo

### Backend

```
server/
├── routes/
│   └── empleados.js          # Rutas del módulo de empleados
└── utils/
    └── excelParser.js        # Parser inteligente de Excel
```

#### Endpoints API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/empleados/import` | Sube y parsea un Excel de empleados |
| `POST` | `/api/empleados/confirm` | Confirma y guarda empleados validados |
| `GET` | `/api/empleados` | Obtiene todos los empleados |
| `GET` | `/api/empleados/:id` | Obtiene un empleado específico |
| `DELETE` | `/api/empleados/:id` | Desactiva un empleado (soft delete) |

### Frontend

```
client/src/
├── components/
│   ├── Employee/
│   │   ├── EmployeeImporter.tsx       # Componente maestro
│   │   └── EmployeeImporter.css
│   └── Upload/
│       ├── FileUploader.tsx           # Componente de carga de archivos
│       ├── FileUploader.css
│       ├── DataValidationTable.tsx    # Tabla de validación
│       └── DataValidationTable.css
├── pages/
│   └── EmpleadosPage.tsx              # Página principal del módulo
└── services/
    └── api.ts                         # Servicio de API centralizado
```

---

## 📝 Formato del Excel

### Columnas Requeridas

Tu archivo Excel debe tener **al menos** estas columnas (el sistema las detecta automáticamente por palabras clave):

| Columna | Palabras Clave | Requerido | Ejemplo |
|---------|----------------|-----------|---------|
| **Número** | `n°`, `nº`, `#`, `no`, `num`, `número`, `id` | ✅ Sí | `2`, `3`, `4` |
| **Nombre** | `nombre`, `name`, `personal` | ✅ Sí | `Pedro Ancheyta Bringas` |
| **Correo** | `correo`, `email`, `mail` | ⚠️ Recomendado | `pedro.ab@iztapalapa3.tecnm.mx` |

> **Nota:** Los campos `Departamento` y `Grupo` no están actualmente implementados, se agregarán en versiones futuras.

### Ejemplo de Excel Válido

```
| N° | NOMBRE DEL PERSONAL          | CORREO                              |
|----|------------------------------|-------------------------------------|
| 2  | Pedro Ancheyta Bringas       | pedro.ab@iztapalapa3.tecnm.mx       |
| 3  | Ivanhoe Gilberto Osorio León | ivanhoe.ol@iztapalapa3.tecnm.mx     |
| 4  | Josue Josafat Moreno Breña   | josue.mb@iztapalapa3.tecnm.mx       |
```

> **Importante:** Los correos pueden estar como **hipervínculos** (links) en Excel, el sistema los detecta automáticamente.

### Casos Especiales Soportados

#### ✅ Múltiples Nombres/Correos en una Celda

```
| Nombre                      | Correo                                          |
|-----------------------------|-------------------------------------------------|
| Juan Pérez, María López     | juan@outlook.com, maria@hotmail.com             |
```

**Resultado:** Se crean 2 empleados:
- Juan Pérez → `juan@outlook.com`
- María López → `maria@hotmail.com`

#### ⚠️ Nombres sin Correo

```
| Nombre              | Correo            |
|---------------------|-------------------|
| Juan Pérez          | juan@outlook.com  |
| María López         |                   | ← Sin correo
```

**Resultado:** Se marca con **advertencia** y se permite editar antes de guardar.

---

## 🚀 Flujo de Uso

### 1. Acceder al Módulo

Navega a **`/empleados`** desde el menú principal o desde la página de inicio.

### 2. Subir Excel

1. **Arrastra** tu archivo Excel a la zona de carga o **haz clic** para seleccionarlo
2. El sistema valida que sea un archivo `.xlsx` o `.xls`
3. Tamaño máximo: **10 MB**

### 3. Revisar Datos Parseados

El sistema muestra:

- 📊 **Resumen:** Total de empleados, con/sin correo, con advertencias
- ⚠️ **Advertencias:** Lista de problemas detectados
- 📋 **Tabla:** Todos los empleados con opción de editar

### 4. Validar y Editar (Opcional)

- Haz clic en el botón **Editar** (✏️) de cualquier fila
- Modifica los campos necesarios
- Guarda con **Guardar** (✓) o cancela con **Cancelar** (✗)

### 5. Confirmar Procesamiento

1. Haz clic en **"Confirmar y Procesar"**
2. El sistema guarda los empleados en la base de datos
3. Se muestra un resumen del resultado:
   - ✅ Insertados
   - 🔄 Actualizados
   - ⚠️ Duplicados
   - ❌ Errores

---

## 🔧 Configuración del Entorno

### Variables de Entorno (Frontend)

Crea un archivo `.env` en `client/`:

```bash
# URL del API Backend para desarrollo local
VITE_API_URL=http://localhost:3005/api
```

### Base de Datos

La tabla de empleados tiene la siguiente estructura:

```sql
CREATE TABLE empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    num TEXT NOT NULL UNIQUE,           -- Número de empleado
    nombre TEXT NOT NULL,                -- Nombre completo
    correo TEXT UNIQUE,                  -- Correo de Microsoft
    departamento TEXT DEFAULT 'aca',     -- Departamento
    grupo TEXT,                          -- Grupo/Turno
    activo INTEGER DEFAULT 1             -- 1 = activo, 0 = inactivo
);
```

---

## 🧪 Pruebas

### Probar el Parser Inteligente

Puedes crear un Excel de prueba con casos complejos:

```
| Número | Nombre                      | Correo                                          |
|--------|-----------------------------|-------------------------------------------------|
| 001    | Juan Pérez, María López     | juan@outlook.com, maria@hotmail.com             |
| 002    | José Rodríguez              | jose @ outlook.com                              |
| E-003  | Ana García Fernández        | ana.garcia@empresa.com                          |
| 004    | Pedro Martínez              |                                                 |
```

**Resultado Esperado:**
- 5 empleados detectados
- 1 advertencia (Pedro Martínez sin correo)
- Correos limpiados automáticamente
- Números normalizados

---

## 📦 Dependencias

### Backend
- `exceljs` - Para leer archivos Excel
- `multer` - Para subir archivos

### Frontend
- `axios` - Para peticiones HTTP
- `react-icons` - Para iconos
- `react-router-dom` - Para navegación

---

## 🎨 Interfaz de Usuario

### Características Visuales

- ✨ **Sin video de fondo** en esta página (para evitar distracciones)
- 🎨 **Glassmorphism** en las tarjetas para mantener consistencia visual
- 📱 **100% Responsivo** (móvil, tablet, desktop)
- 🌓 **Dark/Light Mode** completo
- 🎯 **Tabla interactiva** con edición inline
- ⚠️ **Advertencias visuales** con códigos de color

### Estados del Sistema

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| **OK** | Verde | ✅ | Empleado sin problemas |
| **Advertencia** | Amarillo | ⚠️ | Falta correo o dato incompleto |
| **Error** | Rojo | ❌ | No se pudo procesar |
| **Cargando** | Azul | ⏳ | Procesando archivo |
| **Éxito** | Verde | 🎉 | Procesamiento completado |

---

## 🔒 Seguridad

- ✅ Validación de tipo de archivo (solo `.xlsx`, `.xls`)
- ✅ Límite de tamaño (10 MB)
- ✅ Sanitización de correos electrónicos
- ✅ Prevención de inyección SQL (prepared statements)
- ✅ Validación de formato de correo
- ✅ Limpieza automática de archivos temporales

---

## 📚 Próximas Mejoras

- [ ] **Exportar empleados** a Excel
- [ ] **Búsqueda y filtrado** en la tabla de empleados
- [ ] **Paginación** para grandes volúmenes
- [ ] **Integración con Microsoft Graph API** para validar correos en tiempo real
- [ ] **Historial de cambios** (auditoría)
- [ ] **Importación incremental** (solo cambios)
- [ ] **Templates de Excel** descargables

---

## 🐛 Troubleshooting

### Error: "Error de conexión con el servidor"

**Causa:** El backend no está corriendo.

**Solución:**
```bash
cd asistencia-monolito
node index.js
```

### Error: "Tipo de archivo no válido"

**Causa:** El archivo no es `.xlsx` o `.xls`.

**Solución:** Guarda tu archivo como Excel Workbook (`.xlsx`) en Excel/LibreOffice.

### Los correos no se detectan

**Causa:** El formato de correo no es válido o no es de Microsoft.

**Solución:**
- Verifica que los correos tengan el formato: `usuario@dominio.com`
- Asegúrate de que sean cuentas de Microsoft o corporativas

### Se duplican empleados

**Causa:** El número de empleado o correo ya existen en la base de datos.

**Solución:** El sistema detecta automáticamente duplicados y los marca. Revisa la tabla de validación antes de confirmar.

---

## 📞 Soporte

Si encuentras algún problema o tienes sugerencias, revisa:

1. **Logs del backend:** `console.log` muestra información detallada del parsing
2. **DevTools del navegador:** Pestaña "Network" para ver peticiones HTTP
3. **Base de datos:** `data/asistencia.db` → Tabla `empleados`

---

## ✅ Checklist de Implementación

- [x] Parser inteligente de Excel con detección de nombres/correos
- [x] Endpoint de importación (`POST /api/empleados/import`)
- [x] Endpoint de confirmación (`POST /api/empleados/confirm`)
- [x] Prevención de duplicados por número y correo
- [x] Componente de carga de archivos (FileUploader)
- [x] Tabla de validación interactiva (DataValidationTable)
- [x] Integración frontend-backend
- [x] Página dedicada sin video de fondo
- [x] Navegación desde el menú principal
- [x] Validación de tipo y tamaño de archivo
- [x] Manejo de errores robusto
- [x] Interfaz responsive con dark mode
- [x] Documentación completa

---

## 🎉 ¡Listo para Usar!

El módulo de gestión de empleados está **100% funcional** y listo para:

1. **Desarrollo local:** `http://localhost:5173/empleados`
2. **Docker:** Después de hacer `docker-compose up --build`

**Siguiente paso:** Subir un Excel de empleados y probar todo el flujo. 🚀

