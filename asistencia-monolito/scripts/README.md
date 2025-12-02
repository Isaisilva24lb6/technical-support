# 📜 Scripts de Utilidad

Esta carpeta contiene scripts de ayuda para el desarrollo y mantenimiento del proyecto.

## 🐳 Docker Development

### `docker-dev.sh`

Script principal para manejar el ciclo de vida de Docker en desarrollo.

```bash
# Iniciar el contenedor (con rebuild automático)
./docker-dev.sh start

# Ver logs en tiempo real
./docker-dev.sh logs

# Reconstruir completamente (sin caché)
./docker-dev.sh rebuild

# Ver estado del contenedor
./docker-dev.sh status

# Limpiar todo (contenedores, imágenes, volúmenes)
./docker-dev.sh clean

# Ver todas las opciones
./docker-dev.sh help
```

**Cuándo usar cada comando:**
- `start` → Inicio normal del día
- `logs` → Para debuggear
- `rebuild` → Cuando hay problemas de caché o versiones viejas
- `clean` → Limpieza total antes de rebuild
- `status` → Verificar si el contenedor está corriendo

## 🧹 Limpieza de Datos

### `clean-test-data.sh`

Limpia archivos temporales y de prueba acumulados durante el desarrollo.

```bash
# Ver qué se eliminaría (sin eliminar nada)
./scripts/clean-test-data.sh --all --dry-run

# Limpiar solo archivos Excel subidos
./scripts/clean-test-data.sh --uploads

# Limpiar solo la base de datos
./scripts/clean-test-data.sh --database

# Limpiar solo logs
./scripts/clean-test-data.sh --logs

# Limpiar todo
./scripts/clean-test-data.sh --all
```

**O usando npm:**
```bash
npm run clean
```

## 🧪 Testing

### `test-parser.js`

Script para probar el parser de Excel (Nextep NE-234) con archivos reales.

```bash
# Usar archivo por defecto
npm run test:parser

# Usar archivo específico
node scripts/test-parser.js data/uploads/asistencia/asistencia_1234567890.xlsx
```

**Qué hace:**
- Carga y parsea un archivo Excel del reloj checador
- Muestra estadísticas de empleados, marcas y hojas detectadas
- Útil para debuggear problemas de parseo

## 📝 Uso Rápido

```bash
# Día normal de desarrollo
./docker-dev.sh start
./docker-dev.sh logs

# Cuando hay problemas con Docker
./docker-dev.sh rebuild

# Antes de hacer commit (limpiar archivos de prueba)
./scripts/clean-test-data.sh --all --dry-run
./scripts/clean-test-data.sh --all

# Testing del parser
npm run test:parser
```

## 🚨 Notas Importantes

- Todos los scripts están ignorados por Git excepto su código fuente
- Los datos en `data/` no se subirán a Git (están en `.gitignore`)
- Usa `--dry-run` antes de eliminar para verificar qué se borrará
- Los scripts requieren permisos de ejecución (`chmod +x`)

