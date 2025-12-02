// client/src/components/Empleados/EmpleadosTable.tsx
// Tabla para mostrar, editar y eliminar empleados

import { useState, useEffect } from 'react';
import { empleadosApi, handleApiError, type EmployeeData } from '../../services/api';
import EditarEmpleadoModal from './EditarEmpleadoModal';
import AgregarEmpleadoModal from './AgregarEmpleadoModal';

interface EmpleadosTableProps {
  onEmployeeChange?: () => void;
}

function EmpleadosTable({ onEmployeeChange }: EmpleadosTableProps) {
  const [empleados, setEmpleados] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [editingEmpleado, setEditingEmpleado] = useState<EmployeeData | null>(null);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Cargar empleados al montar
  useEffect(() => {
    loadEmpleados();
  }, []);

  const loadEmpleados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await empleadosApi.getAll();
      setEmpleados(data);
      console.log('[FRONTEND] Tabla empleados cargada:', data.length);
    } catch (err) {
      const errorMsg = handleApiError(err);
      console.error('[FRONTEND ERROR]', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRefresh = () => {
    loadEmpleados();
  };

  const handleEdit = (empleado: EmployeeData) => {
    setEditingEmpleado(empleado);
  };

  const handleSaveEdit = async (empleadoActualizado: EmployeeData) => {
    try {
      setSaving(true);
      await empleadosApi.update(empleadoActualizado.id, empleadoActualizado);
      console.log('[FRONTEND] Empleado actualizado:', empleadoActualizado.nombre);
      
      // Cerrar modal
      setEditingEmpleado(null);
      
      // Recargar lista
      await loadEmpleados();
      
      // Notificar al padre
      if (onEmployeeChange) {
        onEmployeeChange();
      }
      
      alert('✅ Empleado actualizado exitosamente');
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert(`❌ Error al actualizar: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmpleado(null);
  };

  const handleAgregar = () => {
    setShowAgregarModal(true);
  };

  const handleSaveNew = async (nuevoEmpleado: Omit<EmployeeData, 'id'>) => {
    try {
      setSaving(true);
      await empleadosApi.create(nuevoEmpleado);
      console.log('[FRONTEND] Empleado creado:', nuevoEmpleado.nombre);
      
      // Cerrar modal
      setShowAgregarModal(false);
      
      // Recargar lista
      await loadEmpleados();
      
      // Notificar al padre
      if (onEmployeeChange) {
        onEmployeeChange();
      }
      
      alert('✅ Empleado creado exitosamente');
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert(`❌ Error al crear empleado: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelNew = () => {
    setShowAgregarModal(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      console.log('[FRONTEND] Exportando empleados a Excel...');
      await empleadosApi.export();
      console.log('[FRONTEND] ✅ Excel descargado exitosamente');
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert(`❌ Error al exportar: ${errorMsg}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (empleado: EmployeeData) => {
    const confirmacion = window.confirm(
      `¿Estás seguro de que quieres eliminar a ${empleado.nombre}?\n\n` +
      `Número: ${empleado.num}\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      setDeleting(empleado.id);
      await empleadosApi.delete(empleado.id);
      console.log('[FRONTEND] Empleado eliminado:', empleado.nombre);
      
      // Recargar lista
      await loadEmpleados();
      
      // Notificar al padre que cambió la cantidad de empleados
      if (onEmployeeChange) {
        onEmployeeChange();
      }
      
    } catch (err) {
      const errorMsg = handleApiError(err);
      alert(`❌ Error al eliminar: ${errorMsg}`);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p style={{ textAlign: 'center', color: '#94a3b8' }}>
          ⏳ Cargando empleados...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
        <p style={{ color: '#ef4444', fontWeight: 'bold' }}>
          ❌ Error al cargar empleados
        </p>
        <p style={{ color: '#ef4444', fontSize: '0.9em', marginTop: '8px' }}>
          {error}
        </p>
        <button 
          className="btn btn--secondary mt-2"
          onClick={handleRefresh}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  if (empleados.length === 0) {
    return (
      <div className="card" style={{ background: 'rgba(59, 130, 246, 0.05)', textAlign: 'center' }}>
        <p style={{ fontSize: '2em', margin: '20px 0 10px' }}>📭</p>
        <h3 style={{ margin: 0 }}>No hay empleados registrados</h3>
        <p className="text-muted mt-1">
          Importa un archivo Excel para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>👥 Empleados Registrados ({empleados.length})</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className="btn btn--primary"
            onClick={handleAgregar}
            disabled={saving}
            style={{ fontSize: '0.9em' }}
          >
            ➕ Agregar Empleado
          </button>
          <button 
            className="btn"
            onClick={handleExport}
            disabled={exporting || empleados.length === 0}
            style={{ 
              fontSize: '0.9em',
              background: 'rgba(34, 197, 94, 0.1)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}
          >
            {exporting ? '⏳ Exportando...' : '📥 Exportar Excel'}
          </button>
          <button 
            className="btn btn--secondary"
            onClick={handleRefresh}
            style={{ fontSize: '0.9em' }}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Tabla responsive */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '0.9em'
        }}>
          <thead>
            <tr style={{ 
              background: 'rgba(99, 102, 241, 0.1)',
              borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
            }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Núm</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Nombre</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Correo</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Departamento</th>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Grupo</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((emp, index) => (
              <tr 
                key={emp.id}
                style={{ 
                  borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                  background: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'transparent'
                }}
              >
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    background: 'rgba(99, 102, 241, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    {emp.num}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                  {emp.nombre}
                </td>
                <td style={{ padding: '12px 8px', color: '#64748b' }}>
                  {emp.correo || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Sin correo</span>}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    color: '#16a34a',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    fontWeight: 600
                  }}>
                    {emp.departamento}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {emp.grupo || '-'}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  {emp.activo ? (
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ Activo</span>
                  ) : (
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Inactivo</span>
                  )}
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => handleEdit(emp)}
                      disabled={saving}
                      style={{
                        fontSize: '0.85em',
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}
                      title="Editar empleado"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleDelete(emp)}
                      disabled={deleting === emp.id}
                      style={{
                        fontSize: '0.85em',
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}
                      title="Eliminar empleado"
                    >
                      {deleting === emp.id ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '0.9em', color: '#64748b' }}>
          <strong>Total:</strong> {empleados.length} empleados
          {' • '}
          <strong>Activos:</strong> {empleados.filter(e => e.activo).length}
          {' • '}
          <strong>Inactivos:</strong> {empleados.filter(e => !e.activo).length}
        </div>
      </div>

      {/* Modal de edición */}
      {editingEmpleado && (
        <EditarEmpleadoModal
          empleado={editingEmpleado}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Modal de agregar empleado */}
      {showAgregarModal && (
        <AgregarEmpleadoModal
          onSave={handleSaveNew}
          onCancel={handleCancelNew}
        />
      )}
    </div>
  );
}

export default EmpleadosTable;

