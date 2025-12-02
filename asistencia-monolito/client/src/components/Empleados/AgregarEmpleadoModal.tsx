// client/src/components/Empleados/AgregarEmpleadoModal.tsx
// Modal para agregar un nuevo empleado manualmente

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { type EmployeeData } from '../../services/api';

interface AgregarEmpleadoModalProps {
  onSave: (empleado: Omit<EmployeeData, 'id'>) => void;
  onCancel: () => void;
}

function AgregarEmpleadoModal({ onSave, onCancel }: AgregarEmpleadoModalProps) {
  const [formData, setFormData] = useState<Omit<EmployeeData, 'id'>>({
    num: '',
    nombre: '',
    correo: '',
    departamento: 'aca',
    grupo: '',
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Bloquear scroll del body cuando el modal está abierto
    const originalOverflow = document.body.style.overflow;
    
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.num || formData.num.trim().length === 0) {
      newErrors.num = 'El número es requerido';
    }

    if (!formData.nombre || formData.nombre.trim().length === 0) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (formData.correo && formData.correo.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.correo)) {
        newErrors.correo = 'Correo electrónico inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setSaving(true);
      try {
        await onSave(formData);
      } catch (error) {
        console.error('[FRONTEND ERROR] Error al guardar:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return createPortal(
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        overflow: 'hidden'
      }}
      onClick={handleOverlayClick}
    >
      <div 
        style={{
          background: 'var(--card-bg, #1e293b)',
          borderRadius: '10px',
          padding: '20px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-primary, #f1f5f9)', fontSize: '1.2em' }}>
          ➕ Agregar Nuevo Empleado
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Número */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: 600,
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.9em'
            }}>
              Número de Empleado *
            </label>
            <input
              type="text"
              value={formData.num}
              onChange={(e) => handleChange('num', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.num ? '2px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.3)',
                background: 'var(--input-bg, #0f172a)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px'
              }}
              placeholder="Ej: 1, 48, 100"
              autoFocus
            />
            {errors.num && (
              <span style={{ color: '#ef4444', fontSize: '0.8em', marginTop: '2px', display: 'block' }}>
                {errors.num}
              </span>
            )}
            <span style={{ color: '#94a3b8', fontSize: '0.75em', marginTop: '2px', display: 'block' }}>
              Número único que identifica al empleado
            </span>
          </div>

          {/* Nombre */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: 600,
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.9em'
            }}>
              Nombre Completo *
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.nombre ? '2px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.3)',
                background: 'var(--input-bg, #0f172a)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px'
              }}
              placeholder="Nombre completo del empleado"
            />
            {errors.nombre && (
              <span style={{ color: '#ef4444', fontSize: '0.8em', marginTop: '2px', display: 'block' }}>
                {errors.nombre}
              </span>
            )}
          </div>

          {/* Correo */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: 600,
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.9em'
            }}>
              Correo Electrónico
            </label>
            <input
              type="email"
              value={formData.correo || ''}
              onChange={(e) => handleChange('correo', e.target.value || '')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.correo ? '2px solid #ef4444' : '1px solid rgba(148, 163, 184, 0.3)',
                background: 'var(--input-bg, #0f172a)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px'
              }}
              placeholder="correo@ejemplo.com (opcional)"
            />
            {errors.correo && (
              <span style={{ color: '#ef4444', fontSize: '0.8em', marginTop: '2px', display: 'block' }}>
                {errors.correo}
              </span>
            )}
          </div>

          {/* Departamento */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: 600,
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.9em'
            }}>
              Departamento
            </label>
            <input
              type="text"
              value={formData.departamento}
              onChange={(e) => handleChange('departamento', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'var(--input-bg, #0f172a)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px'
              }}
              placeholder="Ej: aca, ventas, IT"
            />
          </div>

          {/* Grupo */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '4px', 
              fontWeight: 600,
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: '0.9em'
            }}>
              Grupo
            </label>
            <input
              type="text"
              value={formData.grupo || ''}
              onChange={(e) => handleChange('grupo', e.target.value || '')}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'var(--input-bg, #0f172a)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: '14px'
              }}
              placeholder="Ej: A, B, C (opcional)"
            />
          </div>

          {/* Activo */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              userSelect: 'none'
            }}>
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) => handleChange('activo', e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span style={{ fontWeight: 600, color: 'var(--text-primary, #f1f5f9)', fontSize: '0.9em' }}>
                Empleado Activo
              </span>
            </label>
          </div>

          {/* Botones */}
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'flex-end',
            marginTop: '16px'
          }}>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onCancel}
              disabled={saving}
              style={{ fontSize: '0.9em', padding: '8px 16px' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
              style={{ fontSize: '0.9em', padding: '8px 16px' }}
            >
              {saving ? '💾 Guardando...' : '➕ Crear Empleado'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default AgregarEmpleadoModal;

