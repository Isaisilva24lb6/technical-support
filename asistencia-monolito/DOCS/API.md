# 🔌 Documentación API REST

API RESTful del sistema de asistencia con endpoints para gestión de empleados y períodos de asistencia.

**Base URL:** `http://localhost:3005/api`

---

## 📑 Índice

- [Empleados](#empleados)
- [Asistencia](#asistencia)
- [Errores](#manejo-de-errores)
- [Autenticación](#autenticación-futura)

---

## 👥 Empleados

### `GET /empleados`

Obtener lista de todos los empleados.

**Headers:**
```
Content-Type: application/json
```

**Response 200:**
```json
[
  {
    "id": 1,
    "num": "1",
    "nombre": "Juan Gutiérrez González",
    "correo": "juan.gg@iztapalapa3.tecnm.mx",
    "departamento": "aca",
    "grupo": "A",
    "activo": 1,
    "fecha_registro": "2025-12-01T12:00:00.000Z"
  },
  {
    "id": 2,
    "num": "3",
    "nombre": "Ivanhoe Gilberto Osorio León",
    "correo": "ivanhoe.ol@iztapalapa3.tecnm.mx",
    "departamento": "aca",
    "grupo": null,
    "activo": 1,
    "fecha_registro": "2025-12-01T12:00:00.000Z"
  }
]
```

---

### `POST /empleados/create`

Crear un nuevo empleado.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "num": "120",
  "nombre": "Giovana Guadalupe Torrez Gómez",
  "correo": "giovana.tg@iztapalapa3.tecnm.mx",
  "departamento": "aca",
  "grupo": null,
  "activo": true
}
```

**Response 201:**
```json
{
  "message": "Empleado creado exitosamente",
  "id": 47
}
```

**Error 400:**
```json
{
  "error": "El número de empleado ya existe"
}
```

---

### `PUT /empleados/:id`

Actualizar un empleado existente.

**Headers:**
```
Content-Type: application/json
```

**Params:**
- `id` (integer): ID del empleado

**Body:**
```json
{
  "nombre": "Giovana G. Torrez Gómez",
  "correo": "giovana.torrez@iztapalapa3.tecnm.mx",
  "departamento": "rh",
  "grupo": "B",
  "activo": true
}
```

**Response 200:**
```json
{
  "message": "Empleado actualizado exitosamente",
  "changes": 1
}
```

**Error 404:**
```json
{
  "error": "Empleado no encontrado"
}
```

---

### `DELETE /empleados/:id`

Eliminar un empleado.

**Params:**
- `id` (integer): ID del empleado

**Response 200:**
```json
{
  "message": "Empleado eliminado exitosamente",
  "deleted": 1
}
```

**Error 404:**
```json
{
  "error": "Empleado no encontrado"
}
```

**⚠️ Warning:** Esta operación también eliminará en cascada:
- Marcas de asistencia del empleado
- Totales del empleado en períodos

---

### `POST /empleados/upload`

Subir archivo Excel de empleados (parse inicial).

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Archivo Excel (.xlsx)

**Response 200:**
```json
{
  "message": "Archivo parseado exitosamente",
  "filename": "empleados_1764639262283.xlsx",
  "tempFilePath": "/app/data/uploads/empleados/empleados_1764639262283.xlsx",
  "employees": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez González",
      "correo": "juan.gg@iztapalapa3.tecnm.mx",
      "departamento": "aca",
      "grupo": "A"
    },
    ...
  ],
  "warnings": [],
  "duplicates": []
}
```

**Error 400:**
```json
{
  "error": "No se subió ningún archivo"
}
```

---

### `POST /empleados/confirm`

Confirmar y guardar empleados en BD.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "employees": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez González",
      "correo": "juan.gg@iztapalapa3.tecnm.mx",
      "departamento": "aca",
      "grupo": "A"
    }
  ],
  "tempFilePath": "/app/data/uploads/empleados/empleados_1764639262283.xlsx"
}
```

**Response 200:**
```json
{
  "message": "Empleados procesados exitosamente",
  "results": {
    "insertados": 10,
    "actualizados": 35,
    "omitidos": 0
  }
}
```

---

### `GET /empleados/export`

Descargar Excel con todos los empleados.

**Response 200:**
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition:** `attachment; filename="empleados_YYYYMMDD_HHMMSS.xlsx"`
- **Body:** Archivo Excel binario

**Estructura del Excel:**

| num | nombre | correo | departamento | grupo | estado |
|-----|--------|--------|--------------|-------|--------|
| 1 | Juan Gutiérrez González | juan.gg@... | aca | A | Activo |
| 3 | Ivanhoe G. Osorio León | ivanhoe.ol@... | aca | - | Activo |

---

## 📅 Asistencia

### `POST /asistencia/upload`

Subir archivo Excel de asistencia (parse inicial).

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
- `file`: Archivo Excel (.xlsx) de reloj checador

**Response 200:**
```json
{
  "success": true,
  "message": "Archivo procesado exitosamente",
  "filename": "asistencia_1764639646322.xlsx",
  "tempFilePath": "/app/data/uploads/asistencia/asistencia_1764639646322.xlsx",
  "periodo": {
    "nombre": "Agosto 2025",
    "fecha_inicio": "2025-08-01T00:00:00.000Z",
    "fecha_fin": "2025-08-29T00:00:00.000Z"
  },
  "empleados": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez González",
      "nombreExcel": "GUTIERREZ GONZALEZ JUAN"
    },
    ...
  ],
  "marcas": [
    {
      "num_empleado": "1",
      "fecha": "2025-08-04",
      "hora": "08:02",
      "tipo": "Entrada"
    },
    {
      "num_empleado": "1",
      "fecha": "2025-08-04",
      "hora": "11:06",
      "tipo": "Salida"
    },
    ...
  ],
  "totales": [
    {
      "num_empleado": "1",
      "nombre_empleado": "GUTIERREZ GONZALEZ JUAN",
      "tiempo_requerido_min": 44100,
      "tiempo_real_min": 1944,
      "retardos_cuenta": 7,
      "retardos_min": 3907,
      "salidas_tempranas_cuenta": 7,
      "salidas_tempranas_min": 1661,
      "extra_normal_min": 0,
      "extra_especial_min": 0,
      "dias_asistidos": 21,
      "dias_periodo": 8,
      "vacaciones": 0,
      "faltas": 13,
      "permisos": 0
    },
    ...
  ],
  "stats": {
    "totalEmpleados": 43,
    "totalMarcas": 980,
    "sheetsParsed": 17,
    "parsingTime": 1.23
  }
}
```

**Error 400:**
```json
{
  "error": "No se subió ningún archivo"
}
```

**Error 500:**
```json
{
  "error": "Error al procesar archivo",
  "details": "Could not read workbook"
}
```

---

### `GET /asistencia/verify-employees`

Validar empleados contra base de datos.

**Query Params:**
- `nums` (string): Números de empleado separados por comas
  - Ejemplo: `?nums=1,3,5,6,8,14,19`

**Response 200:**
```json
{
  "success": true,
  "total": 7,
  "found": 6,
  "notFound": 1,
  "employees": [
    {
      "num": "1",
      "exists": true,
      "data": {
        "id": 1,
        "num": "1",
        "nombre": "Juan Gutiérrez González",
        "correo": "juan.gg@iztapalapa3.tecnm.mx",
        "departamento": "aca",
        "grupo": "A"
      }
    },
    {
      "num": "107",
      "exists": false,
      "data": null
    }
  ]
}
```

**Error 400:**
```json
{
  "error": "Parámetro \"nums\" requerido"
}
```

---

### `POST /asistencia/confirm`

Confirmar y guardar asistencia (con cálculo automático día por día).

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "periodo": {
    "nombre": "Agosto 2025",
    "fecha_inicio": "2025-08-01T00:00:00.000Z",
    "fecha_fin": "2025-08-29T00:00:00.000Z",
    "archivo_origen": "001_2025_8_MON.xlsx"
  },
  "empleados": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez González"
    }
  ],
  "marcas": [
    {
      "num_empleado": "1",
      "fecha": "2025-08-04",
      "hora": "08:02",
      "tipo": "Entrada"
    }
  ],
  "totales": [
    {
      "num_empleado": "1",
      "nombre_empleado": "GUTIERREZ GONZALEZ JUAN",
      "tiempo_requerido_min": 44100,
      "tiempo_real_min": 1944,
      "retardos_cuenta": 7,
      "retardos_min": 3907,
      "faltas": 13
    }
  ],
  "tempFilePath": "/app/data/uploads/asistencia/asistencia_1764639646322.xlsx"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Asistencia guardada exitosamente",
  "results": {
    "periodo_id": 1,
    "marcas_insertadas": 980,
    "marcas_omitidas": 0,
    "totales_insertados": 43,
    "empleados_procesados": 43,
    "calculo_diario": {
      "success": true,
      "diasProcesados": 29,
      "registrosCreados": 1247,
      "tiempoSegundos": 2.35
    }
  }
}
```

**Error 400:**
```json
{
  "error": "Datos de período requeridos"
}
```

**Error 500:**
```json
{
  "error": "Error al guardar asistencia",
  "details": "UNIQUE constraint failed: periodos.nombre"
}
```

---

### `GET /asistencia/periodos`

Listar todos los períodos de asistencia.

**Response 200:**
```json
{
  "success": true,
  "periodos": [
    {
      "id": 1,
      "nombre": "Agosto 2025",
      "fecha_inicio": "2025-08-01",
      "fecha_fin": "2025-08-29",
      "archivo_origen": "001_2025_8_MON.xlsx",
      "fecha_importacion": "2025-12-01T18:30:00.000Z",
      "total_marcas": 980,
      "total_empleados": 43
    }
  ]
}
```

**Error 500:**
```json
{
  "error": "Error al obtener períodos",
  "details": "Database locked"
}
```

---

### `GET /asistencia/periodos/:id`

Obtener detalles de un período específico.

**Params:**
- `id` (integer): ID del período

**Response 200:**
```json
{
  "success": true,
  "periodo": {
    "id": 1,
    "nombre": "Agosto 2025",
    "fecha_inicio": "2025-08-01",
    "fecha_fin": "2025-08-29",
    "archivo_origen": "001_2025_8_MON.xlsx",
    "fecha_importacion": "2025-12-01T18:30:00.000Z"
  },
  "marcas": [
    {
      "fecha": "2025-08-04",
      "hora": "08:02",
      "tipo": "Entrada",
      "num_empleado": "1",
      "nombre_empleado": "Juan Gutiérrez González"
    },
    ...
  ],
  "totales": [
    {
      "num_empleado": "1",
      "nombre_empleado": "Juan Gutiérrez González",
      "departamento": "aca",
      "grupo": "A",
      "tiempo_requerido_min": 44100,
      "tiempo_real_min": 1944,
      "retardos_cuenta": 7,
      "retardos_min": 3907,
      "faltas": 13
    }
  ],
  "empleados": [
    {
      "num": "1",
      "nombre": "Juan Gutiérrez González",
      "correo": "juan.gg@iztapalapa3.tecnm.mx",
      "departamento": "aca",
      "grupo": "A",
      "retardos_min": 3907,
      "faltas": 13,
      "extra_normal_min": 0,
      "extra_especial_min": 0
    }
  ],
  "stats": {
    "totalMarcas": 980,
    "totalEmpleados": 43,
    "fechaInicio": "2025-08-01",
    "fechaFin": "2025-08-29"
  }
}
```

**Error 404:**
```json
{
  "error": "Período no encontrado"
}
```

---

### `GET /asistencia/periodos/:id/dia-por-dia` 🆕

**Obtener asistencia diaria calculada para un período.**

**Params:**
- `id` (integer): ID del período

**Response 200:**
```json
{
  "success": true,
  "periodo_id": 1,
  "registros": [
    {
      "fecha": "2025-08-04",
      "dia_semana": "Lunes",
      "es_laborable": true,
      "horario_entrada_esperada": "07:00",
      "horario_salida_esperada": "18:00",
      "entrada_real": "08:02",
      "salida_real": "11:06",
      "minutos_trabajados": 184,
      "minutos_retardo": 62,
      "cuenta_retardo": 1,
      "minutos_salida_temprana": 414,
      "cuenta_salida_temprana": 1,
      "minutos_extra_normal": 0,
      "minutos_extra_especial": 0,
      "es_falta": false,
      "es_permiso": false,
      "es_vacacion": false,
      "estado": "Completo",
      "num_empleado": "1",
      "nombre_empleado": "Juan Gutiérrez González",
      "departamento": "aca",
      "grupo": "A"
    },
    {
      "fecha": "2025-08-05",
      "dia_semana": "Martes",
      "es_laborable": true,
      "horario_entrada_esperada": "07:00",
      "horario_salida_esperada": "18:00",
      "entrada_real": null,
      "salida_real": null,
      "minutos_trabajados": 0,
      "minutos_retardo": 0,
      "cuenta_retardo": 0,
      "minutos_salida_temprana": 0,
      "cuenta_salida_temprana": 0,
      "minutos_extra_normal": 0,
      "minutos_extra_especial": 0,
      "es_falta": true,
      "es_permiso": false,
      "es_vacacion": false,
      "estado": "Falta",
      "num_empleado": "1",
      "nombre_empleado": "Juan Gutiérrez González",
      "departamento": "aca",
      "grupo": "A"
    },
    ...
  ]
}
```

**Error 404:**
```json
{
  "error": "Período no encontrado"
}
```

**Error 500:**
```json
{
  "error": "Error al obtener asistencia diaria",
  "details": "Table asistencia_diaria not found"
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Uso |
|--------|-------------|-----|
| 200 | OK | Solicitud exitosa |
| 201 | Created | Recurso creado exitosamente |
| 400 | Bad Request | Datos inválidos o faltantes |
| 404 | Not Found | Recurso no encontrado |
| 413 | Payload Too Large | Archivo demasiado grande (>50MB) |
| 500 | Internal Server Error | Error del servidor |

### Estructura de Errores

```json
{
  "error": "Mensaje de error legible",
  "details": "Detalles técnicos (opcional)"
}
```

### Errores Comunes

#### 400 Bad Request

```json
{
  "error": "Parámetro \"nums\" requerido"
}
```

```json
{
  "error": "No se subió ningún archivo"
}
```

#### 404 Not Found

```json
{
  "error": "Empleado no encontrado"
}
```

```json
{
  "error": "Período no encontrado"
}
```

#### 413 Payload Too Large

```json
{
  "error": "Request entity too large"
}
```

**Solución:** El límite es 50MB. Si el archivo es mayor, comprimirlo o dividirlo.

#### 500 Internal Server Error

```json
{
  "error": "Error al procesar archivo",
  "details": "SQLITE_BUSY: database is locked"
}
```

---

## 🔐 Autenticación (Futuro)

**⚠️ Actualmente la API NO tiene autenticación.**

### Roadmap de Autenticación

#### Fase 1: JWT
```
POST /auth/login
{
  "username": "admin",
  "password": "..."
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### Fase 2: Roles
- **Admin**: Full access
- **Manager**: Ver y editar períodos
- **Viewer**: Solo lectura

#### Fase 3: Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

---

## 📊 Paginación (Futuro)

Para endpoints con muchos resultados:

```
GET /empleados?page=1&limit=50

Response:
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 200,
    "pages": 4
  }
}
```

---

## 🔄 Versionamiento (Futuro)

API versionada con prefijo:

```
/api/v1/empleados
/api/v2/empleados
```

Headers:
```
Accept: application/vnd.api+json; version=1
```

---

## 📝 Ejemplos de Uso

### Con cURL

**Listar empleados:**
```bash
curl -X GET http://localhost:3005/api/empleados \
  -H "Content-Type: application/json"
```

**Crear empleado:**
```bash
curl -X POST http://localhost:3005/api/empleados/create \
  -H "Content-Type: application/json" \
  -d '{
    "num": "150",
    "nombre": "María López",
    "correo": "maria.l@example.com",
    "departamento": "TI",
    "activo": true
  }'
```

**Subir archivo:**
```bash
curl -X POST http://localhost:3005/api/asistencia/upload \
  -F "file=@/path/to/001_2025_8_MON.xlsx"
```

---

### Con Axios (Frontend)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET
const empleados = await api.get('/empleados');

// POST con JSON
const result = await api.post('/empleados/create', {
  num: '150',
  nombre: 'María López'
});

// POST con FormData
const formData = new FormData();
formData.append('file', file);
const upload = await api.post('/asistencia/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

---

## 📚 Referencias

- **Express.js**: https://expressjs.com
- **Multer**: https://github.com/expressjs/multer
- **SQLite3**: https://www.sqlite.org
- **ExcelJS**: https://github.com/exceljs/exceljs

---

**Última actualización:** Diciembre 2025

