# 🎨 Arquitectura del Frontend - Sistema de Asistencia

## 📋 Índice

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura de Carpetas](#estructura-de-carpetas)
3. [Sistema de Diseño](#sistema-de-diseño)
4. [Componentes Implementados](#componentes-implementados)
5. [Efectos Visuales](#efectos-visuales)
6. [Responsividad](#responsividad)
7. [Rutas y Navegación](#rutas-y-navegación)
8. [Guía de Estilos](#guía-de-estilos)

---

## 🛠️ Stack Tecnológico

### Dependencias Principales

```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^6.x.x",
  "react-icons": "^5.x.x",
  "vite": "^7.2.2",
  "typescript": "~5.9.3"
}
```

### Herramientas de Desarrollo

- **Bundler:** Vite 7.2.2
- **Lenguaje:** TypeScript
- **Estilos:** CSS puro (sin preprocesadores)
- **Linting:** ESLint
- **Build Target:** ES2020

---

## 📁 Estructura de Carpetas

```
client/src/
├── components/
│   ├── common/
│   │   ├── Navbar.tsx              ✅ Implementado
│   │   ├── Navbar.css              ✅ Implementado
│   │   ├── StatusMessage.tsx       📋 Pendiente
│   │   ├── LoadingSpinner.tsx      📋 Pendiente
│   │   └── Table.tsx               📋 Pendiente
│   ├── Upload/
│   │   ├── FileUploader.tsx        📋 Pendiente
│   │   └── ImportHistory.tsx       📋 Pendiente
│   ├── Periods/
│   │   ├── PeriodsList.tsx         📋 Pendiente
│   │   └── PeriodCard.tsx          📋 Pendiente
│   └── Employee/
│       ├── EmployeeTable.tsx       📋 Pendiente
│       ├── ComparisonView.tsx      📋 Pendiente
│       └── MarksViewer.tsx         📋 Pendiente
├── pages/
│   ├── HomePage.tsx                ✅ Placeholder
│   ├── PeriodsPage.tsx             ✅ Placeholder
│   ├── EmployeeReportPage.tsx      📋 Pendiente
│   └── MarksViewerPage.tsx         📋 Pendiente
├── services/
│   ├── uploadService.js            📋 Pendiente
│   ├── periodService.js            📋 Pendiente
│   └── employeeService.js          📋 Pendiente
├── hooks/
│   └── useFileUpload.js            📋 Pendiente
├── App.tsx                         ✅ Implementado
├── App.css                         ✅ Implementado
├── main.tsx                        ✅ Original
└── index.css                       ✅ Original
```

### Estado de Implementación

| Categoría | Completado | Pendiente | Total |
|-----------|------------|-----------|-------|
| **Componentes Comunes** | 1 | 3 | 4 |
| **Páginas** | 2 | 2 | 4 |
| **Servicios** | 0 | 3 | 3 |
| **Hooks** | 0 | 1 | 1 |

---

## 🎨 Sistema de Diseño

### 1. Variables CSS Globales

Ubicación: `src/App.css`

#### Paleta de Colores

```css
:root {
  /* Colores Principales - Tema Empresarial Azul */
  --primary-color: #2563eb;        /* Azul profesional */
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  --primary-rgb: 37, 99, 235;
  
  /* Colores Funcionales */
  --success-color: #10b981;        /* Verde éxito */
  --success-hover: #059669;
  --success-light: #d1fae5;
  
  --error-color: #ef4444;          /* Rojo error */
  --error-hover: #dc2626;
  --error-light: #fee2e2;
  
  --warning-color: #f59e0b;        /* Amarillo advertencia */
  --warning-hover: #d97706;
  --warning-light: #fef3c7;
  
  --info-color: #3b82f6;           /* Azul información */
  --info-light: #dbeafe;
  
  /* Colores Base - Modo Claro */
  --bg-color: #f9fafb;
  --text-color: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --hover-bg: #f3f4f6;
  
  /* Tabla */
  --table-header-bg: #f3f4f6;
  --table-hover: #f9fafb;
  --table-border: #e5e7eb;
  
  /* Navbar */
  --navbar-bg: #ffffff;
  --navbar-border: #e5e7eb;
  --navbar-height: 70px;
}
```

#### Modo Oscuro

```css
.dark-mode {
  --bg-color: #111827;
  --text-color: #f9fafb;
  --text-secondary: #d1d5db;
  --text-muted: #9ca3af;
  --card-bg: #1f2937;
  --border-color: #374151;
  --hover-bg: #374151;
  --table-header-bg: #374151;
  --table-hover: #374151;
  --table-border: #4b5563;
  --navbar-bg: #1f2937;
  --navbar-border: #374151;
}
```

#### Sombras

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--card-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
--card-shadow-hover: 0 8px 20px rgba(0, 0, 0, 0.12);
```

#### Espaciado

```css
--border-radius: 12px;
--border-radius-sm: 8px;
--border-radius-lg: 16px;
--transition-speed: 0.3s;

--spacing-xs: 0.5rem;    /* 8px */
--spacing-sm: 1rem;      /* 16px */
--spacing-md: 1.5rem;    /* 24px */
--spacing-lg: 2rem;      /* 32px */
--spacing-xl: 3rem;      /* 48px */
```

---

### 2. Sistema de Botones

#### Clases Disponibles

```css
.btn                    /* Botón base */
.btn--primary           /* Azul con gradiente, acción principal */
.btn--secondary         /* Transparente con borde, acción secundaria */
.btn--success           /* Verde, confirmación */
.btn--danger            /* Rojo, acciones destructivas */
.btn--icon              /* Botón circular para iconos */
.btn--small             /* Tamaño reducido */
.btn--large             /* Tamaño grande */
```

#### Ejemplo de Uso

```tsx
<button className="btn btn--primary">
  Subir Archivo
</button>

<button className="btn btn--secondary btn--small">
  Cancelar
</button>

<button className="btn btn--icon">
  <FaMoon />
</button>
```

#### Efectos Especiales

- **Botón Primario:** Gradiente + efecto ripple al hover
- **Botón Secundario:** Fondo translúcido al hover
- **Botón Icono:** Fondo circular al hover
- **Todos:** Elevación (`translateY(-2px)`) al hover

---

### 3. Sistema de Cards

#### Características

```css
✨ Fondo translúcido: rgba(255, 255, 255, 0.7)
✨ Glassmorphism: backdrop-filter: blur(10px)
✨ Overlay animado al hover
✨ Elevación dinámica
✨ Bordes translúcidos
```

#### Ejemplo de Uso

```tsx
<div className="card">
  <h3>Título de la Card</h3>
  <p>Contenido de la card</p>
</div>

<div className="card card--clickable" onClick={handleClick}>
  <h3>Card Clickeable</h3>
</div>
```

#### Efectos al Hover

1. **Overlay animado:** Gradiente que cruza de izquierda a derecha
2. **Elevación:** `transform: translateY(-2px)`
3. **Sombra:** Aumenta de `0 8px 32px` a `0 12px 48px`
4. **Borde:** Cambia a color primario translúcido

---

## 🧩 Componentes Implementados

### 1. Navbar (Completamente Funcional)

**Ubicación:** `src/components/common/Navbar.tsx`

#### Características

```tsx
✅ Sticky positioning (siempre visible)
✅ Glassmorphism (fondo translúcido + blur)
✅ Navegación responsive (desktop/móvil)
✅ Toggle de tema oscuro/claro
✅ Menú hamburguesa animado
✅ Persistencia de tema en localStorage
✅ Enlaces activos con indicador visual
```

#### Estructura del Componente

```tsx
<nav className="navbar">
  <div className="navbar-container">
    {/* Logo */}
    <Link to="/" className="navbar-logo">
      <FaChartBar className="logo-icon" />
      <span className="logo-text">Asistencia</span>
    </Link>

    {/* Menú Desktop */}
    <div className="nav-links desktop-menu">
      <Link to="/">Inicio</Link>
      <Link to="/periodos">Periodos</Link>
    </div>

    {/* Acciones */}
    <div className="nav-actions">
      <button className="btn btn--icon theme-toggle">
        {isDarkMode ? <FaSun /> : <FaMoon />}
      </button>
      <button className="btn btn--icon mobile-menu-btn">
        {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
      </button>
    </div>
  </div>

  {/* Menú Móvil */}
  {isMobileMenuOpen && (
    <div className="mobile-menu">
      <Link to="/">Inicio</Link>
      <Link to="/periodos">Periodos</Link>
    </div>
  )}
</nav>
```

#### Breakpoints de Responsividad

| Breakpoint | Comportamiento |
|------------|----------------|
| **>768px** | Menú horizontal completo |
| **≤768px** | Menú hamburguesa, altura reducida a 60px |
| **≤480px** | Logo más pequeño, altura 56px |
| **≤350px** | Padding mínimo, elementos esenciales |

#### Efectos Visuales

1. **Glassmorphism:**
   ```css
   background: rgba(255, 255, 255, 0.85);
   backdrop-filter: blur(12px);
   ```

2. **Menú Móvil Animado:**
   ```css
   animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
   ```

3. **Enlaces con Hover:**
   - Fondo translúcido
   - Gradiente animado
   - Color primario
   - Indicador visual en enlace activo

4. **Tema Oscuro Automático:**
   - Detecta preferencia guardada
   - Aplica clase `.dark-mode` al body
   - Cambia todas las variables CSS

---

### 2. HomePage (Página Principal)

**Ubicación:** `src/pages/HomePage.tsx`

#### Estructura Actual (Placeholder)

```tsx
<div className="main-container">
  <div className="page-header">
    <h1 className="page-title">📊 Sistema de Asistencia</h1>
    <p className="page-subtitle">
      Sube y procesa archivos Excel de asistencia de empleados
    </p>
  </div>

  <div className="card">
    {/* Zona de bienvenida */}
    <h2>Bienvenido al Sistema de Asistencia</h2>
    <button className="btn btn--primary">
      Subir Archivo Excel
    </button>
  </div>

  <div className="card mt-4">
    {/* Historial de importaciones */}
    <h3>Historial de Importaciones</h3>
  </div>
</div>
```

#### Componentes Pendientes

1. **FileUploader** - Drag & drop para Excel
2. **ImportHistory** - Tabla con historial de importaciones

---

### 3. PeriodsPage (Página de Periodos)

**Ubicación:** `src/pages/PeriodsPage.tsx`

#### Estructura Actual (Placeholder)

```tsx
<div className="main-container">
  <div className="page-header">
    <h1 className="page-title">📅 Periodos de Asistencia</h1>
    <p className="page-subtitle">
      Consulta y gestiona los periodos procesados
    </p>
  </div>

  <div className="card">
    {/* Filtros */}
    <h3>Filtros</h3>
  </div>

  <div className="card mt-4">
    {/* Lista de periodos */}
    <h3>Lista de Periodos</h3>
  </div>
</div>
```

#### Componentes Pendientes

1. **Filtros** - Por año, departamento, estado
2. **PeriodsList** - Grid de cards de periodos
3. **PeriodCard** - Tarjeta individual de periodo

---

## ✨ Efectos Visuales Implementados

### 1. Glassmorphism (Efecto Cristal)

**¿Qué es?**
Efecto de cristal translúcido con desenfoque del fondo.

**Dónde se usa:**
- Navbar
- Cards
- Menú móvil

**Implementación:**
```css
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(10px);
-webkit-backdrop-filter: blur(10px);  /* Safari */
border: 1px solid rgba(229, 231, 235, 0.3);
```

**Intensidades:**
- Navbar: `blur(12px)` + opacidad 0.85
- Cards: `blur(10px)` + opacidad 0.7
- Menú móvil: `blur(16px)` + opacidad 0.95

---

### 2. Overlays Animados

**¿Qué es?**
Gradientes que se desplazan sobre elementos al hacer hover.

**Dónde se usa:**
- Cards
- Enlaces del menú móvil

**Implementación:**
```css
.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(37, 99, 235, 0.03),
    transparent
  );
  transition: left 0.6s;
}

.card:hover::before {
  left: 100%;
}
```

---

### 3. Efecto Ripple (Onda)

**¿Qué es?**
Onda circular que se expande desde el centro al interactuar.

**Dónde se usa:**
- Botones primarios

**Implementación:**
```css
.btn--primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn--primary:hover::before {
  width: 300px;
  height: 300px;
}
```

---

### 4. Gradientes de Fondo

**¿Qué es?**
Gradiente base + overlays radiales de colores.

**Implementación:**
```css
/* Gradiente base */
body {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

/* Overlays radiales */
body::before {
  content: '';
  position: fixed;
  background: 
    radial-gradient(circle at 20% 50%, rgba(37, 99, 235, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
}
```

**Modo Oscuro:**
```css
body.dark-mode {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}
```

---

### 5. Texto con Gradiente

**¿Qué es?**
Texto con color gradiente en lugar de color sólido.

**Dónde se usa:**
- Títulos de página (`.page-title`)

**Implementación:**
```css
.page-title {
  background: linear-gradient(135deg, var(--text-color) 0%, var(--primary-color) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), transparent);
}
```

---

### 6. Animaciones Suaves

#### SlideDown (Menú Móvil)

```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-menu {
  animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Elevación (Cards y Botones)

```css
.card:hover {
  transform: translateY(-2px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn--primary:hover {
  transform: translateY(-2px);
}
```

---

## 📱 Responsividad Detallada

### Estrategia: Mobile-First con Mejoras Progresivas

Aunque el código usa Desktop-First, los breakpoints están optimizados para cada tamaño.

### Breakpoints Principales

```css
/* Móvil Pequeño */
@media (max-width: 350px) { }

/* Móvil */
@media (max-width: 480px) { }

/* Tablet */
@media (max-width: 768px) { }

/* Desktop Pequeño */
@media (max-width: 1004px) and (min-width: 769px) { }

/* Desktop Grande */
/* Por defecto (>1004px) */
```

---

### Componente por Componente

#### Navbar

| Breakpoint | Altura | Logo | Menú | Padding |
|------------|--------|------|------|---------|
| >1004px | 70px | 1.5rem | Horizontal completo | 1-2rem |
| 769-1004px | 70px | 1.5rem | Horizontal compacto | 1.5rem |
| ≤768px | 60px | 1.125rem | Hamburguesa | 1rem |
| ≤480px | 56px | 1rem | Hamburguesa | 0.75rem |
| ≤350px | 46px | 0.9375rem | Hamburguesa | 0.5rem |

#### Cards

| Breakpoint | Padding | Border Radius | Efectos |
|------------|---------|---------------|---------|
| >768px | 2rem | 12px | Todos los efectos |
| ≤768px | 1.5rem | 12px | Todos los efectos |
| ≤480px | 1.5rem | 12px | Efectos reducidos |

#### Botones

| Breakpoint | Padding | Font Size |
|------------|---------|-----------|
| >768px | 0.75rem 1.5rem | 1rem |
| ≤768px | 0.625rem 1.25rem | 0.9375rem |
| ≤480px | 0.5rem 1rem | 0.875rem |

#### Títulos de Página

```css
.page-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
}

.page-subtitle {
  font-size: clamp(0.95rem, 2vw, 1.125rem);
}
```

**Explicación de `clamp()`:**
```
clamp(mínimo, preferido, máximo)
- Móvil pequeño: usa el mínimo
- Responsive: se adapta al viewport (vw)
- Desktop grande: no excede el máximo
```

---

### Técnicas de Responsividad

#### 1. Clamp() para Tamaños Fluidos

```css
/* Malo: Tamaños fijos */
font-size: 24px;

/* Bueno: Tamaños adaptativos */
font-size: clamp(1.5rem, 4vw, 2rem);
```

#### 2. Grid Adaptativo

```css
/* Para listas de cards/periodos */
display: grid;
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
gap: clamp(1rem, 3vw, 2rem);
```

#### 3. Flexbox con Wrap

```css
/* Para grupos de botones */
display: flex;
flex-wrap: wrap;
gap: 1rem;
```

#### 4. Media Queries Específicas

```css
/* No usar genéricos como "mobile" */
@media (max-width: 768px) {
  .navbar { /* estilos específicos */ }
}
```

---

## 🛣️ Rutas y Navegación

### Configuración en App.tsx

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

<Router>
  <div className="App">
    <Navbar />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/periodos" element={<PeriodsPage />} />
    </Routes>
  </div>
</Router>
```

### Rutas Disponibles

| Ruta | Componente | Estado | Descripción |
|------|------------|--------|-------------|
| `/` | HomePage | ✅ Placeholder | Subida de Excel + Historial |
| `/periodos` | PeriodsPage | ✅ Placeholder | Lista de periodos |
| `/periodos/:id/empleados` | EmployeeReportPage | 📋 Pendiente | Resumen por empleado |
| `/empleados/:id/marcas` | MarksViewerPage | 📋 Pendiente | Marcas del reloj |

---

## 📖 Guía de Estilos

### Convenciones de Nomenclatura

#### CSS

```css
/* BEM Simplificado */
.componente                  /* Bloque */
.componente-elemento         /* Elemento */
.componente--modificador     /* Modificador */

/* Ejemplos */
.navbar                      /* Bloque */
.navbar-container            /* Elemento */
.navbar-logo                 /* Elemento */
.btn                         /* Bloque */
.btn--primary                /* Modificador */
.btn--small                  /* Modificador */
```

#### TypeScript/React

```tsx
/* PascalCase para componentes */
function Navbar() { }
function HomePage() { }

/* camelCase para funciones */
const handleClick = () => { }
const toggleTheme = () => { }

/* camelCase para variables */
const isMobileMenuOpen = false
const isDarkMode = true
```

---

### Orden de Propiedades CSS

```css
.componente {
  /* 1. Posicionamiento */
  position: relative;
  top: 0;
  left: 0;
  z-index: 10;
  
  /* 2. Display y Box Model */
  display: flex;
  width: 100%;
  padding: 1rem;
  margin: 0;
  
  /* 3. Tipografía */
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color);
  
  /* 4. Visual */
  background: white;
  border: 1px solid;
  border-radius: 8px;
  
  /* 5. Efectos */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: translateY(0);
  
  /* 6. Animaciones */
  transition: all 0.3s;
}
```

---

### Uso de Variables CSS

```css
/* ❌ Malo: Valores hardcodeados */
color: #2563eb;
padding: 16px;
border-radius: 8px;

/* ✅ Bueno: Variables CSS */
color: var(--primary-color);
padding: var(--spacing-sm);
border-radius: var(--border-radius-sm);
```

---

### Patrones de Componentes

#### Patrón Container/Content

```tsx
function MiComponente() {
  return (
    <div className="main-container">
      <div className="page-header">
        <h1 className="page-title">Título</h1>
        <p className="page-subtitle">Subtítulo</p>
      </div>
      
      <div className="card">
        {/* Contenido */}
      </div>
    </div>
  );
}
```

#### Patrón de Estados

```tsx
function MiComponente() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <StatusMessage type="error" />;
  if (!data) return <StatusMessage type="info" />;
  
  return <div>{/* Contenido */}</div>;
}
```

---

## 🚀 Próximos Pasos de Desarrollo

### Fase 2: Componentes Comunes (Estimado: 2-3 horas)

- [ ] StatusMessage - Mensajes de éxito/error
- [ ] LoadingSpinner - Indicador de carga
- [ ] Table - Tabla reutilizable con ordenamiento

### Fase 3: Pantalla 1 - Upload (Estimado: 3-4 horas)

- [ ] FileUploader con drag & drop
- [ ] ImportHistory tabla funcional
- [ ] Integración con `/api/upload-excel`

### Fase 4: Pantalla 2 - Periodos (Estimado: 2-3 horas)

- [ ] PeriodsList grid responsivo
- [ ] PeriodCard con datos reales
- [ ] Filtros funcionales

### Fase 5: Pantalla 3 - Empleados (Estimado: 4-5 horas)

- [ ] EmployeeTable con comparación
- [ ] ComparisonView modal/panel
- [ ] Filtros y búsqueda

### Fase 6: Pantalla 4 - Marcas (Estimado: 2-3 horas)

- [ ] MarksViewer tabla
- [ ] Filtros de fecha
- [ ] Información de horarios

### Fase 7: Pulido y Optimización (Estimado: 2-3 horas)

- [ ] Animaciones de entrada
- [ ] Lazy loading de imágenes
- [ ] Code splitting
- [ ] Testing en diferentes navegadores

---

## 📊 Checklist de Calidad

### Performance

- [x] CSS minimizado en build
- [x] Imágenes optimizadas
- [ ] Lazy loading implementado
- [ ] Code splitting configurado
- [x] Fonts optimizados (system fonts)

### Accesibilidad

- [x] Contraste de colores adecuado
- [x] `aria-label` en botones de icono
- [ ] Navegación por teclado
- [ ] Screen reader friendly
- [ ] Focus visible

### Responsividad

- [x] Móvil (≤480px)
- [x] Tablet (≤768px)
- [x] Desktop (>768px)
- [x] Desktop grande (>1200px)
- [x] Testing en DevTools

### Compatibilidad

- [x] Chrome/Edge (Chromium)
- [x] Firefox
- [x] Safari (webkit prefixes)
- [ ] Mobile browsers
- [ ] Testing en dispositivos reales

---

## 🔧 Flujo de Desarrollo y Comandos

### Opción 1: Desarrollo Rápido (Sin Docker)

**Ventajas:** Hot reload instantáneo, más rápido para iterar

```bash
# Terminal 1: Backend (Express + BD)
node index.js

# Terminal 2: Frontend (React con Vite)
cd client
npm run dev
```

**Acceso:**
- Frontend: http://localhost:5173 (con proxy a backend)
- Backend: http://localhost:3000

**Cuando usar:** Desarrollo de UI, ajustes de estilos, componentes sin API

---

### Opción 2: Desarrollo con Docker (Entorno Real)

**Ventajas:** Mismo entorno que producción, testing completo

#### Primer Build (o cambios mayores)

```bash
# Construir desde cero (limpia caché)
docker-compose build --no-cache
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

#### Cambios en Frontend

```bash
# Opción A: Build rápido (usa caché)
cd client
npm run build

# Reconstruir solo la imagen
docker-compose up --build -d

# Opción B: Build completo
docker-compose build
docker-compose up -d
```

#### Cambios en Backend

```bash
# Reconstruir y reiniciar
docker-compose up --build -d

# Ver logs
docker-compose logs --tail=50
```

#### Ver Estado del Sistema

```bash
# Ver contenedores activos
docker-compose ps

# Ver logs específicos
docker-compose logs asistencia-app

# Ver logs en tiempo real
docker-compose logs -f

# Verificar la API
curl http://localhost:3005/api/status
```

#### Limpiar y Reiniciar

```bash
# Detener contenedores
docker-compose down

# Detener y limpiar volúmenes
docker-compose down -v

# Limpiar todo (contenedores, imágenes, caché)
docker system prune -a

# Iniciar de nuevo
docker-compose up --build -d
```

**Acceso:**
- Sistema completo: http://localhost:3005

**Cuando usar:** Testing de integración, antes de commit, debugging de APIs

---

### Flujo de Trabajo Recomendado

#### Desarrollo de UI (CSS, Componentes)

```bash
# 1. Desarrollo rápido
cd client && npm run dev

# 2. Hacer cambios en archivos .tsx o .css
# 3. Ver cambios instantáneos en http://localhost:5173

# 4. Cuando esté listo, probar en Docker
cd ..
docker-compose up --build -d

# 5. Verificar en http://localhost:3005
```

#### Desarrollo de Funcionalidades (Frontend + Backend)

```bash
# 1. Levantar sistema completo
docker-compose up -d

# 2. Ver logs
docker-compose logs -f

# 3. Hacer cambios
# 4. Reconstruir
docker-compose up --build -d

# 5. Verificar cambios
```

#### Antes de Commit

```bash
# 1. Compilar frontend
cd client
npm run build

# 2. Verificar que compile sin errores
npm run lint

# 3. Probar en Docker
cd ..
docker-compose up --build -d

# 4. Verificar que todo funcione
curl http://localhost:3005/api/status

# 5. Commit
git add .
git commit -m "feat: descripción del cambio"
```

---

### Comandos Útiles

#### NPM (Client)

```bash
cd client

# Desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint

# Instalar nueva dependencia
npm install nombre-paquete

# Ver dependencias desactualizadas
npm outdated
```

#### Docker

```bash
# Ver imágenes
docker images

# Eliminar imagen específica
docker rmi asistencia-monolito_asistencia-app

# Ver contenedores (todos)
docker ps -a

# Entrar a un contenedor
docker exec -it asistencia-monolito-dev sh

# Ver uso de recursos
docker stats

# Limpiar todo lo no usado
docker system prune -a --volumes
```

#### Docker Compose

```bash
# Levantar en modo detached (background)
docker-compose up -d

# Levantar y ver logs
docker-compose up

# Reconstruir sin caché
docker-compose build --no-cache

# Reconstruir y levantar
docker-compose up --build -d

# Detener
docker-compose down

# Reiniciar un servicio
docker-compose restart asistencia-app

# Ver configuración compilada
docker-compose config

# Ver uso de recursos
docker-compose stats
```

---

### Troubleshooting

#### El frontend no se actualiza después de cambios

```bash
# 1. Verificar que compiló
cd client && npm run build

# 2. Limpiar caché de Docker
docker-compose build --no-cache

# 3. Reconstruir
docker-compose up --build -d

# 4. Verificar que se copió (dentro del contenedor)
docker exec asistencia-monolito-dev ls -la /app/build
```

#### El contenedor no arranca

```bash
# Ver logs detallados
docker-compose logs

# Ver errores de build
docker-compose build 2>&1 | grep -i error

# Verificar el Dockerfile
docker-compose config
```

#### Puerto ocupado

```bash
# Ver qué usa el puerto 3005
sudo lsof -i :3005

# Cambiar puerto en docker-compose.yml
# ports:
#   - "3006:3000"  # Usar otro puerto
```

#### Build muy lento

```bash
# Verificar .dockerignore
cat .dockerignore

# Asegurar que ignora node_modules
echo "node_modules/" >> .dockerignore

# Limpiar builders antiguos
docker builder prune
```

---

### Acceso al Sistema

| Entorno | URL | Puerto | Uso |
|---------|-----|--------|-----|
| **Vite Dev** | http://localhost:5173 | 5173 | Desarrollo frontend solo |
| **Docker Local** | http://localhost:3005 | 3005 | Sistema completo (dev) |
| **Raspberry Pi** | http://192.168.1.X:3000 | 3000 | Producción |
| **API Backend** | http://localhost:3005/api | 3005 | Endpoints REST |

---

## 🚀 Despliegue a Producción (Raspberry Pi)

### Pre-requisitos

```bash
# 1. Tener cuenta en Docker Hub
# Crea una cuenta gratis en: https://hub.docker.com/signup

# 2. Login a Docker Hub
docker login
# Usuario: tu-usuario-dockerhub
# Contraseña: [tu contraseña]

# 3. Configurar buildx (solo primera vez)
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap
```

---

### Paso 1: Probar Localmente

```bash
# 1. Asegurar que todo funciona local
docker-compose up --build -d

# 2. Probar el sistema
curl http://localhost:3005/api/status

# 3. Verificar frontend
# Abrir http://localhost:3005 en navegador

# 4. Si todo funciona, continuar al siguiente paso
docker-compose down
```

---

### Paso 2: Build Multi-Arquitectura

```bash
# Build para amd64 (tu PC) + arm64 (Raspberry Pi)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  --push \
  .
```

**Explicación del comando:**
- `--platform linux/amd64,linux/arm64` → Construye para ambas arquitecturas
- `-t tu-usuario-dockerhub/asistencia-monolito:latest` → Etiqueta la imagen
- `--push` → Sube automáticamente a Docker Hub
- `.` → Usa el Dockerfile del directorio actual

**Tiempo estimado:** 8-12 minutos (primera vez), 3-5 minutos (siguientes)

**Salida esperada:**
```
[+] Building 450.2s (38/38) FINISHED
 => [linux/amd64 stage-1  9/9] COPY --from=builder /app/client/dist ./build
 => [linux/arm64 stage-1  9/9] COPY --from=builder /app/client/dist ./build
 => exporting to image
 => => pushing layers
 => => pushing manifest for docker.io/tu-usuario-dockerhub/asistencia-monolito:latest
```

---

### Paso 3: Verificar en Docker Hub

1. Ir a: https://hub.docker.com/r/tu-usuario-dockerhub/asistencia-monolito
2. Verificar que muestra:
   - ✅ OS/ARCH: linux/amd64, linux/arm64
   - ✅ Tag: latest
   - ✅ Pushed: hace unos minutos

---

### Paso 4: Desplegar en Raspberry Pi

**En la Raspberry Pi (conexión SSH):**

```bash
# 1. Si es primera vez, clonar el repo
git clone https://github.com/tu-usuario/asistencia-monolito.git
cd asistencia-monolito

# 2. Actualizar código (si ya existe)
git pull origin main

# 3. Descargar última imagen de Docker Hub
docker-compose -f docker-compose.prod.yml pull

# 4. Levantar el contenedor
docker-compose -f docker-compose.prod.yml up -d

# 5. Verificar estado
docker-compose -f docker-compose.prod.yml ps

# 6. Ver logs
docker-compose -f docker-compose.prod.yml logs --tail=50
```

**Verificar que funciona:**
```bash
# Desde la Raspberry Pi
curl http://localhost:3000/api/status

# Desde tu PC (en la misma red)
curl http://192.168.1.X:3000/api/status
```

---

### Flujo Completo: Desarrollo → Producción

```bash
# === EN TU PC (WSL2) ===

# 1. Hacer cambios en el código
# 2. Probar localmente
docker-compose up --build -d

# 3. Si funciona bien, commit
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main

# 4. Build multi-arquitectura y subir a Docker Hub
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  --push \
  .

# === EN LA RASPBERRY PI (SSH) ===

# 5. Actualizar código
cd asistencia-monolito
git pull origin main

# 6. Descargar nueva imagen
docker-compose -f docker-compose.prod.yml pull

# 7. Actualizar contenedor
docker-compose -f docker-compose.prod.yml up -d

# 8. Verificar
docker-compose -f docker-compose.prod.yml logs --tail=30
```

---

### Versionado de Imágenes (Opcional)

En lugar de solo usar `latest`, puedes versionar:

```bash
# Build con versión específica
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  -t tu-usuario-dockerhub/asistencia-monolito:v1.0.0 \
  --push \
  .

# En la RPi, usar versión específica
# En docker-compose.prod.yml:
# image: tu-usuario-dockerhub/asistencia-monolito:v1.0.0
```

**Ventajas:**
- ✅ Rollback fácil a versiones anteriores
- ✅ Testing de versiones específicas
- ✅ Historial de releases

---

### Rollback en Caso de Error

```bash
# En la Raspberry Pi

# 1. Ver versiones disponibles
docker images tu-usuario-dockerhub/asistencia-monolito

# 2. Detener versión actual
docker-compose -f docker-compose.prod.yml down

# 3. Cambiar a versión anterior en docker-compose.prod.yml
# image: tu-usuario-dockerhub/asistencia-monolito:v1.0.0

# 4. Levantar versión anterior
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

### Automatización con GitHub Actions (Próximamente)

**Archivo:** `.github/workflows/deploy.yml`

```yaml
name: Build and Push to Docker Hub

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v2
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: tu-usuario-dockerhub/asistencia-monolito:latest
```

**Beneficio:** Cada push a `main` construye y sube automáticamente a Docker Hub.

---

### Checklist Pre-Despliegue

Antes de hacer `docker buildx build --push`:

- [ ] ✅ Código funciona localmente en Docker
- [ ] ✅ Tests pasan (cuando se implementen)
- [ ] ✅ No hay errores de linting
- [ ] ✅ Frontend compila sin errores (`npm run build`)
- [ ] ✅ Backend responde correctamente
- [ ] ✅ Base de datos se crea sin problemas
- [ ] ✅ Commit hecho con mensaje descriptivo
- [ ] ✅ Push a GitHub realizado

---

### Monitoreo en Producción (Raspberry Pi)

```bash
# Ver estado del contenedor
docker-compose -f docker-compose.prod.yml ps

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver uso de recursos
docker stats asistencia-monolito-prod

# Reiniciar si hay problemas
docker-compose -f docker-compose.prod.yml restart

# Ver logs de errores
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

---

### Comandos Rápidos (Aliases Recomendados)

**En tu PC (WSL2):**

```bash
# Agregar a ~/.zshrc o ~/.bashrc
alias dc-build="docker-compose up --build -d"
alias dc-logs="docker-compose logs -f"
alias dc-down="docker-compose down"

# Para Docker Hub
alias dc-push="docker buildx build --platform linux/amd64,linux/arm64 -t tu-usuario-dockerhub/asistencia-monolito:latest --push ."
```

**En la Raspberry Pi:**

```bash
# Agregar a ~/.bashrc
alias rpi-update="git pull && docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
alias rpi-logs="docker-compose -f docker-compose.prod.yml logs -f"
alias rpi-status="docker-compose -f docker-compose.prod.yml ps"
```

**Uso:**
```bash
# En tu PC
dc-build     # Construir local
dc-push      # Subir a Docker Hub

# En RPi
rpi-update   # Actualizar todo
rpi-logs     # Ver logs
rpi-status   # Ver estado
```

---

## 📝 Notas de Implementación

### Decisiones de Diseño

1. **CSS Puro vs Framework:**
   - ✅ Elegimos CSS puro para control total
   - ✅ Variables CSS para consistencia
   - ✅ Sin dependencias adicionales

2. **Glassmorphism:**
   - ✅ Efecto moderno y profesional
   - ✅ Funciona en todos los navegadores modernos
   - ⚠️ Requiere `-webkit-` prefix para Safari

3. **TypeScript:**
   - ✅ Type safety desde el inicio
   - ✅ Mejor DX con autocompletado
   - ✅ Menos bugs en runtime

4. **Responsive Design:**
   - ✅ Desktop-First pero con breakpoints completos
   - ✅ Uso extensivo de `clamp()` y `vw`
   - ✅ Media queries específicas

---

## 🎓 Referencias y Recursos

### Inspiración de Diseño

- **Glassmorphism:** [glassmorphism.com](https://glassmorphism.com/)
- **Paleta de Colores:** Tailwind CSS
- **Animaciones:** Framer Motion patterns
- **Componentes:** Material Design + Shadcn/ui

### Herramientas Útiles

- **Gradientes:** [cssgradient.io](https://cssgradient.io/)
- **Sombras:** [box-shadow.dev](https://box-shadow.dev/)
- **Colores:** [coolors.co](https://coolors.co/)
- **Responsividad:** Chrome DevTools

---

**Documento creado:** 20 de Noviembre, 2025  
**Última actualización:** 20 de Noviembre, 2025  
**Versión:** 1.0  
**Estado:** Base completada, en desarrollo activo

