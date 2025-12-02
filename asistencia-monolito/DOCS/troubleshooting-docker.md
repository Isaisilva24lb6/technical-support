# 🐛 Solución de Problemas - Docker

Este documento contiene soluciones detalladas para problemas comunes relacionados con Docker en el proyecto.

---

## Problema: Contenedor se reinicia constantemente

### 📋 Síntomas

- Al ejecutar `docker ps`, el contenedor muestra estado **"Restarting"**
- El contenedor aparece y desaparece constantemente
- Los logs están vacíos: `docker logs asistencia-monolito-dev` no muestra nada
- Al ejecutar `docker inspect`, el `ExitCode` es `0` (salida exitosa pero inmediata)
- El `RestartCount` incrementa constantemente (24, 25, 26...)

### 🔍 Diagnóstico

```bash
# Ver el estado del contenedor
docker ps -a | grep asistencia

# Ejemplo de salida problemática:
# CONTAINER ID   IMAGE      STATUS
# 1eb8b129013f   ...        Restarting (0) 4 seconds ago

# Ver información detallada del estado
docker inspect asistencia-monolito-dev | grep -A 20 "State"

# Ejemplo de salida problemática:
# "Status": "restarting",
# "ExitCode": 0,
# "RestartCount": 24
```

### 🎯 Causa Raíz

**Imagen de Docker corrupta o construcción con caché problemática.**

Esto sucede cuando:
- Se interrumpió una construcción previa (`Ctrl+C` durante `docker compose build`)
- Hay archivos corruptos en las capas de caché de Docker
- Se actualizaron dependencias pero la caché no se limpió
- Hubo cambios en `package.json` o `Dockerfile` que no se reflejaron correctamente

### ✅ Solución Completa

#### Paso 1: Detener y limpiar

```bash
# Ir al directorio del proyecto
cd ~/mis-proyectos/technical-support/asistencia-monolito

# Detener todos los contenedores y redes
docker compose down
```

#### Paso 2: Reconstruir sin caché (CRÍTICO)

```bash
# Reconstruir la imagen completamente SIN usar caché
docker compose build --no-cache
```

Este comando:
- ✅ Descarga todas las dependencias nuevamente
- ✅ Recompila el frontend de React desde cero
- ✅ Reinstala las dependencias de Node.js
- ✅ Recompila módulos nativos como `sqlite3`

**Nota:** Este proceso puede tomar 3-5 minutos.

#### Paso 3: Levantar el contenedor

```bash
# Levantar el contenedor en modo detached
docker compose up -d
```

#### Paso 4: Verificar que funciona

```bash
# Ver el estado (debe mostrar "Up")
docker ps | grep asistencia

# Salida esperada:
# CONTAINER ID   IMAGE                              STATUS        PORTS
# 1d7bdb45ca3e   asistencia-monolito-asistencia-app Up 47 seconds 0.0.0.0:3005->3000/tcp

# Ver los logs (deben mostrar el inicio exitoso)
docker logs asistencia-monolito-dev
```

**Logs esperados (salida exitosa):**

```
[DB] Ruta de la base de datos: /app/data/asistencia.db
[DB OK] Conectado a SQLite exitosamente.
[DB OK] Tabla "periodos" lista.
[DB OK] Tabla "empleados" lista.
[INFO] Sirviendo archivos estáticos desde /build

╔════════════════════════════════════════════════════════════╗
║  🚀 Servidor Monolito de Asistencia                       ║
╠════════════════════════════════════════════════════════════╣
║  Puerto:     3000                                        ║
║  URL Local:  http://localhost:3000                      ║
╚════════════════════════════════════════════════════════════╝
```

#### Paso 5: Probar la API

```bash
# Probar el endpoint de estado
curl http://localhost:3005/api/status

# Respuesta esperada:
# {"status":"OK","version":"1.2 (Con Gestión de Empleados)","dbConnected":true}

# Probar el frontend
curl -I http://localhost:3005/

# Respuesta esperada:
# HTTP/1.1 200 OK
```

---

## Solución Alternativa: Ejecutar manualmente

Si después de reconstruir el problema persiste, puedes probar ejecutar el contenedor manualmente para ver más detalles:

```bash
# Detener docker-compose
docker compose down

# Ejecutar manualmente sin detached para ver logs en tiempo real
docker run --rm \
  -p 3005:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  -e PORT=3000 \
  asistencia-monolito-asistencia-app:latest

# Presiona Ctrl+C para detener
```

Si esto funciona pero `docker compose` no, revisa el archivo `docker-compose.yml`.

---

## Limpieza Profunda (Última Opción)

Si nada funciona, puedes hacer una limpieza completa de Docker:

```bash
# ⚠️ ADVERTENCIA: Esto eliminará TODAS las imágenes, contenedores y caché

# Detener el proyecto
docker compose down

# Eliminar las imágenes del proyecto
docker rmi asistencia-monolito-asistencia-app:latest

# Limpiar caché de construcción
docker builder prune -a -f

# Reconstruir desde cero
docker compose build --no-cache
docker compose up -d
```

---

## Prevención

Para evitar este problema en el futuro:

1. **Siempre usa `--no-cache` cuando cambies `Dockerfile` o `package.json`:**
   ```bash
   docker compose build --no-cache
   ```

2. **No interrumpas las construcciones** con `Ctrl+C` a menos que sea necesario

3. **Limpia regularmente:**
   ```bash
   # Eliminar imágenes no utilizadas
   docker image prune -a
   
   # Eliminar caché de construcción
   docker builder prune
   ```

---

## Comandos Útiles para Debugging

```bash
# Ver todos los contenedores (incluyendo detenidos)
docker ps -a

# Ver logs en tiempo real
docker logs -f asistencia-monolito-dev

# Ver información detallada del contenedor
docker inspect asistencia-monolito-dev

# Ver las imágenes disponibles
docker images | grep asistencia

# Entrar al contenedor (si está corriendo)
docker exec -it asistencia-monolito-dev sh

# Ver el uso de recursos del contenedor
docker stats asistencia-monolito-dev
```

---

## Historial de Casos

### Caso 1: Noviembre 23, 2025
**Problema:** Contenedor se reiniciaba 24+ veces con ExitCode 0  
**Causa:** Imagen corrupta por construcción previa interrumpida  
**Solución:** `docker compose build --no-cache`  
**Tiempo de resolución:** ~5 minutos (incluye rebuild)  
**Estado:** ✅ Resuelto

---

## Referencias

- [Docker Compose CLI Reference](https://docs.docker.com/compose/reference/)
- [Docker Build Cache](https://docs.docker.com/build/cache/)
- [Debugging Docker](https://docs.docker.com/config/containers/logging/)

---

**Última actualización:** 23 de noviembre, 2025






