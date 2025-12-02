# 👥 CRUD de Empleados

**Guía completa de gestión de empleados: Crear, Leer, Actualizar, Eliminar, Importar y Exportar**

---

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Importar desde Excel](#importar-desde-excel)
3. [Crear Empleado Manual](#crear-empleado-manual)
4. [Ver Lista de Empleados](#ver-lista-de-empleados)
5. [Editar Empleado](#editar-empleado)
6. [Eliminar Empleado](#eliminar-empleado)
7. [Exportar a Excel](#exportar-a-excel)
8. [Validaciones](#validaciones)
9. [Casos de Uso](#casos-de-uso)

---

## 🎯 Visión General

El sistema de gestión de empleados permite mantener un **catálogo actualizado** que se usa como referencia al procesar archivos del Nextep.

### **Flujo de Trabajo:**

```
1. IMPORTAR CATÁLOGO INICIAL
   ├─► Subir Excel con empleados
   ├─► Sistema parsea y valida
   └─► Guarda en BD
   
2. GESTIÓN CONTINUA
   ├─► Agregar empleados nuevos manualmente
   ├─► Editar información desactualizada
   ├─► Eliminar empleados inactivos
   └─► Exportar versión actualizada
   
3. PROCESAR ASISTENCIA
   └─► Sistema relaciona num_empleado del Nextep
       con empleados.id de la BD
```

### **Características:**

```
✅ Importación masiva desde Excel
✅ Creación manual individual
✅ Edición en tiempo real
✅ Eliminación suave (soft delete)
✅ Exportación actualizada
✅ Validación de duplicados
✅ Sistema de vistas (lista/importar)
```

---

## 📥 Importar desde Excel

### **1. Preparar Archivo Excel**

**Estructura requerida:**

```excel
| Num | Nombre                      | Correo                        | Departamento | Grupo |
|-----|-----------------------------|-------------------------------|--------------|-------|
| 1   | Juan Gutiérrez Gonzalez     | juan.gg@tzapaltipa3-1ecem.mx | aca          | A     |
| 48  | Mia Xiclali Rivera Vera     | mia.xv@tzapaltipa3-1ecem.mx  | aca          | B     |
| 100 | Pedro Ancheyta Bringas      | pedro.ab@tzapaltipa3-1ecem.mx| aca          | A     |
```

**Columnas requeridas:**
- ✅ **Num** (o Número, #, ID, Clave): Identificador único
- ✅ **Nombre** (o Name, Empleado): Nombre completo
- ✅ **Correo** (o Email, Mail): Correo electrónico

**Columnas opcionales:**
- **Departamento** (o Depto, Area): Por defecto "aca"
- **Grupo** (o Turno, Group): A, B, C, etc.

**Formato de Números:**

```
✅ CORRECTO: 1, 48, 100, 278
❌ INCORRECTO: 001, 048, 100, 278

Razón:
  - Los archivos del Nextep usan números sin padding
  - La BD relaciona por num_empleado (texto)
  - Debe coincidir exactamente para matching
```

---

### **2. Subir Archivo en el Sistema**

**Paso a paso:**

```
1. Ir a: http://localhost:3005/empleados

2. Si no hay empleados:
   → Se muestra automáticamente el importador con video de fondo
   
3. Si ya hay empleados:
   → Click: "Importar desde Excel"
   → Se cambia a vista de importación

4. Arrastrar archivo o hacer click para seleccionar

5. Sistema procesa y muestra preview:
   ┌────────────────────────────────────────┐
   │ ✅ 44 empleados listos para importar  │
   ├────────────────────────────────────────┤
   │ Preview:                               │
   │  1  - Juan Gutiérrez Gonzalez         │
   │  48 - Mia Xiclali Rivera Vera         │
   │  100- Pedro Ancheyta Bringas          │
   │  ... (mostrando 5 de 44)              │
   └────────────────────────────────────────┘

6. Click: "Confirmar Empleados"

7. Sistema guarda en BD:
   ┌────────────────────────────────────────┐
   │ ✅ Empleados procesados exitosamente  │
   │ Insertados: 44                        │
   │ Actualizados: 0                       │
   │ Errores: 0                            │
   └────────────────────────────────────────┘

8. Vista cambia automáticamente a lista de empleados
```

---

### **3. Backend: Endpoints de Importación**

#### **POST /api/empleados/import**

```javascript
// Parsear Excel y retornar preview

Request:
  POST /api/empleados/import
  Content-Type: multipart/form-data
  Body: {
    excelFile: File (empleados_lista.xlsx)
  }

Response (200):
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
      ...
    ],
    "warnings": [],
    "stats": {
      "total": 44,
      "conCorreo": 44,
      "sinCorreo": 0
    }
  }

Response (400):
  {
    "error": "No se pudo detectar la cabecera del Excel.",
    "details": "..."
  }
```

#### **POST /api/empleados/confirm**

```javascript
// Guardar empleados en la BD

Request:
  POST /api/empleados/confirm
  Content-Type: application/json
  Body: {
    "employees": [
      { "num": "1", "nombre": "...", "correo": "..." },
      ...
    ],
    "tempFilePath": "/app/data/uploads/empleados/empleados_xxx.xlsx"
  }

Response (200):
  {
    "message": "Empleados procesados exitosamente",
    "results": {
      "insertados": 44,
      "actualizados": 0,
      "errores": 0,
      "detalles": []
    }
  }

Response (400):
  {
    "error": "Error al procesar empleados",
    "details": [...]
  }
```

---

## ➕ Crear Empleado Manual

### **1. Abrir Modal de Creación**

**Paso a paso:**

```
1. Ir a: http://localhost:3005/empleados

2. Click: "➕ Agregar Empleado"

3. Se abre modal centrado:
   ┌──────────────────────────────────┐
   │  ➕ Agregar Empleado            │
   ├──────────────────────────────────┤
   │  Número de Empleado: *           │
   │  [___________]                   │
   │                                  │
   │  Nombre Completo: *              │
   │  [___________]                   │
   │                                  │
   │  Correo Electrónico:             │
   │  [___________]                   │
   │                                  │
   │  Departamento:                   │
   │  [aca________]                   │
   │                                  │
   │  Grupo/Turno:                    │
   │  [___________]                   │
   │                                  │
   │  [Cancelar]    [💾 Guardar]     │
   └──────────────────────────────────┘

4. Llenar datos requeridos (marcados con *)

5. Click: "💾 Guardar"

6. Sistema valida y guarda:
   ✅ Empleado creado exitosamente
```

---

### **2. Validación en Tiempo Real**

**Frontend (TypeScript):**

```typescript
const [formData, setFormData] = useState({
  num: '',
  nombre: '',
  correo: '',
  departamento: 'aca',
  grupo: ''
});

const [errors, setErrors] = useState({
  num: '',
  nombre: '',
  correo: ''
});

// Validación al cambiar campo
const handleChange = (e) => {
  const { name, value } = e.target;
  
  // Actualizar valor
  setFormData(prev => ({ ...prev, [name]: value }));
  
  // Validar
  let error = '';
  
  if (name === 'num') {
    if (!value.trim()) {
      error = 'El número es requerido';
    } else if (!/^\d+$/.test(value)) {
      error = 'Debe ser un número válido';
    }
  }
  
  if (name === 'nombre') {
    if (!value.trim()) {
      error = 'El nombre es requerido';
    } else if (value.trim().length < 3) {
      error = 'Debe tener al menos 3 caracteres';
    }
  }
  
  if (name === 'correo') {
    if (value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = 'Correo inválido';
    }
  }
  
  setErrors(prev => ({ ...prev, [name]: error }));
};

// Validación al enviar
const handleSubmit = async () => {
  // Validar todos los campos
  const newErrors = {
    num: !formData.num.trim() ? 'Requerido' : '',
    nombre: !formData.nombre.trim() ? 'Requerido' : '',
    correo: ''
  };
  
  if (Object.values(newErrors).some(e => e)) {
    setErrors(newErrors);
    return;
  }
  
  // Enviar al backend
  try {
    await empleadosApi.create(formData);
    onSuccess();
  } catch (error) {
    setError(error.response?.data?.error || 'Error al crear empleado');
  }
};
```

---

### **3. Backend: Endpoint de Creación**

#### **POST /api/empleados/create**

```javascript
// Crear empleado individual

Request:
  POST /api/empleados/create
  Content-Type: application/json
  Body: {
    "num": "999",
    "nombre": "Nuevo Empleado",
    "correo": "nuevo@empresa.com",
    "departamento": "aca",
    "grupo": "A"
  }

Response (201):
  {
    "success": true,
    "message": "Empleado creado exitosamente",
    "empleado": {
      "id": 45,
      "num": "999",
      "nombre": "Nuevo Empleado",
      "correo": "nuevo@empresa.com",
      "departamento": "aca",
      "grupo": "A",
      "activo": 1
    }
  }

Response (400):
  {
    "success": false,
    "error": "El número de empleado ya existe"
  }
  
  o
  
  {
    "success": false,
    "error": "El correo ya está registrado"
  }
  
  o
  
  {
    "success": false,
    "error": "Datos incompletos: se requiere num y nombre"
  }
```

**Código del Backend:**

```javascript
// server/routes/empleados.js

router.post('/create', (req, res) => {
  const { num, nombre, correo, departamento, grupo } = req.body;
  
  // Validar datos requeridos
  if (!num || !nombre) {
    return res.status(400).json({
      success: false,
      error: 'Datos incompletos: se requiere num y nombre'
    });
  }
  
  // Verificar duplicados
  db.get("SELECT id FROM empleados WHERE num = ?", [num], (err, existing) => {
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'El número de empleado ya existe'
      });
    }
    
    // Si hay correo, verificar que no esté duplicado
    if (correo) {
      db.get("SELECT id FROM empleados WHERE correo = ?", [correo], (err, existingEmail) => {
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            error: 'El correo ya está registrado'
          });
        }
        
        insertEmpleado();
      });
    } else {
      insertEmpleado();
    }
    
    function insertEmpleado() {
      const sql = `
        INSERT INTO empleados (num, nombre, correo, departamento, grupo)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [
        num,
        nombre,
        correo || null,
        departamento || 'aca',
        grupo || null
      ], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Error al crear empleado',
            details: err.message
          });
        }
        
        // Retornar el empleado creado
        db.get("SELECT * FROM empleados WHERE id = ?", [this.lastID], (err, row) => {
          res.status(201).json({
            success: true,
            message: 'Empleado creado exitosamente',
            empleado: row
          });
        });
      });
    }
  });
});
```

---

## 📋 Ver Lista de Empleados

### **1. Tabla de Empleados**

**Interfaz:**

```
┌─────────────────────────────────────────────────────────────┐
│  👥 Empleados (44)                                          │
│  [🔄 Actualizar] [➕ Agregar] [📥 Exportar] [📤 Importar] │
├──────┬──────────────────────┬─────────────────────┬────────┤
│ Num  │ Nombre              │ Correo              │ Acción │
├──────┼──────────────────────┼─────────────────────┼────────┤
│ 1    │ Juan Gutiérrez      │ juan.gg@...         │ ✏️ 🗑️  │
│ 48   │ Mia Rivera          │ mia.xv@...          │ ✏️ 🗑️  │
│ 100  │ Pedro Ancheyta      │ pedro.ab@...        │ ✏️ 🗑️  │
│ ...  │ ...                 │ ...                 │ ...    │
└──────┴──────────────────────┴─────────────────────┴────────┘
```

**Funcionalidades:**

```
🔄 Actualizar:  Refresca la lista desde la BD
➕ Agregar:     Abre modal de creación
📥 Exportar:    Descarga Excel con empleados actuales
📤 Importar:    Cambia a vista de importación
✏️ Editar:      Abre modal de edición
🗑️ Eliminar:    Elimina empleado (soft delete)
```

---

### **2. Backend: Endpoint de Listado**

#### **GET /api/empleados**

```javascript
// Obtener todos los empleados activos

Request:
  GET /api/empleados

Response (200):
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
    },
    ...
  ]
```

**Código del Backend:**

```javascript
// server/routes/empleados.js

router.get('/', (req, res) => {
  db.all(
    "SELECT * FROM empleados WHERE activo = 1 ORDER BY CAST(num AS INTEGER)",
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: 'Error al obtener empleados',
          details: err.message
        });
      }
      res.json(rows);
    }
  );
});
```

---

## ✏️ Editar Empleado

### **1. Abrir Modal de Edición**

**Paso a paso:**

```
1. En la tabla de empleados, click: ✏️

2. Se abre modal pre-llenado:
   ┌──────────────────────────────────┐
   │  ✏️ Editar Empleado             │
   ├──────────────────────────────────┤
   │  Número de Empleado: *           │
   │  [1__________]  (bloqueado)      │
   │                                  │
   │  Nombre Completo: *              │
   │  [Juan Gutiérrez Gonzalez____]  │
   │                                  │
   │  Correo Electrónico:             │
   │  [juan.gg@tzapaltipa3-1ecem.mx] │
   │                                  │
   │  Departamento:                   │
   │  [aca________]                   │
   │                                  │
   │  Grupo/Turno:                    │
   │  [A__________]                   │
   │                                  │
   │  ☑ Activo                        │
   │                                  │
   │  [Cancelar]    [💾 Guardar]     │
   └──────────────────────────────────┘

3. Modificar campos necesarios

4. Click: "💾 Guardar Cambios"

5. Sistema valida y actualiza:
   ✅ Empleado actualizado exitosamente
```

**Nota:** El campo `num` está bloqueado porque es la clave primaria de negocio y no debe modificarse.

---

### **2. Backend: Endpoint de Actualización**

#### **PUT /api/empleados/:id**

```javascript
// Actualizar datos de un empleado

Request:
  PUT /api/empleados/1
  Content-Type: application/json
  Body: {
    "nombre": "Juan Gutiérrez González (Actualizado)",
    "correo": "juan.nuevo@empresa.com",
    "departamento": "rh",
    "grupo": "B",
    "activo": 1
  }

Response (200):
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

Response (400):
  {
    "success": false,
    "error": "El correo ya está registrado por otro empleado"
  }

Response (404):
  {
    "success": false,
    "error": "Empleado no encontrado"
  }
```

**Código del Backend:**

```javascript
// server/routes/empleados.js

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, correo, departamento, grupo, activo } = req.body;
  
  // Verificar que el empleado existe
  db.get("SELECT * FROM empleados WHERE id = ?", [id], (err, empleado) => {
    if (!empleado) {
      return res.status(404).json({
        success: false,
        error: 'Empleado no encontrado'
      });
    }
    
    // Si cambió el correo, verificar que no esté duplicado
    if (correo && correo !== empleado.correo) {
      db.get(
        "SELECT id FROM empleados WHERE correo = ? AND id != ?",
        [correo, id],
        (err, existing) => {
          if (existing) {
            return res.status(400).json({
              success: false,
              error: 'El correo ya está registrado por otro empleado'
            });
          }
          
          updateEmpleado();
        }
      );
    } else {
      updateEmpleado();
    }
    
    function updateEmpleado() {
      const sql = `
        UPDATE empleados
        SET nombre = ?,
            correo = ?,
            departamento = ?,
            grupo = ?,
            activo = ?
        WHERE id = ?
      `;
      
      db.run(sql, [
        nombre || empleado.nombre,
        correo || null,
        departamento || empleado.departamento,
        grupo || empleado.grupo,
        activo !== undefined ? activo : empleado.activo,
        id
      ], (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Error al actualizar empleado',
            details: err.message
          });
        }
        
        // Retornar el empleado actualizado
        db.get("SELECT * FROM empleados WHERE id = ?", [id], (err, row) => {
          res.status(200).json({
            success: true,
            message: 'Empleado actualizado exitosamente',
            empleado: row
          });
        });
      });
    }
  });
});
```

---

## 🗑️ Eliminar Empleado

### **1. Eliminación Suave (Soft Delete)**

**¿Por qué soft delete?**

```
❌ NO eliminar físicamente (DELETE FROM empleados WHERE id = ?)
   Razón: Hay marcas_crudas relacionadas

✅ Marcar como inactivo (UPDATE empleados SET activo = 0)
   Beneficios:
     - Se mantiene integridad referencial
     - Historial de marcas preservado
     - Posibilidad de reactivar después
     - Auditoría completa
```

---

### **2. Eliminar desde la Interfaz**

**Paso a paso:**

```
1. En la tabla, click: 🗑️ del empleado

2. Confirmación (navegador):
   ┌────────────────────────────────────┐
   │  ⚠️ Confirmar Eliminación         │
   │                                    │
   │  ¿Estás seguro de eliminar a       │
   │  "Juan Gutiérrez Gonzalez"?       │
   │                                    │
   │  [Cancelar]  [Eliminar]           │
   └────────────────────────────────────┘

3. Click: "Eliminar"

4. Sistema marca como inactivo (activo = 0)

5. Empleado desaparece de la lista:
   ✅ Empleado eliminado: Juan Gutiérrez Gonzalez
```

---

### **3. Backend: Endpoint de Eliminación**

#### **DELETE /api/empleados/:id**

```javascript
// Marcar empleado como inactivo (soft delete)

Request:
  DELETE /api/empleados/1

Response (200):
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

Response (404):
  {
    "success": false,
    "error": "Empleado no encontrado"
  }
```

**Código del Backend:**

```javascript
// server/routes/empleados.js

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Verificar que existe
  db.get("SELECT * FROM empleados WHERE id = ?", [id], (err, empleado) => {
    if (!empleado) {
      return res.status(404).json({
        success: false,
        error: 'Empleado no encontrado'
      });
    }
    
    // Soft delete: marcar como inactivo
    db.run(
      "UPDATE empleados SET activo = 0 WHERE id = ?",
      [id],
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Error al eliminar empleado',
            details: err.message
          });
        }
        
        res.status(200).json({
          success: true,
          message: 'Empleado eliminado exitosamente',
          empleado: {
            id: empleado.id,
            num: empleado.num,
            nombre: empleado.nombre,
            activo: 0
          }
        });
      }
    );
  });
});
```

---

## 📤 Exportar a Excel

### **1. Exportar desde la Interfaz**

**Paso a paso:**

```
1. En la página de empleados, click: "📥 Exportar Excel"

2. Sistema descarga archivo:
   empleados_2025-01-29.xlsx

3. Archivo contiene todos los empleados activos con formato:
   | Num | Nombre              | Correo              | Depto | Grupo |
   |-----|---------------------|---------------------|-------|-------|
   | 1   | Juan Gutiérrez      | juan.gg@...         | aca   | A     |
   | 48  | Mia Rivera          | mia.xv@...          | aca   | B     |
   ...
```

---

### **2. Backend: Endpoint de Exportación**

#### **GET /api/empleados/export**

```javascript
// Exportar empleados a Excel

Request:
  GET /api/empleados/export

Response (200):
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="empleados_2025-01-29.xlsx"
  
  (archivo Excel binario)

Response (500):
  {
    "success": false,
    "error": "Error al exportar empleados"
  }
```

**Código del Backend:**

```javascript
// server/routes/empleados.js

const ExcelJS = require('exceljs');

router.get('/export', async (req, res) => {
  try {
    // Obtener empleados activos
    db.all(
      "SELECT num, nombre, correo, departamento, grupo FROM empleados WHERE activo = 1 ORDER BY CAST(num AS INTEGER)",
      [],
      async (err, empleados) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: 'Error al obtener empleados',
            details: err.message
          });
        }
        
        // Crear workbook
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Empleados');
        
        // Definir columnas
        sheet.columns = [
          { header: 'Num', key: 'num', width: 10 },
          { header: 'Nombre', key: 'nombre', width: 35 },
          { header: 'Correo', key: 'correo', width: 35 },
          { header: 'Departamento', key: 'departamento', width: 15 },
          { header: 'Grupo', key: 'grupo', width: 10 }
        ];
        
        // Estilizar cabecera
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4472C4' }
        };
        sheet.getRow(1).font.color = { argb: 'FFFFFFFF' };
        
        // Agregar datos
        empleados.forEach(emp => {
          sheet.addRow({
            num: emp.num,
            nombre: emp.nombre,
            correo: emp.correo || '',
            departamento: emp.departamento || 'aca',
            grupo: emp.grupo || ''
          });
        });
        
        // Aplicar bordes
        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        });
        
        // Generar nombre de archivo
        const fecha = new Date().toISOString().split('T')[0];
        const filename = `empleados_${fecha}.xlsx`;
        
        // Configurar headers de respuesta
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${filename}"`
        );
        
        // Enviar archivo
        await workbook.xlsx.write(res);
        res.end();
      }
    );
  } catch (error) {
    console.error('[EMPLEADOS ERROR] Error al exportar:', error);
    res.status(500).json({
      success: false,
      error: 'Error al exportar empleados',
      details: error.message
    });
  }
});
```

---

## ✅ Validaciones

### **1. Validaciones Frontend (TypeScript)**

```typescript
// Validación de número
if (!num.trim()) {
  error = 'El número es requerido';
} else if (!/^\d+$/.test(num)) {
  error = 'Debe ser un número válido (sin letras)';
}

// Validación de nombre
if (!nombre.trim()) {
  error = 'El nombre es requerido';
} else if (nombre.trim().length < 3) {
  error = 'El nombre debe tener al menos 3 caracteres';
}

// Validación de correo (opcional pero si se proporciona debe ser válido)
if (correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
  error = 'El correo no es válido';
}
```

---

### **2. Validaciones Backend (JavaScript)**

```javascript
// Validar datos requeridos
if (!num || !nombre) {
  return res.status(400).json({
    error: 'Datos incompletos: se requiere num y nombre'
  });
}

// Validar duplicado de número
db.get("SELECT id FROM empleados WHERE num = ?", [num], (err, existing) => {
  if (existing) {
    return res.status(400).json({
      error: 'El número de empleado ya existe'
    });
  }
});

// Validar duplicado de correo
if (correo) {
  db.get("SELECT id FROM empleados WHERE correo = ?", [correo], (err, existing) => {
    if (existing) {
      return res.status(400).json({
        error: 'El correo ya está registrado'
      });
    }
  });
}
```

---

### **3. Validaciones Base de Datos (SQL)**

```sql
-- Constraints a nivel de tabla

CREATE TABLE empleados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  num TEXT NOT NULL UNIQUE,        -- No nulos, únicos
  nombre TEXT NOT NULL,             -- No nulo
  correo TEXT UNIQUE,               -- Único (permite NULL)
  departamento TEXT DEFAULT 'aca',
  grupo TEXT,
  activo INTEGER DEFAULT 1
);

-- Validaciones automáticas:
  ✅ num: NOT NULL, UNIQUE
  ✅ nombre: NOT NULL
  ✅ correo: UNIQUE (si se proporciona)
  ✅ activo: DEFAULT 1
```

---

## 💼 Casos de Uso

### **Caso 1: Primera Importación**

```
Situación:
  - Sistema nuevo
  - Catálogo Excel con 44 empleados
  - Nunca se han importado empleados

Flujo:
  1. Usuario va a /empleados
  2. Ve vista de importación automáticamente (video de fondo)
  3. Sube Excel con 44 empleados
  4. Sistema parsea y muestra preview
  5. Usuario confirma
  6. Sistema guarda 44 empleados
  7. Vista cambia a lista de empleados

Resultado:
  ✅ 44 empleados en BD
  ✅ Lista visible
  ✅ Video ya no se muestra por defecto
```

---

### **Caso 2: Empleado Nuevo (Manual)**

```
Situación:
  - Contratación nueva
  - Persona aún no está en catálogo Excel
  - Necesita agregarse rápido

Flujo:
  1. Usuario click: "➕ Agregar Empleado"
  2. Llena:
     - Num: 999
     - Nombre: Carlos Méndez
     - Correo: carlos.m@empresa.com
     - Depto: aca
     - Grupo: C
  3. Click: "Guardar"
  4. Sistema valida y crea empleado
  5. Aparece en la lista inmediatamente

Resultado:
  ✅ Empleado 999 en BD
  ✅ Listo para procesar asistencia
  ✅ Se puede exportar después con todos los demás
```

---

### **Caso 3: Correo Actualizado**

```
Situación:
  - Empleado cambió de correo
  - Necesita actualizar el registro

Flujo:
  1. Usuario busca empleado en lista
  2. Click: ✏️ (editar)
  3. Modifica correo:
     De: juan.gg@tzapaltipa3-1ecem.mx
     A:  juan.gutierrez@empresa.com
  4. Click: "Guardar Cambios"
  5. Sistema valida y actualiza

Resultado:
  ✅ Correo actualizado en BD
  ✅ Próxima exportación incluye nuevo correo
  ✅ Historial de marcas no afectado
```

---

### **Caso 4: Empleado Inactivo**

```
Situación:
  - Empleado renunció o fue despedido
  - Tiene marcas históricas en períodos anteriores
  - Ya no debe aparecer en lista activa

Flujo:
  1. Usuario busca empleado
  2. Click: 🗑️ (eliminar)
  3. Confirma eliminación
  4. Sistema marca activo = 0
  5. Empleado desaparece de lista

Resultado:
  ✅ Empleado oculto en lista
  ✅ Marcas históricas preservadas
  ✅ BD mantiene integridad
  ✅ Puede reactivarse si es necesario (UPDATE activo = 1)
```

---

### **Caso 5: Exportar Versión Actualizada**

```
Situación:
  - Se han agregado 5 empleados manualmente
  - Se actualizaron 3 correos
  - Se eliminaron 2 empleados
  - Necesita Excel actualizado para auditoría

Flujo:
  1. Usuario click: "📥 Exportar Excel"
  2. Sistema genera Excel con empleados actuales
  3. Descarga: empleados_2025-01-29.xlsx
  4. Archivo contiene:
     - 44 empleados originales
     - +5 nuevos
     - -2 eliminados
     - = 47 empleados activos

Resultado:
  ✅ Excel con 47 empleados
  ✅ Correos actualizados
  ✅ Solo empleados activos
  ✅ Listo para backup o auditoría
```

---

## 🎯 Mejores Prácticas

### **1. Números de Empleado:**

```
✅ Usar números naturales: 1, 48, 100
❌ Evitar padding: 001, 048, 100

✅ Mantener consistencia con archivos Nextep
✅ No reutilizar números de empleados eliminados
✅ Usar números únicos incluso entre departamentos
```

### **2. Correos:**

```
✅ Validar formato antes de guardar
✅ Permitir NULL (no todos tienen correo)
✅ Asegurar unicidad (UNIQUE constraint)
✅ Normalizar (trim, lowercase en BD)
```

### **3. Soft Delete:**

```
✅ SIEMPRE usar soft delete (activo = 0)
❌ NUNCA eliminar físicamente registros con relaciones
✅ Filtrar por activo = 1 en todas las consultas
✅ Mantener empleados.id estable (no reutilizar IDs)
```

### **4. Sincronización:**

```
✅ Exportar versión actualizada regularmente
✅ Backup del Excel exportado
✅ Verificar empleados antes de procesar asistencia
✅ Mantener catálogo sincronizado con RH
```

---

## 📚 Documentación Relacionada

- [API Endpoints](./api-endpoints.md)
- [Base de Datos](./base-de-datos.md)
- [Procesar Asistencia](./procesar-asistencia.md)
- [Arquitectura del Sistema](./arquitectura-sistema.md)

---

**Última actualización: 2025-01-29**



