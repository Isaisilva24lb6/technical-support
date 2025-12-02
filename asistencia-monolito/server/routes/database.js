// server/routes/database.js
// Rutas para gestión de la base de datos (solo desarrollo/pruebas)

const express = require('express');
const router = express.Router();
const db = require('../../config/db');

/**
 * 🗑️ DELETE /api/database/reset
 * 
 * VACÍA COMPLETAMENTE LA BASE DE DATOS
 * ⚠️ SOLO PARA PRUEBAS - Elimina todos los datos
 */
router.delete('/reset', async (req, res) => {
    try {
        console.log('[DATABASE] ⚠️ Iniciando reset completo de la base de datos...');
        
        const results = {
            empleados_eliminados: 0,
            periodos_eliminados: 0,
            marcas_eliminadas: 0,
            totales_eliminados: 0,
            turnos_eliminados: 0,
            logs_eliminados: 0
        };
        
        // ORDEN IMPORTANTE: Eliminar primero las tablas con foreign keys
        
        // 1. Logs de importación
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM logs_importacion', function(err) {
                if (err) reject(err);
                else {
                    results.logs_eliminados = this.changes;
                    resolve();
                }
            });
        });
        
        // 2. Totales Excel
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM totales_excel', function(err) {
                if (err) reject(err);
                else {
                    results.totales_eliminados = this.changes;
                    resolve();
                }
            });
        });
        
        // 3. Asistencia diaria
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM asistencia_diaria', function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        
        // 4. Marcas crudas
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM marcas_crudas', function(err) {
                if (err) reject(err);
                else {
                    results.marcas_eliminadas = this.changes;
                    resolve();
                }
            });
        });
        
        // 5. Horarios/Turnos
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM horarios_turnos', function(err) {
                if (err) reject(err);
                else {
                    results.turnos_eliminados = this.changes;
                    resolve();
                }
            });
        });
        
        // 6. Períodos
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM periodos', function(err) {
                if (err) reject(err);
                else {
                    results.periodos_eliminados = this.changes;
                    resolve();
                }
            });
        });
        
        // 7. Empleados (al final porque otras tablas dependen de ella)
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM empleados', function(err) {
                if (err) reject(err);
                else {
                    results.empleados_eliminados = this.changes;
                    resolve();
                }
            });
        });
        
        // Resetear autoincrement
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM sqlite_sequence', function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('[DATABASE] ✅ Base de datos vaciada exitosamente');
        console.log('[DATABASE] Resultados:', results);
        
        res.status(200).json({
            success: true,
            message: 'Base de datos vaciada exitosamente',
            results: results
        });
        
    } catch (error) {
        console.error('[DATABASE ERROR]', error);
        res.status(500).json({
            error: 'Error al vaciar la base de datos',
            details: error.message
        });
    }
});

/**
 * 📊 GET /api/database/stats
 * 
 * Obtiene estadísticas de la base de datos
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {};
        
        // Contar empleados
        stats.empleados = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM empleados', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        // Contar períodos
        stats.periodos = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM periodos', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        // Contar marcas
        stats.marcas = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM marcas_crudas', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        // Contar totales
        stats.totales = await new Promise((resolve, reject) => {
            db.get('SELECT COUNT(*) as count FROM totales_excel', (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
        
        res.status(200).json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('[DATABASE ERROR]', error);
        res.status(500).json({
            error: 'Error al obtener estadísticas',
            details: error.message
        });
    }
});

module.exports = router;



