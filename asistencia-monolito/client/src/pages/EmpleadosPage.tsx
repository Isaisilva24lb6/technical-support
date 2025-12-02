// client/src/pages/EmpleadosPage.tsx
// Página de gestión de empleados (con video background condicional)

import { useState, useEffect } from 'react';
import VideoBackground from '../components/common/VideoBackground';
import EmployeeImporter from '../components/Employee/EmployeeImporter';
import EmpleadosTable from '../components/Empleados/EmpleadosTable';
import { empleadosApi, handleApiError } from '../services/api';

type ViewMode = 'list' | 'import';

function EmpleadosPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showVideo, setShowVideo] = useState(false);
  const [empleadosCount, setEmpleadosCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  // Cargar cantidad de empleados al montar
  useEffect(() => {
    checkEmpleados();
  }, []);

  const checkEmpleados = async () => {
    try {
      setLoadingCount(true);
      const empleados = await empleadosApi.getAll();
      const count = empleados.length;
      setEmpleadosCount(count);
      
      console.log(`[FRONTEND] Empleados en BD: ${count}`);
      
      // Si NO hay empleados, mostrar importador con video
      if (count === 0) {
        setViewMode('import');
        setShowVideo(true);
      } else {
        // Si hay empleados, mostrar lista sin video
        setViewMode('list');
        setShowVideo(false);
      }
    } catch (err) {
      console.error('[FRONTEND ERROR]', handleApiError(err));
      // En caso de error, asumir que no hay empleados
      setViewMode('import');
      setShowVideo(true);
      setEmpleadosCount(0);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleImportComplete = async () => {
    // Después de importar, actualizar contador primero
    await checkEmpleados(); // Actualizar contador
    // Luego cambiar a vista de lista (checkEmpleados ya lo hace si hay empleados)
  };

  const handleGoToImport = () => {
    setViewMode('import');
    setShowVideo(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setShowVideo(false);
  };

  if (loadingCount) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">👥 Gestión de Empleados</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#94a3b8' }}>⏳ Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Video de fondo SOLO cuando estamos en modo importar */}
      {showVideo && (
        <VideoBackground 
          videoUrl="/videos/videocorporativo.mp4"
          opacity={0.55}
          enableOnMobile={false}
        />
      )}
      
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">👥 Gestión de Empleados</h1>
          <p className="page-subtitle">
            {viewMode === 'list' 
              ? `Administra la base de datos de empleados (${empleadosCount || 0} registrados)`
              : 'Importa empleados desde archivos Excel'
            }
          </p>
        </div>

        {/* VISTA: LISTA DE EMPLEADOS */}
        {viewMode === 'list' && (
          <>
            {/* Botón para ir a importar */}
            <div className="card" style={{ 
              background: 'rgba(99, 102, 241, 0.05)', 
              borderLeft: '4px solid rgb(99, 102, 241)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>📤 Importar Más Empleados</h3>
                <p className="text-muted mt-1" style={{ margin: '8px 0 0 0' }}>
                  Sube un archivo Excel para agregar o actualizar empleados
                </p>
              </div>
              <button 
                className="btn btn--primary"
                onClick={handleGoToImport}
              >
                📂 Importar desde Excel
              </button>
            </div>

            {/* Tabla de empleados */}
            <div className="mt-4">
              <EmpleadosTable onEmployeeChange={checkEmpleados} />
            </div>
          </>
        )}

        {/* VISTA: IMPORTADOR */}
        {viewMode === 'import' && (
          <>
            {/* Botón volver (solo si hay empleados) */}
            {empleadosCount && empleadosCount > 0 && (
              <div className="card" style={{ 
                background: 'rgba(148, 163, 184, 0.05)', 
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button 
                  className="btn btn--secondary"
                  onClick={handleBackToList}
                  style={{ fontSize: '0.9em' }}
                >
                  ← Volver a Lista
                </button>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.9em' }}>
                  {empleadosCount} empleado{empleadosCount !== 1 ? 's' : ''} registrado{empleadosCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Importador */}
            <EmployeeImporter 
              onStepChange={(step) => setShowVideo(step === 'upload')} 
              onImportComplete={handleImportComplete}
            />
          </>
        )}
      </div>
    </>
  );
}

export default EmpleadosPage;

