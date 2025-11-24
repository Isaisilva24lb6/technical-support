# 🚀 GUÍA DE INICIO RÁPIDO

## Para Desarrolladores Nuevos

### 1️⃣ Prerrequisitos

```bash
# Verificar que Docker esté instalado
docker --version
docker-compose --version

# Si no tienes Docker, instálalo:
# Ubuntu/Debian:
sudo apt update && sudo apt install docker.io docker-compose

# Agregar tu usuario al grupo docker (reiniciar sesión después)
sudo usermod -aG docker $USER
```

---

### 2️⃣ Clonar y Levantar

```bash
# Clonar el repositorio
git clone <URL_DEL_REPO>
cd asistencia-monolito

# Levantar el contenedor (primera vez tarda ~5 min)
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f
```

---

### 3️⃣ Acceder al Sistema

**URL:** `http://localhost:3005`

**Páginas disponibles:**
- `/` - Página principal (sistema de asistencia)
- `/empleados` - Gestión de empleados
- `/periodos` - Gestión de periodos (próximamente)

---

### 4️⃣ Subir tu Primer Excel de Empleados

1. **Ve a:** `http://localhost:3005/empleados`
2. **Prepara un Excel** con estas columnas:
   ```
   N° | NOMBRE DEL PERSONAL | CORREO
   2  | Juan Pérez         | juan@outlook.com
   3  | María López        | maria@hotmail.com
   ```
3. **Arrastra** el archivo a la zona punteada
4. **Revisa** los datos detectados
5. **Confirma** para guardar

---

## 🛠️ Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar el contenedor
docker-compose restart

# Detener todo
docker-compose down

# Reconstruir después de cambios en código
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver qué contenedores están corriendo
docker ps

# Acceder al shell del contenedor
docker exec -it asistencia-monolito-dev sh
```

---

## 📂 Estructura de Carpetas Importantes

```
asistencia-monolito/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas principales
│   │   └── services/      # API client
│   └── public/
│       └── videos/        # Video de fondo
├── server/                 # Backend Express
│   ├── routes/            # Rutas API
│   └── utils/             # Parser de Excel
├── config/                 # Configuración DB
├── data/                   # Base de datos SQLite (volumen persistente)
├── DOCS/                   # Documentación
├── docker-compose.yml      # Configuración Docker
└── Dockerfile             # Imagen Docker
```

---

## 🔍 Verificar que Todo Funciona

### Test 1: Backend está corriendo
```bash
curl http://localhost:3005/api/status
# Debe responder: {"status":"OK","version":"1.2 (Con Gestión de Empleados)"}
```

### Test 2: Frontend carga
Abre `http://localhost:3005` en tu navegador.
Debes ver la página principal con el video de fondo.

### Test 3: Base de datos funciona
```bash
# Entrar al contenedor
docker exec -it asistencia-monolito-dev sh

# Ver empleados en la DB
apk add sqlite
sqlite3 /app/data/asistencia.db "SELECT * FROM empleados LIMIT 5;"
```

---

## 🐛 Problemas Comunes

### "Error: Cannot GET /"
**Causa:** El frontend no se compiló correctamente.
**Solución:**
```bash
cd client
npm install
npm run build
cd ..
docker-compose build --no-cache
docker-compose up -d
```

### "Port 3005 already in use"
**Causa:** El puerto está ocupado.
**Solución:**
```bash
# Ver qué está usando el puerto
sudo lsof -i :3005

# Detener el proceso o cambiar el puerto en docker-compose.yml
```

### "No se detectan los correos"
**Causa:** Los correos están en formato especial.
**Solución:** El sistema los detecta automáticamente si están como:
- Hipervínculos (`mailto:...`)
- Texto plano válido

### "El contenedor se reinicia constantemente"
**Síntomas:**
- `docker ps` muestra el estado "Restarting"
- Los logs están vacíos o el contenedor muestra `ExitCode: 0`
- El contenedor se reinicia infinitamente sin mostrar errores

**Causa:** Imagen de Docker corrupta o construcción con caché problemática.

**Solución:**
```bash
# 1. Detener todos los contenedores
docker compose down

# 2. Reconstruir la imagen SIN caché (esto es crítico)
docker compose build --no-cache

# 3. Levantar el contenedor
docker compose up -d

# 4. Verificar que está corriendo
docker ps | grep asistencia

# 5. Ver los logs para confirmar
docker logs asistencia-monolito-dev
```

**Verificación exitosa:**
Debes ver en los logs:
```
[DB OK] Conectado a SQLite exitosamente.
🚀 Servidor Monolito de Asistencia
Puerto: 3000
```

Y al ejecutar:
```bash
curl http://localhost:3005/api/status
```

Debes recibir:
```json
{"status":"OK","version":"1.2 (Con Gestión de Empleados)","dbConnected":true}
```

---

## 📚 Más Documentación

- **README.md** - Documentación completa del proyecto
- **DOCS/employee-management.md** - Guía detallada del módulo de empleados
- **DOCS/frontend-architecture.md** - Arquitectura del frontend
- **CHANGELOG.md** - Historial de cambios

---

## 💡 Siguiente Paso

Una vez que el sistema está corriendo:
1. ✅ Sube tu Excel de empleados
2. ⏳ Prepárate para el módulo de **Reloj Checador**

---

**¿Problemas?** Revisa los logs:
```bash
docker-compose logs -f
```


