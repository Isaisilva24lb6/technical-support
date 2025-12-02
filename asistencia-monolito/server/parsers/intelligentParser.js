// server/parsers/intelligentParser.js
// Parser inteligente con heurística para detectar estructura de hojas Excel

const { SHEET_KEYWORDS, COLUMN_PATTERNS } = require('../../shared/constants');

/**
 * Parser inteligente sin IA que detecta la estructura de hojas Excel
 */
class IntelligentParser {
  
  /**
   * Analiza una hoja de Excel y detecta su tipo y estructura
   * @param {import('exceljs').Worksheet} sheet
   * @returns {Object} Análisis de la hoja
   */
  analyzeSheet(sheet) {
    const warnings = [];
    
    // PASO 1: Encontrar la fila de cabecera
    const headerRow = this.findHeaderRow(sheet);
    if (headerRow === -1) {
      warnings.push('No se detectó fila de cabecera, usando fila 1');
    }
    
    // PASO 2: Extraer cabeceras
    const headers = this.extractHeaders(sheet, headerRow > 0 ? headerRow : 1);
    
    // PASO 3: Detectar tipo de hoja por palabras clave
    const detection = this.detectSheetType(sheet.name, headers);
    
    // PASO 4: Mapear columnas a campos conocidos
    const structure = this.mapColumns(headers, detection.type);
    
    // PASO 5: Analizar patrones en los datos
    const dataPattern = this.analyzeDataPattern(sheet, headerRow > 0 ? headerRow : 1);
    
    // PASO 6: Refinar detección con patrones de datos
    const refined = this.refineTypeWithDataPattern(detection.type, dataPattern, detection.confidence);
    
    return {
      sheetName: sheet.name,
      type: refined.type,
      confidence: refined.confidence,
      structure: structure,
      warnings: warnings,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      headerRow: headerRow > 0 ? headerRow : 1,
      dataPattern: dataPattern
    };
  }

  /**
   * Encuentra la fila de cabecera (usualmente entre las filas 1-10)
   * @param {import('exceljs').Worksheet} sheet
   * @returns {number} Número de fila (1-based) o -1 si no se encuentra
   */
  findHeaderRow(sheet) {
    for (let i = 1; i <= Math.min(10, sheet.rowCount); i++) {
      const row = sheet.getRow(i);
      const cells = [];
      
      row.eachCell({ includeEmpty: false }, (cell) => {
        cells.push(cell.value);
      });
      
      // Una cabecera debe tener:
      // 1. Al menos 3 celdas con contenido
      // 2. Contener palabras clave relevantes
      // 3. No contener solo números
      
      if (cells.length < 3) continue;
      
      const hasKeywords = cells.some(cell => this.containsKeyword(cell));
      const isNumericOnly = cells.every(cell => 
        typeof cell === 'number' || /^\d+$/.test(String(cell))
      );
      
      if (hasKeywords && !isNumericOnly) {
        return i;
      }
    }
    
    return -1;
  }

  /**
   * Extrae los valores de cabecera de una fila
   * @param {import('exceljs').Worksheet} sheet
   * @param {number} rowNumber
   * @returns {string[]}
   */
  extractHeaders(sheet, rowNumber) {
    const row = sheet.getRow(rowNumber);
    const headers = [];
    
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const value = String(cell.value || '').toLowerCase().trim();
      headers[colNumber - 1] = value;
    });
    
    return headers;
  }

  /**
   * Detecta el tipo de hoja basándose en nombre y cabeceras
   * @param {string} sheetName
   * @param {string[]} headers
   * @returns {{ type: string, confidence: number }}
   */
  detectSheetType(sheetName, headers) {
    const scores = {
      registros: 0,
      resumen: 0,
      turnos: 0,
      empleados: 0,
      unknown: 0
    };

    // Calcular score por nombre de hoja
    const sheetNameLower = sheetName.toLowerCase();
    for (const [type, keywords] of Object.entries(SHEET_KEYWORDS)) {
      const nameScore = keywords.filter(kw => sheetNameLower.includes(kw)).length;
      scores[type] += nameScore * 2; // Peso doble para nombre de hoja
    }

    // Calcular score por cabeceras
    for (const [type, keywords] of Object.entries(SHEET_KEYWORDS)) {
      const headerScore = this.calculateMatchScore(headers, keywords);
      scores[type] += headerScore;
    }

    // Encontrar tipo con mayor score
    let maxScore = 0;
    let detectedType = 'unknown';
    
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // Calcular confianza
    const keywords = SHEET_KEYWORDS[detectedType] || SHEET_KEYWORDS.registros;
    const confidence = Math.min(1.0, maxScore / keywords.length);

    return { type: detectedType, confidence: confidence };
  }

  /**
   * Calcula un score de matching entre headers y keywords
   * @param {string[]} headers
   * @param {string[]} keywords
   * @returns {number}
   */
  calculateMatchScore(headers, keywords) {
    let score = 0;
    
    for (const header of headers) {
      if (!header) continue;
      
      for (const keyword of keywords) {
        if (header.includes(keyword)) {
          score++;
          break; // Una vez por header
        }
      }
    }
    
    return score;
  }

  /**
   * Mapea columnas a campos conocidos usando regex
   * @param {string[]} headers
   * @param {string} sheetType
   * @returns {Object}
   */
  mapColumns(headers, sheetType) {
    const mapping = {};
    
    headers.forEach((header, index) => {
      if (!header) return;
      
      for (const [field, regex] of Object.entries(COLUMN_PATTERNS)) {
        if (regex.test(header)) {
          // Evitar duplicados: solo mapear si el campo no existe
          if (!mapping[field]) {
            mapping[field] = index;
          }
          break; // Una sola coincidencia por header
        }
      }
    });
    
    return mapping;
  }

  /**
   * Analiza patrones en los datos (primeras 20 filas)
   * @param {import('exceljs').Worksheet} sheet
   * @param {number} startRow
   * @returns {Object}
   */
  analyzeDataPattern(sheet, startRow) {
    const sampleSize = Math.min(20, sheet.rowCount - startRow);
    const sample = [];
    
    for (let i = startRow + 1; i <= startRow + sampleSize; i++) {
      const row = sheet.getRow(i);
      sample.push(this.getRowValues(row));
    }
    
    return {
      hasRepeatedNumbers: this.detectRepeatedPattern(sample, 0),
      hasDateColumn: this.detectDateColumn(sample),
      hasTimeColumn: this.detectTimeColumn(sample),
      hasNumericSummary: this.detectNumericSummary(sample),
      averageColumnsPerRow: this.calculateAverageColumns(sample)
    };
  }

  /**
   * Detecta si hay un patrón de números repetidos en una columna
   * @param {any[][]} sample
   * @param {number} colIndex
   * @returns {boolean}
   */
  detectRepeatedPattern(sample, colIndex) {
    const values = sample.map(row => row[colIndex]).filter(v => v !== undefined && v !== null);
    if (values.length < 2) return false;
    
    const uniqueValues = new Set(values);
    return uniqueValues.size < values.length;
  }

  /**
   * Detecta si hay una columna con fechas
   * @param {any[][]} sample
   * @returns {boolean}
   */
  detectDateColumn(sample) {
    const datePatterns = [
      /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
      /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
    ];
    
    for (let col = 0; col < (sample[0]?.length || 0); col++) {
      const values = sample.map(row => row[col]).filter(v => v);
      if (values.length === 0) continue;
      
      const matchCount = values.filter(v => {
        if (v instanceof Date) return true;
        if (typeof v === 'number' && v > 40000 && v < 50000) return true; // Excel serial
        return datePatterns.some(p => p.test(String(v)));
      }).length;
      
      if (matchCount / values.length > 0.6) return true;
    }
    
    return false;
  }

  /**
   * Detecta si hay una columna con horas
   * @param {any[][]} sample
   * @returns {boolean}
   */
  detectTimeColumn(sample) {
    const timePattern = /^\d{1,2}:\d{2}(:\d{2})?(\s*[AP]M)?$/i;
    
    for (let col = 0; col < (sample[0]?.length || 0); col++) {
      const values = sample.map(row => row[col]).filter(v => v);
      if (values.length === 0) continue;
      
      const matchCount = values.filter(v => {
        if (typeof v === 'number' && v >= 0 && v < 1) return true; // Excel time serial
        return timePattern.test(String(v));
      }).length;
      
      if (matchCount / values.length > 0.6) return true;
    }
    
    return false;
  }

  /**
   * Detecta si la mayoría de columnas son numéricas (típico de resúmenes)
   * @param {any[][]} sample
   * @returns {boolean}
   */
  detectNumericSummary(sample) {
    if (sample.length === 0 || !sample[0]) return false;
    
    const columnCount = sample[0].length;
    let numericColumns = 0;
    
    for (let col = 0; col < columnCount; col++) {
      const values = sample.map(row => row[col]).filter(v => v !== undefined && v !== null);
      if (values.length === 0) continue;
      
      const numericCount = values.filter(v => 
        typeof v === 'number' || !isNaN(Number(v))
      ).length;
      
      if (numericCount / values.length > 0.8) {
        numericColumns++;
      }
    }
    
    return numericColumns / columnCount > 0.5;
  }

  /**
   * Calcula el promedio de columnas con datos por fila
   * @param {any[][]} sample
   * @returns {number}
   */
  calculateAverageColumns(sample) {
    if (sample.length === 0) return 0;
    
    const totalColumns = sample.reduce((sum, row) => {
      const nonEmptyCells = row.filter(cell => 
        cell !== undefined && cell !== null && cell !== ''
      ).length;
      return sum + nonEmptyCells;
    }, 0);
    
    return totalColumns / sample.length;
  }

  /**
   * Refina el tipo detectado usando patrones de datos
   * @param {string} type
   * @param {Object} pattern
   * @param {number} confidence
   * @returns {{ type: string, confidence: number }}
   */
  refineTypeWithDataPattern(type, pattern, confidence) {
    let refinedConfidence = confidence;
    
    // HOJA DE REGISTROS: debe tener fechas, horas y números repetidos
    if (type === 'registros') {
      if (pattern.hasDateColumn && pattern.hasTimeColumn && pattern.hasRepeatedNumbers) {
        refinedConfidence = Math.min(1.0, confidence + 0.2);
      } else if (!pattern.hasDateColumn || !pattern.hasTimeColumn) {
        refinedConfidence = Math.max(0.0, confidence - 0.3);
      }
    }
    
    // HOJA DE RESUMEN: debe tener muchos números y pocos registros repetidos
    if (type === 'resumen') {
      if (pattern.hasNumericSummary && !pattern.hasRepeatedNumbers) {
        refinedConfidence = Math.min(1.0, confidence + 0.2);
      } else if (!pattern.hasNumericSummary) {
        refinedConfidence = Math.max(0.0, confidence - 0.2);
      }
    }
    
    // Si la confianza es muy baja, marcar como unknown
    if (refinedConfidence < 0.3) {
      return { type: 'unknown', confidence: refinedConfidence };
    }
    
    return { type: type, confidence: refinedConfidence };
  }

  /**
   * Extrae valores de una fila (helper)
   * @param {import('exceljs').Row} row
   * @returns {any[]}
   */
  getRowValues(row) {
    const values = [];
    row.eachCell({ includeEmpty: false }, (cell) => {
      values.push(cell.value);
    });
    return values;
  }

  /**
   * Verifica si un texto contiene palabras clave relevantes
   * @param {any} text
   * @returns {boolean}
   */
  containsKeyword(text) {
    const str = String(text || '').toLowerCase();
    if (str.length < 3) return false;
    
    const allKeywords = Object.values(SHEET_KEYWORDS).flat();
    return allKeywords.some(kw => str.includes(kw));
  }
}

module.exports = { IntelligentParser };



