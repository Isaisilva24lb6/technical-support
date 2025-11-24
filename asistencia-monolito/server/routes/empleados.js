// server/routes/empleados.js
// Rutas para la gestión de empleados

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../config/db');
const { parseEmployeesExcel } = require('../utils/excelParser');

// --- Configuración de Multer para Excel de Empleados ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', '..', 'data', 'uploads', 'empleados');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const now = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `empleados_${now}${ext}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Solo aceptar archivos Excel
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel' // .xls
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no válido. Solo se aceptan archivos Excel (.xlsx, .xls)'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB máximo
    }
});

/**
 * 📤 POST /api/empleados/import
 * 
 * Sube un archivo Excel de empleados y lo parsea con detección inteligente.
 * Retorna los datos detectados para que el usuario los valide manualmente.
 */
router.post('/import', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No se ha subido ningún archivo.' 
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;

        console.log(`[EMPLEADOS] Archivo recibido: ${fileName}`);
        console.log(`[EMPLEADOS] Ruta: ${filePath}`);

        // Parsear el Excel con el parser inteligente
        const result = await parseEmployeesExcel(filePath);

        console.log(`[EMPLEADOS] Parseado exitoso: ${result.employees.length} empleados detectados`);

        // Guardar la ruta del archivo temporalmente en el resultado
        // (para procesarlo luego al confirmar)
        const tempFilePath = filePath;

        res.status(200).json({
            message: 'Archivo parseado exitosamente',
            filename: fileName,
            tempFilePath: tempFilePath, // ⚠️ No exponer en producción real (guardar en sesión/redis)
            employees: result.employees,
            warnings: result.warnings,
            stats: result.stats
        });

    } catch (error) {
        console.error('[EMPLEADOS ERROR]', error);
        
        // Limpiar archivo si hubo error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('[EMPLEADOS ERROR] No se pudo eliminar archivo temporal:', unlinkError);
            }
        }

        res.status(500).json({ 
            error: 'Error al procesar el archivo Excel', 
            details: error.message 
        });
    }
});

/**
 * ✅ POST /api/empleados/confirm
 * 
 * Recibe los datos validados manualmente por el usuario y los guarda en la DB.
 * Previene duplicados por número de empleado o correo.
 */
router.post('/confirm', async (req, res) => {
    try {
        const { employees, tempFilePath } = req.body;

        if (!employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ 
                error: 'No se enviaron empleados para procesar.' 
            });
        }

        console.log(`[EMPLEADOS] Procesando ${employees.length} empleados confirmados...`);

        const results = {
            insertados: 0,
            actualizados: 0,
            duplicados: 0,
            errores: [],
            warnings: []
        };

        // Procesar cada empleado
        for (const emp of employees) {
            try {
                // Verificar si ya existe por número de empleado
                const existeNum = await new Promise((resolve, reject) => {
                    db.get(
                        'SELECT id, nombre, correo FROM empleados WHERE num = ?',
                        [emp.num],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row);
                        }
                    );
                });

                // Verificar si ya existe por correo (si tiene correo)
                let existeCorreo = null;
                if (emp.correo && emp.correo.length > 0) {
                    existeCorreo = await new Promise((resolve, reject) => {
                        db.get(
                            'SELECT id, nombre, num FROM empleados WHERE correo = ?',
                            [emp.correo],
                            (err, row) => {
                                if (err) reject(err);
                                else resolve(row);
                            }
                        );
                    });
                }

                // CASO 1: Ya existe por número -> ACTUALIZAR
                if (existeNum) {
                    await new Promise((resolve, reject) => {
                        db.run(
                            `UPDATE empleados 
                             SET nombre = ?, correo = ?, departamento = ?, grupo = ?, activo = ?
                             WHERE num = ?`,
                            [emp.nombre, emp.correo, emp.departamento, emp.grupo, emp.activo ? 1 : 0, emp.num],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });

                    results.actualizados++;
                    results.warnings.push(`Empleado #${emp.num} "${emp.nombre}" actualizado (ya existía).`);
                    console.log(`[EMPLEADOS] Actualizado: ${emp.nombre} (#${emp.num})`);
                }
                // CASO 2: Ya existe por correo (pero con otro número) -> DUPLICADO
                else if (existeCorreo) {
                    results.duplicados++;
                    results.warnings.push(
                        `Empleado "${emp.nombre}" (${emp.correo}) duplicado: ` +
                        `ya existe como #${existeCorreo.num} "${existeCorreo.nombre}". No insertado.`
                    );
                    console.log(`[EMPLEADOS] Duplicado por correo: ${emp.nombre} (${emp.correo})`);
                }
                // CASO 3: No existe -> INSERTAR
                else {
                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT INTO empleados (num, nombre, correo, departamento, grupo, activo)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [emp.num, emp.nombre, emp.correo, emp.departamento, emp.grupo, emp.activo ? 1 : 0],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });

                    results.insertados++;
                    console.log(`[EMPLEADOS] Insertado: ${emp.nombre} (#${emp.num})`);
                }

            } catch (error) {
                results.errores.push({
                    empleado: emp.nombre,
                    error: error.message
                });
                console.error(`[EMPLEADOS ERROR] Error al procesar ${emp.nombre}:`, error);
            }
        }

        // Limpiar archivo temporal
        if (tempFilePath) {
            try {
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                    console.log(`[EMPLEADOS] Archivo temporal eliminado: ${tempFilePath}`);
                }
            } catch (unlinkError) {
                console.error('[EMPLEADOS ERROR] No se pudo eliminar archivo temporal:', unlinkError);
            }
        }

        console.log(`[EMPLEADOS] Proceso completado:`, results);

        res.status(200).json({
            message: 'Empleados procesados exitosamente',
            results
        });

    } catch (error) {
        console.error('[EMPLEADOS ERROR]', error);
        res.status(500).json({ 
            error: 'Error al confirmar empleados', 
            details: error.message 
        });
    }
});

/**
 * 📋 GET /api/empleados
 * 
 * Lista todos los empleados activos
 */
router.get('/', (req, res) => {
    const query = `
        SELECT id, num, nombre, correo, departamento, grupo, activo
        FROM empleados
        ORDER BY nombre ASC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('[EMPLEADOS ERROR]', err);
            return res.status(500).json({ 
                error: 'Error al obtener empleados', 
                details: err.message 
            });
        }

        res.status(200).json({
            empleados: rows,
            total: rows.length
        });
    });
});

/**
 * 🔍 GET /api/empleados/:id
 * 
 * Obtiene un empleado específico por ID
 */
router.get('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT id, num, nombre, correo, departamento, grupo, activo
        FROM empleados
        WHERE id = ?
    `;

    db.get(query, [id], (err, row) => {
        if (err) {
            console.error('[EMPLEADOS ERROR]', err);
            return res.status(500).json({ 
                error: 'Error al obtener empleado', 
                details: err.message 
            });
        }

        if (!row) {
            return res.status(404).json({ 
                error: 'Empleado no encontrado' 
            });
        }

        res.status(200).json(row);
    });
});

/**
 * 🗑️ DELETE /api/empleados/:id
 * 
 * Elimina (soft delete) un empleado
 */
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    const query = `
        UPDATE empleados
        SET activo = 0
        WHERE id = ?
    `;

    db.run(query, [id], function(err) {
        if (err) {
            console.error('[EMPLEADOS ERROR]', err);
            return res.status(500).json({ 
                error: 'Error al eliminar empleado', 
                details: err.message 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Empleado no encontrado' 
            });
        }

        res.status(200).json({
            message: 'Empleado desactivado exitosamente',
            id: id
        });
    });
});

module.exports = router;




