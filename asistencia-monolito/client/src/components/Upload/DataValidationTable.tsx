import { useState } from 'react';
import { FaCheck, FaTimes, FaEdit, FaExclamationTriangle } from 'react-icons/fa';
import type { EmployeeData } from '../../services/api';
import './DataValidationTable.css';

interface DataValidationTableProps {
  data: EmployeeData[];
  onConfirm: (validatedData: EmployeeData[]) => void;
  onCancel: () => void;
}

function DataValidationTable({ data: initialData, onConfirm, onCancel }: DataValidationTableProps) {
  const [data, setData] = useState<EmployeeData[]>(initialData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<EmployeeData | null>(null);

  // Iniciar edición de una fila
  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditedRow({ ...data[index] });
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingIndex(null);
    setEditedRow(null);
  };

  // Guardar cambios de una fila
  const saveEdit = () => {
    if (editingIndex !== null && editedRow) {
      const newData = [...data];
      newData[editingIndex] = editedRow;
      setData(newData);
      setEditingIndex(null);
      setEditedRow(null);
    }
  };

  // Actualizar campo editado
  const updateField = (field: keyof EmployeeData, value: string) => {
    if (editedRow) {
      setEditedRow({ ...editedRow, [field]: value });
    }
  };

  // Contar advertencias
  const warningsCount = data.filter(row => row.warnings && row.warnings.length > 0).length;

  return (
    <div className="data-validation-container">
      {/* Header */}
      <div className="validation-header">
        <h2>📋 Validación de Datos Detectados</h2>
        <p className="validation-subtitle">
          Revisa los datos extraídos del Excel. Puedes editar cualquier campo antes de procesar.
        </p>
        {warningsCount > 0 && (
          <div className="validation-warning-banner">
            <FaExclamationTriangle /> {warningsCount} registros con advertencias
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="validation-stats">
        <div className="stat-card">
          <span className="stat-number">{data.length}</span>
          <span className="stat-label">Empleados Detectados</span>
        </div>
        <div className="stat-card stat-card--warning">
          <span className="stat-number">{warningsCount}</span>
          <span className="stat-label">Con Advertencias</span>
        </div>
        <div className="stat-card stat-card--success">
          <span className="stat-number">{data.length - warningsCount}</span>
          <span className="stat-label">Sin Problemas</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="validation-table-container">
        <table className="validation-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Número</th>
              <th>Nombre</th>
              <th>Correo Electrónico</th>
              <th>Departamento</th>
              <th>Grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={index} 
                className={`${(row.warnings && row.warnings.length > 0) ? 'row-warning' : ''} ${editingIndex === index ? 'row-editing' : ''}`}
              >
                <td>{index + 1}</td>
                
                {editingIndex === index && editedRow ? (
                  // Modo edición
                  <>
                    <td>
                      <input
                        type="text"
                        value={editedRow.num}
                        onChange={(e) => updateField('num', e.target.value)}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedRow.nombre}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        value={editedRow.correo || ''}
                        onChange={(e) => updateField('correo', e.target.value || '')}
                        className="edit-input"
                        placeholder="empleado@empresa.com"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedRow.departamento || ''}
                        onChange={(e) => updateField('departamento', e.target.value || '')}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={editedRow.grupo || ''}
                        onChange={(e) => updateField('grupo', e.target.value || '')}
                        className="edit-input"
                      />
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-action btn-action--success"
                          onClick={saveEdit}
                          title="Guardar"
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="btn-action btn-action--danger"
                          onClick={cancelEdit}
                          title="Cancelar"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Modo vista
                  <>
                    <td>{row.num}</td>
                    <td>{row.nombre}</td>
                    <td>
                      {row.correo || (
                        <span className="text-muted">
                          <FaExclamationTriangle className="warning-icon" /> Sin correo
                        </span>
                      )}
                    </td>
                    <td>{row.departamento}</td>
                    <td>{row.grupo || '-'}</td>
                    <td>
                      <button
                        className="btn-action btn-action--primary"
                        onClick={() => startEdit(index)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="validation-actions">
        <button className="btn btn--secondary btn--large" onClick={onCancel}>
          <FaTimes /> Cancelar
        </button>
        <button 
          className="btn btn--success btn--large" 
          onClick={() => onConfirm(data)}
          disabled={editingIndex !== null}
        >
          <FaCheck /> Confirmar y Procesar ({data.length} empleados)
        </button>
      </div>

      {/* Help Text */}
      <div className="validation-help">
        <p>
          💡 <strong>Tip:</strong> Haz clic en el botón <FaEdit /> para editar cualquier campo. 
          Los empleados sin correo no recibirán notificaciones automáticas.
        </p>
      </div>
    </div>
  );
}

export default DataValidationTable;

