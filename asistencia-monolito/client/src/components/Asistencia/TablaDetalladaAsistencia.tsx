// client/src/components/Asistencia/TablaDetalladaAsistencia.tsx
// Tabla detallada con filtros para asistencia día por día

import { useState, useMemo } from 'react';
import { type RegistroDiario } from '../../services/api';
import './TablaDetalladaAsistencia.css';

interface TablaDetalladaAsistenciaProps {
  registros: RegistroDiario[];
}

function TablaDetalladaAsistencia({ registros }: TablaDetalladaAsistenciaProps) {
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [soloLaborables, setSoloLaborables] = useState(true);

  // Obtener lista única de empleados
  const empleados = useMemo(() => {
    const unicos = new Map<string, string>();
    registros.forEach(r => {
      if (!unicos.has(r.num_empleado)) {
        unicos.set(r.num_empleado, r.nombre_empleado);
      }
    });
    return Array.from(unicos.entries()).sort((a, b) => 
      parseInt(a[0]) - parseInt(b[0])
    );
  }, [registros]);

  // Filtrar registros
  const registrosFiltrados = useMemo(() => {
    let filtered = registros;

    // Filtro por empleado
    if (filtroEmpleado) {
      filtered = filtered.filter(r => r.num_empleado === filtroEmpleado);
    }

    // Filtro por estado
    if (filtroEstado) {
      filtered = filtered.filter(r => r.estado === filtroEstado);
    }

    // Solo días laborables
    if (soloLaborables) {
      filtered = filtered.filter(r => r.es_laborable === 1);
    }

    return filtered.sort((a, b) => {
      // Ordenar por empleado y luego por fecha
      const cmpEmp = parseInt(a.num_empleado) - parseInt(b.num_empleado);
      if (cmpEmp !== 0) return cmpEmp;
      return a.fecha.localeCompare(b.fecha);
    });
  }, [registros, filtroEmpleado, filtroEstado, soloLaborables]);

  // Formatear hora
  const formatearHora = (hora: string | null) => {
    if (!hora) return '-';
    return hora;
  };

  // Formatear minutos a horas
  const formatearMinutos = (minutos: number) => {
    if (minutos === 0) return '0h';
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  };

  // Obtener clase CSS según estado
  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'Completo':
        return 'estado-completo';
      case 'Incompleto':
        return 'estado-incompleto';
      case 'Falta':
        return 'estado-falta';
      case 'No Laborable':
        return 'estado-no-laborable';
      default:
        return '';
    }
  };

  return (
    <div className="tabla-detallada-asistencia">
      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-grupo">
          <label htmlFor="filtro-empleado">👤 Empleado:</label>
          <select
            id="filtro-empleado"
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los empleados ({empleados.length})</option>
            {empleados.map(([num, nombre]) => (
              <option key={num} value={num}>
                #{num} - {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label htmlFor="filtro-estado">📊 Estado:</label>
          <select
            id="filtro-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos</option>
            <option value="Completo">Completo</option>
            <option value="Incompleto">Incompleto</option>
            <option value="Falta">Falta</option>
            <option value="No Laborable">No Laborable</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label className="filtro-checkbox-label">
            <input
              type="checkbox"
              checked={soloLaborables}
              onChange={(e) => setSoloLaborables(e.target.checked)}
            />
            <span>Solo días laborables</span>
          </label>
        </div>

        <div className="filtros-info">
          <span className="filtro-resultado">
            Mostrando {registrosFiltrados.length} de {registros.length} registros
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="tabla-scroll">
        <table className="data-table tabla-asistencia-diaria">
          <thead>
            <tr>
              <th className="sticky-col">Empleado</th>
              <th>Núm</th>
              <th>Fecha</th>
              <th>Día</th>
              <th>Entrada</th>
              <th>Salida</th>
              <th>Horas</th>
              <th>Retardo</th>
              <th>Sal. Temp.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No hay registros que coincidan con los filtros
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((reg, idx) => (
                <tr key={`${reg.empleado_id}-${reg.fecha}-${idx}`} className={reg.es_laborable === 0 ? 'fila-no-laborable' : ''}>
                  <td className="sticky-col">
                    <strong>{reg.nombre_empleado}</strong>
                  </td>
                  <td>{reg.num_empleado}</td>
                  <td>{new Date(reg.fecha + 'T00:00:00').toLocaleDateString('es-MX')}</td>
                  <td>{reg.dia_semana}</td>
                  <td className={reg.tiene_entrada ? 'celda-hora' : 'celda-vacia'}>
                    {formatearHora(reg.entrada_real)}
                  </td>
                  <td className={reg.tiene_salida ? 'celda-hora' : 'celda-vacia'}>
                    {formatearHora(reg.salida_real)}
                  </td>
                  <td>
                    {reg.minutos_trabajados > 0 ? (
                      <span className="badge badge-info">
                        {formatearMinutos(reg.minutos_trabajados)}
                      </span>
                    ) : (
                      <span className="celda-vacia">-</span>
                    )}
                  </td>
                  <td>
                    {reg.minutos_retardo > 0 ? (
                      <span className="badge badge-warning">
                        {formatearMinutos(reg.minutos_retardo)}
                      </span>
                    ) : (
                      <span style={{ color: '#22c55e' }}>✓</span>
                    )}
                  </td>
                  <td>
                    {reg.minutos_salida_temprana > 0 ? (
                      <span className="badge badge-warning">
                        {formatearMinutos(reg.minutos_salida_temprana)}
                      </span>
                    ) : (
                      <span style={{ color: '#22c55e' }}>✓</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getEstadoClass(reg.estado)}`}>
                      {reg.estado}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TablaDetalladaAsistencia;

