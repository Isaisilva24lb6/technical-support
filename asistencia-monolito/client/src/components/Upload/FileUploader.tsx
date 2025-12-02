import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { FaFileExcel, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import './FileUploader.css';

interface FileUploaderProps {
  onFileSelect?: (file: File) => void;
  disabled?: boolean;
}

function FileUploader({ onFileSelect, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validar que el archivo sea Excel
  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xlsx',
      '.xls'
    ];
    
    const isValid = validTypes.some(type => 
      file.type === type || file.name.toLowerCase().endsWith(type)
    );

    if (!isValid) {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return false;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('El archivo es muy grande. Tamaño máximo: 10MB');
      return false;
    }

    setError(null);
    return true;
  };

  // Manejar drag over
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Manejar drag leave
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Manejar drop
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    }
  };

  // Manejar selección desde input
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    }
  };

  // Abrir explorador de archivos
  const handleButtonClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  // Remover archivo seleccionado
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="file-uploader">
      {/* Área de drag & drop */}
      <div
        className={`drop-zone ${isDragging ? 'drop-zone--dragging' : ''} ${selectedFile ? 'drop-zone--has-file' : ''} ${disabled ? 'drop-zone--disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        {!selectedFile ? (
          <>
            <FaCloudUploadAlt className="drop-zone-icon" />
            <h3 className="drop-zone-title">
              {isDragging ? '¡Suelta el archivo aquí!' : 'Arrastra tu archivo Excel aquí'}
            </h3>
            <p className="drop-zone-subtitle">
              o haz clic para seleccionar desde tu computadora
            </p>
            <p className="drop-zone-info">
              Formatos: .xlsx, .xls • Tamaño máximo: 10MB
            </p>
          </>
        ) : (
          <div className="file-preview">
            <FaFileExcel className="file-icon" />
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              className="btn btn--icon remove-file-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              title="Remover archivo"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="file-error">
          ⚠️ {error}
        </div>
      )}

      {/* Botones de acción */}
      {selectedFile && !error && (
        <div className="upload-actions">
          <button className="btn btn--primary btn--large">
            <FaCloudUploadAlt /> Procesar Archivo
          </button>
          <button className="btn btn--secondary" onClick={handleRemoveFile}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUploader;

