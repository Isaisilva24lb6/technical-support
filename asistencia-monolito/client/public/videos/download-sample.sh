#!/bin/bash

# Script para descargar un video de ejemplo desde Pexels
# Este video es gratuito y sin copyright

echo "🎬 Descargando video de ejemplo para background..."
echo "📦 Fuente: Pexels (Libre de uso comercial)"
echo ""

# Video de ejemplo: Abstract Blue Technology Background
# ID: 3129957 (Abstract data visualization)
VIDEO_URL="https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_30fps.mp4"

# Descargar con curl
echo "⬇️  Descargando... (esto puede tardar un minuto)"
curl -L -o background.mp4 "$VIDEO_URL"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Video descargado exitosamente!"
    echo "📁 Ubicación: $(pwd)/background.mp4"
    echo ""
    
    # Mostrar tamaño
    SIZE=$(du -h background.mp4 | cut -f1)
    echo "📊 Tamaño: $SIZE"
    echo ""
    echo "💡 Tip: Este video es grande para web. Para optimizarlo:"
    echo "   ffmpeg -i background.mp4 -vf scale=1920:1080 -c:v libx264 -crf 28 background-opt.mp4"
    echo ""
    echo "🚀 ¡Reinicia el servidor de desarrollo para ver el video!"
else
    echo ""
    echo "❌ Error al descargar. Verifica tu conexión a internet."
    echo ""
    echo "📥 Alternativa: Descarga manualmente desde:"
    echo "   https://www.pexels.com/video/3129957/"
fi





