# 🐳 Configuración de Docker Hub

Esta guía te ayudará a configurar tu cuenta de Docker Hub para poder subir las imágenes del proyecto.

---

## 📋 Pre-requisitos

Antes de comenzar, necesitas:
- ✅ Una cuenta de Docker Hub (gratuita)
- ✅ Docker instalado en tu sistema
- ✅ Acceso al repositorio del proyecto

---

## 1️⃣ Crear Cuenta de Docker Hub

Si aún no tienes una cuenta:

1. Ve a: https://hub.docker.com/signup
2. Regístrate con tu correo electrónico
3. Verifica tu correo
4. **Anota tu nombre de usuario** (lo necesitarás después)

**Ejemplo:**
- Tu nombre de usuario será algo como: `juan123`, `mi-empresa`, etc.

---

## 2️⃣ Iniciar Sesión en Docker

Una vez que tengas tu cuenta, inicia sesión desde tu terminal:

```bash
# Iniciar sesión en Docker Hub
docker login

# Te pedirá:
# Username: tu-usuario-dockerhub
# Password: [tu contraseña]
```

**Verificar que iniciaste sesión correctamente:**

```bash
# Este comando debe mostrar tu información de usuario
docker info | grep -i username
```

---

## 3️⃣ Configurar el Proyecto

Ahora debes reemplazar el placeholder `tu-usuario-dockerhub` con tu nombre de usuario real en el archivo de producción.

### Editar `docker-compose.prod.yml`

```bash
# Abrir el archivo
nano docker-compose.prod.yml
# O con tu editor favorito: code, vim, etc.
```

**Buscar esta línea:**
```yaml
image: tu-usuario-dockerhub/asistencia-monolito:latest
```

**Reemplazar con tu usuario:**
```yaml
image: juan123/asistencia-monolito:latest
```

*(Reemplaza `juan123` con tu usuario real de Docker Hub)*

---

## 4️⃣ Construir y Subir la Imagen

Una vez configurado tu usuario, puedes construir y subir la imagen:

### Opción A: Build Multi-Arquitectura (Recomendado)

```bash
# 1. Configurar buildx (solo la primera vez)
docker buildx create --name multiarch --use
docker buildx inspect --bootstrap

# 2. Construir y subir para amd64 + arm64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  --push \
  .
```

**⚠️ IMPORTANTE:** Reemplaza `tu-usuario-dockerhub` con tu usuario real.

**Ejemplo real:**
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t juan123/asistencia-monolito:latest \
  --push \
  .
```

### Opción B: Build Simple (Solo tu arquitectura)

```bash
# Construir solo para tu arquitectura actual
docker build -t tu-usuario-dockerhub/asistencia-monolito:latest .

# Subir a Docker Hub
docker push tu-usuario-dockerhub/asistencia-monolito:latest
```

---

## 5️⃣ Verificar la Imagen en Docker Hub

Después de subir, verifica que la imagen esté disponible:

1. Ve a: `https://hub.docker.com/r/tu-usuario-dockerhub/asistencia-monolito`
2. Debes ver:
   - ✅ Tag: `latest`
   - ✅ Arquitecturas: `linux/amd64`, `linux/arm64` (si usaste buildx)
   - ✅ Fecha de subida reciente

---

## 6️⃣ Uso en Producción (Raspberry Pi)

Una vez que la imagen esté en Docker Hub, puedes descargarla en cualquier máquina:

```bash
# En la Raspberry Pi o servidor de producción

# 1. Iniciar sesión (opcional, si el repositorio es privado)
docker login

# 2. Descargar la imagen
docker-compose -f docker-compose.prod.yml pull

# 3. Levantar el contenedor
docker-compose -f docker-compose.prod.yml up -d
```

Docker descargará automáticamente la versión correcta para la arquitectura del sistema.

---

## 🔒 Seguridad

### Repositorios Públicos vs Privados

**Público (Gratuito):**
- ✅ Cualquiera puede descargar tu imagen
- ✅ Gratis ilimitado
- ❌ Tu código es visible para todos

**Privado (Requiere plan de pago o cuenta gratuita limitada):**
- ✅ Solo tú puedes descargar la imagen
- ✅ Tu código está protegido
- ⚠️ Docker Hub Free: 1 repositorio privado gratis

### Hacer un Repositorio Privado

1. Ve a Docker Hub: https://hub.docker.com/repositories
2. Selecciona tu repositorio
3. Ve a `Settings` → `Make Private`

### Usar Repositorio Privado en Raspberry Pi

Si tu repositorio es privado, debes iniciar sesión antes de hacer pull:

```bash
# En la Raspberry Pi
docker login
# Username: tu-usuario-dockerhub
# Password: [tu contraseña]

# Ahora puedes hacer pull
docker-compose -f docker-compose.prod.yml pull
```

---

## 🚨 Troubleshooting

### Error: "unauthorized: incorrect username or password"

**Solución:**
```bash
# Cerrar sesión
docker logout

# Volver a iniciar sesión
docker login
```

### Error: "denied: requested access to the resource is denied"

**Causa:** Estás intentando subir a un repositorio que no te pertenece.

**Solución:** Verifica que el nombre de usuario en la etiqueta de la imagen coincida con tu usuario de Docker Hub:

```bash
# Incorrecto (si no eres "otro-usuario")
docker push otro-usuario/asistencia-monolito:latest

# Correcto
docker push tu-usuario-real/asistencia-monolito:latest
```

### Error: "no space left on device"

**Causa:** Tu disco está lleno o Docker tiene muchas imágenes antiguas.

**Solución:**
```bash
# Limpiar imágenes no utilizadas
docker system prune -a

# Limpiar caché de build
docker builder prune -a
```

---

## 📝 Resumen de Comandos

```bash
# 1. Iniciar sesión
docker login

# 2. Construir y subir (multi-arquitectura)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t tu-usuario-dockerhub/asistencia-monolito:latest \
  --push \
  .

# 3. Verificar en Docker Hub
# Ir a: https://hub.docker.com/r/tu-usuario-dockerhub/asistencia-monolito

# 4. Descargar en producción
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔗 Referencias

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-Platform Images](https://docs.docker.com/build/building/multi-platform/)

---

**Última actualización:** 23 de noviembre, 2025

