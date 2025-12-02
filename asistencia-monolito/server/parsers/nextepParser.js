// server/parsers/nextepParser.js
// Parser especializado para archivos del reloj checador Nextep NE-234

const ExcelJS = require('exceljs');
const { IntelligentParser } = require('./intelligentParser');
const { parseDate, parseTime } = require('../utils/dateParser');
const { TIPO_MARCA } = require('../../shared/constants');

/**
 * Parser especializado para el reloj checador Nextep NE-234
 */
class NextepParser {
  constructor() {
    this.intelligentParser = new IntelligentParser();
  }
  
  /**
   * Parsea un archivo Excel del Nextep NE-234
   * @param {string} filePath - Ruta del archivo Excel
   * @returns {Promise<Object>} Resultado del parseo
   */
  async parse(filePath) {
    const startTime = Date.now();
    const warnings = [];
    const errors = [];
    
    try {
      // Cargar el archivo Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      console.log(`[PARSER] Archivo cargado: ${filePath}`);
      console.log(`[PARSER] Hojas encontradas: ${workbook.worksheets.map(w => w.name).join(', ')}`);
      
      // Analizar cada hoja con el IntelligentParser
      const sheetAnalyses = workbook.worksheets.map(sheet => {
        const analysis = this.intelligentParser.analyzeSheet(sheet);
        console.log(`[PARSER] Hoja "${sheet.name}" detectada como: ${analysis.type} (confianza: ${(analysis.confidence * 100).toFixed(0)}%)`);
        return analysis;
      });
      
      // Identificar hojas clave
      // Priorizar por nombre exacto para evitar confusiones
      const registrosSheet = this.selectBestSheet(sheetAnalyses, 'registros', ['registros', 'lista', 'marcas', 'checks']);
      const resumenSheet = this.selectBestSheet(sheetAnalyses, 'resumen', ['resumen', 'totales', 'summary']);
      const turnosSheets = sheetAnalyses.filter(s => 
        (s.type === 'turnos' && s.confidence > 0.5) ||
        /^\d+\.\d+\.\d+$/.test(s.sheetName) // Hojas como "1.3.5", "6.8.14"
      );
      
      // Advertencias si no se encuentran hojas esperadas
      if (!registrosSheet) {
        warnings.push('No se detectó la hoja de registros/marcas');
      }
      if (!resumenSheet) {
        warnings.push('No se detectó la hoja de resumen/totales');
      }
      
      // Parsear cada tipo de hoja
      const marcas = registrosSheet 
        ? this.parseRegistros(workbook.getWorksheet(registrosSheet.sheetName), registrosSheet)
        : [];
        
      const totales = resumenSheet
        ? this.parseResumen(workbook.getWorksheet(resumenSheet.sheetName), resumenSheet)
        : [];
        
      const turnos = turnosSheets.flatMap(analysis => 
        this.parseTurnos(workbook.getWorksheet(analysis.sheetName), analysis)
      );
      
      // Detectar período del archivo
      const periodo = this.detectPeriodo(marcas, filePath);
      
      // Extraer empleados únicos (desde resumen, nombres de hojas y marcas)
      const empleados = this.extractEmpleados(marcas, totales, turnosSheets);
      
      const elapsedTime = Date.now() - startTime;
      
      console.log(`[PARSER] ✅ Parseo completado en ${elapsedTime}ms`);
      console.log(`[PARSER] - ${marcas.length} marcas encontradas`);
      console.log(`[PARSER] - ${totales.length} totales encontrados`);
      console.log(`[PARSER] - ${turnos.length} turnos encontrados`);
      console.log(`[PARSER] - ${empleados.length} empleados detectados`);
      
      return {
        success: errors.length === 0,
        periodo,
        empleados,
        marcas,
        turnos,
        totales,
        warnings,
        errors,
        stats: {
          totalHojas: workbook.worksheets.length,
          hojasDetectadas: {
            registros: registrosSheet?.sheetName,
            resumen: resumenSheet?.sheetName,
            turnos: turnosSheets.map(s => s.sheetName)
          },
          totalEmpleados: empleados.length,
          totalMarcas: marcas.length,
          totalTurnos: turnos.length,
          tiempoProcesamiento: elapsedTime
        }
      };
      
    } catch (error) {
      console.error('[PARSER] Error fatal:', error);
      errors.push(`Error fatal al parsear: ${error.message}`);
      
      return {
        success: false,
        periodo: null,
        empleados: [],
        marcas: [],
        turnos: [],
        totales: [],
        warnings,
        errors,
        stats: {
          totalHojas: 0,
          hojasDetectadas: {},
          totalEmpleados: 0,
          totalMarcas: 0,
          totalTurnos: 0,
          tiempoProcesamiento: Date.now() - startTime
        }
      };
    }
  }
  
  /**
   * Parsea la hoja de registros (marcas del reloj checador)
   * Soporta DOS formatos:
   * 1. Formato lineal: Num | Fecha | Hora | Tipo (una fila por marca)
   * 2. Formato grid: Empleados en filas, días en columnas (Nextep común)
   * @param {import('exceljs').Worksheet} sheet
   * @param {Object} analysis
   * @returns {Array}
   */
  parseRegistros(sheet, analysis) {
    const marcas = [];
    const { structure, headerRow } = analysis;
    
    console.log(`[PARSER] Parseando hoja de registros: ${sheet.name}`);
    console.log(`[PARSER] Estructura detectada:`, structure);
    
    // DETECTAR FORMATO: ¿Lineal o Grid?
    const formato = this.detectFormatoRegistros(sheet);
    console.log(`[PARSER] Formato detectado: ${formato}`);
    
    if (formato === 'grid') {
      return this.parseRegistrosGrid(sheet);
    }
    
    // FORMATO LINEAL (el original)
    // Validar que tenemos las columnas mínimas necesarias
    if (!structure.num && !structure.nombre) {
      console.warn('[PARSER] No se detectó columna de número o nombre de empleado');
      return marcas;
    }
    
    if (!structure.fecha) {
      console.warn('[PARSER] No se detectó columna de fecha');
      return marcas;
    }
    
    if (!structure.hora) {
      console.warn('[PARSER] No se detectó columna de hora');
      return marcas;
    }
    
    // Parsear cada fila de datos
    for (let i = headerRow + 1; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      
      // Saltar filas vacías
      if (this.isEmptyRow(row)) continue;
      
      try {
        // Extraer número de empleado
        const numEmpleado = structure.num !== undefined 
          ? this.extractEmployeeNumber(row.getCell(structure.num + 1).value)
          : this.extractEmployeeNumber(row.getCell(structure.nombre + 1).value);
        
        if (!numEmpleado) {
          continue; // Saltar si no hay número de empleado
        }
        
        // Extraer fecha
        const fechaValue = row.getCell(structure.fecha + 1).value;
        const fecha = parseDate(fechaValue);
        
        // Extraer hora
        const horaValue = row.getCell(structure.hora + 1).value;
        const hora = parseTime(horaValue);
        
        // Detectar tipo de marca (Entrada/Salida)
        const tipo = structure.tipo !== undefined
          ? this.detectTipoMarca(row.getCell(structure.tipo + 1).value)
          : this.detectTipoPorAlternancia(marcas, numEmpleado, fecha);
        
        marcas.push({
          num_empleado: numEmpleado,
          fecha: fecha,
          hora: hora,
          tipo: tipo,
          fila_original: i
        });
        
      } catch (error) {
        console.warn(`[PARSER] Error en fila ${i}: ${error.message}`);
      }
    }
    
    return marcas;
  }
  
  /**
   * Parsea la hoja de resumen (totales)
   * @param {import('exceljs').Worksheet} sheet
   * @param {Object} analysis
   * @returns {Array}
   */
  parseResumen(sheet, analysis) {
    const totales = [];
    const { headerRow } = analysis;
    
    console.log(`[PARSER] Parseando hoja de resumen: ${sheet.name}`);
    
    // PASO 1: Detectar columnas manualmente (la estructura puede variar)
    const headerRowData = sheet.getRow(headerRow);
    const columnMap = this.detectResumenColumns(headerRowData);
    
    console.log(`[PARSER] Columnas detectadas en Resumen:`, Object.keys(columnMap));
    
    // PASO 2: Parsear cada fila de empleado
    for (let i = headerRow + 1; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      
      if (this.isEmptyRow(row)) continue;
      
      try {
        // Extraer número de empleado
        const numEmpleado = this.extractEmployeeNumber(
          row.getCell(columnMap.num || 1).value
        );
        
        if (!numEmpleado) continue;
        
        // Extraer todos los campos
        const total = {
          num_empleado: numEmpleado,
          nombre_empleado: columnMap.nombre 
            ? String(row.getCell(columnMap.nombre).value || '') 
            : '',
          departamento: columnMap.departamento
            ? String(row.getCell(columnMap.departamento).value || '')
            : 'aca',
          
          // Tiempo de trabajo
          tiempo_requerido_min: this.parseNumericCell(row, columnMap.tiempo_requerido),
          tiempo_real_min: this.parseNumericCell(row, columnMap.tiempo_real),
          
          // Retardos
          retardos_cuenta: this.parseNumericCell(row, columnMap.retardo_total),
          retardos_min: this.parseNumericCell(row, columnMap.retardo_min),
          
          // Salidas tempranas  
          salidas_tempranas_cuenta: this.parseNumericCell(row, columnMap.salida_temprana_total),
          salidas_tempranas_min: this.parseNumericCell(row, columnMap.salida_temprana_min),
          
          // Tiempo extra
          extra_normal_min: this.parseNumericCell(row, columnMap.extra_normal),
          extra_especial_min: this.parseNumericCell(row, columnMap.extra_especial),
          
          // Asistencias y faltas
          dias_asistidos: this.parseNumericCell(row, columnMap.asistencias),
          faltas: this.parseNumericCell(row, columnMap.faltas),
          vacaciones: this.parseNumericCell(row, columnMap.vacaciones),
          permisos: this.parseNumericCell(row, columnMap.permisos),
          
          fila_original: i
        };
        
        totales.push(total);
        
      } catch (error) {
        console.warn(`[PARSER] Error en fila ${i} de resumen: ${error.message}`);
      }
    }
    
    console.log(`[PARSER] Totales parseados: ${totales.length} empleados`);
    
    return totales;
  }
  
  /**
   * Detecta las columnas de la hoja de Resumen
   * @param {import('exceljs').Row} headerRow
   * @returns {Object} Mapa de columnas
   */
  detectResumenColumns(headerRow) {
    const columnMap = {};
    
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const header = String(cell.value || '').toLowerCase().trim();
      
      // Número y nombre
      if (/^n[uúo]m/.test(header)) columnMap.num = colNumber;
      if (/^nombre/.test(header)) columnMap.nombre = colNumber;
      if (/depart/.test(header)) columnMap.departamento = colNumber;
      
      // Tiempo de trabajo
      if (/requerido/.test(header)) columnMap.tiempo_requerido = colNumber;
      if (/real/.test(header) && /tiempo/.test(header)) columnMap.tiempo_real = colNumber;
      
      // Retardo (buscar columna "T" y "(min)")
      if (header === 't' || header === 'total') {
        // Verificar si la columna anterior dice "retardo"
        const prevCell = headerRow.getCell(colNumber - 1);
        const prevHeader = String(prevCell.value || '').toLowerCase();
        
        if (/retard/.test(prevHeader)) {
          columnMap.retardo_total = colNumber;
        }
        if (/salida.*temp|temp.*salida/.test(prevHeader)) {
          columnMap.salida_temprana_total = colNumber;
        }
      }
      
      if (/\(min\)|\(minuto/.test(header)) {
        const prevCell = headerRow.getCell(colNumber - 1);
        const prevHeader = String(prevCell.value || '').toLowerCase();
        
        if (/retard/.test(prevHeader)) {
          columnMap.retardo_min = colNumber;
        }
        if (/salida.*temp|temp.*salida/.test(prevHeader)) {
          columnMap.salida_temprana_min = colNumber;
        }
      }
      
      // Tiempo extra
      if (/normal/.test(header) && /extra/.test(header)) columnMap.extra_normal = colNumber;
      if (/especial/.test(header) && /extra/.test(header)) columnMap.extra_especial = colNumber;
      
      // Asistencias y faltas
      if (/asistencia/.test(header)) columnMap.asistencias = colNumber;
      if (header === 'f' || /^falta/.test(header)) columnMap.faltas = colNumber;
      if (/^v$|vacaci/.test(header)) columnMap.vacaciones = colNumber;
      if (/^p$|permiso/.test(header)) columnMap.permisos = colNumber;
    });
    
    return columnMap;
  }
  
  /**
   * Parsea una celda numérica de forma segura
   * @param {import('exceljs').Row} row
   * @param {number} colNumber
   * @returns {number}
   */
  parseNumericCell(row, colNumber) {
    if (!colNumber) return 0;
    
    const value = row.getCell(colNumber).value;
    
    if (value === null || value === undefined || value === '') return 0;
    
    // Si es número, retornar directamente
    if (typeof value === 'number') return value;
    
    // Si es string, intentar parsear
    const parsed = parseFloat(String(value).replace(/,/g, ''));
    
    return isNaN(parsed) ? 0 : parsed;
  }
  
  /**
   * Parsea una hoja de turnos/horarios
   * @param {import('exceljs').Worksheet} sheet
   * @param {Object} analysis
   * @returns {Array}
   */
  parseTurnos(sheet, analysis) {
    const turnos = [];
    
    console.log(`[PARSER] Parseando hoja de turnos: ${sheet.name}`);
    
    // La implementación depende de la estructura específica de los turnos
    // Por ahora retornamos array vacío como placeholder
    
    return turnos;
  }
  
  /**
   * Detecta el período del archivo basándose en las marcas
   * @param {Array} marcas
   * @param {string} filePath
   * @returns {Object}
   */
  detectPeriodo(marcas, filePath) {
    if (marcas.length === 0) {
      return {
        nombre_archivo: filePath.split('/').pop() || 'unknown',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        fecha_carga: new Date(),
        departamento: 'aca',
        estado: 'procesando',
        usuario_carga: 'admin'
      };
    }
    
    const fechas = marcas.map(m => m.fecha).sort((a, b) => a - b);
    const fechaInicio = fechas[0];
    const fechaFin = fechas[fechas.length - 1];
    
    return {
      nombre_archivo: filePath.split('/').pop() || 'unknown',
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      fecha_carga: new Date(),
      departamento: 'aca',
      estado: 'procesando',
      usuario_carga: 'admin'
    };
  }
  
  /**
   * Extrae lista de empleados únicos
   * @param {Array} marcas
   * @param {Array} totales
   * @param {Array} turnosSheets - Análisis de hojas de turnos (nombres como "1.3.5")
   * @returns {Array}
   */
  extractEmpleados(marcas, totales, turnosSheets = []) {
    const empleadosMap = new Map();
    
    // PRIORIDAD 1: Agregar empleados desde la hoja de RESUMEN/TOTALES
    // Estos tienen los números correctos (100, 101, 115, etc.)
    totales.forEach(total => {
      if (total.num_empleado && !empleadosMap.has(total.num_empleado)) {
        empleadosMap.set(total.num_empleado, {
          num: total.num_empleado,
          nombre: total.nombre_empleado || '',
          activo: true
        });
      }
    });
    
    // PRIORIDAD 2: Extraer números de empleado de los NOMBRES de las hojas
    // Ejemplo: "1.3.5" → empleados 1, 3, 5
    // Ejemplo: "6.8.14" → empleados 6, 8, 14
    turnosSheets.forEach(sheet => {
      const sheetName = sheet.sheetName || '';
      
      // Detectar formato: números separados por puntos
      // Ejemplo: "1.3.5", "6.8.14", "19.22.24", "100.101.105"
      const numberPattern = /^(\d+)\.(\d+)\.(\d+)(?:\.(\d+))?$/;
      const match = sheetName.match(numberPattern);
      
      if (match) {
        // Extraer todos los números (hasta 4 posibles)
        const nums = [match[1], match[2], match[3], match[4]].filter(n => n);
        
        nums.forEach(num => {
          const numEmpleado = this.extractEmployeeNumber(num); // Eliminar ceros a la izquierda
          
          if (numEmpleado && !empleadosMap.has(numEmpleado)) {
            // Buscar nombre en totales si existe
            const totalEmpleado = totales.find(t => t.num_empleado === numEmpleado);
            
            empleadosMap.set(numEmpleado, {
              num: numEmpleado,
              nombre: totalEmpleado ? totalEmpleado.nombre_empleado : '',
              activo: true
            });
          }
        });
      }
    });
    
    // PRIORIDAD 3: Agregar empleados de las marcas SOLO si no existen ya
    // (para casos donde no hay hoja de resumen ni nombres de hojas)
    marcas.forEach(marca => {
      if (!empleadosMap.has(marca.num_empleado)) {
        empleadosMap.set(marca.num_empleado, {
          num: marca.num_empleado,
          nombre: marca.nombre || '',
          activo: true
        });
      }
    });
    
    console.log(`[PARSER] Empleados extraídos: ${empleadosMap.size}`);
    console.log(`[PARSER] Números: ${Array.from(empleadosMap.keys()).sort((a, b) => parseInt(a) - parseInt(b)).join(', ')}`);
    
    return Array.from(empleadosMap.values());
  }
  
  /**
   * Extrae el número de empleado de un valor de celda
   * @param {any} value
   * @returns {string|null}
   */
  extractEmployeeNumber(value) {
    if (!value) return null;
    
    const str = String(value).trim();
    
    // ❌ RECHAZAR si parece una HORA (contiene ":")
    // Ejemplos: "07:55", "10:37", "11:34 19:38"
    if (str.includes(':')) {
      return null;
    }
    
    // ❌ RECHAZAR si parece una FECHA
    // Ejemplos: "2025/08/01", "01-08-2025"
    if (str.includes('/') || str.includes('-')) {
      return null;
    }
    
    // Número puro (eliminar ceros a la izquierda: 08 -> 8, 01 -> 1)
    if (/^\d{1,6}$/.test(str)) {
      const num = parseInt(str, 10);
      
      // ❌ RECHAZAR números muy pequeños (1-6) que puedan ser días u horas
      // Los números de empleado reales suelen empezar desde 7 o más
      // EXCEPCIÓN: Permitir 1-6 si están en hojas con nombres tipo "1.3.5"
      // pero aquí solo validamos el formato básico
      if (num >= 1 && num <= 31) {
        // PODRÍA ser un día del mes, así que ser más estricto
        // Solo aceptar si está en contexto correcto (ya se valida en otro lado)
      }
      
      return String(num);
    }
    
    // Con prefijo (E-001, EMP-001, etc.)
    const match = str.match(/(?:E-?|EMP-?|#)?(\d{1,6})/i);
    if (match && match[1]) {
      return String(parseInt(match[1], 10)); // Eliminar ceros a la izquierda
    }
    
    return null;
  }
  
  /**
   * Detecta el tipo de marca (Entrada/Salida)
   * @param {any} value
   * @returns {string}
   */
  detectTipoMarca(value) {
    const str = String(value || '').toLowerCase().trim();
    
    const entradaKeywords = ['entrada', 'entry', 'in', 'e', 'check-in'];
    const salidaKeywords = ['salida', 'exit', 'out', 's', 'check-out'];
    
    if (entradaKeywords.some(kw => str.includes(kw))) {
      return TIPO_MARCA.ENTRADA;
    }
    
    if (salidaKeywords.some(kw => str.includes(kw))) {
      return TIPO_MARCA.SALIDA;
    }
    
    return TIPO_MARCA.DESCONOCIDO;
  }
  
  /**
   * Detecta el tipo de marca por alternancia (si no hay columna explícita)
   * @param {Array} marcas
   * @param {string} numEmpleado
   * @param {Date} fecha
   * @returns {string}
   */
  detectTipoPorAlternancia(marcas, numEmpleado, fecha) {
    // Buscar la última marca del mismo empleado en la misma fecha
    const marcasEmpleado = marcas
      .filter(m => 
        m.num_empleado === numEmpleado && 
        m.fecha.toDateString() === fecha.toDateString()
      );
    
    if (marcasEmpleado.length === 0) {
      return TIPO_MARCA.ENTRADA; // Primera marca del día
    }
    
    const ultimaMarca = marcasEmpleado[marcasEmpleado.length - 1];
    
    // Alternar
    return ultimaMarca.tipo === TIPO_MARCA.ENTRADA 
      ? TIPO_MARCA.SALIDA 
      : TIPO_MARCA.ENTRADA;
  }
  
  /**
   * Selecciona la mejor hoja basándose en tipo y palabras clave en el nombre
   * @param {Array} analyses - Array de análisis de hojas
   * @param {string} type - Tipo buscado
   * @param {string[]} keywords - Palabras clave prioritarias
   * @returns {Object|undefined}
   */
  selectBestSheet(analyses, type, keywords) {
    // Filtrar hojas del tipo buscado con confianza > 0.6
    const candidates = analyses.filter(s => s.type === type && s.confidence > 0.6);
    
    if (candidates.length === 0) return undefined;
    if (candidates.length === 1) return candidates[0];
    
    // Si hay múltiples candidatos, priorizar por nombre
    for (const keyword of keywords) {
      const match = candidates.find(c => 
        c.sheetName.toLowerCase().includes(keyword)
      );
      if (match) {
        console.log(`[PARSER] Hoja seleccionada por keyword "${keyword}": ${match.sheetName}`);
        return match;
      }
    }
    
    // Si no hay match por keyword, retornar el de mayor confianza
    return candidates.sort((a, b) => b.confidence - a.confidence)[0];
  }
  
  /**
   * Detecta si el formato es lineal o grid
   * @param {import('exceljs').Worksheet} sheet
   * @returns {string} 'lineal' o 'grid'
   */
  detectFormatoRegistros(sheet) {
    // Buscar en las primeras filas si hay columnas que sean números (días del mes)
    for (let rowNum = 1; rowNum <= Math.min(10, sheet.rowCount); rowNum++) {
      const row = sheet.getRow(rowNum);
      let dayColumns = 0;
      
      row.eachCell({ includeEmpty: false }, (cell) => {
        const value = cell.value;
        // Si encontramos números del 1-31 como cabecera, es formato grid
        if (typeof value === 'number' && value >= 1 && value <= 31) {
          dayColumns++;
        }
      });
      
      // Si hay al menos 10 columnas con números (días), es formato grid
      if (dayColumns >= 10) {
        return 'grid';
      }
    }
    
    return 'lineal';
  }
  
  /**
   * Parsea formato GRID (días como columnas, empleados como filas)
   * Formato típico del Nextep: cada celda tiene múltiples horas separadas por saltos de línea
   * @param {import('exceljs').Worksheet} sheet
   * @returns {Array}
   */
  parseRegistrosGrid(sheet) {
    const marcas = [];
    
    console.log(`[PARSER] Parseando formato GRID (calendario)`);
    
    // PASO 1: Encontrar fila de cabecera con días (1, 2, 3... 31)
    let headerRow = 0;
    const dayColumns = {}; // { columnIndex: dayNumber }
    
    for (let rowNum = 1; rowNum <= Math.min(10, sheet.rowCount); rowNum++) {
      const row = sheet.getRow(rowNum);
      const tempDays = {};
      
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const value = cell.value;
        if (typeof value === 'number' && value >= 1 && value <= 31) {
          tempDays[colNumber] = value;
        }
      });
      
      // Si encontramos al menos 10 días, esta es la cabecera
      if (Object.keys(tempDays).length >= 10) {
        headerRow = rowNum;
        Object.assign(dayColumns, tempDays);
        break;
      }
    }
    
    if (headerRow === 0) {
      console.warn('[PARSER] No se detectó cabecera con días del mes');
      return marcas;
    }
    
    console.log(`[PARSER] Cabecera encontrada en fila ${headerRow}`);
    console.log(`[PARSER] Días detectados: ${Object.keys(dayColumns).length} columnas`);
    
    // PASO 2: Detectar año y mes del período (de la misma hoja o asumir)
    const periodoMatch = sheet.name.match(/(\d{4}).*(\d{1,2})/);
    const year = periodoMatch ? parseInt(periodoMatch[1]) : new Date().getFullYear();
    const month = periodoMatch ? parseInt(periodoMatch[2]) - 1 : 7; // Agosto = 7 (0-based)
    
    console.log(`[PARSER] Período detectado: ${year}-${month + 1}`);
    
    // PASO 3: Iterar sobre empleados (filas después de la cabecera)
    // Formato especial: "No :" en una fila, marcas en la fila siguiente
    let currentEmpleado = null;
    let currentNombre = null;
    
    for (let rowNum = headerRow + 1; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      
      // Verificar si esta fila contiene "No :" o "No:" (inicio de empleado)
      let esFilaEmpleado = false;
      let numEmpleado = null;
      let nombreEmpleado = null;
      
      // Buscar "No :" o "No:" en las primeras columnas
      for (let col = 1; col <= Math.min(10, row.cellCount); col++) {
        const cell = row.getCell(col);
        const value = cell.value;
        
        if (!value) continue;
        
        const strValue = String(value).trim();
        
        // Detectar "No :", "No:", "Nº:", etc.
        if (/^n[oº°]\.?\s*:?$/i.test(strValue)) {
          esFilaEmpleado = true;
          
          // Buscar el número en las siguientes columnas
          for (let nextCol = col + 1; nextCol <= Math.min(col + 10, row.cellCount); nextCol++) {
            const nextCell = row.getCell(nextCol);
            const nextValue = nextCell.value;
            
            if (!nextValue) continue;
            
            const nextStr = String(nextValue).trim();
            
            // Saltar si contiene ":" (hora)
            if (nextStr.includes(':')) continue;
            
            // Detectar número de empleado
            if (/^\d{1,6}$/.test(nextStr)) {
              numEmpleado = this.extractEmployeeNumber(nextStr);
              if (numEmpleado) break;
            }
          }
        }
        
        // Detectar "Nombre :" y buscar el nombre
        if (/^nombre\s*:?$/i.test(strValue)) {
          for (let nextCol = col + 1; nextCol <= Math.min(col + 10, row.cellCount); nextCol++) {
            const nextCell = row.getCell(nextCol);
            const nextValue = nextCell.value;
            
            if (!nextValue) continue;
            
            const nextStr = String(nextValue).trim();
            
            // Saltar si contiene ":" (hora)
            if (nextStr.includes(':')) continue;
            
            // Detectar nombre (texto con espacios o palabras)
            if (/[a-záéíóúñ]/i.test(nextStr) && nextStr.length > 3) {
              nombreEmpleado = nextStr;
              break;
            }
          }
        }
      }
      
      // Si encontramos "No :", actualizar empleado actual
      if (esFilaEmpleado && numEmpleado) {
        currentEmpleado = numEmpleado;
        currentNombre = nombreEmpleado || 'Sin nombre';
        console.log(`[PARSER] Empleado detectado: #${currentEmpleado} - ${currentNombre}`);
        continue; // La fila siguiente tiene las marcas
      }
      
      // Si ya tenemos un empleado actual, buscar marcas en esta fila
      if (currentEmpleado) {
        let tieneMarcas = false;
        
        // PASO 4: Iterar sobre días (columnas)
        for (const [colNumber, day] of Object.entries(dayColumns)) {
          const cell = row.getCell(parseInt(colNumber));
          const cellValue = cell.value;
          
          if (!cellValue) continue;
          
          // Extraer horas de la celda (pueden ser múltiples líneas)
          const horas = this.extractHorasDeCell(cellValue);
          
          if (horas.length === 0) continue;
          
          tieneMarcas = true;
          
          // Crear una marca por cada hora
          horas.forEach((hora, index) => {
            const fecha = new Date(year, month, day);
            
            marcas.push({
              num_empleado: currentEmpleado,
              nombre: currentNombre,
              fecha: fecha,
              hora: hora,
              tipo: index % 2 === 0 ? 'Entrada' : 'Salida', // Alternar
              fila_original: rowNum,
              columna_original: colNumber
            });
          });
        }
        
        // Si esta fila tenía marcas, pero la siguiente puede ser nuevo empleado
        // No reseteamos currentEmpleado aquí, se resetea cuando encontramos "No :"
      }
    }
    
    console.log(`[PARSER] Grid parseado: ${marcas.length} marcas encontradas`);
    
    return marcas;
  }
  
  /**
   * Extrae múltiples horas de una celda (pueden estar separadas por saltos de línea)
   * @param {any} cellValue
   * @returns {string[]}
   */
  extractHorasDeCell(cellValue) {
    if (!cellValue) return [];
    
    const str = String(cellValue);
    const horas = [];
    
    // Dividir por saltos de línea
    const lines = str.split(/[\r\n]+/);
    
    lines.forEach(line => {
      // Buscar patrón de hora HH:MM
      const matches = line.match(/(\d{1,2}):(\d{2})/g);
      
      if (matches) {
        matches.forEach(match => {
          const [h, m] = match.split(':');
          const hora = `${h.padStart(2, '0')}:${m}`;
          horas.push(hora);
        });
      }
    });
    
    return horas;
  }
  
  /**
   * Verifica si una fila está vacía
   * @param {import('exceljs').Row} row
   * @returns {boolean}
   */
  isEmptyRow(row) {
    let hasContent = false;
    
    row.eachCell({ includeEmpty: false }, () => {
      hasContent = true;
    });
    
    return !hasContent;
  }
}

module.exports = { NextepParser };

