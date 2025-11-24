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
  correo: string;
  departamento: string;
  grupo: string;
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
   * Desactiva un empleado
   * @param id - ID del empleado
   * @returns Mensaje de éxito
   */
  delete: async (id: number): Promise<{ message: string; id: number }> => {
    const response = await api.delete<{ message: string; id: number }>(`/empleados/${id}`);
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




