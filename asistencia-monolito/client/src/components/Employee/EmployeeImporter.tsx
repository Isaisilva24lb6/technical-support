// client/src/components/Employee/EmployeeImporter.tsx
// Componente maestro que integra FileUploader y DataValidationTable

import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import FileUploader from '../Upload/FileUploader';
import DataValidationTable from '../Upload/DataValidationTable';
import { empleadosApi, handleApiError, type EmployeeData, type ImportResponse } from '../../services/api';
import './EmployeeImporter.css';

interface EmployeeImporterProps {
  onStepChange?: (step: 'upload' | 'validate' | 'success') => void;
  onImportComplete?: () => void;
}

const EmployeeImporter: React.FC<EmployeeImporterProps> = ({ onStepChange, onImportComplete }) => {
  const [step, setStep] = useState<'upload' | 'validate' | 'success'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importData, setImportData] = useState<ImportResponse | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Notificar cambios de paso al padre
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  /**
   * Maneja la subida del archivo Excel
   */
  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('[FRONTEND] Subiendo archivo:', file.name);
      
      const result = await empleadosApi.import(file);
      
      console.log('[FRONTEND] Archivo parseado:', result);
      
      setImportData(result);
      setStep('validate');
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      console.error('[FRONTEND ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja la confirmación de los datos validados
   */
  const handleConfirm = async (validatedEmployees: EmployeeData[]) => {
    if (!importData) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[FRONTEND] Confirmando empleados:', validatedEmployees);
      
      const result = await empleadosApi.confirm(validatedEmployees, importData.tempFilePath);
      
      console.log('[FRONTEND] Empleados procesados:', result);
      
      const { insertados, actualizados, duplicados, errores } = result.results;
      
      setSuccessMessage(
        `✅ Procesamiento completado:\n` +
        `• ${insertados} empleados nuevos insertados\n` +
        `• ${actualizados} empleados actualizados\n` +
        `• ${duplicados} empleados duplicados (no insertados)\n` +
        (errores.length > 0 ? `• ${errores.length} errores` : '')
      );
      
      setStep('success');
      
      // Notificar al padre que se completó la importación
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      const errorMsg = handleApiError(err);
      setError(errorMsg);
      console.error('[FRONTEND ERROR]', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja la cancelación del proceso de validación
   */
  const handleCancel = () => {
    setStep('upload');
    setImportData(null);
    setError(null);
    setSuccessMessage(null);
  };

  /**
   * Reinicia el proceso para subir otro archivo
   */
  const handleReset = () => {
    setStep('upload');
    setImportData(null);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="employee-importer">
      {/* PASO 1: SUBIR ARCHIVO */}
      {step === 'upload' && (
        <>
          <div className="card">
            <h2>📤 Subir Archivo Excel de Empleados</h2>
            <p className="text-muted mt-1">
              El sistema detectará automáticamente nombres y correos de Microsoft (Outlook, Hotmail, etc.)
            </p>
          </div>

          <FileUploader onFileSelect={handleFileSelect} />

          {isLoading && (
            <div className="status-message status-message--info mt-4">
              <div className="spinner"></div>
              <span>Analizando archivo Excel... Esto puede tardar unos segundos.</span>
            </div>
          )}

          {error && (
            <div className="status-message status-message--error mt-4">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          <div className="card mt-4">
            <h3><FaInfoCircle /> Formato del Excel</h3>
            <p className="text-muted mt-1">
              Tu archivo Excel debe tener al menos las siguientes columnas:
            </p>
            <ul className="format-list">
              <li><strong>Nombre:</strong> Nombre completo del empleado</li>
              <li><strong>Correo:</strong> Cuenta de Microsoft (Outlook, Hotmail, o corporativo)</li>
              <li><strong>Número:</strong> Número de empleado (opcional, se generará automáticamente si no existe)</li>
              <li><strong>Departamento:</strong> (Opcional)</li>
              <li><strong>Grupo/Turno:</strong> (Opcional)</li>
            </ul>
            <p className="text-muted mt-2">
              💡 <strong>Tip:</strong> El sistema es inteligente y puede detectar múltiples nombres o correos en una sola celda.
            </p>
          </div>
        </>
      )}

      {/* PASO 2: VALIDAR DATOS */}
      {step === 'validate' && importData && (
        <>
          {importData.warnings.length > 0 && (
            <div className="status-message status-message--warning mb-4">
              <FaExclamationTriangle />
              <div>
                <strong>Advertencias detectadas:</strong>
                <ul className="warnings-list">
                  {importData.warnings.slice(0, 5).map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                  {importData.warnings.length > 5 && (
                    <li>... y {importData.warnings.length - 5} más</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          <DataValidationTable
            data={importData.employees}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />

          {isLoading && (
            <div className="status-message status-message--info mt-4">
              <div className="spinner"></div>
              <span>Guardando empleados en la base de datos...</span>
            </div>
          )}

          {error && (
            <div className="status-message status-message--error mt-4">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}
        </>
      )}

      {/* PASO 3: ÉXITO */}
      {step === 'success' && (
        <div className="card text-center">
          <FaCheckCircle className="success-icon" />
          <h2>¡Empleados Procesados Exitosamente!</h2>
          <pre className="success-message-box mt-3">{successMessage}</pre>
          <button className="btn btn--primary mt-4" onClick={handleReset}>
            Importar Otro Archivo
          </button>
        </div>
      )}
    </div>
  );
};

export default EmployeeImporter;

