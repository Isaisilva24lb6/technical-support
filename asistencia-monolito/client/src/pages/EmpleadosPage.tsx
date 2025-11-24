// client/src/pages/EmpleadosPage.tsx
// Página de gestión de empleados (con video background condicional)

import { useState } from 'react';
import VideoBackground from '../components/common/VideoBackground';
import EmployeeImporter from '../components/Employee/EmployeeImporter';

function EmpleadosPage() {
  const [showVideo, setShowVideo] = useState(true);

  return (
    <>
      {/* Video de fondo solo cuando NO hay Excel cargado */}
      {showVideo && (
        <VideoBackground 
          videoUrl="/videos/videocorporativo.mp4"
          opacity={0.55}
          enableOnMobile={false}
        />
      )}
      
      <div className="main-container">
        <div className="page-header">
          <h1 className="page-title">👥 Gestión de Empleados</h1>
          <p className="page-subtitle">
            Importa y administra la base de datos de empleados con cuentas Microsoft
          </p>
        </div>

        <EmployeeImporter onStepChange={(step) => setShowVideo(step === 'upload')} />
      </div>
    </>
  );
}

export default EmpleadosPage;

