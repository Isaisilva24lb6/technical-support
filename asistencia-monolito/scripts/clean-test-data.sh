#!/bin/bash
# =============================================================================
# Script de Limpieza de Datos de Prueba
# =============================================================================
# Este script limpia archivos temporales y de prueba acumulados durante
# el desarrollo. NO afecta a archivos bajo control de Git.
#
# Uso: ./scripts/clean-test-data.sh [opción]
#
# Opciones:
#   --uploads     Limpia solo archivos Excel subidos
#   --database    Limpia solo la base de datos
#   --logs        Limpia solo archivos de log
#   --all         Limpia todo (default)
#   --dry-run     Muestra qué se eliminaría sin hacerlo
#   --help        Muestra esta ayuda
# =============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DRY_RUN=false
CLEAN_UPLOADS=false
CLEAN_DATABASE=false
CLEAN_LOGS=false

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

show_help() {
    cat << EOF
${GREEN}=============================================================================
  Script de Limpieza de Datos de Prueba
=============================================================================${NC}

${BLUE}Uso:${NC}
  ./scripts/clean-test-data.sh [opción]

${BLUE}Opciones:${NC}
  ${GREEN}--uploads${NC}     Limpia solo archivos Excel subidos (data/uploads/)
  ${GREEN}--database${NC}    Limpia solo la base de datos (data/*.db)
  ${GREEN}--logs${NC}        Limpia solo archivos de log (*.log)
  ${GREEN}--all${NC}         Limpia todo (default)
  ${GREEN}--dry-run${NC}     Muestra qué se eliminaría sin hacerlo
  ${GREEN}--help${NC}        Muestra esta ayuda

${BLUE}Ejemplos:${NC}
  ./scripts/clean-test-data.sh --uploads --dry-run
  ./scripts/clean-test-data.sh --all
  ./scripts/clean-test-data.sh --database

${YELLOW}Nota:${NC} Este script solo elimina archivos ignorados por Git.
No afecta a tu código fuente.

EOF
}

clean_uploads() {
    local uploads_dir="data/uploads"
    
    if [ ! -d "$uploads_dir" ]; then
        log_warning "Carpeta $uploads_dir no existe"
        return
    fi
    
    local count=$(find "$uploads_dir" -type f -name "*.xlsx" 2>/dev/null | wc -l)
    
    if [ "$count" -eq 0 ]; then
        log_info "No hay archivos Excel para limpiar"
        return
    fi
    
    log_warning "Se eliminarán $count archivos Excel de prueba"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Archivos que se eliminarían:"
        find "$uploads_dir" -type f -name "*.xlsx" -exec ls -lh {} \;
    else
        # Intentar eliminar y capturar errores de permisos
        local errors=0
        while IFS= read -r file; do
            if ! rm -f "$file" 2>/dev/null; then
                ((errors++))
            fi
        done < <(find "$uploads_dir" -type f -name "*.xlsx")
        
        local deleted=$((count - errors))
        
        if [ "$errors" -gt 0 ]; then
            log_warning "Eliminados $deleted archivos, $errors archivos sin permisos"
            echo ""
            log_error "⚠️  PERMISOS DENEGADOS"
            echo ""
            echo "Los archivos fueron creados por Docker (root)."
            echo "Usa una de estas soluciones:"
            echo ""
            echo "1️⃣  Ejecutar con sudo:"
            echo "   ${GREEN}sudo bash scripts/clean-test-data.sh --uploads${NC}"
            echo ""
            echo "2️⃣  Cambiar permisos (recomendado):"
            echo "   ${GREEN}sudo chown -R \$USER:\$USER data/${NC}"
            echo "   ${GREEN}npm run clean${NC}"
            echo ""
            echo "3️⃣  Limpiar desde dentro de Docker:"
            echo "   ${GREEN}./docker-dev.sh shell${NC}"
            echo "   ${GREEN}find /app/data/uploads -name '*.xlsx' -delete${NC}"
            echo ""
        else
            log_success "Eliminados $count archivos Excel"
            
            # Crear .gitkeep en subcarpetas vacías
            find "$uploads_dir" -type d -empty -exec touch {}/.gitkeep \;
        fi
    fi
}

clean_database() {
    local db_files=(
        "data/asistencia.db"
        "data/*.db"
        "data/*.sqlite"
        "data/*.sqlite3"
    )
    
    local count=0
    
    for pattern in "${db_files[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                ((count++))
            fi
        done
    done
    
    if [ "$count" -eq 0 ]; then
        log_info "No hay bases de datos para limpiar"
        return
    fi
    
    log_warning "Se eliminarán $count archivo(s) de base de datos"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Archivos que se eliminarían:"
        for pattern in "${db_files[@]}"; do
            for file in $pattern; do
                [ -f "$file" ] && ls -lh "$file"
            done
        done
    else
        for pattern in "${db_files[@]}"; do
            for file in $pattern; do
                [ -f "$file" ] && rm -f "$file"
            done
        done
        log_success "Eliminados $count archivo(s) de base de datos"
    fi
}

clean_logs() {
    local log_patterns=(
        "*.log"
        "logs/*.log"
        "npm-debug.log*"
    )
    
    local count=0
    
    for pattern in "${log_patterns[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                ((count++))
            fi
        done
    done
    
    if [ "$count" -eq 0 ]; then
        log_info "No hay archivos de log para limpiar"
        return
    fi
    
    log_warning "Se eliminarán $count archivo(s) de log"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Archivos que se eliminarían:"
        for pattern in "${log_patterns[@]}"; do
            for file in $pattern; do
                [ -f "$file" ] && ls -lh "$file"
            done
        done
    else
        for pattern in "${log_patterns[@]}"; do
            for file in $pattern; do
                [ -f "$file" ] && rm -f "$file"
            done
        done
        log_success "Eliminados $count archivo(s) de log"
    fi
}

# Parse arguments
if [ $# -eq 0 ]; then
    CLEAN_UPLOADS=true
    CLEAN_DATABASE=true
    CLEAN_LOGS=true
fi

while [ $# -gt 0 ]; do
    case "$1" in
        --uploads)
            CLEAN_UPLOADS=true
            ;;
        --database)
            CLEAN_DATABASE=true
            ;;
        --logs)
            CLEAN_LOGS=true
            ;;
        --all)
            CLEAN_UPLOADS=true
            CLEAN_DATABASE=true
            CLEAN_LOGS=true
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            log_error "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
    shift
done

# Main execution
log_info "Iniciando limpieza de datos de prueba..."

if [ "$DRY_RUN" = true ]; then
    log_warning "MODO DRY RUN - No se eliminará nada"
fi

echo ""

if [ "$CLEAN_UPLOADS" = true ]; then
    clean_uploads
fi

if [ "$CLEAN_DATABASE" = true ]; then
    clean_database
fi

if [ "$CLEAN_LOGS" = true ]; then
    clean_logs
fi

echo ""

if [ "$DRY_RUN" = true ]; then
    log_info "Ejecución completa (dry run)"
    log_info "Para ejecutar de verdad, quita --dry-run"
else
    log_success "Limpieza completa"
fi

