// config/db.js - Configuración y conexión a la Base de Datos SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ========================================================================
// 1. CONFIGURACIÓN DE LA RUTA DE LA BASE DE DATOS
// ========================================================================

// La base de datos se guardará en la carpeta 'data/' (persistente en Docker)
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'asistencia.db');

// Asegurar que la carpeta 'data/' exista
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('[DB] Carpeta "data/" creada.');
}

console.log(`[DB] Ruta de la base de datos: ${dbPath}`);

// ========================================================================
// 2. CREAR/ABRIR CONEXIÓN A LA BASE DE DATOS
// ========================================================================

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('[DB ERROR] No se pudo conectar a SQLite:', err.message);
        process.exit(1); // Salir si no hay conexión a la BD
    } else {
        console.log('[DB OK] Conectado a SQLite exitosamente.');
    }
});

// ========================================================================
// 3. CREAR LAS TABLAS (SI NO EXISTEN)
// ========================================================================

// db.serialize() asegura que las tablas se creen en orden secuencial
db.serialize(() => {

    // ------------------------------------------------------------------------
    // TABLA 1: periodos
    // Guarda información de cada archivo Excel cargado (mes procesado)
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS periodos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_archivo TEXT NOT NULL UNIQUE,
            fecha_inicio DATE NOT NULL,
            fecha_fin DATE NOT NULL,
            fecha_carga DATETIME DEFAULT CURRENT_TIMESTAMP,
            departamento TEXT DEFAULT 'aca',
            estado TEXT DEFAULT 'procesando',
            detalle_errores TEXT,
            usuario_carga TEXT DEFAULT 'admin'
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "periodos":', err.message);
        } else {
            console.log('[DB OK] Tabla "periodos" lista.');
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 2: empleados
    // Información básica de cada empleado
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS empleados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            num TEXT NOT NULL UNIQUE,
            nombre TEXT NOT NULL,
            correo TEXT UNIQUE,
            departamento TEXT DEFAULT 'aca',
            grupo TEXT,
            activo INTEGER DEFAULT 1
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "empleados":', err.message);
        } else {
            console.log('[DB OK] Tabla "empleados" lista.');
            
            // Agregar columna correo si la tabla ya existe (migración)
            db.run(`
                ALTER TABLE empleados ADD COLUMN correo TEXT UNIQUE
            `, (alterErr) => {
                // Si la columna ya existe, ignorar el error
                if (alterErr && !alterErr.message.includes('duplicate column')) {
                    console.log('[DB INFO] Columna "correo" agregada a empleados.');
                }
            });
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 3: horarios_turnos
    // Configuración de turnos/horarios por periodo y grupo
    // Ejemplo: "1. 07:00-00:00, 00:00-18:00"
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS horarios_turnos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            periodo_id INTEGER NOT NULL,
            grupo TEXT NOT NULL,
            turno_numero INTEGER DEFAULT 1,
            entrada_manana TEXT,
            salida_manana TEXT,
            entrada_tarde TEXT,
            salida_tarde TEXT,
            descripcion_completa TEXT,
            FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "horarios_turnos":', err.message);
        } else {
            console.log('[DB OK] Tabla "horarios_turnos" lista.');
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 4: marcas_crudas
    // Todas las marcas del reloj checador (hoja "Registros")
    // Cada entrada/salida registrada por el empleado
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS marcas_crudas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            periodo_id INTEGER NOT NULL,
            empleado_id INTEGER NOT NULL,
            num_empleado TEXT NOT NULL,
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            tipo TEXT CHECK(tipo IN ('Entrada', 'Salida', 'Desconocido')),
            dia_semana TEXT,
            FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
            FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
            UNIQUE(periodo_id, empleado_id, fecha, hora)
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "marcas_crudas":', err.message);
        } else {
            console.log('[DB OK] Tabla "marcas_crudas" lista.');
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 5: asistencia_diaria
    // Datos procesados día por día (calculados por la aplicación)
    // Incluye retardos, salidas tempranas, horas extra, etc.
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS asistencia_diaria (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            periodo_id INTEGER NOT NULL,
            empleado_id INTEGER NOT NULL,
            fecha DATE NOT NULL,
            dia_semana TEXT,
            es_laborable INTEGER DEFAULT 1,
            
            -- HORARIOS
            horario_entrada_esperada TIME,
            horario_salida_esperada TIME,
            horas_requeridas_min INTEGER DEFAULT 0,
            
            -- MARCAS REALES
            entrada_real TIME,
            salida_real TIME,
            tiene_entrada INTEGER DEFAULT 0,
            tiene_salida INTEGER DEFAULT 0,
            
            -- HORAS TRABAJADAS
            minutos_trabajados INTEGER DEFAULT 0,
            
            -- RETARDOS
            minutos_retardo INTEGER DEFAULT 0,
            cuenta_retardo INTEGER DEFAULT 0,
            
            -- SALIDAS TEMPRANAS
            minutos_salida_temprana INTEGER DEFAULT 0,
            cuenta_salida_temprana INTEGER DEFAULT 0,
            
            -- HORAS EXTRA
            minutos_extra_normal INTEGER DEFAULT 0,
            minutos_extra_especial INTEGER DEFAULT 0,
            
            -- INCIDENCIAS
            es_falta INTEGER DEFAULT 0,
            es_permiso INTEGER DEFAULT 0,
            es_vacacion INTEGER DEFAULT 0,
            
            -- ESTADO Y OBSERVACIONES
            estado TEXT DEFAULT 'Completo',
            observaciones TEXT,
            
            FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
            FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
            UNIQUE(periodo_id, empleado_id, fecha)
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "asistencia_diaria":', err.message);
        } else {
            console.log('[DB OK] Tabla "asistencia_diaria" lista.');
            
            // MIGRACIONES: Agregar columnas nuevas si la tabla ya existe
            const nuevasColumnas = [
                { nombre: 'es_laborable', tipo: 'INTEGER DEFAULT 1' },
                { nombre: 'horas_requeridas_min', tipo: 'INTEGER DEFAULT 0' },
                { nombre: 'tiene_entrada', tipo: 'INTEGER DEFAULT 0' },
                { nombre: 'tiene_salida', tipo: 'INTEGER DEFAULT 0' },
                { nombre: 'estado', tipo: 'TEXT DEFAULT "Completo"' }
            ];
            
            nuevasColumnas.forEach(col => {
                db.run(`ALTER TABLE asistencia_diaria ADD COLUMN ${col.nombre} ${col.tipo}`, (alterErr) => {
                    if (alterErr && !alterErr.message.includes('duplicate column')) {
                        console.log(`[DB INFO] Columna "${col.nombre}" agregada a asistencia_diaria.`);
                    }
                });
            });
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 6: totales_excel
    // Los totales OFICIALES de la hoja "Resumen" del Excel
    // Estos son los datos que usarás para VALIDAR tus cálculos
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS totales_excel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            periodo_id INTEGER NOT NULL,
            empleado_id INTEGER NOT NULL,
            num_empleado TEXT NOT NULL,
            nombre_empleado TEXT NOT NULL,
            tiempo_requerido_min INTEGER DEFAULT 0,
            tiempo_real_min INTEGER DEFAULT 0,
            retardos_cuenta INTEGER DEFAULT 0,
            retardos_min INTEGER DEFAULT 0,
            salidas_tempranas_cuenta INTEGER DEFAULT 0,
            salidas_tempranas_min INTEGER DEFAULT 0,
            extra_normal_min INTEGER DEFAULT 0,
            extra_especial_min INTEGER DEFAULT 0,
            dias_asistidos INTEGER DEFAULT 0,
            dias_periodo INTEGER DEFAULT 0,
            vacaciones INTEGER DEFAULT 0,
            faltas INTEGER DEFAULT 0,
            permisos INTEGER DEFAULT 0,
            bono_nota REAL DEFAULT 0,
            bono_extra REAL DEFAULT 0,
            deduccion_tarde REAL DEFAULT 0,
            deduccion_salida REAL DEFAULT 0,
            deduccion_otro REAL DEFAULT 0,
            resultado_real REAL DEFAULT 0,
            observacion TEXT,
            FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE,
            FOREIGN KEY (empleado_id) REFERENCES empleados(id) ON DELETE CASCADE,
            UNIQUE(periodo_id, empleado_id)
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "totales_excel":', err.message);
        } else {
            console.log('[DB OK] Tabla "totales_excel" lista.');
        }
    });

    // ------------------------------------------------------------------------
    // TABLA 7: logs_importacion
    // Historial detallado de cada importación (para la pantalla de historial)
    // ------------------------------------------------------------------------
    db.run(`
        CREATE TABLE IF NOT EXISTS logs_importacion (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            periodo_id INTEGER NOT NULL,
            fecha_proceso DATETIME DEFAULT CURRENT_TIMESTAMP,
            hojas_procesadas INTEGER DEFAULT 0,
            empleados_procesados INTEGER DEFAULT 0,
            marcas_insertadas INTEGER DEFAULT 0,
            errores_encontrados INTEGER DEFAULT 0,
            advertencias TEXT,
            duracion_segundos REAL,
            estado_final TEXT DEFAULT 'exitoso',
            FOREIGN KEY (periodo_id) REFERENCES periodos(id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) {
            console.error('[DB ERROR] Error al crear tabla "logs_importacion":', err.message);
        } else {
            console.log('[DB OK] Tabla "logs_importacion" lista.');
        }
    });

    console.log('[DB] Todas las tablas han sido creadas o verificadas exitosamente.\n');
});

// ========================================================================
// 4. EXPORTAR LA CONEXIÓN
// ========================================================================

// Este objeto 'db' será importado por otros archivos (api.js, index.js, etc.)
module.exports = db;


