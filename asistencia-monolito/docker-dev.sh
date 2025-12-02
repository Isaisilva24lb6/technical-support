#!/bin/bash
# =============================================================================
# Script de Ayuda para Docker Development
# =============================================================================
# Uso: ./docker-dev.sh [comando]
#
# Comandos disponibles:
#   start     - Inicia el contenedor (con rebuild)
#   stop      - Detiene el contenedor
#   restart   - Reinicia el contenedor
#   rebuild   - Reconstruye la imagen desde cero (sin caché)
#   logs      - Muestra los logs en tiempo real
#   shell     - Accede al shell del contenedor
#   clean     - Limpia todo (contenedores, imágenes, volúmenes)
#   status    - Muestra el estado del contenedor
#   help      - Muestra esta ayuda
# =============================================================================

set -e

COMPOSE_FILE="docker-compose.yml"
CONTAINER_NAME="asistencia-monolito-dev"
IMAGE_NAME="asistencia-monolito:dev-latest"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Función para verificar si el contenedor está corriendo
is_running() {
    docker ps --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"
}

# Comandos
cmd_start() {
    log_info "Iniciando contenedor con rebuild..."
    docker-compose -f "${COMPOSE_FILE}" up -d --build
    log_success "Contenedor iniciado"
    log_info "Accede a: http://localhost:3005"
    log_info "Ver logs: ./docker-dev.sh logs"
}

cmd_stop() {
    log_info "Deteniendo contenedor..."
    docker-compose -f "${COMPOSE_FILE}" down
    log_success "Contenedor detenido"
}

cmd_restart() {
    log_info "Reiniciando contenedor..."
    docker-compose -f "${COMPOSE_FILE}" restart
    log_success "Contenedor reiniciado"
}

cmd_rebuild() {
    log_warning "Reconstruyendo imagen desde cero (sin caché)..."
    log_info "Deteniendo contenedor..."
    docker-compose -f "${COMPOSE_FILE}" down
    
    log_info "Eliminando imagen antigua..."
    docker rmi "${IMAGE_NAME}" 2>/dev/null || true
    
    log_info "Reconstruyendo con --no-cache..."
    docker-compose -f "${COMPOSE_FILE}" build --no-cache
    
    log_info "Iniciando contenedor..."
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    log_success "Rebuild completo"
}

cmd_logs() {
    log_info "Mostrando logs en tiempo real (Ctrl+C para salir)..."
    docker-compose -f "${COMPOSE_FILE}" logs -f
}

cmd_shell() {
    if is_running; then
        log_info "Accediendo al shell del contenedor..."
        docker exec -it "${CONTAINER_NAME}" sh
    else
        log_error "El contenedor no está corriendo. Usa: ./docker-dev.sh start"
        exit 1
    fi
}

cmd_clean() {
    log_warning "⚠️  LIMPIEZA COMPLETA - Esto eliminará:"
    echo "  - Contenedor ${CONTAINER_NAME}"
    echo "  - Imagen ${IMAGE_NAME}"
    echo "  - Volúmenes asociados"
    echo "  - Imágenes huérfanas"
    echo ""
    read -p "¿Estás seguro? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deteniendo y eliminando contenedor..."
        docker-compose -f "${COMPOSE_FILE}" down -v
        
        log_info "Eliminando imagen..."
        docker rmi "${IMAGE_NAME}" 2>/dev/null || true
        
        log_info "Limpiando sistema Docker..."
        docker system prune -f
        
        log_success "Limpieza completa"
        log_info "Para volver a iniciar: ./docker-dev.sh start"
    else
        log_info "Limpieza cancelada"
    fi
}

cmd_status() {
    log_info "Estado del contenedor:"
    echo ""
    
    if is_running; then
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        log_success "Contenedor está corriendo"
        log_info "URL: http://localhost:3005"
    else
        log_warning "Contenedor no está corriendo"
        echo ""
        # Verificar si existe pero está detenido
        if docker ps -a --filter "name=${CONTAINER_NAME}" --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
            docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}"
            echo ""
            log_info "Para iniciarlo: ./docker-dev.sh start"
        else
            log_info "Contenedor no existe. Créalo con: ./docker-dev.sh start"
        fi
    fi
}

cmd_clean_data() {
    if is_running; then
        log_info "Limpiando archivos de prueba dentro del contenedor..."
        
        # Contar archivos antes
        local count=$(docker exec "${CONTAINER_NAME}" sh -c "find /app/data/uploads -name '*.xlsx' 2>/dev/null | wc -l")
        
        if [ "$count" -eq 0 ]; then
            log_info "No hay archivos Excel para limpiar"
            return
        fi
        
        log_warning "Se eliminarán $count archivos Excel de prueba"
        echo ""
        read -p "¿Continuar? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker exec "${CONTAINER_NAME}" sh -c "find /app/data/uploads -name '*.xlsx' -delete"
            log_success "Archivos eliminados desde Docker"
        else
            log_info "Operación cancelada"
        fi
    else
        log_error "El contenedor no está corriendo"
        log_info "Alternativa: sudo bash scripts/clean-test-data.sh --uploads"
    fi
}

cmd_help() {
    cat << EOF
${GREEN}=============================================================================
  Script de Ayuda para Docker Development
=============================================================================${NC}

${BLUE}Uso:${NC}
  ./docker-dev.sh [comando]

${BLUE}Comandos disponibles:${NC}
  ${GREEN}start${NC}       - Inicia el contenedor (con rebuild automático)
  ${GREEN}stop${NC}        - Detiene el contenedor
  ${GREEN}restart${NC}     - Reinicia el contenedor
  ${GREEN}rebuild${NC}     - Reconstruye la imagen desde cero (sin caché)
  ${GREEN}logs${NC}        - Muestra los logs en tiempo real
  ${GREEN}shell${NC}       - Accede al shell del contenedor
  ${GREEN}clean${NC}       - Limpia todo (contenedores, imágenes, volúmenes)
  ${GREEN}clean-data${NC}  - Limpia archivos de prueba (dentro de Docker)
  ${GREEN}status${NC}      - Muestra el estado del contenedor
  ${GREEN}help${NC}        - Muestra esta ayuda

${BLUE}Ejemplos:${NC}
  ./docker-dev.sh start       # Iniciar normalmente
  ./docker-dev.sh logs        # Ver logs
  ./docker-dev.sh shell       # Entrar al contenedor
  ./docker-dev.sh rebuild     # Rebuild completo (si hay problemas)
  ./docker-dev.sh clean-data  # Limpiar archivos Excel de prueba
  ./docker-dev.sh clean       # Limpieza total

${YELLOW}Nota:${NC} 
  - Si tienes problemas de caché: ./docker-dev.sh rebuild
  - Si hay error de permisos al limpiar: ./docker-dev.sh clean-data

EOF
}

# Main
case "${1:-help}" in
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    restart)
        cmd_restart
        ;;
    rebuild)
        cmd_rebuild
        ;;
    logs)
        cmd_logs
        ;;
    shell)
        cmd_shell
        ;;
    clean)
        cmd_clean
        ;;
    clean-data)
        cmd_clean_data
        ;;
    status)
        cmd_status
        ;;
    help|--help|-h)
        cmd_help
        ;;
    *)
        log_error "Comando desconocido: $1"
        echo ""
        cmd_help
        exit 1
        ;;
esac

