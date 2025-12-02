# 🎬 Videos de Fondo

Esta carpeta contiene los videos utilizados como background en la aplicación.

## 📥 Dónde Conseguir Videos Gratis

### Sitios Recomendados (Sin Copyright):

1. **Pexels Videos** - https://www.pexels.com/videos/
   - ✅ Gratis, sin atribución requerida
   - ✅ Alta calidad, 4K disponible
   - 🎯 Busca: "office", "technology", "business abstract", "data"

2. **Pixabay Videos** - https://pixabay.com/videos/
   - ✅ Gratis, sin copyright
   - ✅ Variedad de estilos

3. **Coverr** - https://coverr.co/
   - ✅ Videos cortos para backgrounds
   - ✅ Optimizados para web

4. **Videvo** - https://www.videvo.net/
   - ✅ Gratis con atribución opcional
   - ✅ Categoría específica de backgrounds

---

## 🎨 Recomendaciones de Video para Sistema de Asistencia

### Temáticas Sugeridas:
- 📊 **"Data visualization abstract"** - Gráficos y datos animados
- 💼 **"Office timelapse"** - Oficina en movimiento suave
- 🌐 **"Technology particles"** - Partículas tecnológicas
- 📈 **"Business growth"** - Conceptos de productividad
- 🔵 **"Blue abstract motion"** - Abstracto azul (match con tu tema)

### Características Ideales:
- ✅ Movimiento **suave y lento** (no agresivo)
- ✅ Colores **neutros o azulados** (match con tu tema)
- ✅ Sin elementos muy definidos (funcionará como fondo sutil)
- ✅ Loop perfecto (inicio = final)
- ✅ Duración: 10-30 segundos

---

## ⚙️ Cómo Optimizar tu Video

### Antes de Subirlo al Proyecto:

#### 1. **Convertir a Formatos Optimizados** (Recomendado)

Usa **FFmpeg** (instálalo con `sudo apt install ffmpeg`):

```bash
# Convertir a WebM (mejor compresión para web)
ffmpeg -i original.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -b:a 128k -c:a libopus background.webm

# Convertir a MP4 optimizado (fallback para navegadores viejos)
ffmpeg -i original.mp4 -vcodec h264 -acodec aac -b:v 1M background.mp4
```

#### 2. **Reducir Resolución** (Para mejor performance)

```bash
# Reducir a 1080p (Full HD)
ffmpeg -i original.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 background.mp4

# Reducir a 720p (HD - más ligero)
ffmpeg -i original.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 background-720p.mp4
```

#### 3. **Reducir Duración** (Solo si es muy largo)

```bash
# Recortar los primeros 20 segundos
ffmpeg -i original.mp4 -t 20 -c copy background.mp4
```

---

## 📦 Tamaños Recomendados

| Resolución | Formato | Tamaño Ideal | Uso |
|------------|---------|--------------|-----|
| **1920x1080** | WebM | 2-5 MB | Desktop principal |
| **1920x1080** | MP4 | 3-8 MB | Desktop fallback |
| **1280x720** | WebM | 1-3 MB | Desktop ligero |
| **1280x720** | MP4 | 2-5 MB | Desktop fallback ligero |

**Regla general:** Menos de 5 MB para carga rápida.

---

## 📁 Estructura de Archivos

```
public/videos/
├── background.webm       ← Formato principal (mejor compresión)
├── background.mp4        ← Fallback para compatibilidad
└── README.md             ← Este archivo
```

El componente `VideoBackground.tsx` intentará cargar automáticamente ambos formatos.

---

## 🔧 Configuración en el Código

Para cambiar el video, edita en `src/App.tsx`:

```tsx
<VideoBackground 
  videoUrl="/videos/tu-video.mp4"    // Ruta del video
  opacity={0.12}                      // Opacidad (0.05 - 0.3)
  enableOnMobile={false}              // true/false (no recomendado en móviles)
/>
```

### Parámetros:

- **`videoUrl`**: Ruta del video (debe estar en `/public/videos/`)
- **`opacity`**: Transparencia del video (recomendado: 0.08 - 0.15)
- **`enableOnMobile`**: Si se muestra en dispositivos móviles (desactivado por defecto para ahorrar datos)

---

## 🎯 Ejemplos de Búsqueda en Pexels

1. Ve a: https://www.pexels.com/videos/
2. Busca:
   - `office timelapse blue`
   - `abstract data visualization`
   - `business technology background`
   - `particles blue motion`
3. Filtra por:
   - ✅ Orientación: **Horizontal**
   - ✅ Tamaño: **Full HD o 4K** (luego lo optimizas)
4. Descarga y optimiza con FFmpeg (ver arriba)

---

## 🚀 Instalación Rápida

```bash
# 1. Descarga tu video favorito de Pexels/Pixabay
# 2. Renómbralo a background.mp4
# 3. Optimízalo (opcional pero recomendado):
ffmpeg -i background.mp4 -vf scale=1920:1080 -c:v libx264 -crf 23 background-optimized.mp4

# 4. Copia a la carpeta:
mv background-optimized.mp4 ./public/videos/background.mp4

# 5. Reinicia el servidor de desarrollo
```

---

## 💡 Tips

- **Opacidad baja es clave:** No más de 0.15 para que no distraiga
- **Modo oscuro:** El componente ajusta automáticamente el overlay
- **Performance:** Se desactiva automáticamente en móviles
- **Loop perfecto:** Busca videos que hagan loop sin cortes visibles

---

¡Disfruta de tu background animado! 🎬✨








