// client/src/components/Asistencia/GraficasAsistencia.tsx
// Gráficas visuales para análisis de asistencia

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { type RegistroDiario } from '../../services/api';
import './GraficasAsistencia.css';

interface GraficasAsistenciaProps {
  registros: RegistroDiario[];
}

const COLORS = {
  completo: '#10b981',
  incompleto: '#f59e0b',
  falta: '#ef4444',
  retardo: '#f59e0b',
  horasTrabajadas: '#3b82f6'
};

function GraficasAsistencia({ registros }: GraficasAsistenciaProps) {

  // Filtrar solo días laborables para estadísticas
  const registrosLaborables = useMemo(() => 
    registros.filter(r => r.es_laborable === 1),
    [registros]
  );

  // Datos para gráfica de estados (Pie Chart)
  const datosEstados = useMemo(() => {
    const estados = registrosLaborables.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { name: 'Completos', value: estados['Completo'] || 0, color: COLORS.completo },
      { name: 'Incompletos', value: estados['Incompleto'] || 0, color: COLORS.incompleto },
      { name: 'Faltas', value: estados['Falta'] || 0, color: COLORS.falta }
    ].filter(d => d.value > 0);
  }, [registrosLaborables]);

  // Datos por empleado para gráfica de barras
  const datosPorEmpleado = useMemo(() => {
    const empleados = registrosLaborables.reduce((acc, r) => {
      if (!acc[r.num_empleado]) {
        acc[r.num_empleado] = {
          nombre: r.nombre_empleado,
          num: r.num_empleado,
          completos: 0,
          faltas: 0,
          retardos: 0,
          horasTrabajadas: 0
        };
      }
      const emp = acc[r.num_empleado];
      if (r.estado === 'Completo') emp.completos++;
      if (r.estado === 'Falta') emp.faltas++;
      if (r.minutos_retardo > 0) emp.retardos++;
      emp.horasTrabajadas += r.minutos_trabajados / 60;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(empleados)
      .sort((a: any, b: any) => parseInt(a.num) - parseInt(b.num))
      .slice(0, 15); // Top 15 empleados
  }, [registrosLaborables]);

  // Datos de asistencia por día (para línea temporal)
  const datosPorDia = useMemo(() => {
    const dias = registrosLaborables.reduce((acc, r) => {
      if (!acc[r.fecha]) {
        acc[r.fecha] = {
          fecha: new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'short' 
          }),
          completos: 0,
          faltas: 0,
          total: 0
        };
      }
      const dia = acc[r.fecha];
      dia.total++;
      if (r.estado === 'Completo') dia.completos++;
      if (r.estado === 'Falta') dia.faltas++;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(dias)
      .map((d: any) => ({
        ...d,
        porcentajeAsistencia: ((d.completos / d.total) * 100).toFixed(1)
      }))
      .slice(0, 31); // Máximo 31 días
  }, [registrosLaborables]);

  // Calcular porcentajes globales
  const estadisticasGlobales = useMemo(() => {
    const total = registrosLaborables.length;
    const completos = registrosLaborables.filter(r => r.estado === 'Completo').length;
    const faltas = registrosLaborables.filter(r => r.estado === 'Falta').length;
    const retardos = registrosLaborables.filter(r => r.minutos_retardo > 0).length;

    return {
      porcentajeAsistencia: ((completos / total) * 100).toFixed(1),
      porcentajeFaltas: ((faltas / total) * 100).toFixed(1),
      porcentajeRetardos: ((retardos / total) * 100).toFixed(1),
      totalRegistros: total
    };
  }, [registrosLaborables]);

  return (
    <div className="graficas-asistencia">
      {/* Estadísticas Globales */}
      <div className="stats-globales">
        <div className="stat-card stat-card--success">
          <p className="stat-label">Asistencia Global</p>
          <p className="stat-value">{estadisticasGlobales.porcentajeAsistencia}%</p>
          <p className="stat-detail">{registrosLaborables.filter(r => r.estado === 'Completo').length} de {estadisticasGlobales.totalRegistros}</p>
        </div>
        <div className="stat-card stat-card--error">
          <p className="stat-label">Faltas</p>
          <p className="stat-value">{estadisticasGlobales.porcentajeFaltas}%</p>
          <p className="stat-detail">{registrosLaborables.filter(r => r.estado === 'Falta').length} registros</p>
        </div>
        <div className="stat-card stat-card--warning">
          <p className="stat-label">Retardos</p>
          <p className="stat-value">{estadisticasGlobales.porcentajeRetardos}%</p>
          <p className="stat-detail">{registrosLaborables.filter(r => r.minutos_retardo > 0).length} días</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="graficas-grid">
        
        {/* Gráfica de Pastel - Estados */}
        <div className="grafica-card">
          <h4 className="grafica-titulo">📊 Distribución de Estados</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={datosEstados}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {datosEstados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de Línea - Asistencia por día */}
        <div className="grafica-card">
          <h4 className="grafica-titulo">📈 Asistencia por Día</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={datosPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="porcentajeAsistencia" 
                name="% Asistencia"
                stroke={COLORS.horasTrabajadas} 
                strokeWidth={2}
                dot={{ fill: COLORS.horasTrabajadas }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de Barras - Faltas por Empleado */}
        <div className="grafica-card grafica-card--full">
          <h4 className="grafica-titulo">👥 Asistencia y Faltas por Empleado (Top 15)</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={datosPorEmpleado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="num" tick={{ fontSize: 12 }} label={{ value: 'Número de Empleado', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completos" name="Días Completos" fill={COLORS.completo} />
              <Bar dataKey="faltas" name="Faltas" fill={COLORS.falta} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de Barras - Retardos por Empleado */}
        <div className="grafica-card grafica-card--full">
          <h4 className="grafica-titulo">⏰ Retardos por Empleado (Top 15)</h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={datosPorEmpleado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="num" tick={{ fontSize: 12 }} label={{ value: 'Número de Empleado', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="retardos" name="Días con Retardo" fill={COLORS.retardo} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default GraficasAsistencia;

