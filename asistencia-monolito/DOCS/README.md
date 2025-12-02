# 📚 Documentación Técnica

Índice de toda la documentación del Sistema de Asistencia y Control de Empleados.

---

## 🗂️ Documentos Disponibles

### 1. [README.md](../README.md) - Inicio
**📋 Vista General del Sistema**

- Características principales
- Stack tecnológico
- Estructura del proyecto
- Instalación con Docker
- Guía de uso básica

👉 **Empieza aquí si es tu primera vez**

---

### 2. [API.md](./API.md) - API REST
**🔌 Documentación Completa de Endpoints**

- Endpoints de Empleados
- Endpoints de Asistencia
- Formato de requests/responses
- Manejo de errores
- Ejemplos con cURL y Axios

👉 **Para desarrolladores frontend o integraciones**

---

### 3. [DATABASE.md](./DATABASE.md) - Base de Datos
**🗄️ Esquema y Estructura de BD**

- Diagrama E-R
- Todas las tablas con campos
- Relaciones y foreign keys
- Consultas SQL útiles
- Mantenimiento y backups

👉 **Para entender el modelo de datos**

---

### 4. [CALCULATOR.md](./CALCULATOR.md) - Calculador
**🧮 Lógica de Cálculo Diario**

- Algoritmo paso a paso
- Funciones de cálculo
- Detección de incidencias
- Validación contra Excel
- Performance y optimizaciones

👉 **Para entender cómo se procesan los datos**

---

### 5. [COMPONENTS.md](./COMPONENTS.md) - Frontend
**🎨 Componentes React**

- CalendarioAsistencia
- TablaDetalladaAsistencia
- GraficasAsistencia
- Sistema de estilos
- Props y ejemplos de uso

👉 **Para desarrollo frontend**

---

## 🚀 Quick Start

### Para Usuarios
1. Leer [README.md](../README.md) - Sección "Guía de Uso"
2. Ver tutoriales en video (próximamente)

### Para Desarrolladores Backend
1. [README.md](../README.md) - Stack y arquitectura
2. [DATABASE.md](./DATABASE.md) - Esquema de BD
3. [API.md](./API.md) - Endpoints disponibles
4. [CALCULATOR.md](./CALCULATOR.md) - Lógica de negocio

### Para Desarrolladores Frontend
1. [COMPONENTS.md](./COMPONENTS.md) - Componentes React
2. [API.md](./API.md) - Consumo de API
3. [README.md](../README.md) - Estructura del proyecto

### Para DevOps
1. [README.md](../README.md) - Docker y despliegue
2. [DATABASE.md](./DATABASE.md) - Backups y mantenimiento

---

## 📖 Glosario

### Términos Clave

- **Período**: Rango de fechas (generalmente un mes) para el cual se registra asistencia.
- **Marca Cruda**: Registro de entrada/salida sin procesar, tal como viene del Excel.
- **Asistencia Diaria**: Registro calculado día por día con métricas procesadas.
- **Total Excel**: Resumen mensual extraído de la hoja "Resumen" del archivo Excel.
- **Empleado**: Trabajador registrado en el catálogo maestro.
- **Retardo**: Entrada después del horario esperado (default: 07:00).
- **Salida Temprana**: Salida antes del horario esperado (default: 18:00).
- **Falta**: Día laborable sin registros de entrada/salida.
- **No Laborable**: Fin de semana o día festivo.

---

## 🔗 Enlaces Útiles

### Tecnologías Utilizadas

- **React**: https://react.dev
- **Express.js**: https://expressjs.com
- **SQLite**: https://www.sqlite.org
- **Docker**: https://www.docker.com
- **ExcelJS**: https://github.com/exceljs/exceljs
- **Recharts**: https://recharts.org
- **date-fns**: https://date-fns.org

### Recursos Externos

- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vite.dev/guide/
- **Docker Compose**: https://docs.docker.com/compose/

---

## 📝 Changelog

### v1.0.0 (Diciembre 2025)

**🎉 Release Inicial**

#### Backend
- ✅ API REST completa para empleados y asistencia
- ✅ Parser inteligente de Excel (Nextep NE-234)
- ✅ **Cálculo automático día por día** con `asistenciaCalculator.js`
- ✅ Base de datos SQLite con 6 tablas
- ✅ Endpoint `/api/asistencia/periodos/:id/dia-por-dia`

#### Frontend
- ✅ CRUD de empleados con modal
- ✅ Importación de asistencia con validación
- ✅ **Vista Calendario** con colores por estado
- ✅ **Vista Tabla** con filtros y scroll
- ✅ **Vista Gráficas** con Recharts
- ✅ Gestión de períodos históricos

#### DevOps
- ✅ Docker + Docker Compose
- ✅ Volúmenes persistentes
- ✅ Hot-reload en desarrollo

#### Documentación
- ✅ README.md completo
- ✅ API.md con todos los endpoints
- ✅ DATABASE.md con esquema completo
- ✅ CALCULATOR.md con lógica detallada
- ✅ COMPONENTS.md con guía frontend

#### Bugs Corregidos
- 🐛 Modal positioning (implementado con React Portals)
- 🐛 Employee number leading zeros (parser normaliza a integer)
- 🐛 Excel employee detection (prioriza hoja "Resumen")
- 🐛 Date format ISO handling (normalización automática)
- 🐛 413 Payload Too Large (límite aumentado a 50MB)
- 🐛 Docker cache issues (rebuild con --no-cache)
- 🐛 removeChild error (evita cambios de estado simultáneos)

---

## 🗺️ Roadmap

### v1.1 (Próxima versión)

#### Seguridad y Autenticación
- [ ] Sistema de login con JWT
- [ ] Roles de usuario (Admin, Manager, Viewer)
- [ ] Rate limiting en API

#### Funcionalidades
- [ ] Horarios personalizados por empleado
- [ ] Gestión de permisos y vacaciones
- [ ] Días festivos configurables
- [ ] Exportación de reportes PDF

#### Mejoras UX
- [ ] Dashboard con KPIs
- [ ] Notificaciones en tiempo real
- [ ] Búsqueda avanzada
- [ ] Temas claro/oscuro

### v1.2 (Futuro)

- [ ] Comparativa entre períodos
- [ ] Predicción de tendencias (ML)
- [ ] Integración con hardware de reloj checador
- [ ] API REST completa con OpenAPI docs

### v2.0 (Visión a largo plazo)

- [ ] App móvil (React Native)
- [ ] Multi-tenancy (múltiples empresas)
- [ ] Sincronización en la nube
- [ ] Reportes personalizables con drag & drop

---

## 🤝 Contribución

### Cómo Contribuir

1. **Fork** el repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear **Pull Request**

### Estándares de Código

#### Backend (Node.js)
- Usar `async/await` en lugar de callbacks
- Comentarios JSDoc en funciones públicas
- Logging con prefijos `[MODULO]`
- Manejo de errores con `try/catch`

#### Frontend (React + TypeScript)
- Componentes funcionales con hooks
- Props con TypeScript interfaces
- CSS modules o styled-components
- No usar `any`, especificar tipos

#### Commits
```
feat: Agregar vista de gráficas
fix: Corregir error en parser de fechas
docs: Actualizar README con nueva funcionalidad
refactor: Mejorar performance del calculador
test: Agregar tests para API de empleados
```

---

## 📞 Soporte

### ¿Tienes Dudas?

1. **Revisa la documentación** correspondiente
2. **Busca en los issues** del repositorio
3. **Crea un nuevo issue** con detalles:
   - Versión del sistema
   - Pasos para reproducir
   - Logs relevantes
   - Screenshots si aplica

### Contacto

- **Email**: [tu-email@example.com]
- **Slack**: #asistencia-support
- **GitHub Issues**: [link-to-issues]

---

## 📄 Licencia

Este proyecto es **privado** y de uso interno.

Todos los derechos reservados © 2025.

---

## 🙏 Agradecimientos

- **Team de Desarrollo**: Por implementar el sistema
- **Team de QA**: Por las pruebas exhaustivas
- **Usuarios Beta**: Por el feedback invaluable
- **Comunidad Open Source**: Por las increíbles herramientas

---

**Última actualización:** Diciembre 2, 2025  
**Versión de la Documentación:** 1.0.0
