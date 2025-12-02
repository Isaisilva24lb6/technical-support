// index.js - Punto de entrada del Backend
const express = require('express');
const cors = require('cors');
const path = require('path');
// Importar la conexión a la base de datos para asegurar su inicialización
require('./config/db'); 
const apiRoutes = require('./server/api'); // Importar el archivo de rutas

const app = express();
const PORT = process.env.PORT || 3005;

// ============================================
// MIDDLEWARES
// ============================================

// 1. CORS - Permitir peticiones desde el frontend en desarrollo
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3005', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Parser de JSON (con límite aumentado para archivos grandes)
app.use(express.json({ limit: '50mb' }));

// 3. Parser de URL-encoded (para formularios)
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================
// RUTAS DE API
// ============================================

// Rutas de API (ANTES de los archivos estáticos)
app.use('/api', apiRoutes); 

// ============================================
// ARCHIVOS ESTÁTICOS (Solo para producción)
// ============================================

// Solo servir archivos estáticos si estamos en producción y existe la carpeta build
if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(__dirname, 'build');
    const fs = require('fs');
    
    if (fs.existsSync(buildPath)) {
        app.use(express.static(buildPath));
        
        // Fallback para client-side routing
        app.get(/^\/(?!api).*/, (req, res) => {
            res.sendFile(path.join(buildPath, 'index.html'));
        });
        
        console.log('[INFO] Sirviendo archivos estáticos desde /build');
    } else {
        console.log('[WARN] Carpeta /build no encontrada. Ejecuta "npm run build" en /client');
    }
} else {
    console.log('[INFO] Modo desarrollo - Frontend en Vite (puerto 5173)');
}

app.listen(PORT, () => {
    console.log(`\n\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  🚀 Servidor Monolito de Asistencia                       ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Puerto:     ${PORT}                                        ║`);
    console.log(`║  URL Local:  http://localhost:${PORT}                      ║`);
    console.log(`║  API:        http://localhost:${PORT}/api                  ║`);
    console.log(`║  Frontend:   http://localhost:5173 (Dev)                  ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);
});
