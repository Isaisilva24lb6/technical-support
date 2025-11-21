// index.js - Punto de entrada del Backend
const express = require('express');
const path = require('path');
// Importar la conexión a la base de datos para asegurar su inicialización
require('./config/db'); 
const apiRoutes = require('./server/api'); // Importar el archivo de rutas

const app = express();
const PORT = 3000;

// Rutas de API (ANTES de los archivos estáticos)
app.use('/api', apiRoutes); 

// Middleware para servir archivos estáticos (React compilado)
// Express servirá index.html automáticamente para rutas que no coincidan
app.use(express.static(path.join(__dirname, 'build')));

// Fallback: Si ninguna ruta coincide, sirve el index.html de React (para client-side routing)
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n\n[INFO] Servidor Monolito de Asistencia corriendo en el puerto ${PORT}`);
    console.log(`[INFO] Accede via: http://localhost:${PORT} o la IP de la RPi.\n`);
});
