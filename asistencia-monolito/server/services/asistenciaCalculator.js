// server/services/asistenciaCalculator.js
// Servicio para calcular asistencia diaria de empleados

const db = require('../../config/db');

/**
 * Calcula la asistencia día por día para todos los empleados de un período
 * @param {number} periodoId - ID del período
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @param {Array} empleados - Lista de empleados validados
 * @returns {Promise<Object>} Resultado del cálculo
 */
async function calcularAsistenciaDiaria(periodoId, fechaInicio, fechaFin, empleados) {
  console.log(`[CALCULADOR] Iniciando cálculo para período ${periodoId}...`);
  console.log(`[CALCULADOR] Rango: ${fechaInicio} a ${fechaFin}`);
  console.log(`[CALCULADOR] Empleados: ${empleados.length}`);

  const inicioTiempo = Date.now();
  let diasProcesados = 0;
  let registrosCreados = 0;

  try {
    // 1. Generar lista de días del período
    const dias = generarDiasPeriodo(fechaInicio, fechaFin);
    console.log(`[CALCULADOR] Total de días a procesar: ${dias.length}`);

    // 2. Obtener IDs de empleados desde la BD
    const empleadoMap = await obtenerEmpleadosMap(empleados);

    // 3. Para cada empleado, calcular su asistencia día por día
    for (const emp of empleados) {
      const empleadoId = empleadoMap.get(emp.num);
      if (!empleadoId) {
        console.warn(`[CALCULADOR] Empleado #${emp.num} no encontrado en BD, omitiendo...`);
        continue;
      }

      // 4. Para cada día del período
      for (const fecha of dias) {
        const esLaborable = esDiaLaborable(fecha);
        const diaSemana = getNombreDia(fecha);

        // 5. Obtener marcas del empleado en esta fecha
        const marcas = await getMarcasDelDia(periodoId, empleadoId, fecha);
        const { entrada, salida } = identificarEntradaSalida(marcas);

        // 6. Calcular métricas
        const minutosTrabajados = calcularMinutosTrabajados(entrada, salida);
        const retardo = calcularRetardo(entrada);
        const salidaTemprana = calcularSalidaTemprana(salida);
        const estado = determinarEstado(esLaborable, !!entrada, !!salida);

        // 7. Guardar registro en asistencia_diaria
        await guardarRegistroDiario({
          periodoId,
          empleadoId,
          fecha,
          diaSemana,
          esLaborable,
          entrada,
          salida,
          minutosTrabajados,
          retardo,
          salidaTemprana,
          estado
        });

        registrosCreados++;
        diasProcesados++;
      }

      console.log(`[CALCULADOR] ✓ Empleado #${emp.num} procesado (${dias.length} días)`);
    }

    const tiempoTotal = ((Date.now() - inicioTiempo) / 1000).toFixed(2);
    console.log(`[CALCULADOR] ✅ Cálculo completado en ${tiempoTotal}s`);
    console.log(`[CALCULADOR] Registros creados: ${registrosCreados}`);

    return {
      success: true,
      diasProcesados,
      registrosCreados,
      tiempoSegundos: parseFloat(tiempoTotal)
    };

  } catch (error) {
    console.error('[CALCULADOR ERROR]', error);
    throw error;
  }
}

/**
 * Genera array de fechas entre fechaInicio y fechaFin
 * @param {string} fechaInicio - YYYY-MM-DD o ISO string
 * @param {string} fechaFin - YYYY-MM-DD o ISO string
 * @returns {Array<string>} Array de fechas
 */
function generarDiasPeriodo(fechaInicio, fechaFin) {
  const dias = [];
  
  // Normalizar fechas (remover parte de tiempo si existe)
  const inicio = fechaInicio.split('T')[0];
  const fin = fechaFin.split('T')[0];
  
  let fecha = new Date(inicio + 'T00:00:00');
  const fechaFin_obj = new Date(fin + 'T00:00:00');

  while (fecha <= fechaFin_obj) {
    dias.push(fecha.toISOString().split('T')[0]);
    fecha.setDate(fecha.getDate() + 1);
  }

  console.log(`[CALCULADOR DEBUG] Generando días: ${inicio} a ${fin} = ${dias.length} días`);
  return dias;
}

/**
 * Determina si una fecha es día laborable (Lunes a Viernes)
 * @param {string} fecha - YYYY-MM-DD
 * @returns {boolean}
 */
function esDiaLaborable(fecha) {
  const dia = new Date(fecha + 'T00:00:00').getDay(); // 0=Dom, 6=Sáb
  return dia !== 0 && dia !== 6;
}

/**
 * Obtiene el nombre del día en español
 * @param {string} fecha - YYYY-MM-DD
 * @returns {string}
 */
function getNombreDia(fecha) {
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return dias[new Date(fecha + 'T00:00:00').getDay()];
}

/**
 * Obtiene el mapa de empleados (num -> id)
 * @param {Array} empleados
 * @returns {Promise<Map>}
 */
async function obtenerEmpleadosMap(empleados) {
  const nums = empleados.map(e => e.num);
  const placeholders = nums.map(() => '?').join(',');

  const empleadosDB = await new Promise((resolve, reject) => {
    db.all(
      `SELECT id, num FROM empleados WHERE num IN (${placeholders})`,
      nums,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  const mapa = new Map();
  empleadosDB.forEach(emp => mapa.set(emp.num, emp.id));
  return mapa;
}

/**
 * Obtiene las marcas de un empleado en una fecha específica
 * @param {number} periodoId
 * @param {number} empleadoId
 * @param {string} fecha
 * @returns {Promise<Array>}
 */
async function getMarcasDelDia(periodoId, empleadoId, fecha) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT fecha, hora, tipo 
       FROM marcas_crudas 
       WHERE periodo_id = ? AND empleado_id = ? AND fecha = ?
       ORDER BY hora ASC`,
      [periodoId, empleadoId, fecha],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
}

/**
 * Identifica la primera entrada y última salida del día
 * @param {Array} marcas
 * @returns {Object} { entrada, salida }
 */
function identificarEntradaSalida(marcas) {
  if (!marcas || marcas.length === 0) {
    return { entrada: null, salida: null };
  }

  // Primera marca = Entrada
  const entrada = marcas[0];

  // Última marca = Salida (si hay más de una marca)
  const salida = marcas.length > 1 ? marcas[marcas.length - 1] : null;

  return {
    entrada: entrada ? entrada.hora : null,
    salida: salida ? salida.hora : null
  };
}

/**
 * Calcula los minutos trabajados entre entrada y salida
 * @param {string} entrada - HH:MM
 * @param {string} salida - HH:MM
 * @returns {number} Minutos trabajados
 */
function calcularMinutosTrabajados(entrada, salida) {
  if (!entrada || !salida) return 0;

  const [hE, mE] = entrada.split(':').map(Number);
  const [hS, mS] = salida.split(':').map(Number);

  const minutosEntrada = hE * 60 + mE;
  const minutosSalida = hS * 60 + mS;

  return minutosSalida - minutosEntrada;
}

/**
 * Calcula retardo (si entró después de las 07:00)
 * @param {string} entrada - HH:MM
 * @param {string} horaEsperada - HH:MM (default: 07:00)
 * @returns {Object} { tiene, minutos, cuenta }
 */
function calcularRetardo(entrada, horaEsperada = '07:00') {
  if (!entrada) return { tiene: false, minutos: 0, cuenta: 0 };

  const [hE, mE] = entrada.split(':').map(Number);
  const [hEsp, mEsp] = horaEsperada.split(':').map(Number);

  const minutosEntrada = hE * 60 + mE;
  const minutosEsperados = hEsp * 60 + mEsp;

  if (minutosEntrada > minutosEsperados) {
    return {
      tiene: true,
      minutos: minutosEntrada - minutosEsperados,
      cuenta: 1
    };
  }

  return { tiene: false, minutos: 0, cuenta: 0 };
}

/**
 * Calcula salida temprana (si salió antes de las 18:00)
 * @param {string} salida - HH:MM
 * @param {string} horaEsperada - HH:MM (default: 18:00)
 * @returns {Object} { tiene, minutos, cuenta }
 */
function calcularSalidaTemprana(salida, horaEsperada = '18:00') {
  if (!salida) return { tiene: false, minutos: 0, cuenta: 0 };

  const [hS, mS] = salida.split(':').map(Number);
  const [hEsp, mEsp] = horaEsperada.split(':').map(Number);

  const minutosSalida = hS * 60 + mS;
  const minutosEsperados = hEsp * 60 + mEsp;

  if (minutosSalida < minutosEsperados) {
    return {
      tiene: true,
      minutos: minutosEsperados - minutosSalida,
      cuenta: 1
    };
  }

  return { tiene: false, minutos: 0, cuenta: 0 };
}

/**
 * Determina el estado del día
 * @param {boolean} esLaborable
 * @param {boolean} tieneEntrada
 * @param {boolean} tieneSalida
 * @returns {string}
 */
function determinarEstado(esLaborable, tieneEntrada, tieneSalida) {
  if (!esLaborable) {
    return 'No Laborable';
  }

  if (!tieneEntrada && !tieneSalida) {
    return 'Falta';
  }

  if (tieneEntrada && !tieneSalida) {
    return 'Incompleto';
  }

  if (tieneEntrada && tieneSalida) {
    return 'Completo';
  }

  return 'Desconocido';
}

/**
 * Guarda un registro diario en la base de datos
 * @param {Object} registro
 * @returns {Promise<void>}
 */
async function guardarRegistroDiario(registro) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO asistencia_diaria (
        periodo_id, empleado_id, fecha, dia_semana, es_laborable,
        entrada_real, salida_real, tiene_entrada, tiene_salida,
        minutos_trabajados,
        minutos_retardo, cuenta_retardo,
        minutos_salida_temprana, cuenta_salida_temprana,
        es_falta, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(periodo_id, empleado_id, fecha) DO UPDATE SET
        entrada_real = excluded.entrada_real,
        salida_real = excluded.salida_real,
        tiene_entrada = excluded.tiene_entrada,
        tiene_salida = excluded.tiene_salida,
        minutos_trabajados = excluded.minutos_trabajados,
        minutos_retardo = excluded.minutos_retardo,
        cuenta_retardo = excluded.cuenta_retardo,
        minutos_salida_temprana = excluded.minutos_salida_temprana,
        cuenta_salida_temprana = excluded.cuenta_salida_temprana,
        es_falta = excluded.es_falta,
        estado = excluded.estado
      `,
      [
        registro.periodoId,
        registro.empleadoId,
        registro.fecha,
        registro.diaSemana,
        registro.esLaborable ? 1 : 0,
        registro.entrada,
        registro.salida,
        registro.entrada ? 1 : 0,
        registro.salida ? 1 : 0,
        registro.minutosTrabajados,
        registro.retardo.minutos,
        registro.retardo.cuenta,
        registro.salidaTemprana.minutos,
        registro.salidaTemprana.cuenta,
        registro.estado === 'Falta' ? 1 : 0,
        registro.estado
      ],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

/**
 * Valida los cálculos contra los totales del Excel
 * @param {number} periodoId
 * @param {number} empleadoId
 * @returns {Promise<Object>} Diferencias encontradas
 */
async function validarCalculos(periodoId, empleadoId) {
  // Obtener nuestros cálculos
  const nuestrosCalculos = await new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        SUM(minutos_trabajados) as total_trabajado,
        SUM(minutos_retardo) as total_retardo,
        SUM(cuenta_retardo) as cuenta_retardo,
        SUM(minutos_salida_temprana) as total_salida_temprana,
        SUM(cuenta_salida_temprana) as cuenta_salida_temprana,
        SUM(es_falta) as total_faltas
      FROM asistencia_diaria
      WHERE periodo_id = ? AND empleado_id = ? AND es_laborable = 1`,
      [periodoId, empleadoId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  // Obtener totales del Excel
  const totalesExcel = await new Promise((resolve, reject) => {
    db.get(
      `SELECT 
        tiempo_real_min,
        retardos_min,
        retardos_cuenta,
        salidas_tempranas_min,
        salidas_tempranas_cuenta,
        faltas
      FROM totales_excel
      WHERE periodo_id = ? AND empleado_id = ?`,
      [periodoId, empleadoId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!totalesExcel) {
    return { error: 'No hay totales del Excel para comparar' };
  }

  // Calcular diferencias
  const diferencias = {
    trabajado: (nuestrosCalculos.total_trabajado || 0) - (totalesExcel.tiempo_real_min || 0),
    retardo_min: (nuestrosCalculos.total_retardo || 0) - (totalesExcel.retardos_min || 0),
    retardo_cuenta: (nuestrosCalculos.cuenta_retardo || 0) - (totalesExcel.retardos_cuenta || 0),
    faltas: (nuestrosCalculos.total_faltas || 0) - (totalesExcel.faltas || 0)
  };

  return {
    nuestros: nuestrosCalculos,
    excel: totalesExcel,
    diferencias
  };
}

module.exports = {
  calcularAsistenciaDiaria,
  validarCalculos,
  // Exportar funciones auxiliares para testing
  generarDiasPeriodo,
  esDiaLaborable,
  getNombreDia,
  calcularMinutosTrabajados,
  calcularRetardo,
  calcularSalidaTemprana,
  determinarEstado
};

