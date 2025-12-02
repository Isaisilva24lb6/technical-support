// server/routes/empleados.js
// Rutas para la gestión de empleados

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../../config/db');
const { parseEmployeesExcel } = require('../utils/excelParser');
const ExcelJS = require('exceljs');

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
 * ➕ POST /api/empleados/create
 * 
 * Crea un nuevo empleado individual (no desde Excel)
 */
router.post('/create', async (req, res) => {
    const { num, nombre, correo, departamento, grupo, activo } = req.body;

    try {
        // Validar campos requeridos
        if (!num || num.trim().length === 0) {
            return res.status(400).json({ 
                error: 'El número de empleado es requerido' 
            });
        }

        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ 
                error: 'El nombre es requerido' 
            });
        }

        // Verificar si el número ya existe
        const existeNum = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM empleados WHERE num = ?', [num.trim()], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (existeNum) {
            return res.status(400).json({ 
                error: `El número ${num} ya está asignado a otro empleado` 
            });
        }

        // Verificar si el correo ya existe (si se proporciona)
        if (correo && correo.trim().length > 0) {
            const existeCorreo = await new Promise((resolve, reject) => {
                db.get('SELECT id FROM empleados WHERE correo = ?', [correo.trim()], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existeCorreo) {
                return res.status(400).json({ 
                    error: `El correo ${correo} ya está asignado a otro empleado` 
                });
            }
        }

        // Normalizar el valor de activo: convertir boolean a integer
        const activoValue = (activo === true || activo === 1 || activo === '1') ? 1 : 0;

        // Insertar nuevo empleado
        const empleadoId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO empleados (num, nombre, correo, departamento, grupo, activo)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    num.trim(),
                    nombre.trim(),
                    correo && correo.trim().length > 0 ? correo.trim() : null,
                    departamento || 'aca',
                    grupo && grupo.trim().length > 0 ? grupo.trim() : null,
                    activoValue
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        console.log(`[EMPLEADOS] Empleado creado: ${nombre} (#${num})`);

        res.status(201).json({
            message: 'Empleado creado exitosamente',
            id: empleadoId
        });

    } catch (error) {
        console.error('[EMPLEADOS ERROR]', error);
        res.status(500).json({ 
            error: 'Error al crear empleado', 
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
                            [
                                emp.nombre,
                                emp.correo && emp.correo.trim().length > 0 ? emp.correo.trim() : null,
                                emp.departamento || 'aca',
                                emp.grupo && emp.grupo.trim().length > 0 ? emp.grupo.trim() : null,
                                emp.activo ? 1 : 0,
                                emp.num
                            ],
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
                            [
                                emp.num,
                                emp.nombre,
                                emp.correo && emp.correo.trim().length > 0 ? emp.correo.trim() : null,
                                emp.departamento || 'aca',
                                emp.grupo && emp.grupo.trim().length > 0 ? emp.grupo.trim() : null,
                                emp.activo ? 1 : 0
                            ],
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
 * 📥 GET /api/empleados/export
 * 
 * Exporta todos los empleados a un archivo Excel
 * NOTA: Esta ruta DEBE estar ANTES de GET /:id para evitar conflictos
 */
router.get('/export', async (req, res) => {
    try {
        console.log('[EMPLEADOS] Iniciando exportación a Excel...');

        // Obtener todos los empleados
        const empleados = await new Promise((resolve, reject) => {
            db.all(
                `SELECT num, nombre, correo, departamento, grupo, activo 
                 FROM empleados 
                 ORDER BY num ASC`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        if (empleados.length === 0) {
            return res.status(404).json({ 
                error: 'No hay empleados para exportar' 
            });
        }

        // Crear workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Empleados');

        // Configurar columnas
        worksheet.columns = [
            { header: 'Número', key: 'num', width: 12 },
            { header: 'Nombre', key: 'nombre', width: 35 },
            { header: 'Correo', key: 'correo', width: 35 },
            { header: 'Departamento', key: 'departamento', width: 15 },
            { header: 'Grupo', key: 'grupo', width: 10 },
            { header: 'Estado', key: 'activo', width: 12 }
        ];

        // Estilo de cabecera
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        // Agregar filas
        empleados.forEach(emp => {
            worksheet.addRow({
                num: emp.num,
                nombre: emp.nombre,
                correo: emp.correo || '',
                departamento: emp.departamento || 'aca',
                grupo: emp.grupo || '',
                activo: emp.activo ? 'Activo' : 'Inactivo'
            });
        });

        // Aplicar bordes a todas las celdas
        worksheet.eachRow((row, rowNumber) => {
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
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `empleados_${timestamp}.xlsx`;

        // Configurar headers para descarga
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Escribir el archivo en la respuesta
        await workbook.xlsx.write(res);
        
        console.log(`[EMPLEADOS] Excel exportado: ${filename} (${empleados.length} empleados)`);
        
        res.end();

    } catch (error) {
        console.error('[EMPLEADOS ERROR]', error);
        res.status(500).json({ 
            error: 'Error al exportar empleados', 
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

        // Normalizar datos: convertir activo (INTEGER) a boolean
        const empleadosNormalizados = rows.map(emp => ({
            ...emp,
            activo: emp.activo === 1,
            // Asegurar que campos opcionales sean null si están vacíos
            correo: emp.correo || null,
            grupo: emp.grupo || null
        }));

        res.status(200).json({
            empleados: empleadosNormalizados,
            total: empleadosNormalizados.length
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

        // Normalizar datos: convertir activo (INTEGER) a boolean
        const empleadoNormalizado = {
            ...row,
            activo: row.activo === 1,
            correo: row.correo || null,
            grupo: row.grupo || null
        };

        res.status(200).json(empleadoNormalizado);
    });
});

/**
 * ✏️ PUT /api/empleados/:id
 * 
 * Actualiza un empleado existente
 */
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { num, nombre, correo, departamento, grupo, activo } = req.body;

    try {
        // Validar campos requeridos
        if (!nombre || nombre.trim().length === 0) {
            return res.status(400).json({ 
                error: 'El nombre es requerido' 
            });
        }

        if (!num || num.trim().length === 0) {
            return res.status(400).json({ 
                error: 'El número de empleado es requerido' 
            });
        }

        // Verificar si el empleado existe
        const empleado = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM empleados WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!empleado) {
            return res.status(404).json({ 
                error: 'Empleado no encontrado' 
            });
        }

        // Verificar si el nuevo número ya existe en otro empleado
        if (num !== empleado.num) {
            const existeNum = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id FROM empleados WHERE num = ? AND id != ?',
                    [num, id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existeNum) {
                return res.status(400).json({ 
                    error: `El número ${num} ya está asignado a otro empleado` 
                });
            }
        }

        // Verificar si el nuevo correo ya existe en otro empleado
        if (correo && correo.trim().length > 0 && correo !== empleado.correo) {
            const existeCorreo = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id FROM empleados WHERE correo = ? AND id != ?',
                    [correo, id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            if (existeCorreo) {
                return res.status(400).json({ 
                    error: `El correo ${correo} ya está asignado a otro empleado` 
                });
            }
        }

        // Normalizar el valor de activo: convertir boolean a integer
        const activoValue = (activo === true || activo === 1 || activo === '1') ? 1 : 0;

        // Actualizar empleado
        await new Promise((resolve, reject) => {
            db.run(
                `UPDATE empleados 
                 SET num = ?, nombre = ?, correo = ?, departamento = ?, grupo = ?, activo = ?
                 WHERE id = ?`,
                [
                    num.trim(),
                    nombre.trim(),
                    correo && correo.trim().length > 0 ? correo.trim() : null,
                    departamento || 'aca',
                    grupo && grupo.trim().length > 0 ? grupo.trim() : null,
                    activoValue,
                    id
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        console.log(`[EMPLEADOS] Empleado actualizado: ${nombre} (#${num})`);

        res.status(200).json({
            message: 'Empleado actualizado exitosamente',
            id: parseInt(id)
        });

    } catch (error) {
        console.error('[EMPLEADOS ERROR]', error);
        res.status(500).json({ 
            error: 'Error al actualizar empleado', 
            details: error.message 
        });
    }
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





