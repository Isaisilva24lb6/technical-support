import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes, FaMoon, FaSun, FaChartBar } from 'react-icons/fa';
import './Navbar.css';

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Cargar preferencia de tema desde localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.body.classList.add('dark-mode');
    }
  }, []);

  // Toggle de tema oscuro
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  // Cerrar menú móvil cuando se hace clic en un enlace
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          <FaChartBar className="logo-icon" />
          <span className="logo-text">Asistencia</span>
        </Link>

        {/* Menú Desktop */}
        <div className="nav-links desktop-menu">
          <Link to="/" className="nav-link">
            Inicio
          </Link>
          <Link to="/empleados" className="nav-link">
            Empleados
          </Link>
          <Link to="/periodos" className="nav-link">
            Periodos
          </Link>
        </div>

        {/* Acciones de navegación */}
        <div className="nav-actions">
          {/* Toggle de tema */}
          <button
            className="btn btn--icon theme-toggle"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>

          {/* Botón menú móvil */}
          <button
            className="btn btn--icon mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Menú Móvil */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <Link to="/" className="mobile-menu-link" onClick={handleLinkClick}>
            Inicio
          </Link>
          <Link to="/empleados" className="mobile-menu-link" onClick={handleLinkClick}>
            Empleados
          </Link>
          <Link to="/periodos" className="mobile-menu-link" onClick={handleLinkClick}>
            Periodos
          </Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;


