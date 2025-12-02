# 🔧 Troubleshooting - Problemas Comunes

## ❌ Error: "Permiso denegado" al limpiar archivos

### Problema

```bash
npm run clean
# find: no se puede borrar 'data/uploads/asistencia/asistencia_*.xlsx': Permiso denegado
```

### Causa

Los archivos fueron creados por **Docker como root**, por lo que tu usuario normal no puede eliminarlos.

### Soluciones

#### ✅ Opción 1: Limpiar desde Docker (RECOMENDADO)

```bash
./docker-dev.sh clean-data
```

Este comando ejecuta la limpieza **dentro** del contenedor Docker, donde tiene todos los permisos.

#### ✅ Opción 2: Cambiar permisos de la carpeta

```bash
# Cambiar el dueño a tu usuario
sudo chown -R $USER:$USER data/

# Ahora funciona normalmente
npm run clean
```

Esta es la **mejor solución para desarrollo** porque solo la haces una vez.

#### ✅ Opción 3: Usar sudo

```bash
sudo npm run clean
```

Funciona, pero tienes que usar `sudo` cada vez.

---

## 🐳 Docker muestra imágenes/código viejo

### Problema

Haces cambios en el código pero Docker sigue mostrando la versión anterior.

### Solución

```bash
# Rebuild completo sin caché
./docker-dev.sh rebuild
```

Si persiste:

```bash
# Limpieza total y rebuild
./docker-dev.sh clean
./docker-dev.sh start
```

---

## 🔌 Error: "Cannot connect to localhost:3005"

### Problema

El frontend no puede conectarse al backend.

### Verificaciones

1. **¿Está corriendo el contenedor?**
   ```bash
   ./docker-dev.sh status
   ```

2. **¿El servidor está levantado dentro del contenedor?**
   ```bash
   ./docker-dev.sh logs
   # Busca: "Servidor Monolito de Asistencia"
   ```

3. **¿El puerto 3005 está ocupado?**
   ```bash
   sudo lsof -i :3005
   # O
   sudo netstat -tulpn | grep 3005
   ```

### Soluciones

```bash
# Reiniciar contenedor
./docker-dev.sh restart

# Si no funciona, rebuild
./docker-dev.sh rebuild
```

---

## 📦 Error: "Module not found"

### Problema

```
Error: Cannot find module 'express'
```

### Causa

Dependencias no instaladas o `node_modules/` corrupto.

### Solución

```bash
# Backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd client
rm -rf node_modules package-lock.json
npm install

# Rebuild Docker
./docker-dev.sh rebuild
```

---

## 🗄️ Base de datos corrupta o con datos incorrectos

### Problema

Datos inconsistentes o errores de schema.

### Solución

**⚠️ CUIDADO: Esto eliminará todos los datos**

```bash
# Opción 1: Eliminar manualmente
rm data/asistencia.db

# Opción 2: Desde el contenedor
./docker-dev.sh shell
rm /app/data/asistencia.db
exit

# Reiniciar para que se cree una nueva
./docker-dev.sh restart
```

La base de datos se recrea automáticamente al iniciar.

---

## 📄 Parser no detecta el archivo Excel

### Problema

```
[PARSER] Error: No se detectó hoja de resumen/registros
```

### Verificaciones

1. **¿Es un archivo del reloj checador Nextep NE-234?**
   - Debe tener hoja "Resumen" o "Registros"
   - Números de empleado correctos

2. **Probar el parser manualmente:**
   ```bash
   npm run test:parser data/uploads/asistencia/archivo.xlsx
   ```

3. **Ver logs detallados:**
   ```bash
   ./docker-dev.sh logs
   ```

### Formatos soportados

- ✅ Formato lineal: Num | Fecha | Hora | Tipo
- ✅ Formato grid: Empleados en filas, días en columnas
- ✅ Hojas: "Resumen", "Registros", hojas con nombres como "1.3.5"

---

## 🔄 Cambios en el código no se reflejan

### Frontend (React)

Si estás en desarrollo:

```bash
cd client
npm run dev
```

El Vite dev server tiene hot-reload automático (puerto 5173).

### Backend (Node.js)

Si estás usando `nodemon`:

```bash
npm run dev
```

Se reinicia automáticamente al guardar.

### Docker

Si los cambios no se ven en Docker:

```bash
# Rebuild para aplicar cambios
./docker-dev.sh rebuild
```

---

## 🌐 CORS errors en el navegador

### Problema

```
Access to XMLHttpRequest blocked by CORS policy
```

### Verificación

En `index.js`, debe haber:

```javascript
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3005', 'http://localhost:3000'],
    credentials: true
}));
```

### Solución

Si agregaste un nuevo puerto:

```javascript
origin: ['http://localhost:5173', 'http://localhost:3005', 'http://localhost:TU_PUERTO'],
```

Luego rebuild:

```bash
./docker-dev.sh rebuild
```

---

## 📊 Gráficas no se muestran

### Problema

Las gráficas de Recharts no aparecen.

### Verificaciones

1. **¿Hay datos?**
   ```javascript
   console.log(registros); // En el componente
   ```

2. **¿Recharts está instalado?**
   ```bash
   cd client
   npm list recharts
   ```

3. **¿El componente tiene el tamaño correcto?**
   ```css
   .graficas-container {
     width: 100%;
     height: 400px; /* Importante */
   }
   ```

---

## 🔐 "SQLite3 was compiled against a different Node.js version"

### Problema

```
Error: The module was compiled against a different Node.js version
```

### Causa

Cambió la versión de Node.js y los binarios de SQLite3 no son compatibles.

### Solución

```bash
# Reinstalar sqlite3
npm rebuild sqlite3

# O reinstalar todo
rm -rf node_modules package-lock.json
npm install

# Rebuild Docker
./docker-dev.sh rebuild
```

---

## 🚨 Docker ocupa mucho espacio

### Problema

Docker usa varios GB de disco.

### Solución

```bash
# Ver uso de disco
docker system df

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar todo (cuidado)
docker system prune -a --volumes
```

Para este proyecto específicamente:

```bash
# Limpiar solo este proyecto
./docker-dev.sh clean
```

---

## 📝 Logs muy extensos

### Problema

Los logs del contenedor son muy largos.

### Solución

```bash
# Ver solo las últimas 50 líneas
docker logs asistencia-monolito-dev --tail 50

# O usar el script
./docker-dev.sh logs | tail -50
```

---

## 🔄 Puerto 3005 ya en uso

### Problema

```
Error: listen EADDRINUSE: address already in use :::3005
```

### Solución

```bash
# Ver qué está usando el puerto
sudo lsof -i :3005

# Matar el proceso
sudo kill -9 PID

# O cambiar el puerto en docker-compose.yml
ports:
  - "3006:3000"  # Usar 3006 en lugar de 3005
```

---

## 🆘 Nada funciona - Reset completo

Si todo lo demás falla:

```bash
# 1. Detener y limpiar Docker
./docker-dev.sh clean

# 2. Limpiar datos (con sudo si es necesario)
sudo rm -rf data/asistencia.db
sudo rm -rf data/uploads/*

# 3. Limpiar node_modules
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json

# 4. Reinstalar dependencias
npm install
cd client && npm install && cd ..

# 5. Rebuild Docker
./docker-dev.sh start

# 6. Ver logs para verificar
./docker-dev.sh logs
```

---

## 📞 Soporte

Si ninguna de estas soluciones funciona:

1. Ver logs detallados: `./docker-dev.sh logs`
2. Verificar estado: `./docker-dev.sh status`
3. Revisar documentación en `DOCS/`
4. Buscar en los issues del proyecto

---

**Última actualización:** 2025-12-02

