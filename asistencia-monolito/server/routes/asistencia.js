// server/routes/asistencia.js
// Rutas para procesar archivos del reloj checador Nextep NE-234

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { NextepParser } = require('../parsers/nextepParser');

// --- Configuración de Multer para archivos de asistencia ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', '..', 'data', 'uploads', 'asistencia');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const now = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `asistencia_${now}${ext}`);
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
        fileSize: 50 * 1024 * 1024 // 50 MB máximo
    }
});

/**
 * 📤 POST /api/asistencia/upload
 * 
 * Sube y parsea un archivo Excel del reloj checador Nextep NE-234
 * Retorna los datos parseados para validación del usuario
 */
router.post('/upload', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: 'No se ha subido ningún archivo.' 
            });
        }

        const filePath = req.file.path;
        const fileName = req.file.filename;

        console.log(`[ASISTENCIA] Archivo recibido: ${fileName}`);
        console.log(`[ASISTENCIA] Ruta: ${filePath}`);

        // Parsear con el NextepParser
        const parser = new NextepParser();
        const result = await parser.parse(filePath);

        if (!result.success) {
            console.error(`[ASISTENCIA] Errores al parsear:`, result.errors);
            
            // Limpiar archivo si hubo error
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkError) {
                console.error('[ASISTENCIA] Error al eliminar archivo temporal:', unlinkError);
            }

            return res.status(400).json({
                error: 'Error al procesar el archivo',
                details: result.errors,
                warnings: result.warnings
            });
        }

        console.log(`[ASISTENCIA] Parseado exitoso:`);
        console.log(`  - ${result.stats.totalMarcas} marcas encontradas`);
        console.log(`  - ${result.stats.totalEmpleados} empleados detectados`);
        console.log(`  - Período: ${result.periodo.fecha_inicio} a ${result.periodo.fecha_fin}`);

        // Retornar datos completos para validación del usuario
        res.status(200).json({
            success: true,
            message: 'Archivo procesado exitosamente',
            filename: fileName,
            tempFilePath: filePath, // Para procesarlo después al confirmar
            periodo: {
                nombre_archivo: result.periodo.nombre_archivo,
                fecha_inicio: result.periodo.fecha_inicio,
                fecha_fin: result.periodo.fecha_fin,
                departamento: result.periodo.departamento
            },
            stats: result.stats,
            hojas_detectadas: result.stats.hojasDetectadas,
            warnings: result.warnings,
            // Datos completos para validación
            empleados: result.empleados,  // Todos los empleados detectados
            marcas: result.marcas,         // Todas las marcas
            totales: result.totales,       // Todos los totales
            // Muestra de datos para preview
            preview: {
                empleados: result.empleados.slice(0, 10), // Primeros 10 empleados
                marcas: result.marcas.slice(0, 20)        // Primeras 20 marcas
            }
        });

    } catch (error) {
        console.error('[ASISTENCIA ERROR]', error);
        
        // Limpiar archivo si hubo error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
                console.error('[ASISTENCIA] Error al eliminar archivo temporal:', unlinkError);
            }
        }

        res.status(500).json({ 
            error: 'Error al procesar el archivo de asistencia', 
            details: error.message 
        });
    }
});

/**
 * 🔍 GET /api/asistencia/verify-employees
 * 
 * Verifica qué empleados del archivo existen en la base de datos
 * @query nums - Array de números de empleado separados por coma
 */
router.get('/verify-employees', async (req, res) => {
    try {
        const { nums } = req.query;
        
        if (!nums) {
            return res.status(400).json({ error: 'Parámetro "nums" requerido' });
        }

        const numArray = nums.split(',').map(n => n.trim()).filter(n => n);
        
        if (numArray.length === 0) {
            return res.json({ empleados: [] });
        }

        const db = require('../../config/db');
        const placeholders = numArray.map(() => '?').join(',');
        
        const empleados = await new Promise((resolve, reject) => {
            db.all(
                `SELECT id, num, nombre, correo, departamento, grupo, activo 
                 FROM empleados 
                 WHERE num IN (${placeholders})`,
                numArray,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows.map(row => ({
                        ...row,
                        activo: row.activo === 1
                    })));
                }
            );
        });

        res.json({ empleados });

    } catch (error) {
        console.error('[ASISTENCIA ERROR]', error);
        res.status(500).json({ 
            error: 'Error al verificar empleados', 
            details: error.message 
        });
    }
});

/**
 * ✅ POST /api/asistencia/confirm
 * 
 * Confirma y guarda los datos de asistencia en la base de datos
 */
router.post('/confirm', async (req, res) => {
    try {
        const { tempFilePath, periodo, empleados, marcas, totales } = req.body;

        if (!tempFilePath) {
            return res.status(400).json({ error: 'Ruta del archivo temporal requerida' });
        }

        if (!periodo || !marcas) {
            return res.status(400).json({ error: 'Datos de período y marcas requeridos' });
        }

        const db = require('../../config/db');
        console.log('[ASISTENCIA] Guardando datos en base de datos...');
        console.log(`  - Período: ${periodo.fecha_inicio} a ${periodo.fecha_fin}`);
        console.log(`  - Marcas: ${marcas.length}`);
        console.log(`  - Empleados: ${empleados?.length || 0}`);

        // 1. GUARDAR PERÍODO
        const periodoId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO periodos (nombre_archivo, fecha_inicio, fecha_fin, departamento, estado)
                 VALUES (?, ?, ?, ?, 'completado')`,
                [
                    periodo.nombre_archivo,
                    periodo.fecha_inicio,
                    periodo.fecha_fin,
                    periodo.departamento || 'aca'
                ],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        console.log(`[ASISTENCIA] Período guardado con ID: ${periodoId}`);

        // 2. OBTENER IDs DE EMPLEADOS
        const empleadoMap = new Map();
        if (empleados && empleados.length > 0) {
            const nums = empleados.map(e => e.num);
            const placeholders = nums.map(() => '?').join(',');
            
            const empleadosDB = await new Promise((resolve, reject) => {
                db.all(
                    `SELECT id, num FROM empleados WHERE num IN (${placeholders})`,
                    nums,
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    }
                );
            });

            empleadosDB.forEach(emp => {
                empleadoMap.set(emp.num, emp.id);
            });
        }

        // 3. GUARDAR MARCAS
        let marcasInsertadas = 0;
        let marcasOmitidas = 0;

        for (const marca of marcas) {
            const empleadoId = empleadoMap.get(marca.num_empleado);
            
            // Solo guardar marcas de empleados registrados
            if (!empleadoId) {
                marcasOmitidas++;
                continue;
            }

            try {
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO marcas_crudas (periodo_id, empleado_id, num_empleado, fecha, hora, tipo)
                         VALUES (?, ?, ?, ?, ?, ?)
                         ON CONFLICT(periodo_id, empleado_id, fecha, hora) DO NOTHING`,
                        [
                            periodoId,
                            empleadoId,
                            marca.num_empleado,
                            marca.fecha,
                            marca.hora,
                            marca.tipo || 'Desconocido'
                        ],
                        function(err) {
                            if (err) reject(err);
                            else {
                                if (this.changes > 0) marcasInsertadas++;
                                resolve();
                            }
                        }
                    );
                });
            } catch (error) {
                console.warn(`[ASISTENCIA] Error al insertar marca: ${error.message}`);
            }
        }

        // 4. GUARDAR TOTALES (si existen o generarlos automáticamente)
        let totalesInsertados = 0;
        const totalesMap = new Map();
        
        // Si hay totales del parser, mapearlos
        if (totales && Array.isArray(totales)) {
            totales.forEach(t => totalesMap.set(t.num_empleado, t));
        }
        
        // Iterar sobre TODOS los empleados validados
        for (const emp of empleados || []) {
            const empleadoId = empleadoMap.get(emp.num);
            if (!empleadoId) continue;
            
            // Buscar si hay totales del parser para este empleado
            let total = totalesMap.get(emp.num);
            
            // Si NO hay totales, generar uno básico
            if (!total) {
                console.log(`[ASISTENCIA] Generando total básico para empleado #${emp.num} (no encontrado en hoja Resumen)`);
                total = {
                    num_empleado: emp.num,
                    nombre_empleado: emp.nombre || '',
                    tiempo_requerido_min: 0,
                    tiempo_real_min: 0,
                    retardos_cuenta: 0,
                    retardos_min: 0,
                    salidas_tempranas_cuenta: 0,
                    salidas_tempranas_min: 0,
                    extra_normal_min: 0,
                    extra_especial_min: 0,
                    dias_asistidos: 0,
                    dias_periodo: 0,
                    vacaciones: 0,
                    faltas: 0,
                    permisos: 0
                };
            }

            try {
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO totales_excel 
                         (periodo_id, empleado_id, num_empleado, nombre_empleado,
                          tiempo_requerido_min, tiempo_real_min, retardos_cuenta, retardos_min,
                          salidas_tempranas_cuenta, salidas_tempranas_min, extra_normal_min, extra_especial_min,
                          dias_asistidos, dias_periodo, vacaciones, faltas, permisos)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                         ON CONFLICT(periodo_id, empleado_id) DO UPDATE SET
                            nombre_empleado = excluded.nombre_empleado,
                            tiempo_requerido_min = excluded.tiempo_requerido_min,
                            tiempo_real_min = excluded.tiempo_real_min,
                            retardos_cuenta = excluded.retardos_cuenta,
                            retardos_min = excluded.retardos_min,
                            salidas_tempranas_cuenta = excluded.salidas_tempranas_cuenta,
                            salidas_tempranas_min = excluded.salidas_tempranas_min,
                            extra_normal_min = excluded.extra_normal_min,
                            extra_especial_min = excluded.extra_especial_min,
                            dias_asistidos = excluded.dias_asistidos,
                            dias_periodo = excluded.dias_periodo,
                            vacaciones = excluded.vacaciones,
                            faltas = excluded.faltas,
                            permisos = excluded.permisos`,
                        [
                            periodoId,
                            empleadoId,
                            total.num_empleado,
                            total.nombre_empleado || '',
                            total.tiempo_requerido_min || 0,
                            total.tiempo_real_min || 0,
                            total.retardos_cuenta || 0,
                            total.retardos_min || 0,
                            total.salidas_tempranas_cuenta || 0,
                            total.salidas_tempranas_min || 0,
                            total.extra_normal_min || 0,
                            total.extra_especial_min || 0,
                            total.dias_asistidos || 0,
                            total.dias_periodo || 0,
                            total.vacaciones || 0,
                            total.faltas || 0,
                            total.permisos || 0
                        ],
                        function(err) {
                            if (err) reject(err);
                            else {
                                totalesInsertados++;
                                resolve();
                            }
                        }
                    );
                });
            } catch (error) {
                console.warn(`[ASISTENCIA] Error al insertar total para empleado #${emp.num}: ${error.message}`);
            }
        }

        // 5. LOG DE IMPORTACIÓN
        await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO logs_importacion 
                 (periodo_id, hojas_procesadas, empleados_procesados, marcas_insertadas, estado_final)
                 VALUES (?, ?, ?, ?, 'exitoso')`,
                [
                    periodoId,
                    3, // Aproximado
                    empleados?.length || 0,
                    marcasInsertadas
                ],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });

        // 6. CALCULAR ASISTENCIA DIARIA
        console.log('[ASISTENCIA] Calculando asistencia día por día...');
        const { calcularAsistenciaDiaria } = require('../services/asistenciaCalculator');
        
        let resultadoCalculo = null;
        try {
            resultadoCalculo = await calcularAsistenciaDiaria(
                periodoId,
                periodo.fecha_inicio,
                periodo.fecha_fin,
                empleados || []
            );
            console.log(`[ASISTENCIA] ✅ Cálculo completado: ${resultadoCalculo.registrosCreados} registros diarios`);
        } catch (errorCalculo) {
            console.error('[ASISTENCIA] ⚠️ Error en cálculo diario (continuando):', errorCalculo.message);
            // No fallar todo si el cálculo falla
        }

        // 7. Limpiar archivo temporal
        try {
            fs.unlinkSync(tempFilePath);
            console.log('[ASISTENCIA] Archivo temporal eliminado');
        } catch (unlinkError) {
            console.warn('[ASISTENCIA] No se pudo eliminar archivo temporal:', unlinkError);
        }

        console.log('[ASISTENCIA] ✅ Datos guardados exitosamente');

        res.status(200).json({
            success: true,
            message: 'Asistencia guardada exitosamente',
            results: {
                periodo_id: periodoId,
                marcas_insertadas: marcasInsertadas,
                marcas_omitidas: marcasOmitidas,
                totales_insertados: totalesInsertados,
                empleados_procesados: empleados?.length || 0,
                calculo_diario: resultadoCalculo ? {
                    registros_creados: resultadoCalculo.registrosCreados,
                    tiempo_segundos: resultadoCalculo.tiempoSegundos
                } : null
            }
        });

    } catch (error) {
        console.error('[ASISTENCIA ERROR]', error);
        res.status(500).json({ 
            error: 'Error al confirmar asistencia', 
            details: error.message 
        });
    }
});

/**
 * 📋 GET /api/asistencia/periodos
 * 
 * Obtiene la lista de todos los períodos guardados con estadísticas
 */
router.get('/periodos', async (req, res) => {
    const db = require('../../config/db');
    
    try {
        console.log('[ASISTENCIA] Obteniendo lista de períodos...');
        
        // Obtener todos los períodos
        const periodos = await new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    id,
                    nombre_archivo,
                    fecha_inicio,
                    fecha_fin,
                    fecha_carga,
                    departamento,
                    estado,
                    usuario_carga
                FROM periodos
                ORDER BY fecha_inicio DESC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Para cada período, obtener estadísticas
        const periodosConStats = await Promise.all(
            periodos.map(async (periodo) => {
                // Contar marcas
                const marcasCount = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT COUNT(*) as count FROM marcas_crudas WHERE periodo_id = ?`,
                        [periodo.id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row.count);
                        }
                    );
                });
                
                // Contar totales (registros únicos de empleados)
                const totalesCount = await new Promise((resolve, reject) => {
                    db.get(
                        `SELECT COUNT(DISTINCT empleado_id) as count FROM totales_excel WHERE periodo_id = ?`,
                        [periodo.id],
                        (err, row) => {
                            if (err) reject(err);
                            else resolve(row.count);
                        }
                    );
                });
                
                // Obtener empleados únicos del período
                const empleados = await new Promise((resolve, reject) => {
                    db.all(
                        `SELECT DISTINCT 
                            e.id, e.num, e.nombre, e.departamento, e.grupo
                        FROM totales_excel t
                        INNER JOIN empleados e ON t.empleado_id = e.id
                        WHERE t.periodo_id = ?
                        ORDER BY e.num`,
                        [periodo.id],
                        (err, rows) => {
                            if (err) reject(err);
                            else resolve(rows);
                        }
                    );
                });
                
                return {
                    ...periodo,
                    stats: {
                        marcas: marcasCount,
                        totales: totalesCount,
                        empleados: empleados.length
                    },
                    empleados: empleados
                };
            })
        );
        
        console.log(`[ASISTENCIA] Períodos encontrados: ${periodosConStats.length}`);
        
        res.status(200).json({
            success: true,
            periodos: periodosConStats,
            total: periodosConStats.length
        });
        
    } catch (error) {
        console.error('[ASISTENCIA ERROR] Error al obtener períodos:', error);
        res.status(500).json({ 
            error: 'Error al obtener períodos', 
            details: error.message 
        });
    }
});

/**
 * 📊 GET /api/asistencia/periodos/:id
 * 
 * Obtiene los detalles completos de un período específico
 */
router.get('/periodos/:id', async (req, res) => {
    const db = require('../../config/db');
    const { id } = req.params;
    
    try {
        console.log(`[ASISTENCIA] Obteniendo detalles del período ${id}...`);
        
        // Obtener información del período
        const periodo = await new Promise((resolve, reject) => {
            db.get(
                `SELECT * FROM periodos WHERE id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
        
        if (!periodo) {
            return res.status(404).json({ error: 'Período no encontrado' });
        }
        
        // Obtener todas las marcas del período
        const marcas = await new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    m.*,
                    e.nombre as nombre_empleado,
                    e.num as num_empleado,
                    e.departamento,
                    e.grupo
                FROM marcas_crudas m
                INNER JOIN empleados e ON m.empleado_id = e.id
                WHERE m.periodo_id = ?
                ORDER BY m.fecha, m.hora`,
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Obtener todos los totales del período
        let totales = await new Promise((resolve, reject) => {
            db.all(
                `SELECT 
                    t.*,
                    e.nombre as nombre_empleado,
                    e.num as num_empleado,
                    e.correo,
                    e.departamento,
                    e.grupo,
                    e.activo
                FROM totales_excel t
                INNER JOIN empleados e ON t.empleado_id = e.id
                WHERE t.periodo_id = ?
                ORDER BY e.num`,
                [id],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
        
        // Si no hay totales, generarlos automáticamente desde las marcas
        if (totales.length === 0 && marcas.length > 0) {
            console.log('[ASISTENCIA] No hay totales, generando desde marcas...');
            
            // Obtener empleados únicos de las marcas
            const empleadosUnicos = [...new Set(marcas.map(m => m.num_empleado))];
            
            totales = await Promise.all(
                empleadosUnicos.map(async (numEmpleado) => {
                    // Obtener info del empleado
                    const empleado = await new Promise((resolve, reject) => {
                        db.get(
                            `SELECT * FROM empleados WHERE num = ?`,
                            [numEmpleado],
                            (err, row) => {
                                if (err) reject(err);
                                else resolve(row);
                            }
                        );
                    });
                    
                    if (!empleado) return null;
                    
                    // Contar marcas del empleado
                    const marcasEmpleado = marcas.filter(m => m.num_empleado === numEmpleado);
                    const diasUnicos = new Set(marcasEmpleado.map(m => m.fecha)).size;
                    
                    return {
                        empleado_id: empleado.id,
                        num_empleado: empleado.num,
                        nombre_empleado: empleado.nombre,
                        correo: empleado.correo,
                        departamento: empleado.departamento,
                        grupo: empleado.grupo,
                        activo: empleado.activo,
                        dias_asistidos: diasUnicos,
                        retardos_cuenta: 0,
                        retardos_min: 0,
                        salidas_tempranas_cuenta: 0,
                        salidas_tempranas_min: 0,
                        extra_normal_min: 0,
                        extra_especial_min: 0,
                        faltas: 0,
                        vacaciones: 0,
                        permisos: 0
                    };
                })
            );
            
            // Filtrar nulls (empleados no encontrados)
            totales = totales.filter(t => t !== null);
            
            console.log(`[ASISTENCIA] Generados ${totales.length} totales desde marcas`);
        }
        
        console.log(`[ASISTENCIA] Período ${id}: ${marcas.length} marcas, ${totales.length} empleados`);
        
        res.status(200).json({
            success: true,
            periodo: periodo,
            marcas: marcas,
            totales: totales,
            stats: {
                totalMarcas: marcas.length,
                totalEmpleados: totales.length,
                fechaInicio: periodo.fecha_inicio,
                fechaFin: periodo.fecha_fin
            }
        });
        
    } catch (error) {
        console.error('[ASISTENCIA ERROR] Error al obtener detalles del período:', error);
        res.status(500).json({
            error: 'Error al obtener detalles del período',
            details: error.message
        });
    }
});

/**
 * 📅 GET /api/asistencia/periodos/:id/dia-por-dia
 * 
 * Obtiene la asistencia calculada día por día de un período
 */
router.get('/periodos/:id/dia-por-dia', async (req, res) => {
    const db = require('../../config/db');
    
    try {
        const { id } = req.params;
        const { empleado_num } = req.query; // Opcional: filtrar por empleado
        
        console.log(`[ASISTENCIA] Obteniendo asistencia diaria del período ${id}...`);
        
        // Obtener período
        const periodo = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM periodos WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!periodo) {
            return res.status(404).json({ error: 'Período no encontrado' });
        }
        
        // Query base
        let query = `
            SELECT 
                ad.*,
                e.num as num_empleado,
                e.nombre as nombre_empleado,
                e.departamento,
                e.grupo
            FROM asistencia_diaria ad
            JOIN empleados e ON ad.empleado_id = e.id
            WHERE ad.periodo_id = ?
        `;
        
        const params = [id];
        
        // Filtro por empleado (opcional)
        if (empleado_num) {
            query += ` AND e.num = ?`;
            params.push(empleado_num);
        }
        
        query += ` ORDER BY e.num ASC, ad.fecha ASC`;
        
        const registros = await new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`[ASISTENCIA] Registros diarios encontrados: ${registros.length}`);
        
        res.status(200).json({
            success: true,
            periodo: {
                id: periodo.id,
                nombre_archivo: periodo.nombre_archivo,
                fecha_inicio: periodo.fecha_inicio,
                fecha_fin: periodo.fecha_fin
            },
            registros: registros,
            total: registros.length
        });
        
    } catch (error) {
        console.error('[ASISTENCIA ERROR] Error al obtener asistencia diaria:', error);
        res.status(500).json({
            error: 'Error al obtener asistencia diaria',
            details: error.message
        });
    }
});

module.exports = router;

