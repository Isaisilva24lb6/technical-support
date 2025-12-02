// client/src/components/Periods/PeriodDetailView.tsx
// Vista detallada de un período con calendario y tabla de asistencia

import { useState, useEffect } from 'react';
import { asistenciaApi, type Periodo, type MarcaAsistencia, type TotalAsistencia, handleApiError } from '../../services/api';

interface Props {
  periodo: Periodo;
  onBack: () => void;
}

interface EmpleadoStats {
  id: number;
  num: string;
  nombre: string;
  departamento: string;
  grupo: string;
  diasTrabajados: number;
  totalMarcas: number;
  retardos: number;
  salidas_tempranas: number;
  faltas: number;
  horasExtra: number;
}

function PeriodDetailView({ periodo, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [marcas, setMarcas] = useState<MarcaAsistencia[]>([]);
  const [empleadosStats, setEmpleadosStats] = useState<EmpleadoStats[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tabla' | 'calendario' | 'graficas'>('tabla');

  useEffect(() => {
    loadDetalles();
  }, [periodo.id]);

  const loadDetalles = async () => {
    try {
      setLoading(true);
      
      console.log(`[FRONTEND] Cargando detalles del período ${periodo.id}...`);
      const response = await asistenciaApi.getPeriodoDetalle(periodo.id);
      
      setMarcas(response.marcas);
      
      // Procesar estadísticas por empleado
      const stats = procesarEstadisticas(response.marcas, response.totales);
      setEmpleadosStats(stats);
      
      console.log(`[FRONTEND] Detalles cargados: ${response.marcas.length} marcas, ${response.totales.length} empleados`);
    } catch (err) {
      const errorMsg = handleApiError(err);
      console.error('[FRONTEND ERROR]', errorMsg);
      alert('Error al cargar detalles: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const procesarEstadisticas = (marcas: MarcaAsistencia[], totales: TotalAsistencia[]): EmpleadoStats[] => {
    return totales.map(total => {
      const marcasEmpleado = marcas.filter(m => m.num_empleado === total.num_empleado);
      
      // Calcular días únicos trabajados
      const diasUnicos = new Set(marcasEmpleado.map(m => m.fecha)).size;
      
      return {
        id: total.empleado_id,
        num: total.num_empleado,
        nombre: total.nombre_empleado,
        departamento: total.departamento || 'aca',
        grupo: total.grupo || '-',
        diasTrabajados: diasUnicos,
        totalMarcas: marcasEmpleado.length,
        retardos: total.retardos_cuenta || 0,
        salidas_tempranas: total.salidas_tempranas_cuenta || 0,
        faltas: total.faltas || 0,
        horasExtra: Math.floor((total.extra_normal_min || 0) / 60)
      };
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ color: '#94a3b8' }}>⏳ Cargando detalles del período...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header con navegación */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          className="btn btn--secondary"
          onClick={onBack}
          style={{ marginBottom: '16px', fontSize: '0.9em' }}
        >
          ← Volver a la lista
        </button>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#2563eb' }}>
              📅 {new Date(periodo.fecha_inicio).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
            </h2>
            <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '0.9em' }}>
              {formatDate(periodo.fecha_inicio)} - {formatDate(periodo.fecha_fin)}
            </p>
          </div>
          
          {/* Selector de vista */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${viewMode === 'tabla' ? '' : 'btn--secondary'}`}
              onClick={() => setViewMode('tabla')}
              style={{ fontSize: '0.85em', padding: '8px 16px' }}
            >
              📋 Tabla
            </button>
            <button
              className={`btn ${viewMode === 'calendario' ? '' : 'btn--secondary'}`}
              onClick={() => setViewMode('calendario')}
              style={{ fontSize: '0.85em', padding: '8px 16px' }}
            >
              📅 Calendario
            </button>
            <button
              className={`btn ${viewMode === 'graficas' ? '' : 'btn--secondary'}`}
              onClick={() => setViewMode('graficas')}
              style={{ fontSize: '0.85em', padding: '8px 16px' }}
            >
              📊 Gráficas
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas generales */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Empleados</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8em', fontWeight: 'bold', color: '#2563eb' }}>
            {empleadosStats.length}
          </p>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Total Registros</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8em', fontWeight: 'bold', color: '#8b5cf6' }}>
            {marcas.length}
          </p>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Retardos</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8em', fontWeight: 'bold', color: '#f59e0b' }}>
            {empleadosStats.reduce((sum, e) => sum + e.retardos, 0)}
          </p>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Faltas</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8em', fontWeight: 'bold', color: '#ef4444' }}>
            {empleadosStats.reduce((sum, e) => sum + e.faltas, 0)}
          </p>
        </div>
        <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.75em', color: '#666' }}>Horas Extra</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '1.8em', fontWeight: 'bold', color: '#22c55e' }}>
            {empleadosStats.reduce((sum, e) => sum + e.horasExtra, 0)}h
          </p>
        </div>
      </div>

      {/* Contenido según la vista seleccionada */}
      {viewMode === 'tabla' && (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ position: 'sticky', left: 0, background: '#f3f4f6', zIndex: 10 }}>Empleado</th>
                  <th>Núm</th>
                  <th>Departamento</th>
                  <th>Grupo</th>
                  <th>Días Trabajados</th>
                  <th>Registros</th>
                  <th style={{ color: '#f59e0b' }}>⏰ Retardos</th>
                  <th style={{ color: '#ef4444' }}>❌ Faltas</th>
                  <th style={{ color: '#22c55e' }}>➕ Horas Extra</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {empleadosStats.map((empleado) => (
                  <tr 
                    key={empleado.id}
                    style={{
                      background: selectedEmpleado === empleado.num ? 'rgba(37, 99, 235, 0.05)' : undefined
                    }}
                  >
                    <td style={{ 
                      position: 'sticky', 
                      left: 0, 
                      background: selectedEmpleado === empleado.num ? 'rgba(37, 99, 235, 0.05)' : '#fff',
                      zIndex: 9,
                      fontWeight: 'bold'
                    }}>
                      {empleado.nombre}
                    </td>
                    <td><strong>{empleado.num}</strong></td>
                    <td>{empleado.departamento}</td>
                    <td>{empleado.grupo}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        background: 'rgba(37, 99, 235, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                      }}>
                        {empleado.diasTrabajados}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>{empleado.totalMarcas}</td>
                    <td style={{ textAlign: 'center' }}>
                      {empleado.retardos > 0 ? (
                        <span style={{ 
                          background: 'rgba(245, 158, 11, 0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: '#f59e0b',
                          fontWeight: 'bold'
                        }}>
                          {empleado.retardos}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {empleado.faltas > 0 ? (
                        <span style={{ 
                          background: 'rgba(239, 68, 68, 0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: '#ef4444',
                          fontWeight: 'bold'
                        }}>
                          {empleado.faltas}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {empleado.horasExtra > 0 ? (
                        <span style={{ 
                          background: 'rgba(34, 197, 94, 0.2)',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: '#22c55e',
                          fontWeight: 'bold'
                        }}>
                          {empleado.horasExtra}h
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn--secondary"
                        style={{ fontSize: '0.8em', padding: '4px 12px' }}
                        onClick={() => setSelectedEmpleado(empleado.num === selectedEmpleado ? null : empleado.num)}
                      >
                        {empleado.num === selectedEmpleado ? '👁️ Ocultar' : '👁️ Ver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'calendario' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3>Vista de Calendario</h3>
          <p style={{ color: '#666' }}>🚧 Vista de calendario en construcción...</p>
        </div>
      )}

      {viewMode === 'graficas' && (
        <div className="card" style={{ padding: '20px' }}>
          <h3>Gráficas de Asistencia</h3>
          <p style={{ color: '#666' }}>🚧 Gráficas en construcción...</p>
        </div>
      )}
    </div>
  );
}

export default PeriodDetailView;

