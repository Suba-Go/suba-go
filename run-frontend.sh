#!/bin/bash

# Script para ejecutar el frontend de Suba&Go - Versión optimizada
# Uso: ./run-frontend.sh

PROJECT_DIR="/Users/juanito/Desktop/Suba&Go/suba-go"

# Cargar nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ir al directorio del proyecto
cd "$PROJECT_DIR" || exit 1

# Usar la versión de Node especificada en .nvmrc
nvm use > /dev/null 2>&1

# Detener procesos previos que puedan interferir
pkill -f "next dev" 2>/dev/null
sleep 1

echo "================================"
echo "🚀 Iniciando Suba&Go Frontend"
echo "================================"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "pnpm: $(pnpm --version)"
echo ""
echo "Ejecutando: next dev --port 3000"
echo "URL: http://localhost:3000"
echo "================================"
echo ""

# Ejecutar Next.js directamente desde apps/frontend
cd "$PROJECT_DIR/apps/frontend"
npx next dev --port 3000
