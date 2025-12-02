import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import VideoBackground from '../components/common/VideoBackground';
import FileUploader from '../components/Upload/FileUploader';
import AsistenciaValidationTable from '../components/Asistencia/AsistenciaValidationTable';
import { asistenciaApi, databaseApi, handleApiError, type AsistenciaUploadResponse, type DatabaseStats, type EmpleadoAsistencia } from '../services/api';

function HomePage() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<AsistenciaUploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [empleadosValidados, setEmpleadosValidados] = useState<EmpleadoAsistencia[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  
  // Estadísticas de la base de datos
  const [dbStats, setDbStats] = useState<DatabaseStats['stats'] | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await databaseApi.getStats();
      setDbStats(response.stats);
    } catch (err) {
      console.error('[FRONTEND ERROR] No se pudieron cargar estadísticas:', err);
    } finally {
      setLoadingStats(false);
    }
  };
  
  const handleResetDatabase = async () => {
    const confirmacion = window.confirm(
      '⚠️ ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos.\n\n' +
      '¿Estás seguro de que quieres continuar?\n\n' +
      'Esta acción es IRREVERSIBLE.'
    );
    
    if (!confirmacion) return;
    
    try {
      setResetting(true);
      const response = await databaseApi.reset();
      console.log('[FRONTEND] Base de datos vaciada:', response);
      alert(`✅ Base de datos vaciada exitosamente\n\n` +
        `Empleados eliminados: ${response.results.empleados_eliminados}\n` +
        `Marcas eliminadas: ${response.results.marcas_eliminadas}\n` +
        `Períodos eliminados: ${response.results.periodos_eliminados}`
      );
      
      // Recargar estadísticas
      await loadStats();
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert('❌ Error al vaciar base de datos: ' + errorMsg);
    } finally {
      setResetting(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    console.log('[FRONTEND] Archivo seleccionado:', file.name);
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[FRONTEND] Subiendo archivo a /api/asistencia/upload...');
      const response = await asistenciaApi.upload(file);
      
      console.log('[FRONTEND] ✅ Archivo procesado:', response);
      setResult(response);
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      console.error('[FRONTEND ERROR]', errorMsg);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleValidationComplete = (empleados: EmpleadoAsistencia[]) => {
    setEmpleadosValidados(empleados);
    console.log('[FRONTEND] Validación completada:', empleados.length, 'empleados');
  };

  const handleConfirm = async () => {
    if (!result) return;

    // Verificar que al menos un empleado esté validado
    const empleadosValidos = empleadosValidados.filter(e => e.existeEnBD);
    
    if (empleadosValidos.length === 0) {
      alert('⚠️ No hay empleados validados para guardar. Agrega los empleados faltantes a tu catálogo primero.');
      return;
    }

    const empleadosNoValidos = empleadosValidados.filter(e => !e.existeEnBD);
    
    if (empleadosNoValidos.length > 0) {
      const confirmar = window.confirm(
        `⚠️ Hay ${empleadosNoValidos.length} empleado(s) que no están registrados.\n\n` +
        `Solo se guardarán las marcas de los ${empleadosValidos.length} empleados validados.\n\n` +
        `¿Deseas continuar?`
      );
      
      if (!confirmar) return;
    }

    try {
      setConfirmando(true);
      console.log('[FRONTEND] Confirmando guardado...');
      
      const response = await asistenciaApi.confirm({
        tempFilePath: result.tempFilePath,
        periodo: result.periodo,
        empleados: empleadosValidos,
        marcas: result.marcas,
        totales: result.totales
      });
      
      console.log('[FRONTEND] ✅ Guardado exitoso:', response);
      
      alert(
        `✅ Asistencia guardada exitosamente\n\n` +
        `📊 Resumen:\n` +
        `• Marcas insertadas: ${response.results.marcas_insertadas}\n` +
        `• Marcas omitidas: ${response.results.marcas_omitidas}\n` +
        `• Totales guardados: ${response.results.totales_insertados}\n` +
        `• Empleados procesados: ${response.results.empleados_procesados}`
      );
      
      setResult(null);
      setEmpleadosValidados([]);
      
      // Recargar estadísticas
      await loadStats();
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert('❌ Error al guardar: ' + errorMsg);
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <>
      {/* Video de fondo solo en la página principal */}
      <VideoBackground 
        videoUrl="/videos/videocorporativo.mp4"
        opacity={0.55}
        enableOnMobile={false}
      />
      
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">⏰ Procesador de Asistencia (Nextep NE-234)</h1>
          <p className="page-subtitle">
            Sube archivos Excel del reloj checador y gestiona periodos procesados
          </p>
        </div>

        {/* Estadísticas de la Base de Datos */}
        <div className="card" style={{ background: 'rgba(99, 102, 241, 0.05)', borderLeft: '4px solid rgb(99, 102, 241)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0 }}>📊 Estado de la Base de Datos</h3>
              {loadingStats ? (
                <p className="text-muted mt-1">Cargando estadísticas...</p>
              ) : dbStats ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85em' }}>Empleados:</p>
                    <p style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold', color: 'rgb(99, 102, 241)' }}>
                      {dbStats.empleados}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85em' }}>Períodos:</p>
                    <p style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold', color: 'rgb(99, 102, 241)' }}>
                      {dbStats.periodos}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.85em' }}>Registros:</p>
                    <p style={{ margin: 0, fontSize: '1.5em', fontWeight: 'bold', color: 'rgb(99, 102, 241)' }}>
                      {dbStats.totales}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted mt-1">No se pudieron cargar estadísticas</p>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="btn btn--secondary"
                onClick={loadStats}
                disabled={loadingStats}
                style={{ fontSize: '0.9em' }}
              >
                🔄 Actualizar
              </button>
              <button 
                className="btn"
                onClick={handleResetDatabase}
                disabled={resetting}
                style={{ 
                  fontSize: '0.9em',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                {resetting ? '⏳ Vaciando...' : '🗑️ Vaciar BD'}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <h2>📤 Subir Archivo Excel de Asistencia</h2>
          <p className="text-muted mt-2">
            El sistema detectará automáticamente las hojas de Registros, Resumen y Turnos.
          </p>
          <div className="mt-3">
            <FileUploader 
              onFileSelect={handleFileSelect} 
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="mt-3 p-3" style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}>
              <p style={{ margin: 0, color: '#3b82f6' }}>
                🔄 Procesando archivo... Esto puede tomar unos segundos.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-3 p-3" style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <p style={{ margin: 0, color: '#ef4444', fontWeight: 'bold' }}>
                ❌ Error al procesar el archivo
              </p>
              <p style={{ margin: '8px 0 0 0', color: '#ef4444' }}>
                {error}
              </p>
            </div>
          )}

          {result && (
            <div className="mt-3">
              {/* Información del archivo procesado */}
              <div className="p-3" style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                marginBottom: '20px'
              }}>
                <h3 style={{ color: '#22c55e', marginTop: 0 }}>
                  ✅ Archivo Procesado Exitosamente
                </h3>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                  gap: '12px',
                  marginTop: '16px'
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>📁 Archivo:</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>{result.periodo.nombre_archivo}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>📅 Período:</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold' }}>
                      {new Date(result.periodo.fecha_inicio).toLocaleDateString()} - {new Date(result.periodo.fecha_fin).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>👥 Empleados Detectados:</p>
                    <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#22c55e', fontSize: '1.5em' }}>
                      {result.stats.totalEmpleados}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>📋 Hojas Detectadas:</h4>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {result.stats.hojasDetectadas.registros && (
                      <span style={{ 
                        background: 'rgba(34, 197, 94, 0.2)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}>
                        ✅ Registros: <strong>{result.stats.hojasDetectadas.registros}</strong>
                      </span>
                    )}
                    {result.stats.hojasDetectadas.resumen && (
                      <span style={{ 
                        background: 'rgba(34, 197, 94, 0.2)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}>
                        ✅ Resumen: <strong>{result.stats.hojasDetectadas.resumen}</strong>
                      </span>
                    )}
                    {result.stats.hojasDetectadas.turnos.length > 0 && (
                      <span style={{ 
                        background: 'rgba(34, 197, 94, 0.2)',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9em'
                      }}>
                        ✅ Turnos: {result.stats.hojasDetectadas.turnos.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {result.warnings.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ color: '#f59e0b', margin: '0 0 8px 0' }}>⚠️ Advertencias:</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {result.warnings.map((warning, idx) => (
                        <li key={idx} style={{ color: '#f59e0b', fontSize: '0.9em' }}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tabla de Validación de Empleados */}
              <div className="card">
                <h3 style={{ marginTop: 0 }}>👥 Validación de Empleados</h3>
                <p className="text-muted" style={{ marginBottom: '16px' }}>
                  Verificando que los empleados del archivo existan en tu catálogo...
                </p>
                <AsistenciaValidationTable
                  empleados={result.empleados}
                  onValidationComplete={handleValidationComplete}
                />
              </div>

              {/* Botones de Acción */}
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn--secondary"
                  onClick={() => {
                    setResult(null);
                    setEmpleadosValidados([]);
                  }}
                  disabled={confirmando}
                >
                  ❌ Cancelar
                </button>
                <button 
                  className="btn btn--primary"
                  onClick={handleConfirm}
                  disabled={confirmando || empleadosValidados.length === 0}
                  style={{ minWidth: '200px' }}
                >
                  {confirmando ? '⏳ Guardando...' : '💾 Confirmar y Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card mt-4">
          <h3>📜 Historial de Importaciones</h3>
          <p className="text-muted mt-1">
            Próximamente: Tabla con el historial de archivos procesados
          </p>
        </div>

        <div className="card mt-4">
          <h3>💡 ¿Nuevo en el sistema?</h3>
          <p className="text-muted mt-1">
            Antes de procesar asistencias, asegúrate de tener tu base de datos de empleados actualizada.
          </p>
          <Link to="/empleados" className="btn btn--primary mt-2">
            Ir a Gestión de Empleados
          </Link>
        </div>

        <div className="card mt-4" style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
          <h3>ℹ️ Formato del Archivo</h3>
          <p className="text-muted mt-1">
            El sistema procesa archivos del <strong>reloj checador Nextep NE-234</strong> con:
          </p>
          <ul className="text-muted" style={{ marginTop: '8px' }}>
            <li>📊 Hoja "Resumen" - Totales del periodo por empleado</li>
            <li>⏱️ Hoja "Registros" - Marcas de entrada y salida</li>
            <li>👥 Hojas de grupos - Turnos y horarios (ej: "1.3.5", "6.8.14")</li>
          </ul>
          <p className="text-muted mt-2" style={{ fontSize: '0.9em' }}>
            <strong>Nota:</strong> Si subes un catálogo de empleados, usa la página de <Link to="/empleados">Gestión de Empleados</Link>.
          </p>
        </div>
      </div>
    </>
  );
}

export default HomePage;


