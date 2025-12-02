// shared/constants.js
// Constantes compartidas entre frontend y backend

// ============================================
// PALABRAS CLAVE PARA DETECCIÓN DE HOJAS
// ============================================

const SHEET_KEYWORDS = {
  registros: [
    'registro', 'registros', 'lista', 'checks',
    'marca', 'marcas',
    // NO incluir palabras genéricas como 'fecha', 'hora' que están en todas las hojas
  ],
  resumen: [
    'resumen', 'summary', 'totales',
    'total', 'requerido', 'real',
    'retardo', 'tarde', 'delay', 'late',
    'extra', 'overtime', 'adicional',
    'falta', 'ausencia', 'absence',
    'bono', 'deducción', 'deduccion'
  ],
  turnos: [
    'horario', 'schedule', 'shift',
    'turno', 'grupo', 'group',
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ],
  empleados: [
    'empleado', 'employee', 'personal', 'staff',
    'nombre', 'name',
    'correo', 'email', 'mail',
    'departamento', 'department', 'area'
  ]
};

// ============================================
// PATRONES REGEX PARA COLUMNAS
// ============================================

const COLUMN_PATTERNS = {
  num: /n[uúo]m[eéa]?r?o?|#|id|clave|emp|employee|no\.?/i,
  nombre: /nombre|name|empleado|employee|personal/i,
  fecha: /fecha|date|d[ií]a/i,
  hora: /hora|time|hour/i,
  tipo: /tipo|type|entrada|salida|marca|check/i,
  tiempoRequerido: /tiempo\s*(req|requerido|esperado)|required\s*time/i,
  tiempoReal: /tiempo\s*(real|trabajado)|actual\s*time|worked/i,
  retardo: /retard|tarde|delay|late/i,
  extra: /extra|overtime|adicional/i,
  falta: /falta|ausencia|absence/i,
  correo: /correo|e-?mail|mail/i,
  departamento: /depart|area|department/i,
  grupo: /grupo|group|turno|shift/i,
  horario: /horario|schedule|hora.*entrada|hora.*salida/i
};

// ============================================
// TIPOS DE MARCA
// ============================================

const TIPO_MARCA = {
  ENTRADA: 'Entrada',
  SALIDA: 'Salida',
  DESCONOCIDO: 'Desconocido'
};

// ============================================
// ESTADOS DE PROCESO
// ============================================

const ESTADO_PROCESO = {
  PROCESANDO: 'procesando',
  COMPLETADO: 'completado',
  ERROR: 'error',
  VALIDACION: 'validacion'
};

// ============================================
// CONFIGURACIÓN DE OLLAMA
// ============================================

const OLLAMA_CONFIG = {
  DEFAULT_HOST: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3.2:3b',
  DEFAULT_TIMEOUT: 30000,
  ENABLED_ENV_VAR: 'OLLAMA_ENABLED'
};

module.exports = {
  SHEET_KEYWORDS,
  COLUMN_PATTERNS,
  TIPO_MARCA,
  ESTADO_PROCESO,
  OLLAMA_CONFIG
};

