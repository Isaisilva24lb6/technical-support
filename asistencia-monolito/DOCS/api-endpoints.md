# 🔌 API Endpoints - Referencia Completa

**Documentación completa de todos los endpoints del sistema**

---

## 📋 Tabla de Contenidos

1. [Resumen General](#resumen-general)
2. [Empleados](#empleados)
3. [Asistencia](#asistencia)
4. [Database (Testing)](#database-testing)
5. [Códigos de Respuesta](#códigos-de-respuesta)
6. [Manejo de Errores](#manejo-de-errores)

---

## 🎯 Resumen General

### **Base URL:**

```
Desarrollo: http://localhost:3005/api
Producción: https://tu-dominio.com/api
```

### **Headers Comunes:**

```http
Content-Type: application/json
Accept: application/json
```

### **Grupos de Endpoints:**

```
/api/empleados   → Gestión de empleados (CRUD + Import/Export)
/api/asistencia  → Procesamiento de archivos Nextep
/api/database    → Gestión de BD (solo testing/desarrollo)
```

---

## 👥 Empleados

### **1. Importar Empleados desde Excel**

#### `POST /api/empleados/import`

Parsea un archivo Excel de empleados y retorna un preview para confirmación.

**Request:**

```http
POST /api/empleados/import
Content-Type: multipart/form-data

Body (form-data):
  excelFile: File (empleados_lista.xlsx)
```

**Response (200):**

```json
{
  "message": "Archivo parseado exitosamente",
  "filename": "empleados_1764468070803.xlsx",
  "tempFilePath": "/app/data/uploads/empleados/empleados_1764468070803.xlsx",
  "employees": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez Gonzalez",
      "correo": "juan.gg@tzapaltipa3-1ecem.mx",
      "departamento": "aca",
      "grupo": "A"
    },
    {
      "num": "48",
      "nombre": "Mia Xiclali Rivera Vera",
      "correo": "mia.xv@tzapaltipa3-1ecem.mx",
      "departamento": "aca",
      "grupo": "B"
    }
  ],
  "warnings": [],
  "stats": {
    "total": 44,
    "conCorreo": 44,
    "sinCorreo": 0
  }
}
```

**Response (400):**

```json
{
  "error": "No se pudo detectar la cabecera del Excel.",
  "details": "No se encontraron columnas 'Nombre' y 'Correo'"
}
```

---

### **2. Confirmar Importación de Empleados**

#### `POST /api/empleados/confirm`

Guarda los empleados parseados en la base de datos.

**Request:**

```http
POST /api/empleados/confirm
Content-Type: application/json

Body:
{
  "employees": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez Gonzalez",
      "correo": "juan.gg@tzapaltipa3-1ecem.mx",
      "departamento": "aca",
      "grupo": "A"
    }
  ],
  "tempFilePath": "/app/data/uploads/empleados/empleados_xxx.xlsx"
}
```

**Response (200):**

```json
{
  "message": "Empleados procesados exitosamente",
  "results": {
    "insertados": 44,
    "actualizados": 0,
    "errores": 0,
    "detalles": []
  }
}
```

**Response (400):**

```json
{
  "error": "Error al procesar empleados",
  "details": ["Empleado 1: Número duplicado", "..."]
}
```

---

### **3. Crear Empleado Manual**

#### `POST /api/empleados/create`

Crea un empleado individual manualmente.

**Request:**

```http
POST /api/empleados/create
Content-Type: application/json

Body:
{
  "num": "999",
  "nombre": "Carlos Méndez López",
  "correo": "carlos.m@empresa.com",
  "departamento": "aca",
  "grupo": "C"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Empleado creado exitosamente",
  "empleado": {
    "id": 45,
    "num": "999",
    "nombre": "Carlos Méndez López",
    "correo": "carlos.m@empresa.com",
    "departamento": "aca",
    "grupo": "C",
    "activo": 1
  }
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "El número de empleado ya existe"
}
```

**Validaciones:**

```
- num: Requerido, único
- nombre: Requerido, mínimo 3 caracteres
- correo: Opcional, pero si se proporciona debe ser único y válido
- departamento: Opcional, default "aca"
- grupo: Opcional
```

---

### **4. Listar Empleados**

#### `GET /api/empleados`

Obtiene todos los empleados activos.

**Request:**

```http
GET /api/empleados
```

**Response (200):**

```json
[
  {
    "id": 1,
    "num": "1",
    "nombre": "Juan Gutiérrez Gonzalez",
    "correo": "juan.gg@tzapaltipa3-1ecem.mx",
    "departamento": "aca",
    "grupo": "A",
    "activo": 1
  },
  {
    "id": 2,
    "num": "48",
    "nombre": "Mia Xiclali Rivera Vera",
    "correo": "mia.xv@tzapaltipa3-1ecem.mx",
    "departamento": "aca",
    "grupo": "B",
    "activo": 1
  }
]
```

**Ordenamiento:** Por `num` (CAST como entero)

---

### **5. Obtener Empleado por ID**

#### `GET /api/empleados/:id`

Obtiene un empleado específico por su ID interno.

**Request:**

```http
GET /api/empleados/1
```

**Response (200):**

```json
{
  "id": 1,
  "num": "1",
  "nombre": "Juan Gutiérrez Gonzalez",
  "correo": "juan.gg@tzapaltipa3-1ecem.mx",
  "departamento": "aca",
  "grupo": "A",
  "activo": 1
}
```

**Response (404):**

```json
{
  "error": "Empleado no encontrado"
}
```

---

### **6. Actualizar Empleado**

#### `PUT /api/empleados/:id`

Actualiza los datos de un empleado existente.

**Request:**

```http
PUT /api/empleados/1
Content-Type: application/json

Body:
{
  "nombre": "Juan Gutiérrez González (Actualizado)",
  "correo": "juan.nuevo@empresa.com",
  "departamento": "rh",
  "grupo": "B",
  "activo": 1
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Empleado actualizado exitosamente",
  "empleado": {
    "id": 1,
    "num": "1",
    "nombre": "Juan Gutiérrez González (Actualizado)",
    "correo": "juan.nuevo@empresa.com",
    "departamento": "rh",
    "grupo": "B",
    "activo": 1
  }
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "El correo ya está registrado por otro empleado"
}
```

**Response (404):**

```json
{
  "success": false,
  "error": "Empleado no encontrado"
}
```

**Nota:** El campo `num` NO se puede modificar (es la clave de negocio).

---

### **7. Eliminar Empleado (Soft Delete)**

#### `DELETE /api/empleados/:id`

Marca un empleado como inactivo (soft delete). NO elimina físicamente el registro.

**Request:**

```http
DELETE /api/empleados/1
```

**Response (200):**

```json
{
  "success": true,
  "message": "Empleado eliminado exitosamente",
  "empleado": {
    "id": 1,
    "num": "1",
    "nombre": "Juan Gutiérrez Gonzalez",
    "activo": 0
  }
}
```

**Response (404):**

```json
{
  "success": false,
  "error": "Empleado no encontrado"
}
```

**Nota:** Se ejecuta `UPDATE empleados SET activo = 0` para preservar la integridad referencial con `marcas_crudas`.

---

### **8. Exportar Empleados a Excel**

#### `GET /api/empleados/export`

Descarga un archivo Excel con todos los empleados activos.

**Request:**

```http
GET /api/empleados/export
```

**Response (200):**

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="empleados_2025-01-29.xlsx"

(archivo Excel binario)
```

**Estructura del Excel:**

```excel
| Num | Nombre              | Correo                  | Departamento | Grupo |
|-----|---------------------|-------------------------|--------------|-------|
| 1   | Juan Gutiérrez      | juan.gg@...            | aca          | A     |
| 48  | Mia Rivera          | mia.xv@...             | aca          | B     |
```

**Response (500):**

```json
{
  "success": false,
  "error": "Error al exportar empleados",
  "details": "..."
}
```

---

## ⏰ Asistencia

### **9. Subir Archivo del Nextep**

#### `POST /api/asistencia/upload`

Procesa un archivo Excel del reloj checador Nextep NE-234.

**Request:**

```http
POST /api/asistencia/upload
Content-Type: multipart/form-data

Body (form-data):
  excelFile: File (001_2025_8_MON.xlsx)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Archivo procesado exitosamente",
  "filename": "asistencia_1764468145832.xlsx",
  "tempFilePath": "/app/data/uploads/asistencia/asistencia_1764468145832.xlsx",
  "periodo": {
    "nombre": "001_2025_8_MON.xlsx",
    "fechaInicio": "2025-08-01",
    "fechaFin": "2025-08-31",
    "departamento": "aca"
  },
  "stats": {
    "totalMarcas": 1240,
    "totalEmpleados": 50,
    "hojasProcesadas": 3
  },
  "analisis": {
    "hojas": [
      {
        "nombre": "Registros",
        "tipo": "registros",
        "formato": "GRID",
        "confianza": 87,
        "marcas": 1240,
        "empleados": 50
      },
      {
        "nombre": "Resumen",
        "tipo": "resumen",
        "confianza": 95,
        "totales": 50
      },
      {
        "nombre": "Grupo A",
        "tipo": "turnos",
        "confianza": 82,
        "horarios": ["6:00-11:00", "13:00-18:00"]
      }
    ]
  },
  "preview": {
    "empleados": [
      { "num": "1", "nombre": "Juan Gutiérrez" },
      { "num": "48", "nombre": "Mia Rivera" }
    ],
    "marcas": [
      {
        "num_empleado": "1",
        "fecha": "2025-08-01",
        "hora": "08:02",
        "tipo": "Entrada"
      },
      {
        "num_empleado": "1",
        "fecha": "2025-08-01",
        "hora": "11:06",
        "tipo": "Salida"
      }
    ]
  }
}
```

**Response (400):**

```json
{
  "error": "Error al procesar el archivo de asistencia",
  "details": ["No se encontró hoja de registros", "..."]
}
```

**Procesamiento:**

```
1. Detecta formato (GRID vs LINEAL)
2. Extrae año/mes del nombre del archivo
3. Analiza hojas del Excel:
   - Registros: Marcas del reloj (GRID)
   - Resumen: Totales del período
   - Grupos: Horarios de turnos
4. Parsea marcas, totales y turnos
5. Retorna preview para confirmación
```

---

### **10. Confirmar y Guardar Asistencia**

#### `POST /api/asistencia/confirm`

Guarda los datos parseados en la base de datos.

**Request:**

```http
POST /api/asistencia/confirm
Content-Type: application/json

Body:
{
  "periodo": {
    "nombre": "001_2025_8_MON.xlsx",
    "fechaInicio": "2025-08-01",
    "fechaFin": "2025-08-31",
    "departamento": "aca"
  },
  "marcas": [
    {
      "num_empleado": "1",
      "fecha": "2025-08-01",
      "hora": "08:02",
      "tipo": "Entrada"
    }
  ],
  "totales": [...],
  "horarios": [...],
  "tempFilePath": "/app/data/uploads/asistencia/asistencia_xxx.xlsx"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Asistencia guardada exitosamente",
  "results": {
    "periodo_id": 1,
    "marcas_insertadas": 1240,
    "totales_insertados": 50,
    "horarios_insertados": 3,
    "empleados_no_encontrados": [],
    "advertencias": []
  }
}
```

**Response (400):**

```json
{
  "success": false,
  "error": "Error al guardar asistencia",
  "details": ["Empleado 999 no encontrado en catálogo", "..."]
}
```

**Proceso:**

```
1. Inserta período en tabla `periodos`
2. Por cada marca:
   - Busca empleado por num_empleado
   - Relaciona marca con empleados.id
   - Inserta en `marcas_crudas`
3. Inserta totales en `totales_excel`
4. Inserta horarios en `horarios_turnos`
5. Registra log en `logs_importacion`
```

---

## 🗄️ Database (Testing)

### **11. Estadísticas de la Base de Datos**

#### `GET /api/database/stats`

Obtiene contadores de registros en las tablas principales.

**Request:**

```http
GET /api/database/stats
```

**Response (200):**

```json
{
  "empleados": 44,
  "periodos": 1,
  "marcas": 1240,
  "totales": 50
}
```

**Uso:** Para verificar el estado actual de la BD en desarrollo.

---

### **12. Vaciar Base de Datos**

#### `DELETE /api/database/reset`

Elimina TODOS los datos de TODAS las tablas. ⚠️ **USO EXCLUSIVO PARA TESTING.**

**Request:**

```http
DELETE /api/database/reset
```

**Response (200):**

```json
{
  "success": true,
  "message": "Base de datos vaciada exitosamente",
  "results": {
    "empleados": 0,
    "periodos": 0,
    "marcas": 0,
    "totales": 0
  }
}
```

**Response (500):**

```json
{
  "success": false,
  "message": "Error al vaciar la base de datos",
  "details": "..."
}
```

**Proceso:**

```sql
DELETE FROM logs_importacion;
DELETE FROM asistencia_diaria;
DELETE FROM marcas_crudas;
DELETE FROM horarios_turnos;
DELETE FROM totales_excel;
DELETE FROM empleados;
DELETE FROM periodos;

-- Reiniciar AUTOINCREMENT
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='logs_importacion';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='asistencia_diaria';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='marcas_crudas';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='horarios_turnos';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='totales_excel';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='empleados';
UPDATE SQLITE_SEQUENCE SET SEQ=0 WHERE NAME='periodos';
```

⚠️ **ADVERTENCIA:** Este endpoint NO debe estar disponible en producción.

---

## 📊 Códigos de Respuesta

### **Códigos HTTP Usados:**

```
200 OK                  - Solicitud exitosa
201 Created             - Recurso creado exitosamente
400 Bad Request         - Error de validación o datos incorrectos
404 Not Found           - Recurso no encontrado
500 Internal Server Error - Error interno del servidor
```

### **Estructura de Respuestas Exitosas:**

```json
{
  "success": true,
  "message": "Descripción de la operación exitosa",
  "data": { ... }
}
```

### **Estructura de Respuestas de Error:**

```json
{
  "success": false,
  "error": "Mensaje de error principal",
  "details": "Información adicional o array de errores"
}
```

---

## ⚠️ Manejo de Errores

### **Errores Comunes:**

#### **1. Archivo no subido (400)**

```json
{
  "error": "No se ha subido ningún archivo."
}
```

**Causa:** No se envió el campo `excelFile` en el `multipart/form-data`.

**Solución:** Verificar que el campo del formulario se llame `excelFile`.

---

#### **2. Excel sin cabecera válida (400)**

```json
{
  "error": "No se pudo detectar la cabecera del Excel.",
  "details": "No se encontraron columnas 'Nombre' y 'Correo'"
}
```

**Causa:** El Excel no tiene las columnas requeridas (`Nombre`, `Correo`, `Num`).

**Solución:** Verificar que el Excel tenga la estructura correcta.

---

#### **3. Número de empleado duplicado (400)**

```json
{
  "success": false,
  "error": "El número de empleado ya existe"
}
```

**Causa:** Se intentó crear/importar un empleado con un `num` que ya existe en la BD.

**Solución:** Usar un número diferente o actualizar el empleado existente.

---

#### **4. Correo duplicado (400)**

```json
{
  "success": false,
  "error": "El correo ya está registrado"
}
```

**Causa:** Se intentó crear/importar un empleado con un `correo` que ya existe.

**Solución:** Usar un correo diferente o actualizar el empleado existente.

---

#### **5. Empleado no encontrado (404)**

```json
{
  "success": false,
  "error": "Empleado no encontrado"
}
```

**Causa:** Se intentó obtener/actualizar/eliminar un empleado que no existe.

**Solución:** Verificar que el ID sea correcto.

---

#### **6. Error al parsear Excel (400)**

```json
{
  "error": "Error al procesar el archivo de asistencia",
  "details": ["No se encontró hoja de registros", "Formato no reconocido"]
}
```

**Causa:** El Excel no es del formato Nextep esperado.

**Solución:** Verificar que sea un archivo del Nextep NE-234.

---

#### **7. Empleado no encontrado en catálogo (400)**

```json
{
  "success": false,
  "error": "Error al guardar asistencia",
  "details": ["Empleado 999 no encontrado en catálogo"]
}
```

**Causa:** El archivo del Nextep contiene un `num_empleado` que no está en la tabla `empleados`.

**Solución:** Importar/crear el empleado faltante antes de procesar la asistencia.

---

## 🧪 Testing con cURL

### **Importar Empleados:**

```bash
curl -X POST http://localhost:3005/api/empleados/import \
  -F "excelFile=@empleados_lista.xlsx"
```

---

### **Crear Empleado:**

```bash
curl -X POST http://localhost:3005/api/empleados/create \
  -H "Content-Type: application/json" \
  -d '{
    "num": "999",
    "nombre": "Carlos Méndez",
    "correo": "carlos.m@empresa.com",
    "departamento": "aca",
    "grupo": "C"
  }'
```

---

### **Listar Empleados:**

```bash
curl -X GET http://localhost:3005/api/empleados
```

---

### **Actualizar Empleado:**

```bash
curl -X PUT http://localhost:3005/api/empleados/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Gutiérrez (Actualizado)",
    "correo": "juan.nuevo@empresa.com"
  }'
```

---

### **Eliminar Empleado:**

```bash
curl -X DELETE http://localhost:3005/api/empleados/1
```

---

### **Exportar Empleados:**

```bash
curl -X GET http://localhost:3005/api/empleados/export \
  -o empleados_export.xlsx
```

---

### **Subir Archivo Nextep:**

```bash
curl -X POST http://localhost:3005/api/asistencia/upload \
  -F "excelFile=@001_2025_8_MON.xlsx"
```

---

### **Estadísticas BD:**

```bash
curl -X GET http://localhost:3005/api/database/stats
```

---

### **Vaciar BD:**

```bash
curl -X DELETE http://localhost:3005/api/database/reset
```

---

## 📚 Documentación Relacionada

- [CRUD de Empleados](./crud-empleados.md)
- [Formato GRID del Nextep](./formato-grid-nextep.md)
- [Arquitectura del Sistema](./arquitectura-sistema.md)
- [Base de Datos](./base-de-datos.md)

---

**Última actualización: 2025-01-29**



