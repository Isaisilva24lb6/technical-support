# 🎨 Componentes Frontend

Documentación de los componentes React del sistema de asistencia.

---

## 📁 Estructura de Componentes

```
client/src/components/
├── Asistencia/
│   ├── CalendarioAsistencia.tsx         # Vista calendario mensual
│   ├── TablaDetalladaAsistencia.tsx     # Vista tabla detallada
│   ├── GraficasAsistencia.tsx           # Vista gráficas
│   ├── FileUploader.tsx                 # Subida de archivos
│   └── AsistenciaValidationTable.tsx    # Validación pre-guardado
├── Employee/
│   └── EmployeeImporter.tsx             # Importador empleados
├── Empleados/
│   └── EmpleadosTable.tsx               # Tabla CRUD empleados
├── Periods/
│   ├── PeriodsList.tsx                  # Lista de períodos
│   └── PeriodDetailViewNew.tsx          # Contenedor vistas
└── common/
    └── VideoBackground.tsx              # Fondo de video
```

---

## 📊 Componentes de Visualización de Asistencia

### 1. `CalendarioAsistencia.tsx`

**Propósito:** Vista de calendario mensual con colores por estado de asistencia.

#### Props

```typescript
interface CalendarioAsistenciaProps {
  registros: RegistroDiario[];           // Datos de asistencia diaria
  empleados: PeriodoEmpleadoDetalle[];   // Lista de empleados
  periodo: Periodo;                      // Información del período
}
```

#### Tipos de Datos

```typescript
interface RegistroDiario {
  fecha: string;                    // '2025-08-04'
  dia_semana: string;               // 'Lunes', 'Martes', etc.
  es_laborable: boolean;
  entrada_real: string | null;      // '08:15'
  salida_real: string | null;       // '17:30'
  minutos_trabajados: number;
  minutos_retardo: number;
  cuenta_retardo: number;           // 0 o 1
  minutos_salida_temprana: number;
  cuenta_salida_temprana: number;
  minutos_extra_normal: number;
  minutos_extra_especial: number;
  es_falta: boolean;
  es_permiso: boolean;
  es_vacacion: boolean;
  estado: string;                   // 'Completo', 'Falta', etc.
  num_empleado: string;
  nombre_empleado: string;
  departamento: string;
  grupo: string;
}
```

#### Características

- ✅ **Grid responsivo** de 7 columnas (Lun-Dom)
- ✅ **Colores por estado:**
  - 🟢 Verde: `completo` (asistencia completa)
  - 🟡 Amarillo: `retardo` o `salida-temprana`
  - 🔴 Rojo: `falta`
  - 🔵 Azul: `permiso`, `vacacion`, `extra`
  - ⚪ Gris: `no-laborable` (fin de semana)
  - ⚫ Negro: `incompleto` (sin salida o entrada)
- ✅ **Tooltip** con detalles al hacer hover
- ✅ **Sección por empleado** (scrollable)

#### Código Clave

```typescript
const getDayStatus = (date: Date, empleadoNum: string) => {
  const registro = registros.find(
    (r) => isSameDay(new Date(r.fecha), date) && r.num_empleado === empleadoNum
  );

  if (!registro) {
    return isWeekend(date) ? 'no-laborable' : 'sin-registro';
  }

  if (registro.es_falta) return 'falta';
  if (registro.es_vacacion) return 'vacacion';
  if (registro.minutos_retardo > 0) return 'retardo';
  if (registro.minutos_salida_temprana > 0) return 'salida-temprana';
  if (registro.estado === 'Completo') return 'completo';
  
  return 'incompleto';
};
```

#### Estilos (CalendarioAsistencia.css)

```css
.calendar-day {
  padding: 8px;
  border-radius: 8px;
  text-align: center;
  transition: all 0.2s;
}

.calendar-day.completo {
  background: #22c55e;    /* Verde */
  color: white;
}

.calendar-day.retardo {
  background: #f59e0b;    /* Amarillo */
  color: white;
}

.calendar-day.falta {
  background: #ef4444;    /* Rojo */
  color: white;
}

.calendar-day.no-laborable {
  background: #64748b;    /* Gris */
  color: white;
  opacity: 0.5;
}
```

#### Uso

```typescript
<CalendarioAsistencia
  registros={asistenciaDiaria}
  empleados={empleadosDelPeriodo}
  periodo={periodoActual}
/>
```

---

### 2. `TablaDetalladaAsistencia.tsx`

**Propósito:** Tabla detallada con todos los registros día por día.

#### Props

```typescript
interface TablaDetalladaAsistenciaProps {
  registros: RegistroDiario[];
  empleados: PeriodoEmpleadoDetalle[];
  periodo: Periodo;
}
```

#### Características

- ✅ **Columnas:**
  - Empleado (#num - nombre)
  - Fecha (dd MMM yyyy)
  - Día de semana
  - Laborable (Sí/No)
  - Horarios esperados (entrada/salida)
  - Horarios reales (entrada/salida)
  - Minutos trabajados
  - Retardo (minutos)
  - Salida temprana (minutos)
  - Horas extra (normal/especial)
  - Estado
- ✅ **Filtro por empleado** (dropdown)
- ✅ **Sticky column** (empleado fijo al hacer scroll horizontal)
- ✅ **Color-coding** en filas según estado
- ✅ **Scroll horizontal** para muchas columnas
- ✅ **Formato de tiempo** (minutos → horas)

#### Código Clave

```typescript
const formatMinutesToHours = (minutes: number) => {
  if (minutes === 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`.trim();
};

const getStatusClass = (registro: RegistroDiario) => {
  if (!registro.es_laborable) return 'status-no-laborable';
  if (registro.es_falta) return 'status-falta';
  if (registro.minutos_retardo > 0) return 'status-retardo';
  if (registro.estado === 'Completo') return 'status-completo';
  return 'status-incompleto';
};
```

#### Estilos (TablaDetalladaAsistencia.css)

```css
.sticky-col {
  position: sticky;
  left: 0;
  background: var(--bg-secondary);
  z-index: 10;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.status-completo {
  background: rgba(34, 197, 94, 0.1);
}

.status-retardo {
  background: rgba(245, 158, 11, 0.1);
}

.status-falta {
  background: rgba(239, 68, 68, 0.1);
}
```

#### Uso

```typescript
<TablaDetalladaAsistencia
  registros={filteredRegistros}
  empleados={empleadosDelPeriodo}
  periodo={periodoActual}
/>
```

---

### 3. `GraficasAsistencia.tsx`

**Propósito:** Visualización de datos con gráficas interactivas.

#### Props

```typescript
interface GraficasAsistenciaProps {
  registros: RegistroDiario[];
  empleados: PeriodoEmpleadoDetalle[];
  periodo: Periodo;
}
```

#### Características

- ✅ **BarChart:** Resumen por empleado
  - Días asistidos
  - Faltas
  - Retardos
  - Horas extra
- ✅ **PieChart:** Distribución de incidencias
  - Asistencias
  - Faltas
  - Retardos
  - Salidas tempranas
- ✅ **LineChart (placeholder):** Horas trabajadas por día
- ✅ **Recharts** para gráficas
- ✅ **Colores consistentes** con el resto de la app

#### Código Clave

```typescript
const dataForCharts = useMemo(() => {
  const employeeStatsMap: { [key: string]: Stats } = {};
  
  registros.forEach(r => {
    if (r.es_laborable) {
      if (!employeeStatsMap[r.num_empleado]) {
        employeeStatsMap[r.num_empleado] = {
          nombre: r.nombre_empleado,
          diasAsistidos: 0,
          faltas: 0,
          retardos: 0,
          horasExtra: 0
        };
      }
      
      const stats = employeeStatsMap[r.num_empleado];
      
      if (r.estado === 'Completo') stats.diasAsistidos++;
      if (r.es_falta) stats.faltas++;
      if (r.cuenta_retardo > 0) stats.retardos++;
      stats.horasExtra += (r.minutos_extra_normal + r.minutos_extra_especial) / 60;
    }
  });
  
  return Object.values(employeeStatsMap).map(emp => ({
    name: emp.nombre,
    'Días Asistidos': emp.diasAsistidos,
    'Faltas': emp.faltas,
    'Retardos': emp.retardos,
    'Horas Extra': parseFloat(emp.horasExtra.toFixed(1))
  }));
}, [registros]);
```

#### Uso de Recharts

```typescript
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={dataForCharts.attendanceSummaryData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="Días Asistidos" fill="#22c55e" />
    <Bar dataKey="Faltas" fill="#ef4444" />
    <Bar dataKey="Retardos" fill="#f59e0b" />
    <Bar dataKey="Horas Extra" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

#### Uso

```typescript
<GraficasAsistencia
  registros={asistenciaDiaria}
  empleados={empleadosDelPeriodo}
  periodo={periodoActual}
/>
```

---

## 🎛️ Componente Contenedor

### `PeriodDetailViewNew.tsx`

**Propósito:** Contenedor que integra las 3 vistas y maneja el estado.

#### Props

```typescript
interface PeriodDetailViewProps {
  periodo: Periodo;          // Objeto período completo
  onBack: () => void;        // Callback para volver a lista
}
```

#### Características

- ✅ **Selector de vistas** (Tabla / Calendario / Gráficas)
- ✅ **Carga de datos** desde API
  - `getPeriodoDetalle()`
  - `getAsistenciaDiaria()`
- ✅ **Filtro global por empleado**
- ✅ **Tarjetas de resumen** (totales)
- ✅ **Loading states**
- ✅ **Error handling**

#### Estados

```typescript
const [periodoDetalle, setPeriodoDetalle] = useState<PeriodoDetalleResponse | null>(null);
const [asistenciaDiaria, setAsistenciaDiaria] = useState<RegistroDiario[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [viewMode, setViewMode] = useState<ViewMode>('table');
const [selectedEmpleadoNum, setSelectedEmpleadoNum] = useState<string | null>(null);
```

#### Carga de Datos

```typescript
useEffect(() => {
  loadPeriodoData();
}, [periodo.id]);

const loadPeriodoData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Cargar en paralelo
    const [detalleResponse, diariaResponse] = await Promise.all([
      asistenciaApi.getPeriodoDetalle(periodo.id),
      asistenciaApi.getAsistenciaDiaria(periodo.id)
    ]);
    
    setPeriodoDetalle(detalleResponse);
    setAsistenciaDiaria(diariaResponse.registros);
  } catch (err) {
    setError(handleApiError(err));
  } finally {
    setLoading(false);
  }
};
```

#### Selector de Vistas

```typescript
<div className="view-selector">
  <button
    className={`btn btn--sm ${viewMode === 'table' ? 'btn--primary' : 'btn--secondary'}`}
    onClick={() => setViewMode('table')}
  >
    📋 Tabla
  </button>
  <button
    className={`btn btn--sm ${viewMode === 'calendar' ? 'btn--primary' : 'btn--secondary'}`}
    onClick={() => setViewMode('calendar')}
  >
    📅 Calendario
  </button>
  <button
    className={`btn btn--sm ${viewMode === 'graphs' ? 'btn--primary' : 'btn--secondary'}`}
    onClick={() => setViewMode('graphs')}
  >
    📊 Gráficas
  </button>
</div>
```

#### Renderizado Condicional

```typescript
{viewMode === 'table' && (
  <TablaDetalladaAsistencia
    registros={filteredAsistenciaDiaria}
    empleados={empleados}
    periodo={periodo}
  />
)}

{viewMode === 'calendar' && (
  <CalendarioAsistencia
    registros={filteredAsistenciaDiaria}
    empleados={empleados}
    periodo={periodo}
  />
)}

{viewMode === 'graphs' && (
  <GraficasAsistencia
    registros={filteredAsistenciaDiaria}
    empleados={empleados}
    periodo={periodo}
  />
)}
```

---

## 📋 Otros Componentes

### `AsistenciaValidationTable.tsx`

**Propósito:** Validar empleados antes de confirmar importación.

#### Características

- ✅ Muestra empleados del Excel
- ✅ Indica si están registrados en BD
- ✅ Destaca empleados no encontrados
- ✅ Permite agregar empleados faltantes

### `FileUploader.tsx`

**Propósito:** Subida de archivos Excel con drag & drop.

#### Características

- ✅ Drag & drop
- ✅ Click to upload
- ✅ Validación de tipo de archivo (.xlsx)
- ✅ Loading indicator
- ✅ Error messages

### `EmpleadosTable.tsx`

**Propósito:** CRUD completo de empleados.

#### Características

- ✅ Tabla con todos los empleados
- ✅ Búsqueda/filtrado
- ✅ Edición inline con modal
- ✅ Eliminación con confirmación
- ✅ Exportar a Excel
- ✅ Agregar empleado manualmente

---

## 🎨 Sistema de Estilos

### Variables CSS Globales

```css
:root {
  /* Colores principales */
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  
  /* Backgrounds */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Texto */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  
  /* Bordes */
  --border-color: #475569;
  --border-radius: 12px;
  
  /* Sombras */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
}
```

### Clases Utilitarias

```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: var(--shadow-md);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
}

.btn--primary {
  background: var(--primary-color);
  color: white;
}

.btn--secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.stat-card {
  background: var(--bg-tertiary);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-card--success {
  border-left: 4px solid var(--success-color);
}

.stat-card--warning {
  border-left: 4px solid var(--warning-color);
}

.stat-card--error {
  border-left: 4px solid var(--error-color);
}
```

---

## 🔧 Utilidades Comunes

### Formato de Fechas

```typescript
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear fecha
format(new Date('2025-08-04'), 'dd MMM yyyy', { locale: es });
// → '04 Ago 2025'

format(new Date('2025-08-04'), 'EEEE', { locale: es });
// → 'Lunes'
```

### Formato de Tiempo

```typescript
const formatMinutesToHours = (minutes: number): string => {
  if (minutes === 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ''}`.trim();
};

formatMinutesToHours(555); // → '9h 15m'
formatMinutesToHours(60);  // → '1h'
formatMinutesToHours(45);  // → '0h 45m'
```

---

## 📱 Responsividad

### Breakpoints

```css
/* Mobile first */
@media (min-width: 640px) {  /* sm */
  .calendar-grid { grid-template-columns: repeat(7, 1fr); }
}

@media (min-width: 768px) {  /* md */
  .stats-cards { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) { /* lg */
  .stats-cards { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1280px) { /* xl */
  .main-container { max-width: 1280px; }
}
```

---

## 🚀 Performance

### Optimizaciones Implementadas

1. **useMemo** para cálculos pesados
```typescript
const aggregatedData = useMemo(() => {
  return registros.reduce((acc, r) => {
    // ... cálculos complejos
  }, {});
}, [registros]);
```

2. **useCallback** para funciones
```typescript
const handleFilterChange = useCallback((num: string) => {
  setSelectedEmpleado(num);
}, []);
```

3. **React.memo** para componentes costosos
```typescript
export default React.memo(CalendarioAsistencia);
```

4. **Lazy loading de imágenes**
```typescript
<img loading="lazy" src={url} alt="..." />
```

---

## 📚 Referencias

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Recharts**: https://recharts.org
- **date-fns**: https://date-fns.org

---

**Última actualización:** Diciembre 2025

