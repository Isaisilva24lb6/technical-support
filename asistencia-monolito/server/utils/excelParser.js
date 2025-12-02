// server/utils/excelParser.js
// Utilidad para parsear archivos Excel de empleados con detección inteligente

const ExcelJS = require('exceljs');

/**
 * 🧠 PARSER INTELIGENTE DE EMPLEADOS
 * 
 * Detecta y extrae:
 * - Nombres (puede haber múltiples en una celda)
 * - Correos de Microsoft (outlook.com, hotmail.com, @empresa.com)
 * - Números de empleado
 * 
 * Casos que maneja:
 * - Múltiples nombres en una celda: "Juan Pérez, María López"
 * - Múltiples correos en una celda: "juan@outlook.com, maria@hotmail.com"
 * - Correos mal formateados: "juan @ outlook.com" -> "juan@outlook.com"
 * - Nombres con caracteres especiales: "José María Ñoño"
 * - Números de empleado en diferentes formatos: "001", "E-001", "EMP001"
 */

/**
 * Regex para detectar correos electrónicos (incluso mal formateados)
 */
const EMAIL_REGEX = /([a-zA-Z0-9._-]+\s*@\s*[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;

/**
 * Regex para detectar nombres (palabras con mayúscula inicial, acentos, ñ)
 */
const NAME_REGEX = /([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)/g;

/**
 * Regex para números de empleado (formatos comunes)
 */
const EMPLOYEE_NUM_REGEX = /(?:E-?|EMP-?|#)?(\d{1,6})/i;

/**
 * Limpia y normaliza un correo electrónico
 * @param {string} email - Correo a limpiar
 * @returns {string} - Correo limpio y normalizado
 */
function cleanEmail(email) {
    if (!email) return '';
    
    let cleaned = email.trim();
    
    // Eliminar espacios alrededor del @
    cleaned = cleaned.replace(/\s*@\s*/g, '@');
    
    // Corregir @@ por @
    cleaned = cleaned.replace(/@@+/g, '@');
    
    // Eliminar espacios internos
    cleaned = cleaned.replace(/\s+/g, '');
    
    // Corregir comas por puntos en el dominio (error común)
    // Ejemplo: nombre@itszaplaca3,tecmm,mx → nombre@itszaplaca3.tecmm.mx
    const parts = cleaned.split('@');
    if (parts.length === 2) {
        const [user, domain] = parts;
        // Reemplazar comas por puntos solo en el dominio
        const cleanDomain = domain.replace(/,/g, '.');
        cleaned = `${user}@${cleanDomain}`;
    }
    
    // Convertir a minúsculas
    cleaned = cleaned.toLowerCase();
    
    return cleaned;
}

/**
 * Valida si un correo es válido y es de Microsoft/corporativo
 * @param {string} email - Correo a validar
 * @returns {boolean}
 */
function isValidMicrosoftEmail(email) {
    if (!email || email.length < 5) return false;
    
    const microsoftDomains = [
        'outlook.com',
        'hotmail.com',
        'live.com',
        'msn.com'
    ];
    
    // Verificar formato básico
    const basicEmailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!basicEmailRegex.test(email)) return false;
    
    // Aceptar cualquier correo corporativo o de Microsoft
    const domain = email.split('@')[1];
    
    // Es válido si es dominio Microsoft o tiene formato corporativo (.com, .mx, .es, etc.)
    return microsoftDomains.includes(domain) || domain.includes('.');
}

/**
 * Limpia y normaliza un nombre
 * @param {string} name - Nombre a limpiar
 * @returns {string}
 */
function cleanName(name) {
    if (!name) return '';
    
    // Eliminar espacios múltiples
    let cleaned = name.trim().replace(/\s+/g, ' ');
    
    // Capitalizar correctamente (mantener acentos y ñ)
    cleaned = cleaned
        .split(' ')
        .map(word => {
            if (word.length === 0) return '';
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
    
    return cleaned;
}

/**
 * Extrae múltiples nombres de una celda
 * @param {string} cellValue - Valor de la celda
 * @returns {Array<string>} - Array de nombres detectados
 */
function extractNames(cellValue) {
    if (!cellValue) return [];
    
    const str = String(cellValue);
    const names = [];
    
    // Detectar separadores comunes: coma, punto y coma, salto de línea, barra
    const separators = /[,;|\n\/]/;
    
    if (separators.test(str)) {
        // Hay separadores, dividir por ellos
        const parts = str.split(separators);
        parts.forEach(part => {
            const cleaned = cleanName(part);
            if (cleaned.length > 3) { // Mínimo "A B"
                names.push(cleaned);
            }
        });
    } else {
        // No hay separadores, intentar detectar nombres completos con regex
        const matches = str.match(NAME_REGEX);
        if (matches) {
            matches.forEach(match => {
                const cleaned = cleanName(match);
                if (cleaned.length > 3) {
                    names.push(cleaned);
                }
            });
        } else {
            // Si no detectamos patrón, pero la cadena parece un nombre, usarla directamente
            const cleaned = cleanName(str);
            if (cleaned.length > 3 && /^[A-Za-záéíóúñÁÉÍÓÚÑ\s]+$/.test(cleaned)) {
                names.push(cleaned);
            }
        }
    }
    
    return names;
}

/**
 * Extrae múltiples correos de una celda
 * @param {string} cellValue - Valor de la celda
 * @returns {Array<string>} - Array de correos válidos
 */
function extractEmails(cellValue) {
    if (!cellValue) return [];
    
    const str = String(cellValue);
    const emails = [];
    
    // Detectar todos los correos con regex
    const matches = str.match(EMAIL_REGEX);
    
    if (matches) {
        matches.forEach(match => {
            const cleaned = cleanEmail(match);
            if (isValidMicrosoftEmail(cleaned)) {
                emails.push(cleaned);
            }
        });
    }
    
    return emails;
}

/**
 * Extrae número de empleado de una celda
 * @param {string} cellValue - Valor de la celda
 * @returns {string|null} - Número de empleado o null
 */
function extractEmployeeNum(cellValue) {
    if (!cellValue) return null;
    
    const str = String(cellValue).trim();
    
    // Si es un número puro, usarlo directamente (SIN PADDING)
    if (/^\d{1,6}$/.test(str)) {
        // ✅ IMPORTANTE: Convertir a int para eliminar ceros a la izquierda
        // "001" → 1 → "1"
        // "008" → 8 → "8"
        // "100" → 100 → "100"
        return String(parseInt(str, 10));
    }
    
    // Intentar extraer con regex
    const match = str.match(EMPLOYEE_NUM_REGEX);
    if (match && match[1]) {
        // ✅ IMPORTANTE: También eliminar padding del regex
        return String(parseInt(match[1], 10));
    }
    
    return null;
}

/**
 * Limpia y normaliza el contenido de una celda
 * Maneja saltos de línea, espacios múltiples, texto mal formateado, e hipervínculos
 * @param {any} cellValue - Valor de la celda (puede ser texto, objeto con hyperlink, etc.)
 * @returns {string} - Texto limpio
 */
function cleanCellValue(cellValue) {
    if (!cellValue) return '';
    
    let str = '';
    
    // Si es un objeto con hipervínculo (común en celdas de correo)
    if (typeof cellValue === 'object' && cellValue !== null) {
        // ExcelJS representa hipervínculos como objetos con propiedades 'text' y 'hyperlink'
        if (cellValue.text) {
            str = String(cellValue.text);
        } else if (cellValue.hyperlink) {
            // Si solo tiene hyperlink, extraer el email del hyperlink
            const hyperlink = String(cellValue.hyperlink);
            // Los mailto: links tienen formato "mailto:correo@dominio.com"
            str = hyperlink.replace(/^mailto:/i, '');
        } else {
            // Si es otro tipo de objeto, intentar convertirlo a string
            str = String(cellValue);
        }
    } else {
        str = String(cellValue);
    }
    
    // Reemplazar saltos de línea por comas
    str = str.replace(/[\r\n]+/g, ', ');
    
    // Eliminar espacios múltiples
    str = str.replace(/\s+/g, ' ');
    
    // Limpiar comas múltiples
    str = str.replace(/,\s*,/g, ',');
    
    return str.trim();
}

/**
 * 🔍 FUNCIÓN PRINCIPAL: Parsear Excel de Empleados
 * 
 * @param {string} filePath - Ruta del archivo Excel
 * @returns {Promise<Object>} - { employees: Array, warnings: Array }
 */
async function parseEmployeesExcel(filePath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    if (!workbook.worksheets || workbook.worksheets.length === 0) {
        throw new Error('El archivo Excel está vacío o no tiene hojas.');
    }
    
    console.log(`[PARSER] Hojas encontradas: ${workbook.worksheets.map(w => w.name).join(', ')}`);
    
    // Buscar hojas que contengan "SABANA" o procesar todas si no hay ninguna con ese nombre
    const targetSheets = workbook.worksheets.filter(ws => 
        ws.name.toLowerCase().includes('sabana') || 
        ws.name.toLowerCase().includes('personal') ||
        ws.name.toLowerCase().includes('empleado')
    );
    
    const sheetsToProcess = targetSheets.length > 0 ? targetSheets : [workbook.worksheets[0]];
    
    console.log(`[PARSER] Procesando ${sheetsToProcess.length} hoja(s): ${sheetsToProcess.map(w => w.name).join(', ')}`);
    
    let allEmployees = [];
    let allWarnings = [];
    let employeeIdCounter = 1;
    
    // Procesar cada hoja
    for (const worksheet of sheetsToProcess) {
        console.log(`\n[PARSER] === Procesando hoja: ${worksheet.name} ===`);
    
    const employees = [];
    const warnings = [];
    
    // 🔍 BUSCAR LA FILA DE CABECERA AUTOMÁTICAMENTE
    let headerRowNumber = 1;
    let headers = [];
    
    for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
        const row = worksheet.getRow(i);
        const tempHeaders = [];
        
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const value = String(cell.value || '').toLowerCase().trim();
            tempHeaders[colNumber] = value;
        });
        
        // Verificar si esta fila tiene palabras clave de cabecera
        const hasNombre = tempHeaders.some(h => h && (h.includes('nombre') || h.includes('name') || h.includes('personal')));
        const hasCorreo = tempHeaders.some(h => h && (h.includes('correo') || h.includes('email') || h.includes('mail')));
        
        if (hasNombre && hasCorreo) {
            headerRowNumber = i;
            headers = tempHeaders;
            console.log(`[PARSER] Cabecera detectada en fila ${i}`);
            break;
        }
    }
    
    if (headers.length === 0) {
        throw new Error('No se pudo detectar la cabecera del Excel. Asegúrate de que tenga columnas "Nombre" y "Correo".');
    }
    
    // Identificar columnas por palabras clave (con validación de undefined)
    const colNombre = headers.findIndex(h => h && (h.includes('nombre') || h.includes('name') || h.includes('personal')));
    const colCorreo = headers.findIndex(h => h && (h.includes('correo') || h.includes('email') || h.includes('mail')));
    const colNumero = headers.findIndex(h => {
        if (!h) return false;
        // Buscar variaciones comunes de "número"
        return h.includes('num') || 
               h.includes('número') || 
               h.includes('no') || 
               h.includes('n°') || 
               h.includes('nº') ||
               h.includes('#') ||
               h.includes('id') || 
               h.includes('emp') || 
               h.includes('clave') ||
               h === 'n' || // A veces solo ponen "N"
               h === 'no.'; // O "No."
    });
    const colDepartamento = headers.findIndex(h => h && (h.includes('depart') || h.includes('area') || h.includes('department')));
    const colGrupo = headers.findIndex(h => h && (h.includes('grupo') || h.includes('group') || h.includes('turno') || h.includes('shift')));
    
    console.log(`[PARSER] Columnas detectadas:`, {
        nombre: colNombre,
        correo: colCorreo,
        numero: colNumero,
        departamento: colDepartamento,
        grupo: colGrupo
    });
    
    // Iterar sobre las filas (desde la siguiente después de la cabecera)
    for (let rowNum = headerRowNumber + 1; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        
        // Verificar si la fila está vacía
        if (row.values.every(v => !v || String(v).trim() === '')) {
            continue;
        }
        
        // Extraer valores de las celdas y limpiarlos
        const nombreCell = colNombre > 0 ? cleanCellValue(row.getCell(colNombre).value) : null;
        const correoCell = colCorreo > 0 ? cleanCellValue(row.getCell(colCorreo).value) : null;
        const numeroCell = colNumero > 0 ? cleanCellValue(row.getCell(colNumero).value) : null;
        const departamentoCell = colDepartamento > 0 ? cleanCellValue(row.getCell(colDepartamento).value) : null;
        const grupoCell = colGrupo > 0 ? cleanCellValue(row.getCell(colGrupo).value) : null;
        
        // Debug: mostrar el tipo de dato de la celda de correo para diagnóstico
        if (colCorreo > 0 && rowNum <= headerRowNumber + 3) {
            const correoRawCell = row.getCell(colCorreo);
            console.log(`[DEBUG] Fila ${rowNum} correo raw:`, {
                value: correoRawCell.value,
                type: typeof correoRawCell.value,
                text: correoRawCell.text,
                hyperlink: correoRawCell.hyperlink
            });
        }
        
        // Extraer nombres y correos (pueden ser múltiples)
        const nombres = extractNames(nombreCell);
        const correos = extractEmails(correoCell);
        
        // Si no hay nombres, saltar esta fila
        if (nombres.length === 0) {
            warnings.push(`Fila ${rowNum}: No se detectó ningún nombre válido.`);
            continue;
        }
        
        // Caso 1: Mismo número de nombres y correos (emparejamiento 1:1)
        if (nombres.length === correos.length && nombres.length > 0) {
            for (let i = 0; i < nombres.length; i++) {
                const empNum = extractEmployeeNum(numeroCell) || `AUTO-${employeeIdCounter++}`;
                
                employees.push({
                    id: employeeIdCounter,
                    num: empNum,
                    nombre: nombres[i],
                    correo: correos[i],
                    departamento: departamentoCell ? String(departamentoCell).trim() : 'aca',
                    grupo: grupoCell ? String(grupoCell).trim() : '',
                    activo: true,
                    warnings: []
                });
                
                employeeIdCounter++;
            }
        }
        // Caso 2: Más nombres que correos (algunos sin correo)
        else if (nombres.length > correos.length) {
            for (let i = 0; i < nombres.length; i++) {
                const empNum = extractEmployeeNum(numeroCell) || `AUTO-${employeeIdCounter++}`;
                const empWarnings = [];
                
                if (i >= correos.length) {
                    empWarnings.push('correo_faltante');
                    warnings.push(`Fila ${rowNum}: "${nombres[i]}" no tiene correo asignado.`);
                }
                
                employees.push({
                    id: employeeIdCounter,
                    num: empNum,
                    nombre: nombres[i],
                    correo: correos[i] || '',
                    departamento: departamentoCell ? String(departamentoCell).trim() : 'aca',
                    grupo: grupoCell ? String(grupoCell).trim() : '',
                    activo: true,
                    warnings: empWarnings
                });
                
                employeeIdCounter++;
            }
        }
        // Caso 3: Más correos que nombres (error de formato)
        else if (correos.length > nombres.length) {
            warnings.push(`Fila ${rowNum}: Hay más correos (${correos.length}) que nombres (${nombres.length}). Se usará el primer nombre para todos.`);
            
            const nombre = nombres[0];
            
            for (let i = 0; i < correos.length; i++) {
                const empNum = extractEmployeeNum(numeroCell) || `AUTO-${employeeIdCounter++}`;
                const empWarnings = ['nombre_duplicado'];
                
                employees.push({
                    id: employeeIdCounter,
                    num: empNum,
                    nombre: `${nombre} (${i + 1})`, // Diferenciar con número
                    correo: correos[i],
                    departamento: departamentoCell ? String(departamentoCell).trim() : 'aca',
                    grupo: grupoCell ? String(grupoCell).trim() : '',
                    activo: true,
                    warnings: empWarnings
                });
                
                employeeIdCounter++;
            }
        }
    }
    
        allEmployees = allEmployees.concat(employees);
        allWarnings = allWarnings.concat(warnings);
    }
    
    console.log(`\n[PARSER] === RESUMEN FINAL ===`);
    console.log(`[PARSER] Total empleados detectados: ${allEmployees.length}`);
    console.log(`[PARSER] Total advertencias: ${allWarnings.length}`);
    
    return {
        employees: allEmployees,
        warnings: allWarnings,
        stats: {
            total: allEmployees.length,
            conCorreo: allEmployees.filter(e => e.correo && e.correo.length > 0).length,
            sinCorreo: allEmployees.filter(e => !e.correo || e.correo.length === 0).length,
            conAdvertencias: allEmployees.filter(e => e.warnings && e.warnings.length > 0).length
        }
    };
}

module.exports = {
    parseEmployeesExcel,
    cleanEmail,
    cleanName,
    extractNames,
    extractEmails,
    extractEmployeeNum,
    isValidMicrosoftEmail
};

