// client/src/services/api.ts
// Servicio centralizado para peticiones al backend

import axios from 'axios';

// Configurar la URL base del API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- TIPOS ---

export interface EmployeeData {
  id: number;
  num: string;
  nombre: string;
  correo: string | null;
  departamento: string;
  grupo: string | null;
  activo: boolean;
  warnings?: string[];
}

export interface ImportResponse {
  message: string;
  filename: string;
  tempFilePath: string;
  employees: EmployeeData[];
  warnings: string[];
  stats: {
    total: number;
    conCorreo: number;
    sinCorreo: number;
    conAdvertencias: number;
  };
}

export interface ConfirmResponse {
  message: string;
  results: {
    insertados: number;
    actualizados: number;
    duplicados: number;
    errores: Array<{ empleado: string; error: string }>;
    warnings: string[];
  };
}

// --- API DE EMPLEADOS ---

export const empleadosApi = {
  /**
   * Sube un archivo Excel de empleados para parsearlo
   * @param file - Archivo Excel
   * @returns Datos parseados para validación manual
   */
  import: async (file: File): Promise<ImportResponse> => {
    const formData = new FormData();
    formData.append('excelFile', file);

    const response = await api.post<ImportResponse>('/empleados/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Confirma y guarda los empleados validados en la BD
   * @param employees - Array de empleados validados
   * @param tempFilePath - Ruta del archivo temporal
   * @returns Resultado del procesamiento
   */
  confirm: async (employees: EmployeeData[], tempFilePath: string): Promise<ConfirmResponse> => {
    const response = await api.post<ConfirmResponse>('/empleados/confirm', {
      employees,
      tempFilePath,
    });

    return response.data;
  },

  /**
   * Crea un nuevo empleado individual
   * @param data - Datos del nuevo empleado
   * @returns Mensaje de éxito con ID
   */
  create: async (data: Omit<EmployeeData, 'id'>): Promise<{ message: string; id: number }> => {
    const response = await api.post<{ message: string; id: number }>('/empleados/create', data);
    return response.data;
  },

  /**
   * Obtiene todos los empleados
   * @returns Lista de empleados
   */
  getAll: async (): Promise<EmployeeData[]> => {
    const response = await api.get<{ empleados: EmployeeData[]; total: number }>('/empleados');
    return response.data.empleados;
  },

  /**
   * Obtiene un empleado por ID
   * @param id - ID del empleado
   * @returns Datos del empleado
   */
  getById: async (id: number): Promise<EmployeeData> => {
    const response = await api.get<EmployeeData>(`/empleados/${id}`);
    return response.data;
  },

  /**
   * Actualiza un empleado existente
   * @param id - ID del empleado
   * @param data - Datos actualizados del empleado
   * @returns Mensaje de éxito
   */
  update: async (id: number, data: Partial<EmployeeData>): Promise<{ message: string; id: number }> => {
    const response = await api.put<{ message: string; id: number }>(`/empleados/${id}`, data);
    return response.data;
  },

  /**
   * Desactiva un empleado
   * @param id - ID del empleado
   * @returns Mensaje de éxito
   */
  delete: async (id: number): Promise<{ message: string; id: number }> => {
    const response = await api.delete<{ message: string; id: number }>(`/empleados/${id}`);
    return response.data;
  },

  /**
   * Exporta todos los empleados a un archivo Excel
   * @returns Descarga el archivo Excel
   */
  export: async (): Promise<void> => {
    const response = await api.get('/empleados/export', {
      responseType: 'blob',
    });

    // Obtener nombre del archivo de los headers o usar uno por defecto
    const contentDisposition = response.headers['content-disposition'];
    let filename = `empleados_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Crear blob con tipo MIME explícito para Excel
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Agregar al DOM, hacer clic y limpiar
    document.body.appendChild(link);
    link.click();
    
    // Limpiar después de un pequeño delay
    setTimeout(() => {
      link.remove();
      window.URL.revokeObjectURL(url);
    }, 100);
  },
};

// --- API DE ASISTENCIA (NEXTEP NE-234) ---

export interface EmpleadoAsistencia {
  num: string;
  nombre: string;
  activo?: boolean;
  // Datos de validación (desde BD)
  existeEnBD?: boolean;
  id?: number;
  correo?: string | null;
  departamento?: string;
  grupo?: string | null;
  nombreExcel?: string; // Nombre original del Excel (para empleados no registrados)
}

export interface MarcaAsistencia {
  num_empleado: string;
  fecha: string;
  hora: string;
  tipo: string;
  fila_original?: number;
}

export interface TotalAsistencia {
  empleado_id: number;
  num_empleado: string;
  nombre_empleado: string;
  correo?: string;
  departamento?: string;
  grupo?: string;
  activo?: number;
  tiempo_requerido_min?: number;
  tiempo_real_min?: number;
  retardos_cuenta?: number;
  retardos_min?: number;
  salidas_tempranas_cuenta?: number;
  salidas_tempranas_min?: number;
  extra_normal_min?: number;
  extra_especial_min?: number;
  dias_asistidos?: number;
  dias_periodo?: number;
  vacaciones?: number;
  faltas?: number;
  permisos?: number;
}

export interface AsistenciaUploadResponse {
  success: boolean;
  message: string;
  filename: string;
  tempFilePath: string;
  periodo: {
    nombre_archivo: string;
    fecha_inicio: string;
    fecha_fin: string;
    departamento: string;
  };
  stats: {
    totalHojas: number;
    hojasDetectadas: {
      registros?: string;
      resumen?: string;
      turnos: string[];
    };
    totalEmpleados: number;
    totalMarcas: number;
    totalTurnos: number;
    tiempoProcesamiento: number;
  };
  hojas_detectadas: any;
  warnings: string[];
  empleados: EmpleadoAsistencia[];
  marcas: MarcaAsistencia[];
  totales?: TotalAsistencia[];
  preview: {
    empleados: EmpleadoAsistencia[];
    marcas: MarcaAsistencia[];
  };
}

export interface AsistenciaConfirmResponse {
  success: boolean;
  message: string;
  results: {
    periodo_id: number;
    marcas_insertadas: number;
    marcas_omitidas: number;
    totales_insertados: number;
    empleados_procesados: number;
  };
}

// --- INTERFACES PARA PERÍODOS ---

export interface Periodo {
  id: number;
  nombre_archivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_carga: string;
  departamento: string;
  estado: string;
  usuario_carga: string;
  stats: {
    marcas: number;
    totales: number;
    empleados: number;
  };
  empleados: EmployeeData[];
}

export interface PeriodosListResponse {
  success: boolean;
  periodos: Periodo[];
  total: number;
}

export interface PeriodoDetalleResponse {
  success: boolean;
  periodo: Periodo;
  marcas: MarcaAsistencia[];
  totales: TotalAsistencia[];
  stats: {
    totalMarcas: number;
    totalEmpleados: number;
    fechaInicio: string;
    fechaFin: string;
  };
}

export interface RegistroDiario {
  id: number;
  periodo_id: number;
  empleado_id: number;
  fecha: string;
  dia_semana: string;
  es_laborable: number;
  entrada_real: string | null;
  salida_real: string | null;
  tiene_entrada: number;
  tiene_salida: number;
  minutos_trabajados: number;
  minutos_retardo: number;
  cuenta_retardo: number;
  minutos_salida_temprana: number;
  cuenta_salida_temprana: number;
  es_falta: number;
  estado: string;
  num_empleado: string;
  nombre_empleado: string;
  departamento: string;
  grupo: string;
}

export interface AsistenciaDiariaResponse {
  success: boolean;
  periodo: {
    id: number;
    nombre_archivo: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  registros: RegistroDiario[];
  total: number;
}

export const asistenciaApi = {
  /**
   * Sube un archivo Excel del reloj checador Nextep NE-234
   * @param file - Archivo Excel del Nextep
   * @returns Datos parseados con preview
   */
  upload: async (file: File): Promise<AsistenciaUploadResponse> => {
    const formData = new FormData();
    formData.append('excelFile', file);

    const response = await api.post<AsistenciaUploadResponse>('/asistencia/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Confirma y guarda los datos de asistencia
   * @param data - Datos de asistencia validados
   * @returns Resultado del guardado
   */
  confirm: async (data: {
    tempFilePath: string;
    periodo: AsistenciaUploadResponse['periodo'];
    empleados: EmpleadoAsistencia[];
    marcas: MarcaAsistencia[];
    totales?: TotalAsistencia[];
  }): Promise<AsistenciaConfirmResponse> => {
    const response = await api.post<AsistenciaConfirmResponse>('/asistencia/confirm', data);
    return response.data;
  },

  /**
   * Verifica qué empleados existen en la base de datos
   * @param nums - Array de números de empleado
   * @returns Empleados encontrados en BD
   */
  verifyEmployees: async (nums: string[]): Promise<{ empleados: EmployeeData[] }> => {
    const response = await api.get<{ empleados: EmployeeData[] }>('/asistencia/verify-employees', {
      params: {
        nums: nums.join(',')
      }
    });
    return response.data;
  },

  /**
   * Obtiene la lista de períodos guardados
   * @returns Lista de períodos con estadísticas
   */
  getPeriodos: async (): Promise<PeriodosListResponse> => {
    const response = await api.get<PeriodosListResponse>('/asistencia/periodos');
    return response.data;
  },

  /**
   * Obtiene los detalles completos de un período
   * @param id - ID del período
   * @returns Detalles del período con marcas y totales
   */
  getPeriodoDetalle: async (id: number): Promise<PeriodoDetalleResponse> => {
    const response = await api.get<PeriodoDetalleResponse>(`/asistencia/periodos/${id}`);
    return response.data;
  },

  /**
   * Obtiene la asistencia calculada día por día de un período
   * @param id - ID del período
   * @param empleadoNum - Número de empleado (opcional para filtrar)
   * @returns Asistencia diaria
   */
  getAsistenciaDiaria: async (id: number, empleadoNum?: string): Promise<AsistenciaDiariaResponse> => {
    const url = empleadoNum 
      ? `/asistencia/periodos/${id}/dia-por-dia?empleado_num=${empleadoNum}`
      : `/asistencia/periodos/${id}/dia-por-dia`;
    const response = await api.get<AsistenciaDiariaResponse>(url);
    return response.data;
  },
};

// --- API DE DATABASE (GESTIÓN Y PRUEBAS) ---

export interface DatabaseStats {
  success: boolean;
  stats: {
    empleados: number;
    periodos: number;
    marcas: number;
    totales: number;
  };
}

export interface DatabaseResetResponse {
  success: boolean;
  message: string;
  results: {
    empleados_eliminados: number;
    periodos_eliminados: number;
    marcas_eliminadas: number;
    totales_eliminados: number;
    turnos_eliminados: number;
    logs_eliminados: number;
  };
}

export const databaseApi = {
  /**
   * Obtiene estadísticas de la base de datos
   * @returns Contadores de registros
   */
  getStats: async (): Promise<DatabaseStats> => {
    const response = await api.get<DatabaseStats>('/database/stats');
    return response.data;
  },
  
  /**
   * VACÍA TODA LA BASE DE DATOS (solo para pruebas)
   * ⚠️ PELIGRO: Elimina todos los datos
   * @returns Resultado de la operación
   */
  reset: async (): Promise<DatabaseResetResponse> => {
    const response = await api.delete<DatabaseResetResponse>('/database/reset');
    return response.data;
  },
};

// --- UTILIDAD PARA MANEJO DE ERRORES ---

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Error del servidor
      return error.response.data?.error || error.response.data?.details || 'Error del servidor';
    } else if (error.request) {
      // Error de red
      return 'Error de conexión con el servidor. Verifica que el backend esté corriendo.';
    }
  }
  
  // Error desconocido
  return 'Error desconocido';
};

export default api;





