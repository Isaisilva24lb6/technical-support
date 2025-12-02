// client/src/pages/PeriodsPage.tsx
// Página de visualización de períodos de asistencia

import { useState, useEffect } from 'react';
import { asistenciaApi, type Periodo, handleApiError } from '../services/api';
import PeriodDetailViewNew from '../components/Periods/PeriodDetailViewNew';

type ViewMode = 'list' | 'detail';

function PeriodsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<Periodo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPeriodos();
  }, []);

  const loadPeriodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await asistenciaApi.getPeriodos();
      setPeriodos(response.periodos);
      
      console.log(`[FRONTEND] Períodos cargados: ${response.periodos.length}`);
    } catch (err) {
      const errorMsg = handleApiError(err);
      console.error('[FRONTEND ERROR]', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPeriodo = (periodo: Periodo) => {
    setSelectedPeriodo(periodo);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedPeriodo(null);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatMonthYear = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long'
    });
  };

  // ==================== VISTA: CARGANDO ====================
  if (loading) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Períodos de Asistencia</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#94a3b8' }}>⏳ Cargando períodos...</p>
        </div>
      </div>
    );
  }

  // ==================== VISTA: ERROR ====================
  if (error) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Períodos de Asistencia</h1>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <p style={{ color: '#ef4444', margin: 0 }}>❌ {error}</p>
          </div>
          <button 
            className="btn"
            onClick={loadPeriodos}
            style={{ marginTop: '16px' }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  // ==================== VISTA: LISTA DE PERÍODOS ====================
  if (viewMode === 'list') {
    return (
      <div className="main-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Períodos de Asistencia</h1>
            <p className="page-subtitle">
              Consulta y analiza los registros de asistencia por período
            </p>
          </div>
          <button 
            className="btn"
            onClick={loadPeriodos}
            style={{ fontSize: '0.9em' }}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Estadísticas Generales */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>Total de Períodos</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '2em', fontWeight: 'bold', color: '#2563eb' }}>
              {periodos.length}
            </p>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>Empleados Registrados</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
              {periodos.reduce((acc, p) => acc + p.stats.empleados, 0)}
            </p>
          </div>
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.85em', color: '#666' }}>Total de Registros</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '2em', fontWeight: 'bold', color: '#8b5cf6' }}>
              {periodos.reduce((acc, p) => acc + p.stats.marcas, 0)}
            </p>
          </div>
        </div>

        {/* Lista de Períodos */}
        {periodos.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '3em', margin: 0 }}>📭</p>
            <h3 style={{ marginTop: '16px' }}>No hay períodos registrados</h3>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Importa tu primer archivo de asistencia desde la página de inicio
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {periodos.map((periodo) => (
              <div 
                key={periodo.id}
                className="card"
                style={{ 
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid transparent'
                }}
                onClick={() => handleSelectPeriodo(periodo)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, color: '#2563eb' }}>
                      📅 {formatMonthYear(periodo.fecha_inicio)}
                    </h3>
                    <p style={{ margin: '8px 0', color: '#666', fontSize: '0.9em' }}>
                      {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
                    </p>
                    <p style={{ margin: '4px 0', color: '#888', fontSize: '0.85em' }}>
                      📁 {periodo.nombre_archivo}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Empleados</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '1.5em', fontWeight: 'bold', color: '#22c55e' }}>
                        {periodo.stats.empleados}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Registros</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '1.5em', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {periodo.stats.marcas}
                      </p>
                    </div>
                    <div style={{ fontSize: '2em', color: '#2563eb' }}>→</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== VISTA: DETALLE DE PERÍODO ====================
  if (viewMode === 'detail' && selectedPeriodo) {
    return (
      <PeriodDetailViewNew
        periodId={selectedPeriodo.id}
        onBack={handleBackToList}
      />
    );
  }

  return null;
}

export default PeriodsPage;
