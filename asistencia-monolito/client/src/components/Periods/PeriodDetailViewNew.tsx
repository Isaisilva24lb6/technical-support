// client/src/components/Periods/PeriodDetailViewNew.tsx
// Vista mejorada con calendario, tabla y gráficas

import { useState, useEffect } from 'react';
import { asistenciaApi, type RegistroDiario, handleApiError } from '../../services/api';
import CalendarioAsistencia from '../Asistencia/CalendarioAsistencia';
import TablaDetalladaAsistencia from '../Asistencia/TablaDetalladaAsistencia';
import GraficasAsistencia from '../Asistencia/GraficasAsistencia';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PeriodDetailViewNewProps {
  periodId: number;
  onBack: () => void;
}

type ViewMode = 'calendario' | 'tabla' | 'graficas';

function PeriodDetailViewNew({ periodId, onBack }: PeriodDetailViewNewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registros, setRegistros] = useState<RegistroDiario[]>([]);
  const [periodo, setPeriodo] = useState<any>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendario');

  useEffect(() => {
    loadAsistenciaDiaria();
  }, [periodId]);

  const loadAsistenciaDiaria = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await asistenciaApi.getAsistenciaDiaria(periodId);
      
      setRegistros(data.registros);
      setPeriodo(data.periodo);
      
      console.log(`[FRONTEND] Asistencia diaria cargada: ${data.registros.length} registros`);
      
    } catch (err) {
      setError(handleApiError(err));
      console.error('[FRONTEND ERROR]', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Detalle del Período</h1>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#94a3b8' }}>⏳ Cargando asistencia diaria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Detalle del Período</h1>
        </div>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>❌ Error: {error}</p>
          <button className="btn btn--primary" onClick={loadAsistenciaDiaria}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!periodo || registros.length === 0) {
    return (
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Detalle del Período</h1>
        </div>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#94a3b8' }}>
            No hay registros de asistencia diaria para este período.
          </p>
          <p style={{ color: '#94a3b8', fontSize: '0.9em', marginTop: '8px' }}>
            💡 Asegúrate de haber importado el archivo de asistencia correctamente.
          </p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const registrosLaborables = registros.filter(r => r.es_laborable === 1);
  const totalCompletos = registrosLaborables.filter(r => r.estado === 'Completo').length;
  const totalFaltas = registrosLaborables.filter(r => r.estado === 'Falta').length;
  const totalRetardos = registrosLaborables.filter(r => r.minutos_retardo > 0).length;
  const porcentajeAsistencia = ((totalCompletos / registrosLaborables.length) * 100).toFixed(1);

  return (
    <div className="main-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <button 
            className="btn btn--icon" 
            onClick={onBack} 
            style={{ marginRight: '15px' }}
            title="Volver a lista de períodos"
          >
            ←
          </button>
          <div>
            <h1 className="page-title" style={{ margin: 0 }}>
              📅 {format(new Date(periodo.fecha_inicio), 'MMMM yyyy', { locale: es })}
            </h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0 0' }}>
              {format(new Date(periodo.fecha_inicio), 'dd MMM', { locale: es })} - {format(new Date(periodo.fecha_fin), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>

        {/* Selector de Vista */}
        <div className="view-selector" style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${viewMode === 'calendario' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('calendario')}
          >
            📅 Calendario
          </button>
          <button 
            className={`btn ${viewMode === 'tabla' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('tabla')}
          >
            📋 Tabla
          </button>
          <button 
            className={`btn ${viewMode === 'graficas' ? 'btn--primary' : 'btn--secondary'}`}
            onClick={() => setViewMode('graficas')}
          >
            📊 Gráficas
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="stats-cards-container" style={{ marginBottom: '24px' }}>
        <div className="stat-card stat-card--success">
          <p className="stat-label">Asistencia</p>
          <p className="stat-value">{porcentajeAsistencia}%</p>
          <p className="stat-detail">{totalCompletos} de {registrosLaborables.length}</p>
        </div>
        <div className="stat-card stat-card--error">
          <p className="stat-label">Faltas</p>
          <p className="stat-value">{totalFaltas}</p>
          <p className="stat-detail">{((totalFaltas / registrosLaborables.length) * 100).toFixed(1)}%</p>
        </div>
        <div className="stat-card stat-card--warning">
          <p className="stat-label">Retardos</p>
          <p className="stat-value">{totalRetardos}</p>
          <p className="stat-detail">{((totalRetardos / registrosLaborables.length) * 100).toFixed(1)}%</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Registros</p>
          <p className="stat-value">{registros.length}</p>
          <p className="stat-detail">{registrosLaborables.length} laborables</p>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      {viewMode === 'calendario' && (
        <CalendarioAsistencia
          registros={registros}
          fechaInicio={periodo.fecha_inicio}
          fechaFin={periodo.fecha_fin}
        />
      )}

      {viewMode === 'tabla' && (
        <TablaDetalladaAsistencia registros={registros} />
      )}

      {viewMode === 'graficas' && (
        <GraficasAsistencia registros={registros} />
      )}
    </div>
  );
}

export default PeriodDetailViewNew;

