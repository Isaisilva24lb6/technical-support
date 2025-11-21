// server/api.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db'); // Conexión a SQLite
const fs = require('fs');

// --- Configuración de Multer para la subida de archivos ---
// Guardamos el archivo Excel en la carpeta 'data/' (el volumen persistente)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'data', 'uploads');
        // Asegurar que la carpeta exista (aunque ya la creamos, es buena práctica)
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generamos un nombre único y seguro para el archivo
        const now = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `asistencia_${now}${ext}`);
    }
});

const upload = multer({ storage: storage });

// --- ENDPOINT PRINCIPAL: Carga y Procesamiento del Excel ---
router.post('/upload-excel', upload.single('excelFile'), (req, res) => {
    // El nombre del campo en el formulario de React debe ser 'excelFile'
    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    const filePath = req.file.path;
    const fileName = req.file.filename;

    console.log(`[FILE] Archivo recibido: ${fileName}. Ruta temporal: ${filePath}`);

    // TODO: Implementar aquí la lógica de ExcelJS (Lectura, Validación, Inserción en DB)
    // El siguiente paso sería llamar a una función como: 
    // processExcelFile(filePath, fileName, db);

    res.status(200).json({
        message: 'Archivo recibido exitosamente. Procesamiento en curso.',
        filename: fileName,
        periodo: '2025-08-01 a 2025-08-31 (Simulado)' // Placeholder
    });
});

// --- Ruta de prueba de estado ---
router.get('/status', (req, res) => {
    // Esta ruta ya estaba en index.js, la movemos aquí para centralizar APIs
    res.json({ 
        status: 'OK', 
        version: '1.1 (Con API de Carga)', 
        dbConnected: !!db // Muestra si la DB está conectada
    });
});

module.exports = router;