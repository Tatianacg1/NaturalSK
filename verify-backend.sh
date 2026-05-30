#!/bin/bash

# Script para verificar que todo el backend está correctamente instalado

echo "🔍 Verificando estructura del backend Natural Sound..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funciones de verificación
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} $1"
  else
    echo -e "${RED}❌${NC} $1 (FALTA)"
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✅${NC} $1/"
  else
    echo -e "${RED}❌${NC} $1/ (FALTA)"
  fi
}

echo "📁 Verificando carpetas..."
check_dir "server"
check_dir "server/src"
check_dir "server/src/routes"

echo ""
echo "📄 Verificando archivos principales..."
check_file "server/package.json"
check_file "server/src/server.js"
check_file "server/src/database.js"
check_file "server/.env.example"
check_file "server/.gitignore"
check_file "server/README.md"

echo ""
echo "📍 Verificando rutas..."
check_file "server/src/routes/auth.js"
check_file "server/src/routes/reservas.js"
check_file "server/src/routes/usuarios.js"
check_file "server/src/routes/alojamientos.js"

echo ""
echo "🔗 Verificando archivos de frontend..."
check_file "src/services/api.js"
check_file ".env.local"

echo ""
echo "📚 Verificando documentación..."
check_file "BACKEND_INTEGRATION.md"
check_file "AUTHCONTEXT_UPDATE.tsx"
check_file "BACKEND_CREATED.md"

echo ""
echo "════════════════════════════════════════════════════"
echo ""

if [ -f "server/package.json" ] && [ -f "server/src/server.js" ]; then
  echo -e "${GREEN}✨ Backend creado correctamente${NC}"
  echo ""
  echo "Próximos pasos:"
  echo "1. cd server"
  echo "2. npm install"
  echo "3. npm run dev"
  echo ""
  echo "El servidor se ejecutará en http://localhost:5000"
else
  echo -e "${RED}⚠️  Faltan archivos importantes${NC}"
fi

echo ""
echo "Para más información, lee BACKEND_CREATED.md"
