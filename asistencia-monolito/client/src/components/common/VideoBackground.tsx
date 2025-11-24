import { useEffect, useState } from 'react';
import './VideoBackground.css';

interface VideoBackgroundProps {
  videoUrl?: string;
  opacity?: number;
  enableOnMobile?: boolean;
}

function VideoBackground({ 
  videoUrl = '/videos/background.mp4',
  opacity = 0.15,
  enableOnMobile = false 
}: VideoBackgroundProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Detectar si es dispositivo móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // No renderizar en móviles (a menos que se habilite explícitamente)
  if (isMobile && !enableOnMobile) {
    return null;
  }

  return (
    <div className="video-background-container">
      <video
        autoPlay
        muted
        loop
        playsInline
        className={`video-background ${isLoaded ? 'loaded' : ''}`}
        style={{ opacity: isLoaded ? opacity : 0 }}
        onLoadedData={() => setIsLoaded(true)}
        src={videoUrl}
      >
        Tu navegador no soporta videos HTML5.
      </video>
      
      {/* Overlay adicional para suavizar el efecto */}
      <div className="video-overlay"></div>
    </div>
  );
}

export default VideoBackground;


