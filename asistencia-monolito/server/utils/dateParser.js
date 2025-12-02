// server/utils/dateParser.js
// Utilidades robustas para parsear fechas y horas de Excel

const { parse, isValid, format } = require('date-fns');
const { es } = require('date-fns/locale');

// ============================================
// PARSEO DE FECHAS
// ============================================

/**
 * Parsea una fecha desde múltiples formatos comunes
 * @param {any} value - Valor a parsear (Date, número Excel, string)
 * @returns {Date}
 */
function parseDate(value) {
  // Caso 1: Ya es un Date
  if (value instanceof Date) {
    return value;
  }

  // Caso 2: Excel serial number (ej: 44774 = 2022-07-20)
  if (typeof value === 'number') {
    return excelSerialToDate(value);
  }

  // Caso 3: String
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Intentar con diferentes formatos
    const formats = [
      'dd/MM/yyyy',    // 20/07/2025
      'dd-MM-yyyy',    // 20-07-2025
      'yyyy-MM-dd',    // 2025-07-20
      'yyyy/MM/dd',    // 2025/07/20
      'dd/MM/yy',      // 20/07/25
      'MM/dd/yyyy',    // 07/20/2025 (formato USA)
      'd/M/yyyy',      // 1/8/2025
    ];

    for (const formatStr of formats) {
      try {
        const parsed = parse(trimmed, formatStr, new Date(), { locale: es });
        if (isValid(parsed)) {
          return parsed;
        }
      } catch {
        continue;
      }
    }

    // Último intento: Date.parse nativo
    const nativeParsed = new Date(trimmed);
    if (isValid(nativeParsed)) {
      return nativeParsed;
    }
  }

  throw new Error(`No se pudo parsear la fecha: ${JSON.stringify(value)}`);
}

/**
 * Convierte un serial number de Excel a Date
 * Excel cuenta días desde 1900-01-01 (con bug de año bisiesto 1900)
 * @param {number} serial
 * @returns {Date}
 */
function excelSerialToDate(serial) {
  const msPerDay = 86400000; // 24 * 60 * 60 * 1000
  const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
  
  return new Date(excelEpoch.getTime() + serial * msPerDay);
}

/**
 * Formatea una fecha a string legible
 * @param {Date} date
 * @param {string} formatStr - Formato (default: 'dd/MM/yyyy')
 * @returns {string}
 */
function formatDate(date, formatStr = 'dd/MM/yyyy') {
  return format(date, formatStr, { locale: es });
}

/**
 * Valida si una fecha está en un rango razonable para asistencia
 * @param {Date} date
 * @returns {boolean}
 */
function isValidAttendanceDate(date) {
  const now = new Date();
  const minDate = new Date(2020, 0, 1); // 1 enero 2020
  const maxDate = new Date(now.getFullYear() + 1, 11, 31); // Fin del próximo año

  return date >= minDate && date <= maxDate;
}

// ============================================
// PARSEO DE HORAS
// ============================================

/**
 * Parsea una hora desde múltiples formatos
 * Retorna string en formato "HH:MM"
 * @param {any} value
 * @returns {string}
 */
function parseTime(value) {
  // Caso 1: Excel decimal (0.5 = 12:00)
  if (typeof value === 'number') {
    return excelSerialToTime(value);
  }

  // Caso 2: String
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    // Formato "HH:MM" o "HH:MM:SS"
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (match24) {
      const hours = parseInt(match24[1]);
      const minutes = parseInt(match24[2]);
      
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return formatTime(hours, minutes);
      }
    }

    // Formato "HH:MM AM/PM"
    const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      let hours = parseInt(match12[1]);
      const minutes = parseInt(match12[2]);
      const period = match12[3].toUpperCase();

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return formatTime(hours, minutes);
      }
    }

    // Formato "HHMM" (sin dos puntos)
    const match4digits = trimmed.match(/^(\d{2})(\d{2})$/);
    if (match4digits) {
      const hours = parseInt(match4digits[1]);
      const minutes = parseInt(match4digits[2]);
      
      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        return formatTime(hours, minutes);
      }
    }
  }

  throw new Error(`No se pudo parsear la hora: ${JSON.stringify(value)}`);
}

/**
 * Convierte decimal de Excel a hora
 * 0.5 = 12:00, 0.75 = 18:00
 * @param {number} decimal
 * @returns {string}
 */
function excelSerialToTime(decimal) {
  const totalMinutes = Math.round(decimal * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  
  return formatTime(hours, minutes);
}

/**
 * Formatea horas y minutos a "HH:MM"
 * @param {number} hours
 * @param {number} minutes
 * @returns {string}
 */
function formatTime(hours, minutes) {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convierte una duración en formato "HHH:MM" a minutos
 * Ej: "160:30" -> 9630 minutos
 * @param {string} duration
 * @returns {number}
 */
function durationToMinutes(duration) {
  const match = duration.match(/^(\d+):(\d{2})$/);
  if (!match) {
    throw new Error(`Formato de duración inválido: ${duration}`);
  }

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);

  return hours * 60 + minutes;
}

/**
 * Convierte minutos a formato "HHH:MM"
 * Ej: 9630 -> "160:30"
 * @param {number} minutes
 * @returns {string}
 */
function minutesToDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Valida si una hora está en un rango razonable
 * @param {string} timeStr
 * @returns {boolean}
 */
function isValidWorkTime(timeStr) {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;

  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);

  return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
}

/**
 * Calcula la diferencia en minutos entre dos horas
 * @param {string} start - Hora de inicio "HH:MM"
 * @param {string} end - Hora de fin "HH:MM"
 * @returns {number}
 */
function timeDifferenceMinutes(start, end) {
  const startMatch = start.match(/^(\d{2}):(\d{2})$/);
  const endMatch = end.match(/^(\d{2}):(\d{2})$/);

  if (!startMatch || !endMatch) {
    throw new Error('Formato de hora inválido');
  }

  const startMinutes = parseInt(startMatch[1]) * 60 + parseInt(startMatch[2]);
  const endMinutes = parseInt(endMatch[1]) * 60 + parseInt(endMatch[2]);

  // Manejar caso de cambio de día (ej: 23:00 -> 02:00)
  if (endMinutes < startMinutes) {
    return (24 * 60 - startMinutes) + endMinutes;
  }

  return endMinutes - startMinutes;
}

module.exports = {
  // Fechas
  parseDate,
  excelSerialToDate,
  formatDate,
  isValidAttendanceDate,
  
  // Horas
  parseTime,
  excelSerialToTime,
  formatTime,
  isValidWorkTime,
  timeDifferenceMinutes,
  
  // Duraciones
  durationToMinutes,
  minutesToDuration
};



