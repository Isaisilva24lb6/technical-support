import { useState, useEffect } from 'react';
import { type EmpleadoAsistencia, asistenciaApi, handleApiError } from '../../services/api';

interface Props {
  empleados: EmpleadoAsistencia[];
  onValidationComplete: (empleadosValidados: EmpleadoAsistencia[]) => void;
}

function AsistenciaValidationTable({ empleados, onValidationComplete }: Props) {
  const [empleadosConValidacion, setEmpleadosConValidacion] = useState<EmpleadoAsistencia[]>([]);
  const [validando, setValidando] = useState(true);
  const [empleadosNoEncontrados, setEmpleadosNoEncontrados] = useState<string[]>([]);

  useEffect(() => {
    validarEmpleados();
  }, [empleados]);

  const validarEmpleados = async () => {
    try {
      setValidando(true);
      
      // Extraer números únicos de empleados
      const nums = [...new Set(empleados.map(e => e.num))];
      
      console.log('[VALIDACIÓN] Verificando empleados:', nums);
      
      // Consultar empleados en la BD
      const { empleados: empleadosEnBD } = await asistenciaApi.verifyEmployees(nums);
      
      // Crear mapa de empleados encontrados
      const empleadosMap = new Map(
        empleadosEnBD.map(emp => [emp.num, emp])
      );
      
      // Marcar cuáles existen y cuáles no
      const validados = empleados.map(emp => {
        const empleadoEnBD = empleadosMap.get(emp.num);
        
        if (empleadoEnBD) {
          return {
            ...emp,
            existeEnBD: true,
            id: empleadoEnBD.id,
            nombre: empleadoEnBD.nombre, // Usar nombre de BD (más confiable)
            nombreExcel: emp.nombre, // Mantener nombre del Excel
            correo: empleadoEnBD.correo,
            departamento: empleadoEnBD.departamento,
            grupo: empleadoEnBD.grupo,
            activo: empleadoEnBD.activo
          };
        } else {
          return {
            ...emp,
            existeEnBD: false,
            nombreExcel: emp.nombre // Guardar nombre del Excel
          };
        }
      });
      
      // Identificar empleados no encontrados
      const noEncontrados = validados
        .filter(e => !e.existeEnBD)
        .map(e => e.num);
      
      setEmpleadosNoEncontrados(noEncontrados);
      setEmpleadosConValidacion(validados);
      onValidationComplete(validados);
      
      console.log('[VALIDACIÓN] Empleados validados:', validados.length);
      console.log('[VALIDACIÓN] Empleados no encontrados:', noEncontrados.length);
      
    } catch (error) {
      const errorMsg = handleApiError(error);
      console.error('[VALIDACIÓN ERROR]', errorMsg);
      alert('❌ Error al validar empleados: ' + errorMsg);
    } finally {
      setValidando(false);
    }
  };

  // Función deshabilitada - no mostramos marcas en esta vista
  // const contarMarcasPorEmpleado = (num: string) => {
  //   return marcas.filter(m => m.num_empleado === num).length;
  // };

  if (validando) {
    return (
      <div style={{ 
        background: 'rgba(59, 130, 246, 0.1)', 
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#3b82f6', margin: 0 }}>
          🔄 Verificando empleados en la base de datos...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Resumen de Validación */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          background: 'rgba(34, 197, 94, 0.1)', 
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <p style={{ margin: 0, fontSize: '0.9em', color: '#22c55e' }}>Empleados Validados</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '2em', fontWeight: 'bold', color: '#22c55e' }}>
            {empleadosConValidacion.filter(e => e.existeEnBD).length}
          </p>
        </div>

        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <p style={{ margin: 0, fontSize: '0.9em', color: '#ef4444' }}>Empleados No Encontrados</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '2em', fontWeight: 'bold', color: '#ef4444' }}>
            {empleadosNoEncontrados.length}
          </p>
        </div>
      </div>

      {/* Advertencia si hay empleados no encontrados */}
      {empleadosNoEncontrados.length > 0 && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <h4 style={{ color: '#ef4444', marginTop: 0 }}>
            ⚠️ Empleados no registrados en la base de datos
          </h4>
          <p style={{ color: '#ef4444', margin: '8px 0' }}>
            Los siguientes empleados NO están en tu catálogo de empleados:
          </p>
          <div style={{ marginTop: '12px' }}>
            <table style={{ width: '100%', fontSize: '0.9em' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#ef4444' }}>Número</th>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#ef4444' }}>Nombre (según Excel)</th>
                </tr>
              </thead>
              <tbody>
                {empleadosConValidacion
                  .filter(e => !e.existeEnBD)
                  .map((empleado, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <td style={{ padding: '8px' }}>
                        <strong style={{ color: '#ef4444' }}>#{empleado.num}</strong>
                      </td>
                      <td style={{ padding: '8px', color: '#ef4444' }}>
                        {empleado.nombreExcel || empleado.nombre || '(Sin nombre)'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: '#ef4444', margin: '12px 0 0 0', fontSize: '0.9em' }}>
            💡 <strong>Recomendación:</strong> Agrega estos empleados a tu catálogo antes de importar la asistencia.
          </p>
        </div>
      )}

      {/* Tabla de Empleados */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Estado</th>
              <th>Número</th>
              <th>Nombre</th>
              <th>Departamento</th>
              <th>Grupo</th>
            </tr>
          </thead>
          <tbody>
            {empleadosConValidacion.map((empleado, idx) => (
              <tr 
                key={idx}
                style={{
                  background: empleado.existeEnBD 
                    ? 'rgba(34, 197, 94, 0.05)' 
                    : 'rgba(239, 68, 68, 0.05)'
                }}
              >
                <td>
                  {empleado.existeEnBD ? (
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ Validado</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗ No encontrado</span>
                  )}
                </td>
                <td>
                  <strong>{empleado.num}</strong>
                </td>
                <td>
                  {empleado.existeEnBD ? (
                    empleado.nombre
                  ) : (
                    <>
                      {empleado.nombreExcel || empleado.nombre || '(Sin nombre)'}
                      {empleado.nombreExcel && (
                        <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '8px' }}>
                          (del Excel)
                        </span>
                      )}
                    </>
                  )}
                </td>
                <td>{empleado.departamento || '-'}</td>
                <td>{empleado.grupo || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Información adicional */}
      <div style={{ 
        marginTop: '20px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '8px',
        fontSize: '0.9em'
      }}>
        <p style={{ margin: 0 }}>
          ℹ️ Solo se guardará la asistencia de empleados validados (con ✓).
        </p>
      </div>
    </div>
  );
}

export default AsistenciaValidationTable;

