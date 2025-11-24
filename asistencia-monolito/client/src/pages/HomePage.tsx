import { Link } from 'react-router-dom';
import VideoBackground from '../components/common/VideoBackground';
import FileUploader from '../components/Upload/FileUploader';

function HomePage() {
  const handleFileSelect = (file: File) => {
    console.log('Archivo seleccionado:', file.name);
    // Aquí irá la lógica para subir el archivo al backend
  };

  return (
    <>
      {/* Video de fondo solo en la página principal */}
      <VideoBackground 
        videoUrl="/videos/videocorporativo.mp4"
        opacity={0.55}
        enableOnMobile={false}
      />
      
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">📊 Sistema de Asistencia</h1>
          <p className="page-subtitle">
            Sube y procesa archivos Excel de asistencia de empleados
          </p>
        </div>

        <div className="card">
          <h2>Bienvenido al Sistema de Asistencia</h2>
          <p className="text-muted mt-2">
            Aquí podrás subir archivos Excel de asistencia y gestionar los periodos procesados.
          </p>
          <div className="mt-3">
            <FileUploader onFileSelect={handleFileSelect} />
          </div>
        </div>

        <div className="card mt-4">
          <h3>Historial de Importaciones</h3>
          <p className="text-muted mt-1">
            Próximamente: Tabla con el historial de archivos procesados
          </p>
        </div>

        <div className="card mt-4">
          <h3>💡 ¿Nuevo en el sistema?</h3>
          <p className="text-muted mt-1">
            Antes de procesar asistencias, asegúrate de tener tu base de datos de empleados actualizada.
          </p>
          <Link to="/empleados" className="btn btn--primary mt-2">
            Ir a Gestión de Empleados
          </Link>
        </div>
      </div>
    </>
  );
}

export default HomePage;


