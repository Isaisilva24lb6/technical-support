// server/ai/ollamaClient.js
// Cliente opcional para Ollama (análisis con IA local)

const { OLLAMA_CONFIG } = require('../../shared/constants');

/**
 * Cliente para Ollama - IA local y gratuita
 * Solo se usa cuando el IntelligentParser tiene baja confianza
 */
class OllamaClient {
  constructor() {
    this.config = {
      enabled: process.env.OLLAMA_ENABLED === 'true',
      host: process.env.OLLAMA_HOST || OLLAMA_CONFIG.DEFAULT_HOST,
      model: process.env.OLLAMA_MODEL || OLLAMA_CONFIG.DEFAULT_MODEL,
      timeout: parseInt(process.env.OLLAMA_TIMEOUT || OLLAMA_CONFIG.DEFAULT_TIMEOUT)
    };
    
    if (this.config.enabled) {
      console.log('[OLLAMA] ✅ Habilitado');
      console.log(`[OLLAMA] Host: ${this.config.host}`);
      console.log(`[OLLAMA] Model: ${this.config.model}`);
    } else {
      console.log('[OLLAMA] ⚠️ Deshabilitado (OLLAMA_ENABLED=false)');
    }
  }
  
  /**
   * Verifica si Ollama está habilitado
   * @returns {boolean}
   */
  isEnabled() {
    return this.config.enabled;
  }
  
  /**
   * Verifica si Ollama está corriendo y disponible
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    if (!this.config.enabled) return false;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${this.config.host}/api/tags`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
      
    } catch (error) {
      console.error('[OLLAMA] No disponible:', error.message);
      return false;
    }
  }
  
  /**
   * Analiza una hoja ambigua con Ollama
   * @param {Object} sheetData - Datos de la hoja a analizar
   * @returns {Promise<Object|null>} Resultado del análisis o null si falla
   */
  async analyzeSheet(sheetData) {
    if (!this.config.enabled) {
      console.log('[OLLAMA] Deshabilitado, saltando análisis');
      return null;
    }
    
    try {
      const prompt = this.createPrompt(sheetData);
      
      console.log(`[OLLAMA] Analizando hoja: ${sheetData.name}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(`${this.config.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          prompt: prompt,
          format: 'json',
          stream: false,
          options: {
            temperature: 0.1, // Más determinístico
            num_predict: 500  // Límite de tokens
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Respuesta vacía de Ollama');
      }
      
      const result = JSON.parse(data.response);
      
      console.log(`[OLLAMA] ✅ Análisis completado: tipo=${result.tipoDocumento}, confianza=${result.confidence}`);
      
      return result;
      
    } catch (error) {
      console.error('[OLLAMA] ❌ Error:', error.message);
      return null; // Fallar silenciosamente
    }
  }
  
  /**
   * Crea el prompt para Ollama
   * @param {Object} sheetData
   * @returns {string}
   */
  createPrompt(sheetData) {
    const sampleData = this.prepareSampleData(sheetData);
    
    return `Eres un experto en analizar archivos Excel de relojes checadores.

Analiza esta hoja de un reloj checador Nextep NE-234 y detecta:
1. Tipo de hoja: "registros" (marcas de entrada/salida), "resumen" (totales), "turnos" (horarios), o "unknown"
2. Formato de fechas si las hay (dd/mm/yyyy, yyyy-mm-dd, etc.)
3. Formato de horas si las hay (HH:MM, H:MM AM/PM, etc.)
4. Nivel de confianza en tu detección (0.0 a 1.0)

DATOS DE LA HOJA:
Nombre: ${sheetData.name}
Cabeceras: ${sheetData.headers?.join(', ') || 'No detectadas'}

Muestra de datos (primeras 5 filas):
${sampleData}

Responde SOLO con JSON válido usando esta estructura exacta:
{
  "tipoDocumento": "registros | resumen | turnos | unknown",
  "formatoFecha": "dd/mm/yyyy o similar (solo si hay fechas)",
  "formatoHora": "HH:MM o similar (solo si hay horas)",
  "confidence": 0.85,
  "razon": "breve explicación de por qué detectaste ese tipo"
}`;
  }
  
  /**
   * Prepara una muestra de datos legible para el prompt
   * @param {Object} sheetData
   * @returns {string}
   */
  prepareSampleData(sheetData) {
    if (!sheetData.sample || sheetData.sample.length === 0) {
      return 'No hay datos de muestra';
    }
    
    const lines = [];
    
    sheetData.sample.slice(0, 5).forEach((row, i) => {
      const rowStr = row.map(cell => {
        if (cell === null || cell === undefined || cell === '') {
          return '[vacío]';
        }
        const str = String(cell);
        return str.length > 30 ? str.substring(0, 30) + '...' : str;
      }).join(' | ');
      
      lines.push(`Fila ${i + 1}: ${rowStr}`);
    });
    
    return lines.join('\n');
  }
  
  /**
   * Valida la respuesta de Ollama
   * @param {Object} result
   * @returns {boolean}
   */
  validateResult(result) {
    if (!result || typeof result !== 'object') return false;
    
    const validTypes = ['registros', 'resumen', 'turnos', 'unknown'];
    
    return (
      validTypes.includes(result.tipoDocumento) &&
      typeof result.confidence === 'number' &&
      result.confidence >= 0 &&
      result.confidence <= 1
    );
  }
}

module.exports = { OllamaClient };



