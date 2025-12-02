// client/src/components/Asistencia/CalendarioAsistencia.tsx
// Componente de calendario mensual con colores por estado de asistencia

import { useMemo } from 'react';
import { type RegistroDiario } from '../../services/api';
import './CalendarioAsistencia.css';

interface CalendarioAsistenciaProps {
  registros: RegistroDiario[];
  fechaInicio: string;
  fechaFin: string;
  onDiaClick?: (fecha: string) => void;
}

function CalendarioAsistencia({ registros, fechaInicio, fechaFin, onDiaClick }: CalendarioAsistenciaProps) {
  
  // Agrupar registros por fecha
  const registrosPorFecha = useMemo(() => {
    const mapa = new Map<string, RegistroDiario[]>();
    registros.forEach(reg => {
      if (!mapa.has(reg.fecha)) {
        mapa.set(reg.fecha, []);
      }
      mapa.get(reg.fecha)!.push(reg);
    });
    return mapa;
  }, [registros]);

  // Generar días del calendario
  const diasCalendario = useMemo(() => {
    const inicio = new Date(fechaInicio + 'T00:00:00');
    const fin = new Date(fechaFin + 'T00:00:00');
    const dias = [];
    
    let fecha = new Date(inicio);
    while (fecha <= fin) {
      dias.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 1);
    }
    
    return dias;
  }, [fechaInicio, fechaFin]);

  // Calcular estadísticas del día
  const getEstadisticasDia = (fecha: string) => {
    const regs = registrosPorFecha.get(fecha) || [];
    
    const completos = regs.filter(r => r.estado === 'Completo').length;
    const incompletos = regs.filter(r => r.estado === 'Incompleto').length;
    const faltas = regs.filter(r => r.estado === 'Falta').length;
    const noLaborable = regs.length > 0 && regs[0].es_laborable === 0;
    
    return { completos, incompletos, faltas, noLaborable, total: regs.length };
  };

  // Determinar color del día
  const getColorDia = (fecha: string) => {
    const stats = getEstadisticasDia(fecha);
    
    if (stats.noLaborable) {
      return 'calendario-dia--no-laborable';
    }
    
    if (stats.total === 0) {
      return 'calendario-dia--sin-datos';
    }
    
    const porcentajeCompletos = (stats.completos / stats.total) * 100;
    const porcentajeFaltas = (stats.faltas / stats.total) * 100;
    
    if (porcentajeFaltas > 50) {
      return 'calendario-dia--critico';
    } else if (porcentajeFaltas > 20) {
      return 'calendario-dia--advertencia';
    } else if (porcentajeCompletos > 80) {
      return 'calendario-dia--excelente';
    } else {
      return 'calendario-dia--bueno';
    }
  };

  // Obtener nombre del mes
  const nombreMes = new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-MX', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="calendario-asistencia">
      <div className="calendario-header">
        <h3 className="calendario-titulo">📅 {nombreMes}</h3>
        <div className="calendario-leyenda">
          <div className="leyenda-item">
            <span className="leyenda-color leyenda-color--excelente"></span>
            <span>Excelente (&gt;80%)</span>
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color leyenda-color--bueno"></span>
            <span>Bueno</span>
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color leyenda-color--advertencia"></span>
            <span>Faltas (20-50%)</span>
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color leyenda-color--critico"></span>
            <span>Crítico (&gt;50%)</span>
          </div>
          <div className="leyenda-item">
            <span className="leyenda-color leyenda-color--no-laborable"></span>
            <span>Fin de semana</span>
          </div>
        </div>
      </div>

      <div className="calendario-grid">
        {/* Cabecera de días de la semana */}
        <div className="calendario-semana-header">
          <div className="calendario-dia-nombre">Dom</div>
          <div className="calendario-dia-nombre">Lun</div>
          <div className="calendario-dia-nombre">Mar</div>
          <div className="calendario-dia-nombre">Mié</div>
          <div className="calendario-dia-nombre">Jue</div>
          <div className="calendario-dia-nombre">Vie</div>
          <div className="calendario-dia-nombre">Sáb</div>
        </div>

        {/* Días del mes */}
        <div className="calendario-dias">
          {/* Espacios vacíos hasta el primer día */}
          {Array.from({ length: new Date(diasCalendario[0] + 'T00:00:00').getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="calendario-dia calendario-dia--vacio"></div>
          ))}

          {/* Días del mes */}
          {diasCalendario.map(fecha => {
            const stats = getEstadisticasDia(fecha);
            const colorClass = getColorDia(fecha);
            const dia = new Date(fecha + 'T00:00:00').getDate();
            
            return (
              <div
                key={fecha}
                className={`calendario-dia ${colorClass} ${onDiaClick ? 'calendario-dia--clickable' : ''}`}
                onClick={() => onDiaClick && onDiaClick(fecha)}
                title={`${fecha}: ${stats.completos} completos, ${stats.faltas} faltas`}
              >
                <div className="calendario-dia-numero">{dia}</div>
                {!stats.noLaborable && stats.total > 0 && (
                  <div className="calendario-dia-stats">
                    <span className="stat-completos">{stats.completos}</span>
                    {stats.faltas > 0 && (
                      <span className="stat-faltas">-{stats.faltas}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CalendarioAsistencia;

